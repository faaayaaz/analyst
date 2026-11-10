/* Interactive signature: scattered data becomes a legible name, without a rendering library. */
(() => {
  "use strict";

  function initializeSignature() {
    const canvas = document.querySelector("#signal-field");
    const button = document.querySelector("#pattern-toggle");
    if (!canvas || !button) return;
    const context = canvas.getContext("2d");
    if (!context) return; // The canvas's HTML fallback remains available.

    const label = button.querySelector(".pattern-label");
    const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const colors = [
      "184,244,208",
      "184,244,208",
      "184,244,208",
      "143,174,255",
      "199,168,237",
    ];
    const sampleCanvas = document.createElement("canvas");
    const sampleContext = sampleCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!sampleContext) return;

    let width = 0;
    let height = 0;
    let particles = [];
    let animationId = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let inViewport = true;
    let reducedMotion = shouldReduceMotion();
    // A static, readable signature is the default when animation is disabled.
    let assembled = reducedMotion;
    const pointer = { x: -1000, y: -1000, active: false };

    function shouldReduceMotion() {
      return (
        motionPreference.matches ||
        document.documentElement.classList.contains("motion-paused")
      );
    }

    function updateLabels() {
      button.setAttribute("aria-pressed", String(assembled));
      if (label)
        label.textContent = assembled
          ? "Release the pattern"
          : "Find the pattern";
      canvas.setAttribute(
        "aria-label",
        assembled
          ? "Data points arranged to spell FAYAZ."
          : "A field of scattered data points. Find the pattern to reveal FAYAZ.",
      );
    }

    // Text is sampled into points once per resize; the animation only moves these small objects.
    function sampleWord() {
      sampleCanvas.width = Math.max(1, Math.round(width));
      sampleCanvas.height = Math.max(1, Math.round(height));
      let size = Math.min(height * 0.85, width * 0.34);
      sampleContext.font = `900 ${size}px Arial, sans-serif`;
      const measured = sampleContext.measureText("FAYAZ").width;
      if (measured > width * 0.9) size *= (width * 0.9) / measured;
      sampleContext.clearRect(0, 0, width, height);
      sampleContext.font = `900 ${size}px Arial, sans-serif`;
      sampleContext.textAlign = "center";
      sampleContext.textBaseline = "middle";
      sampleContext.fillStyle = "#fff";
      sampleContext.fillText("FAYAZ", width / 2, height * 0.53);
      const pixels = sampleContext.getImageData(
        0,
        0,
        sampleCanvas.width,
        sampleCanvas.height,
      ).data;
      const spacing = width < 360 ? 4 : 5;
      const samples = [];
      for (let y = 2; y < sampleCanvas.height; y += spacing) {
        for (let x = 2; x < sampleCanvas.width; x += spacing) {
          if (pixels[(y * sampleCanvas.width + x) * 4 + 3] > 160)
            samples.push({ x, y });
        }
      }
      // Bound the geometry independently of screen size to keep phone rendering inexpensive.
      if (samples.length <= 480) return samples;
      const stride = samples.length / 480;
      return Array.from(
        { length: 480 },
        (_, index) => samples[Math.floor(index * stride)],
      );
    }

    function homeFor(index) {
      // Irrational ratios distribute the scattered points evenly without random jumps on resize.
      return {
        x: width * (0.045 + ((index * 0.61803398875) % 1) * 0.91),
        y: height * (0.13 + ((index * 0.41421356237) % 1) * 0.74),
      };
    }

    function targetFor(particle) {
      if (assembled) return { x: particle.wordX, y: particle.wordY };
      return {
        x:
          particle.homeX +
          Math.sin(elapsed * 0.0007 + particle.phase) *
            Math.min(17, width * 0.045),
        y:
          particle.homeY +
          Math.cos(elapsed * 0.00085 + particle.phase * 1.3) *
            Math.min(13, height * 0.11),
      };
    }

    function settle() {
      particles.forEach((particle) => {
        const target = targetFor(particle);
        particle.x = target.x;
        particle.y = target.y;
        particle.vx = 0;
        particle.vy = 0;
      });
    }

    function render() {
      context.clearRect(0, 0, width, height);
      particles.forEach((particle, index) => {
        const shimmer =
          reducedMotion || assembled
            ? 1
            : 0.76 + Math.sin(elapsed * 0.0012 + particle.phase) * 0.24;
        const alpha = (assembled ? 0.9 : particle.alpha) * shimmer;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${particle.color},${alpha})`;
        if (index % 29 === 0) {
          context.shadowColor = "#b8f4d0";
          context.shadowBlur = assembled ? 7 : 10;
        }
        context.fill();
        context.shadowBlur = 0;
      });
    }

    function advance(delta) {
      const reach = Math.min(80, width * 0.22);
      particles.forEach((particle) => {
        const target = targetFor(particle);
        particle.vx += (target.x - particle.x) * 0.055 * delta;
        particle.vy += (target.y - particle.y) * 0.055 * delta;
        if (pointer.active && finePointer.matches) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < reach * reach) {
            const distance = Math.sqrt(distanceSquared);
            // Bounded force avoids singularities when a pointer lands directly on a dot.
            const force = (1 - distance / reach) * 3.8 * delta;
            const unitX =
              distance > 0.1 ? dx / distance : Math.cos(particle.phase);
            const unitY =
              distance > 0.1 ? dy / distance : Math.sin(particle.phase);
            particle.vx += unitX * force;
            particle.vy += unitY * force;
          }
        }
        const damping = Math.pow(0.77, delta);
        particle.vx *= damping;
        particle.vy *= damping;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
      });
    }

    function tick(time) {
      animationId = 0;
      if (reducedMotion || document.hidden || !inViewport || !width || !height)
        return;
      if (!lastFrame) lastFrame = time - 33.34;
      const frameTime = time - lastFrame;
      if (frameTime >= 32) {
        const boundedTime = Math.min(frameTime, 66.68);
        elapsed += boundedTime;
        advance(boundedTime / 33.34);
        render();
        lastFrame = time;
      }
      animationId = requestAnimationFrame(tick);
    }

    function syncAnimation() {
      cancelAnimationFrame(animationId);
      animationId = 0;
      lastFrame = 0;
      if (!width || !height) return;
      if (reducedMotion) settle();
      render();
      if (!reducedMotion && !document.hidden && inViewport)
        animationId = requestAnimationFrame(tick);
    }

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width < 1 || bounds.height < 1) return;
      const oldWidth = width || bounds.width;
      const oldHeight = height || bounds.height;
      width = bounds.width;
      height = bounds.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const previousParticles = particles;
      particles = sampleWord().map((point, index) => {
        const home = homeFor(index);
        const previous = previousParticles[index];
        return {
          wordX: point.x,
          wordY: point.y,
          homeX: home.x,
          homeY: home.y,
          x: previous ? (previous.x * width) / oldWidth : home.x,
          y: previous ? (previous.y * height) / oldHeight : home.y,
          vx: 0,
          vy: 0,
          phase: index * 2.3999632297,
          radius: assembled ? 1.3 : 1.1 + (index % 5) * 0.2,
          alpha: 0.36 + (index % 7) * 0.085,
          color: colors[index % colors.length],
        };
      });
      syncAnimation();
    }

    button.addEventListener("click", () => {
      assembled = !assembled;
      particles.forEach((particle) => {
        particle.radius = assembled ? 1.3 : 1.1 + (particle.phase % 5) * 0.2;
      });
      updateLabels();
      if (reducedMotion) settle();
      syncAnimation();
    });

    canvas.addEventListener(
      "pointermove",
      (event) => {
        if (reducedMotion || !finePointer.matches) return;
        const bounds = canvas.getBoundingClientRect();
        pointer.x = event.clientX - bounds.left;
        pointer.y = event.clientY - bounds.top;
        pointer.active = true;
      },
      { passive: true },
    );
    canvas.addEventListener("pointerleave", () => {
      pointer.active = false;
    });

    function updateMotion() {
      reducedMotion = shouldReduceMotion();
      pointer.active = false;
      syncAnimation();
    }
    document.addEventListener("portfolio:motion", updateMotion);
    motionPreference.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", syncAnimation);
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          inViewport = entries[0].isIntersecting;
          pointer.active = false;
          syncAnimation();
        },
        { rootMargin: "80px" },
      ).observe(canvas);
    }
    updateLabels();
    resize();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initializeSignature, {
      once: true,
    });
  else initializeSignature();
})();
