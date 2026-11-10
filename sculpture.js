/* Self-hosted Three.js: an original data ribbon, with a lightweight 2D projection fallback. */
import * as THREE from "./vendor/three.module.min.js";

function initializeSculpture() {
  const canvas = document.querySelector("#sculpture-canvas");
  const stage = canvas?.closest(".sculpture-stage");
  if (!canvas || !stage) return;

  const buttons = [...document.querySelectorAll("[data-sculpture]")];
  const description = document.querySelector("#sculpture-description");
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const descriptions = {
    flow: "Flow — two streams of data, finding their rhythm.",
    network: "Network — individual points become a connected structure.",
    signal: "Signal — a different perspective reveals the pattern.",
  };
  const bands = 2;
  const segments = 70;
  const lanes = 6;
  const count = bands * segments * lanes;
  const positions = new Float32Array(count * 3);
  const destinations = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const edgeIndices = [];
  const networkEdges = [];
  const signalEdges = [];
  const faceIndices = [];
  const runnerCount = 22;
  const runnerPositions = new Float32Array(runnerCount * 3);
  const runnerColors = new Float32Array(runnerCount * 3);
  const runnerSizes = new Float32Array(runnerCount);
  let mode = "flow";
  let width = 1;
  let height = 1;
  let dpr = 1;
  let animation = 0;
  let lastTime = 0;
  let elapsed = 0;
  let visible = true;
  let paused = isPaused();
  let morphing = true;
  let rotationX = -0.2;
  let rotationY = 0.15;
  let userX = 0;
  let userY = 0;
  let sculptureScale = 1;
  let renderer = null;
  let fallback = null;
  let fallbackContext = null;
  let surface = null;
  let wire = null;
  let group = null;
  let scene = null;
  let camera = null;
  let pointMaterial = null;
  let runnerMaterial = null;
  let positionAttribute = null;
  let runnerAttribute = null;
  let surfaceGeometry = null;
  const drawColor = new THREE.Color();
  const cyan = new THREE.Color("#49ffe1");
  const blue = new THREE.Color("#3c7bff");
  const pink = new THREE.Color("#ff58d6");

  function isPaused() {
    return (
      preference.matches ||
      document.documentElement.classList.contains("motion-paused")
    );
  }

  function index(band, step, lane) {
    return (band * segments + step) * lanes + lane;
  }

  // Corresponding points keep their identity in all modes, so morphing preserves continuity.
  function pointFor(band, step, lane, currentMode, time = 0) {
    const u = step / (segments - 1);
    const across = lane / (lanes - 1) - 0.5;
    if (currentMode === "network") {
      const column = step % 10;
      const row = Math.floor(step / 10);
      return [
        (column - 4.5) * 0.52 + Math.sin(row * 0.72) * 0.3,
        (row - 3) * 0.54 + band * 0.18,
        across * 2.8 + (band - 0.5) * 0.42 + Math.cos(column * 0.6) * 0.22,
      ];
    }
    if (currentMode === "signal") {
      const column = step % 14;
      const depth = Math.floor(step / 14);
      const height =
        0.7 + (0.5 + 0.5 * Math.sin(column * 0.47 + band * 0.65 + time)) * 2.6;
      return [
        (column - 6.5) * 0.38,
        (lane / (lanes - 1)) * height - 1.8,
        (depth - 2) * 0.47 + (band - 0.5) * 0.23,
      ];
    }
    // Two broad ribbons travel around an S-shaped spine rather than a stock sphere or torus.
    const phase = u * Math.PI * 2.55 + band * Math.PI;
    const radius = 0.98 + 0.18 * Math.sin(u * Math.PI * 2);
    return [
      (u - 0.5) * 5.5,
      Math.sin(phase) * radius +
        Math.sin(u * Math.PI * 2) * 0.42 +
        across * 0.65 * Math.cos(phase),
      Math.cos(phase) * radius + across * 0.65 * Math.sin(phase),
    ];
  }

  function updateDestinations() {
    for (let band = 0; band < bands; band++) {
      for (let step = 0; step < segments; step++) {
        for (let lane = 0; lane < lanes; lane++) {
          const i = index(band, step, lane);
          const point = pointFor(band, step, lane, mode, elapsed * 0.00035);
          destinations.set(point, i * 3);
        }
      }
    }
  }

  for (let band = 0; band < bands; band++) {
    for (let step = 0; step < segments; step++) {
      for (let lane = 0; lane < lanes; lane++) {
        const i = index(band, step, lane);
        drawColor
          .copy(band ? pink : cyan)
          .lerp(blue, (step / (segments - 1)) * 0.75);
        drawColor.toArray(colors, i * 3);
        sizes[i] = 0.34 + ((i * 0.61803398875) % 1) * 0.35;
        if (step < segments - 1)
          edgeIndices.push(i, index(band, step + 1, lane));
        if (lane < lanes - 1 && step % 4 === 0)
          edgeIndices.push(i, index(band, step, lane + 1));
        if (step % 10 < 9) networkEdges.push(i, index(band, step + 1, lane));
        if (step < 60) networkEdges.push(i, index(band, step + 10, lane));
        if (lane < lanes - 1) {
          networkEdges.push(i, i + 1);
          signalEdges.push(i, i + 1);
        }
        if (lane === 0 && step % 14 < 13)
          signalEdges.push(i, index(band, step + 1, lane));
        if (step < segments - 1 && lane < lanes - 1) {
          const next = index(band, step + 1, lane);
          faceIndices.push(i, next, i + 1, i + 1, next, next + 1);
        }
      }
    }
  }
  for (let i = 0; i < runnerCount; i++) {
    (i % 2 ? pink : cyan).toArray(runnerColors, i * 3);
    runnerSizes[i] = i % 4 === 0 ? 1.5 : 1;
  }
  updateDestinations();
  positions.set(destinations);

  function makePointMaterial(opacity) {
    // Each point has its own soft bloom; this avoids an expensive full-screen postprocessing pass.
    return new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 72 }, uOpacity: { value: opacity } },
      vertexShader: `attribute float aSize;
        varying vec3 vColor; varying float vDepth;
        uniform float uScale;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(aSize * uScale / max(1.0,-mv.z),1.0,24.0);
          vColor = color; vDepth = clamp(1.25 - (-mv.z)/20.0,0.3,1.0);
        }`,
      fragmentShader: `varying vec3 vColor; varying float vDepth; uniform float uOpacity;
        void main(){
          float distance = length(gl_PointCoord-vec2(0.5));
          if(distance>0.5) discard;
          float halo=exp(-distance*distance*15.0);
          float core=exp(-distance*distance*110.0);
          gl_FragColor=vec4(vColor*(1.0+core*0.9),(halo*0.55+core*0.6)*uOpacity*vDepth);
        }`,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  function initializeWebGL() {
    try {
      // Probe WebGL2 quietly first; an unavailable capability should select the fallback, not log an app error.
      const context = canvas.getContext("webgl2", {
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      if (!context) return false;
      renderer = new THREE.WebGLRenderer({
        canvas,
        context,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
      camera.position.set(0, 0, 8.6);
      camera.lookAt(0, -0.5, 0);
      group = new THREE.Group();
      group.rotation.z = -0.55;
      scene.add(group);
      positionAttribute = new THREE.BufferAttribute(positions, 3).setUsage(
        THREE.DynamicDrawUsage,
      );
      const colorAttribute = new THREE.BufferAttribute(colors, 3);
      const pointsGeometry = new THREE.BufferGeometry();
      pointsGeometry.setAttribute("position", positionAttribute);
      pointsGeometry.setAttribute("color", colorAttribute);
      pointsGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
      pointMaterial = makePointMaterial(0.95);
      group.add(new THREE.Points(pointsGeometry, pointMaterial));

      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute("position", positionAttribute);
      lineGeometry.setAttribute("color", colorAttribute);
      lineGeometry.setIndex(edgeIndices);
      wire = new THREE.LineSegments(
        lineGeometry,
        new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      group.add(wire);

      surfaceGeometry = new THREE.BufferGeometry();
      surfaceGeometry.setAttribute("position", positionAttribute);
      surfaceGeometry.setAttribute("color", colorAttribute);
      surfaceGeometry.setIndex(faceIndices);
      surfaceGeometry.computeVertexNormals();
      surface = new THREE.Mesh(
        surfaceGeometry,
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          vertexColors: true,
          side: THREE.DoubleSide,
          metalness: 0.65,
          roughness: 0.22,
          iridescence: 1,
          iridescenceIOR: 1.3,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
          emissive: 0x092748,
          emissiveIntensity: 0.7,
        }),
      );
      group.add(surface);
      scene.add(new THREE.AmbientLight(0x9caeff, 1.4));
      const key = new THREE.DirectionalLight(0xc9ffff, 4);
      key.position.set(3, 4, 5);
      scene.add(key);
      const magenta = new THREE.PointLight(0xff35cf, 35, 16);
      magenta.position.set(-3, 1, 3);
      scene.add(magenta);
      const blueLight = new THREE.PointLight(0x3175ff, 35, 16);
      blueLight.position.set(3, -2, 4);
      scene.add(blueLight);

      const runnerGeometry = new THREE.BufferGeometry();
      runnerAttribute = new THREE.BufferAttribute(runnerPositions, 3).setUsage(
        THREE.DynamicDrawUsage,
      );
      runnerGeometry.setAttribute("position", runnerAttribute);
      runnerGeometry.setAttribute(
        "color",
        new THREE.BufferAttribute(runnerColors, 3),
      );
      runnerGeometry.setAttribute(
        "aSize",
        new THREE.BufferAttribute(runnerSizes, 1),
      );
      runnerMaterial = makePointMaterial(1);
      group.add(new THREE.Points(runnerGeometry, runnerMaterial));
      stage.dataset.renderer = "webgl";
      return true;
    } catch {
      renderer?.dispose();
      renderer = null;
      return false;
    }
  }

  function initializeFallback() {
    if (fallback) return;
    // A new canvas is necessary: a WebGL canvas cannot subsequently acquire a 2D context.
    fallback = document.createElement("canvas");
    fallback.setAttribute("aria-hidden", "true");
    Object.assign(fallback.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
    });
    stage.append(fallback);
    fallbackContext = fallback.getContext("2d");
    canvas.style.opacity = "0";
    stage.classList.add("webgl-fallback");
    stage.dataset.renderer = "canvas";
  }
  if (!initializeWebGL()) initializeFallback();

  function updateRunners() {
    for (let i = 0; i < runnerCount; i++) {
      const band = i % 2;
      const location =
        ((elapsed * 0.000065 + i / runnerCount) % 1) * (segments - 1);
      const before = Math.floor(location);
      const after = Math.min(before + 1, segments - 1);
      const lane = i % 3 === 0 ? 0 : lanes - 1;
      const a = index(band, before, lane) * 3;
      const b = index(band, after, lane) * 3;
      for (let axis = 0; axis < 3; axis++)
        runnerPositions[i * 3 + axis] = THREE.MathUtils.lerp(
          positions[a + axis],
          positions[b + axis],
          location - before,
        );
    }
    if (runnerAttribute) runnerAttribute.needsUpdate = true;
  }

  function project(x, y, z) {
    x *= sculptureScale;
    y *= sculptureScale;
    z *= sculptureScale;
    const cx = Math.cos(rotationX),
      sx = Math.sin(rotationX);
    const cy = Math.cos(rotationY),
      sy = Math.sin(rotationY);
    const y1 = y * cx - z * sx,
      z1 = y * sx + z * cx;
    const x1 = x * cy + z1 * sy,
      z2 = -x * sy + z1 * cy;
    const rz = -0.55;
    const x2 = x1 * Math.cos(rz) - y1 * Math.sin(rz);
    const y2 = x1 * Math.sin(rz) + y1 * Math.cos(rz);
    const scale = height / (2 * Math.tan((42 * Math.PI) / 360)) / (8.6 - z2);
    return {
      x: width * 0.5 + x2 * scale,
      y: height * 0.43 - y2 * scale,
      z: z2,
    };
  }

  function renderFallback() {
    const context = fallbackContext;
    if (!context) return;
    context.clearRect(0, 0, width, height);
    const projected = [];
    for (let i = 0; i < count; i++)
      projected.push(
        project(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]),
      );
    context.lineWidth = 0.7;
    const activeEdges =
      mode === "flow"
        ? edgeIndices
        : mode === "network"
          ? networkEdges
          : signalEdges;
    for (let i = 0; i < activeEdges.length; i += 2) {
      const a = projected[activeEdges[i]],
        b = projected[activeEdges[i + 1]];
      const colorIndex = activeEdges[i] * 3;
      context.strokeStyle = `rgba(${Math.round(colors[colorIndex] * 255)},${Math.round(colors[colorIndex + 1] * 255)},${Math.round(colors[colorIndex + 2] * 255)},${0.11 + (a.z + 2) * 0.045})`;
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
    }
    projected.forEach((point, i) => {
      const color = `rgb(${Math.round(colors[i * 3] * 255)},${Math.round(colors[i * 3 + 1] * 255)},${Math.round(colors[i * 3 + 2] * 255)})`;
      context.fillStyle = color;
      context.globalAlpha = Math.min(1, 0.55 + point.z * 0.12);
      if (i % 15 === 0) {
        context.shadowColor = color;
        context.shadowBlur = 10;
      }
      context.beginPath();
      context.arc(
        point.x,
        point.y,
        Math.max(0.7, 1.2 + point.z * 0.16),
        0,
        Math.PI * 2,
      );
      context.fill();
      context.shadowBlur = 0;
    });
    context.globalAlpha = 1;
    for (let i = 0; i < runnerCount; i++) {
      const point = project(
        runnerPositions[i * 3],
        runnerPositions[i * 3 + 1],
        runnerPositions[i * 3 + 2],
      );
      const color = i % 2 ? "#ff58d6" : "#49ffe1";
      context.fillStyle = color;
      context.shadowColor = color;
      context.shadowBlur = 15;
      context.beginPath();
      context.arc(point.x, point.y, 2.1, 0, Math.PI * 2);
      context.fill();
    }
    context.shadowBlur = 0;
  }

  function render() {
    updateRunners();
    if (renderer && group) {
      group.rotation.x = rotationX;
      group.rotation.y = rotationY;
      group.scale.setScalar(sculptureScale);
      renderer.render(scene, camera);
      stage.classList.add("scene-ready");
    } else if (fallbackContext) {
      renderFallback();
      stage.classList.add("scene-ready");
    }
  }

  function advance(delta) {
    elapsed += delta;
    rotationX = -0.2 + userX + Math.sin(elapsed * 0.0002) * 0.1;
    rotationY = 0.15 + userY + elapsed * 0.00009;
    const targetScale = mode === "flow" ? 1 : 0.84;
    sculptureScale += (targetScale - sculptureScale) * 0.08;
    if (mode === "signal") {
      updateDestinations();
      morphing = true;
    }
    if (morphing) {
      let remaining = 0;
      const ease = 1 - Math.exp(-delta * 0.006);
      for (let i = 0; i < positions.length; i++) {
        const distance = destinations[i] - positions[i];
        positions[i] += distance * ease;
        remaining += Math.abs(distance);
      }
      morphing = remaining > 0.03;
      if (positionAttribute) positionAttribute.needsUpdate = true;
      surfaceGeometry?.computeVertexNormals();
    }
    if (surface) {
      surface.visible = mode === "flow";
      wire.material.opacity = mode === "flow" ? 0.5 : 0.22;
    }
  }

  function tick(time) {
    animation = 0;
    if (paused || !visible || document.hidden) return;
    if (time - lastTime >= 32) {
      const delta = Math.min(64, lastTime ? time - lastTime : 33);
      lastTime = time;
      advance(delta);
      render();
    }
    animation = requestAnimationFrame(tick);
  }

  function synchronizeMotion() {
    paused = isPaused();
    cancelAnimationFrame(animation);
    animation = 0;
    lastTime = 0;
    render();
    if (!paused && visible && !document.hidden)
      animation = requestAnimationFrame(tick);
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    // At most 1.75 device pixels per CSS pixel; the scene contains only 840 primary nodes.
    dpr = Math.min(devicePixelRatio || 1, width < 500 ? 1.5 : 1.75);
    if (renderer) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width / height < 0.85 ? 9.6 : 8.6;
      camera.lookAt(0, -0.5, 0);
      camera.updateProjectionMatrix();
      pointMaterial.uniforms.uScale.value = 72 * dpr;
      runnerMaterial.uniforms.uScale.value = 72 * dpr;
    }
    if (fallback) {
      fallback.width = Math.round(width * dpr);
      fallback.height = Math.round(height * dpr);
      fallbackContext?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    render();
  }

  function selectMode(button) {
    if (!descriptions[button.dataset.sculpture]) return;
    mode = button.dataset.sculpture;
    if (wire)
      wire.geometry.setIndex(
        mode === "flow"
          ? edgeIndices
          : mode === "network"
            ? networkEdges
            : signalEdges,
      );
    if (surface) surface.visible = mode === "flow";
    buttons.forEach((item) => {
      const selected = item === button;
      item.setAttribute("aria-pressed", String(selected));
      item.classList.toggle("is-active", selected);
    });
    if (description) description.textContent = descriptions[mode];
    canvas.setAttribute(
      "aria-label",
      `${descriptions[mode]} Interactive three-dimensional data art. Drag horizontally or use arrow keys to rotate.`,
    );
    updateDestinations();
    morphing = true;
    if (paused) {
      sculptureScale = mode === "flow" ? 1 : 0.84;
      positions.set(destinations);
      morphing = false;
      if (positionAttribute) positionAttribute.needsUpdate = true;
      surfaceGeometry?.computeVertexNormals();
      if (surface)
        surface.material.opacity =
          mode === "flow" ? 0.4 : mode === "network" ? 0.035 : 0.085;
    }
    render();
  }
  buttons.forEach((button) =>
    button.addEventListener("click", () => selectMode(button)),
  );

  // Horizontal capture rotates the object; vertical touch gestures remain native page scrolling.
  let pointer = null;
  canvas.style.touchAction = "pan-y";
  canvas.style.cursor = "grab";
  if (!canvas.hasAttribute("tabindex")) canvas.tabIndex = 0;
  canvas.setAttribute(
    "aria-keyshortcuts",
    "ArrowLeft ArrowRight ArrowUp ArrowDown",
  );
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      active: event.pointerType === "mouse",
    };
    if (pointer.active) canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    if (!pointer.active) {
      const horizontal = Math.abs(event.clientX - pointer.x),
        vertical = Math.abs(event.clientY - pointer.y);
      if (horizontal < 8 || horizontal < vertical * 1.25) return;
      pointer.active = true;
      canvas.setPointerCapture(event.pointerId);
    }
    userY += (event.clientX - pointer.lastX) * 0.007;
    userX = THREE.MathUtils.clamp(
      userX + (event.clientY - pointer.lastY) * 0.005,
      -0.9,
      0.9,
    );
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    rotationX = -0.2 + userX;
    rotationY = 0.15 + userY + elapsed * 0.00009;
    canvas.style.cursor = "grabbing";
    render();
  });
  function release(event) {
    if (pointer?.id !== event.pointerId) return;
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    pointer = null;
    canvas.style.cursor = "grab";
  }
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("lostpointercapture", () => {
    pointer = null;
    canvas.style.cursor = "grab";
  });
  canvas.addEventListener("keydown", (event) => {
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    )
      return;
    event.preventDefault();
    if (event.key === "ArrowLeft") userY -= 0.18;
    if (event.key === "ArrowRight") userY += 0.18;
    if (event.key === "ArrowUp") userX -= 0.14;
    if (event.key === "ArrowDown") userX += 0.14;
    userX = THREE.MathUtils.clamp(userX, -0.9, 0.9);
    rotationX = -0.2 + userX;
    rotationY = 0.15 + userY + elapsed * 0.00009;
    render();
  });

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    renderer?.dispose();
    renderer = null;
    initializeFallback();
    resize();
    synchronizeMotion();
  });
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window)
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        synchronizeMotion();
      },
      { rootMargin: "80px" },
    ).observe(canvas);
  preference.addEventListener("change", synchronizeMotion);
  document.addEventListener("portfolio:motion", synchronizeMotion);
  document.addEventListener("visibilitychange", synchronizeMotion);
  if (description) description.textContent = descriptions.flow;
  canvas.setAttribute(
    "aria-label",
    `${descriptions.flow} Interactive three-dimensional data art. Drag horizontally or use arrow keys to rotate.`,
  );
  resize();
  synchronizeMotion();
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", initializeSculpture, {
    once: true,
  });
else initializeSculpture();
