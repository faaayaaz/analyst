/* Vanilla JS only. All portfolio data stays local; no tracking or third-party requests. */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  let manuallyPaused = false;
  try {
    manuallyPaused = localStorage.getItem("portfolio-motion") === "paused";
  } catch {
    /* Storage can be unavailable in private/file contexts. */
  }
  let reducedMotion = motionQuery.matches || manuallyPaused;
  const motionButton = $("#motion-toggle");
  function updateMotion() {
    reducedMotion = motionQuery.matches || manuallyPaused;
    document.documentElement.classList.toggle("motion-paused", reducedMotion);
    motionButton.setAttribute("aria-pressed", String(reducedMotion));
    motionButton.setAttribute(
      "aria-label",
      motionQuery.matches
        ? "Animations disabled by your reduced-motion setting"
        : reducedMotion
          ? "Resume animations"
          : "Pause animations",
    );
    motionButton.disabled = motionQuery.matches;
    $("span", motionButton).textContent = reducedMotion
      ? "MOTION OFF"
      : "MOTION ON";
    // One event keeps Canvas, CSS, and text effects in sync with the same preference.
    document.dispatchEvent(new Event("portfolio:motion"));
  }
  motionButton.addEventListener("click", () => {
    manuallyPaused = !manuallyPaused;
    try {
      localStorage.setItem(
        "portfolio-motion",
        manuallyPaused ? "paused" : "running",
      );
    } catch {
      /* Preference still works for this page. */
    }
    updateMotion();
  });
  updateMotion();
  motionQuery.addEventListener("change", (event) => {
    updateMotion();
  });
  $("#year").textContent = new Date().getFullYear();

  // Reserve the widest word in a shared grid cell, so headline changes never shift layout.
  const words = $$(".rotating-word");
  let wordIndex = 0;
  setInterval(() => {
    if (
      reducedMotion ||
      document.hidden ||
      $("#home").getBoundingClientRect().bottom < 0
    )
      return;
    words[wordIndex].classList.remove("is-active");
    wordIndex = (wordIndex + 1) % words.length;
    words[wordIndex].classList.add("is-active");
  }, 3800);

  // Duplicate only the visual tool set for a seamless marquee; assistive tech reads it once.
  const toolStrip = $(".tech-strip-inner");
  const toolItems = [...toolStrip.children].slice(1);
  const toolWindow = document.createElement("div");
  toolWindow.className = "tech-window";
  const toolTrack = document.createElement("div");
  toolTrack.className = "tech-track";
  const toolSet = document.createElement("div");
  toolSet.className = "tech-set";
  toolSet.append(...toolItems);
  const toolClone = toolSet.cloneNode(true);
  toolClone.setAttribute("aria-hidden", "true");
  toolTrack.append(toolSet, toolClone);
  toolWindow.append(toolTrack);
  toolStrip.append(toolWindow);

  // Scroll updates share one animation frame: progress line, sticky-header state, active nav.
  const header = $(".site-header");
  const trackedSections = $$("main > section[id]");
  let scrollFrame = 0;
  function updateScroll() {
    const distance = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty(
      "--scroll-progress",
      distance > 0 ? scrollY / distance : 0,
    );
    header.classList.toggle("is-scrolled", scrollY > 20);
    const current = trackedSections
      .filter(
        (section) => section.getBoundingClientRect().top <= innerHeight * 0.4,
      )
      .at(-1)?.id;
    $$("nav a").forEach((link) => {
      const active = link.hash === `#${current}`;
      link.classList.toggle("is-current", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    scrollFrame = 0;
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
    },
    { passive: true },
  );
  window.addEventListener(
    "resize",
    () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
    },
    { passive: true },
  );
  updateScroll();

  // Count up only once on entry; original totals remain present for no-JS and reduced-motion users.
  const statObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const element = entry.target,
                total = Number(element.dataset.count);
              statObserver.unobserve(element);
              if (reducedMotion) return;
              const start = performance.now();
              function count(time) {
                const progress = Math.min((time - start) / 1100, 1);
                element.textContent = String(
                  Math.round(total * (1 - (1 - progress) ** 3)),
                );
                if (progress < 1 && !reducedMotion)
                  requestAnimationFrame(count);
                else element.textContent = String(total);
              }
              requestAnimationFrame(count);
            });
          },
          { threshold: 0.6 },
        )
      : null;
  $$(".stat-number").forEach((element) => statObserver?.observe(element));

  // A small-screen disclosure menu retains normal anchor navigation and keyboard support.
  const menuButton = $(".menu-toggle");
  const navigation = $("#navigation");
  function closeMenu() {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    navigation.classList.remove("open");
  }
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
    navigation.classList.toggle("open", open);
  });
  $$("a", navigation).forEach((link) =>
    link.addEventListener("click", closeMenu),
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navigation.classList.contains("open")) {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) closeMenu();
  });
  matchMedia("(min-width: 900px)").addEventListener("change", closeMenu);

  // IntersectionObserver reveals content once, and animates decorative skill bars.
  // Content is visible by default if the browser does not support this enhancement.
  if ("IntersectionObserver" in window) {
    document.documentElement.classList.add("js-reveal");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    $$(".reveal").forEach((element) => revealObserver.observe(element));
  } else {
    $$(".reveal").forEach((element) => element.classList.add("visible"));
  }

  // Keep continuous project effects running only while their cards are actually in view.
  if ("IntersectionObserver" in window) {
    const effectObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-in-view", entry.isIntersecting);
        }),
      { threshold: 0.05 },
    );
    $$(".project-card").forEach((card) => effectObserver.observe(card));
  }
  document.addEventListener("visibilitychange", () => {
    document.documentElement.classList.toggle("page-hidden", document.hidden);
  });
  document.addEventListener("portfolio:motion", () => {
    if (reducedMotion)
      $$(".project-card").forEach((card) =>
        card.getAnimations().forEach((animation) => animation.cancel()),
      );
  });

  // Pointer coordinates drive a subtle CSS radial glow, never a replacement for the native cursor.
  let glowFrame = 0;
  document.addEventListener(
    "pointermove",
    (event) => {
      if (!finePointer.matches || reducedMotion || glowFrame) return;
      glowFrame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty(
          "--cursor-x",
          `${event.clientX}px`,
        );
        document.documentElement.style.setProperty(
          "--cursor-y",
          `${event.clientY}px`,
        );
        glowFrame = 0;
      });
    },
    { passive: true },
  );
  document.documentElement.addEventListener("pointerleave", () => {
    document.documentElement.style.setProperty("--cursor-x", "-1000px");
  });

  // Bounded 3D card tilt: fine pointers only, with no layout reads during the animation frame.
  $$(".project-card").forEach((card) => {
    card.addEventListener(
      "pointermove",
      (event) => {
        if (!finePointer.matches || reducedMotion) return;
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        card.style.setProperty("--card-x", `${x}px`);
        card.style.setProperty("--card-y", `${y}px`);
        card.style.transform = `perspective(1100px) rotateX(${(0.5 - y / rect.height) * 4}deg) rotateY(${(x / rect.width - 0.5) * 5}deg)`;
      },
      { passive: true },
    );
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });

  // Filters operate on existing accessible cards; no network requests or placeholder buttons.
  $$(".filter").forEach((button) =>
    button.addEventListener("click", () => {
      $$(".filter").forEach((filter) => {
        const active = filter === button;
        filter.classList.toggle("active", active);
        filter.setAttribute("aria-pressed", String(active));
      });
      let count = 0;
      $$(".project-card").forEach((card) => {
        const show =
          button.dataset.filter === "all" ||
          card.dataset.category === button.dataset.filter;
        card.hidden = !show;
        if (show) {
          count++;
          card.classList.add("visible");
          if (!reducedMotion) {
            // The Web Animations API gives touch and keyboard users the same filter feedback.
            card.getAnimations().forEach((animation) => animation.cancel());
            card.animate(
              [
                { opacity: 0, transform: "translateY(16px) scale(.98)" },
                { opacity: 1, transform: "translateY(0) scale(1)" },
              ],
              { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" },
            );
          }
        }
      });
      $("#filter-status").textContent =
        `${count} ${count === 1 ? "project" : "projects"} shown.`;
    }),
  );

  const projects = {
    workforce: {
      category: "2023 / BUSINESS INTELLIGENCE",
      title: "Workforce Intelligence",
      summary:
        "Understanding the human side of operational data: work preferences, leave patterns, and workload.",
      tools: ["Power BI", "Microsoft Excel", "ETL", "Statistical analysis"],
      sections: [
        [
          "The question",
          "What can employee data tell us about absenteeism, work arrangements, and the factors affecting productivity?",
        ],
        [
          "The approach",
          "Collected and prepared workforce data with Excel and ETL techniques, then used hypothesis testing and correlation analysis to investigate work preferences, sick leave, and workload. Interactive Power BI reporting translated those patterns into a clearer picture for stakeholders.",
        ],
        [
          "The outcome",
          "Identified relationships between flexible working arrangements and unplanned absences, and developed predictive models to flag high-risk absenteeism patterns. The project presented recommendations for proactive HR intervention, productivity, and retention.",
        ],
      ],
    },
    dermascan: {
      category: "2023 / APPLIED MACHINE LEARNING",
      title: "Skin Cancer Detection",
      summary:
        "An academic exploration of convolutional neural networks for classifying dermoscopic skin images.",
      tools: ["Python", "TensorFlow", "CNN", "Image preprocessing"],
      sections: [
        [
          "The question",
          "How can deep learning support faster preliminary classification of skin lesions from dermoscopic images?",
        ],
        [
          "The approach",
          "Built a convolutional neural network with image augmentation, normalization, and stratified dataset splits. Evaluated classification using confusion matrices, ROC curves, accuracy, precision, recall, and F1-score.",
        ],
        [
          "The outcome",
          "The academic project reported accuracy, precision, recall, and F1-score above 92%. This was a research prototype; these results do not establish clinical validation or suitability for diagnosis.",
        ],
      ],
    },
    smarthome: {
      category: "2022 / INTERNET OF THINGS",
      title: "Connected Living",
      summary:
        "A practical introduction to connected systems, combining embedded programming with everyday automation.",
      tools: ["NodeMCU ESP8266", "Blynk IoT", "C++", "2-channel relay"],
      sections: [
        [
          "The question",
          "How can a small, connected controller make home devices easier to operate and monitor?",
        ],
        [
          "The approach",
          "Engineered an IoT system around a NodeMCU ESP8266 and the Blynk platform. Integrated two-channel relay modules, smartphone controls, and manual switches with real-time status monitoring and notifications.",
        ],
        [
          "The outcome",
          "Demonstrated remote and manual device control in an academic prototype, building practical experience in embedded programming, hardware integration, and connected application workflows.",
        ],
      ],
    },
  };

  const dialog = $("#project-dialog");
  let lastProjectButton;
  $$(".project-open").forEach((button) =>
    button.addEventListener("click", () => {
      const project = projects[button.dataset.project];
      lastProjectButton = button;
      $("#dialog-category").textContent = project.category;
      $("#dialog-title").textContent = project.title;
      $("#dialog-summary").textContent = project.summary;
      $("#dialog-tags").replaceChildren(
        ...project.tools.map((tool) => {
          const tag = document.createElement("span");
          tag.textContent = tool;
          return tag;
        }),
      );
      // Use DOM textContent, not interpolation into HTML, to keep future content safe.
      $("#dialog-content").replaceChildren(
        ...project.sections.map(([title, text]) => {
          const section = document.createElement("section");
          const heading = document.createElement("h3");
          heading.textContent = title;
          const paragraph = document.createElement("p");
          paragraph.textContent = text;
          section.append(heading, paragraph);
          return section;
        }),
      );
      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add("modal-open");
    }),
  );
  $(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    lastProjectButton?.focus({ preventScroll: true });
  });
  $("#discuss-project").addEventListener("click", () => {
    dialog.close();
    // Move focus to the destination as well as scrolling for keyboard and screen-reader users.
    setTimeout(() => $("#name").focus({ preventScroll: true }), 100);
  });

  $("#copy-email").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("fayas818@gmail.com");
      $("#copy-status").textContent = "Email copied to clipboard.";
    } catch {
      $("#copy-status").textContent = "Copy this address: fayas818@gmail.com";
    }
  });

  // Input focus creates a CSS light trail. Button clicks get a transient, non-blocking ripple.
  $$(".button-primary").forEach((button) =>
    button.addEventListener("click", (event) => {
      if (reducedMotion) return;
      const bounds = button.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.setAttribute("aria-hidden", "true");
      ripple.style.left = `${event.detail ? event.clientX - bounds.left : bounds.width / 2}px`;
      ripple.style.top = `${event.detail ? event.clientY - bounds.top : bounds.height / 2}px`;
      button.append(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), {
        once: true,
      });
    }),
  );

  // Static hosting cannot deliver mail. Open a real mailto draft and give a truthful fallback.
  // Never claim a message was sent, and do not clear user input before delivery is confirmed.
  $("#contact-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = data.get("name").trim();
    const email = data.get("email").trim();
    const message = data.get("body").trim();
    if (!name || message.length < 10) {
      $("#form-status").textContent =
        "Please add your name and a message of at least 10 non-space characters.";
      (!name ? $("#name") : $("#message")).focus();
      return;
    }
    const subject = `${data.get("subject")} — ${name}`;
    const body = `Hi Fayaz,\n\n${message}\n\nFrom: ${name}\nReply to: ${email}`;
    const mailto = `mailto:fayas818@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const fallback = $("#draft-fallback");
    fallback.href = mailto;
    fallback.hidden = false;
    $("#form-status").textContent =
      "Your email draft is ready. Send it in your email app to complete your message. If nothing opens, use the link below or email me directly.";
    window.location.href = mailto;
  });

  // Animated wireframe data globe. Canvas is DPR-capped and pauses outside the viewport.
  // A reduced-motion preference renders one static frame instead of an animation loop.
  const stages = {
    connect: {
      color: "#68f4d1",
      rgb: "104,244,209",
      tools: "SQL / ETL / DATA QUALITY",
      input: "RAW DATA",
      description: "Connected possibilities",
      output: "CONNECTED SYSTEMS",
      result: "The foundation for insight.",
    },
    analyze: {
      color: "#72abff",
      rgb: "114,171,255",
      tools: "POWER BI / DAX / MODELING",
      input: "BETTER QUESTIONS",
      description: "Patterns worth exploring",
      output: "CLEARER INSIGHTS",
      result: "See the bigger picture.",
    },
    act: {
      color: "#e790d8",
      rgb: "231,144,216",
      tools: "KPIs / REPORTING / STRATEGY",
      input: "SHARED INSIGHTS",
      description: "Built for real people",
      output: "BUSINESS DIRECTION",
      result: "Clarity. Then action.",
    },
  };
  let activeStage = "connect";
  const canvas = $("#data-globe");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let width = 0,
    height = 0,
    angle = 0.4,
    globeVisible = true,
    animationId = 0,
    lastFrame = 0,
    targetTiltX = 0,
    targetTiltY = 0,
    tiltX = 0,
    tiltY = 0;
  const visual = $(".hero-visual");
  $$("[data-stage]").forEach((button) =>
    button.addEventListener("click", () => {
      activeStage = button.dataset.stage;
      const stage = stages[activeStage];
      $$("[data-stage]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      });
      visual.style.setProperty("--stage-color", stage.color);
      visual.style.setProperty("--stage-rgb", stage.rgb);
      $("#stage-tools").textContent = stage.tools;
      $("#stage-input").textContent = stage.input;
      $("#stage-description").textContent = stage.description;
      $("#stage-output").textContent = stage.output;
      $("#stage-result").textContent = stage.result;
      canvas.setAttribute(
        "aria-label",
        `${activeStage}: ${stage.description}. A wireframe globe with connected data points.`,
      );
      angle += 0.35;
      draw();
    }),
  );
  visual.addEventListener(
    "pointermove",
    (event) => {
      if (!finePointer.matches || reducedMotion) return;
      const bounds = visual.getBoundingClientRect();
      targetTiltX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.6;
      targetTiltY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.3;
    },
    { passive: true },
  );
  visual.addEventListener("pointerleave", () => {
    targetTiltX = 0;
    targetTiltY = 0;
  });
  const points = [];
  // Fibonacci distribution produces evenly spaced points without heavy geometry libraries.
  for (let i = 0; i < 380; i++) {
    const y = 1 - (i / 379) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = i * Math.PI * (3 - Math.sqrt(5));
    points.push([Math.cos(theta) * radius, y, Math.sin(theta) * radius]);
  }
  const stars = Array.from({ length: 40 }, (_, i) => ({
    x: ((i * 137.5) % 100) / 100,
    y: ((i * 43.7) % 100) / 100,
    size: i % 4 === 0 ? 1.2 : 0.6,
  }));
  function project(x, y, z, r) {
    const cy = Math.cos(angle + tiltX),
      sy = Math.sin(angle + tiltX);
    const rx = x * cy + z * sy,
      rz = -x * sy + z * cy;
    const tilt = -0.25 + tiltY;
    const ry = y * Math.cos(tilt) - rz * Math.sin(tilt);
    const depth = y * Math.sin(tilt) + rz * Math.cos(tilt);
    const lean = -0.23;
    const px = rx * Math.cos(lean) - ry * Math.sin(lean);
    const py = rx * Math.sin(lean) + ry * Math.cos(lean);
    const perspective = 2.9 / (2.9 - depth * 0.3);
    return {
      x: width * 0.52 + px * r * perspective,
      y: height * 0.49 + py * r * perspective,
      z: depth,
    };
  }
  function draw() {
    const { color: accent, rgb } = stages[activeStage];
    ctx.clearRect(0, 0, width, height);
    const cx = width * 0.52,
      cy = height * 0.49,
      r = Math.min(width * 0.31, height * 0.34);
    stars.forEach((star, i) => {
      ctx.beginPath();
      const drift = Math.sin(angle + i) * (i % 2 === 0 ? 9 : -6);
      ctx.arc(
        star.x * width,
        star.y * height + drift,
        star.size,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = i % 3 === 0 ? `rgba(${rgb},.5)` : "#648c9977";
      ctx.fill();
    });
    // Fine orbit ellipses and crosshairs provide a restrained scientific-instrument aesthetic.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.43);
    ctx.strokeStyle = `rgba(${rgb},.3)`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.5, r * 0.43, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(0.85);
    ctx.strokeStyle = "#729dff26";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.36, r * 0.52, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    const gradient = ctx.createRadialGradient(
      cx - r * 0.3,
      cy - r * 0.2,
      r * 0.1,
      cx,
      cy,
      r,
    );
    gradient.addColorStop(0, `rgba(${rgb},.10)`);
    gradient.addColorStop(0.85, "#0b252a66");
    gradient.addColorStop(1, `rgba(${rgb},.12)`);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.025, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    // Latitude/longitude segments brighten toward the front side of the globe.
    function line(a, b) {
      const depth = (a.z + b.z) / 2;
      ctx.strokeStyle = `rgba(${rgb},${depth > 0 ? 0.22 + depth * 0.36 : 0.07})`;
      ctx.lineWidth = depth > 0 ? 0.65 : 0.45;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (let latitude = -75; latitude <= 75; latitude += 15) {
      const lat = (latitude * Math.PI) / 180;
      let previous;
      for (let j = 0; j <= 80; j++) {
        const longitude = (j / 80) * Math.PI * 2;
        const p = project(
          Math.cos(lat) * Math.cos(longitude),
          Math.sin(lat),
          Math.cos(lat) * Math.sin(longitude),
          r,
        );
        if (previous) line(previous, p);
        previous = p;
      }
    }
    for (let longitude = 0; longitude < 360; longitude += 15) {
      const lon = (longitude * Math.PI) / 180;
      let previous;
      for (let j = 0; j <= 40; j++) {
        const lat = -Math.PI / 2 + (j / 40) * Math.PI;
        const p = project(
          Math.cos(lat) * Math.cos(lon),
          Math.sin(lat),
          Math.cos(lat) * Math.sin(lon),
          r,
        );
        if (previous) line(previous, p);
        previous = p;
      }
    }
    points
      .map((p) => project(...p, r))
      .sort((a, b) => a.z - b.z)
      .forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.z > 0.1 ? 1.25 : 0.65, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${p.z > 0 ? 0.45 + p.z * 0.5 : 0.13})`;
        if (i % 19 === 0 && p.z > 0.1) {
          ctx.shadowColor = accent;
          ctx.shadowBlur = 10;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    // Traveling orbital node, with a soft bloom drawn using native Canvas shadows.
    const orbitAngle = angle * 1.3;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.43);
    const ox = Math.cos(orbitAngle) * r * 1.5,
      oy = Math.sin(orbitAngle) * r * 0.43;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 16;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(ox, oy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(${rgb},.5)`;
    ctx.beginPath();
    ctx.arc(ox, oy, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Two brighter packets travel along a second orbit, making motion visible on touch devices.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.42);
    for (let i = 0; i < 2; i++) {
      const phase = -angle * 1.8 + i * Math.PI;
      const x = Math.cos(phase) * r * 1.36,
        y = Math.sin(phase) * r * 0.52;
      ctx.beginPath();
      ctx.arc(x, y, i ? 2 : 2.6, 0, Math.PI * 2);
      ctx.shadowBlur = 14;
      ctx.shadowColor = i ? "#e790d8" : "#72abff";
      ctx.fillStyle = i ? "#e790d8" : "#72abff";
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = "#64948b44";
    ctx.lineWidth = 0.6;
    [
      [cx - r * 1.25, cy - r * 0.9],
      [cx + r * 1.2, cy + r * 0.75],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x - 4, y);
      ctx.lineTo(x + 4, y);
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
    });
  }
  function tick(time) {
    animationId = 0;
    if (!globeVisible || document.hidden || reducedMotion) return;
    // Cap rendering at about 30fps; slow animation uses elapsed time, not frame count.
    if (time - lastFrame >= 32) {
      angle += Math.min(time - (lastFrame || time), 64) * 0.0002;
      tiltX += (targetTiltX - tiltX) * 0.09;
      tiltY += (targetTiltY - tiltY) * 0.09;
      draw();
      lastFrame = time;
    }
    animationId = requestAnimationFrame(tick);
  }
  function syncAnimation() {
    cancelAnimationFrame(animationId);
    animationId = 0;
    lastFrame = 0;
    draw();
    if (globeVisible && !document.hidden && !reducedMotion)
      animationId = requestAnimationFrame(tick);
  }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        globeVisible = entries[0].isIntersecting;
        syncAnimation();
      },
      { rootMargin: "100px" },
    ).observe(canvas);
  }
  document.addEventListener("visibilitychange", syncAnimation);
  document.addEventListener("portfolio:motion", syncAnimation);
  resize();
  syncAnimation();
})();
