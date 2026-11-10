/* Every interaction works with native controls. No framework, tracking, or external runtime calls. */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  let manuallyPaused = false;
  try {
    manuallyPaused = localStorage.getItem("portfolio-motion") === "paused";
  } catch {
    /* Private browsing can block storage. */
  }
  let paused = reducedQuery.matches || manuallyPaused;
  const activeAnimations = new Set();

  function updateMotion() {
    paused = reducedQuery.matches || manuallyPaused;
    document.documentElement.classList.toggle("motion-paused", paused);
    const button = $("#motion-toggle");
    button.disabled = reducedQuery.matches;
    button.setAttribute("aria-pressed", String(paused));
    button.setAttribute(
      "aria-label",
      reducedQuery.matches
        ? "Motion disabled by your device setting"
        : paused
          ? "Resume motion"
          : "Pause motion",
    );
    if (paused) {
      activeAnimations.forEach((animation) => animation.cancel());
      $$(".portrait-figure,.round-link").forEach(
        (element) => (element.style.transform = ""),
      );
    }
    document.dispatchEvent(new Event("portfolio:motion"));
  }
  $("#motion-toggle").addEventListener("click", () => {
    manuallyPaused = !manuallyPaused;
    try {
      localStorage.setItem(
        "portfolio-motion",
        manuallyPaused ? "paused" : "running",
      );
    } catch {
      /* The toggle still works without storage. */
    }
    updateMotion();
  });
  reducedQuery.addEventListener("change", updateMotion);
  updateMotion();
  function enter(element) {
    if (paused || !element.animate) return;
    const animation = element.animate(
      [
        { opacity: 0.25, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" },
    );
    activeAnimations.add(animation);
    animation.finished
      .catch(() => {})
      .finally(() => activeAnimations.delete(animation));
  }

  $("#year").textContent = new Date().getFullYear();
  function updateClock() {
    $("#dubai-time").textContent =
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Dubai",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date()) + " GST";
  }
  updateClock();
  setInterval(updateClock, 30000);

  const menu = $(".menu-toggle"),
    navigation = $("#navigation");
  function closeMenu() {
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Open navigation");
    navigation.classList.remove("is-open");
  }
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
    navigation.classList.toggle("is-open", open);
  });
  $$("a", navigation).forEach((link) =>
    link.addEventListener("click", closeMenu),
  );
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menu.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu();
      menu.focus();
    }
  });
  matchMedia("(min-width:1000px)").addEventListener("change", closeMenu);

  // The photo starts with a muted color treatment; a real button reveals its color on touch, too.
  $("#portrait-toggle").addEventListener("click", (event) => {
    const button = event.currentTarget;
    const color = button.getAttribute("aria-pressed") !== "true";
    $(".about-portrait").classList.toggle("is-color", color);
    button.setAttribute("aria-pressed", String(color));
    button.replaceChildren(
      document.createTextNode(color ? "Muted palette " : "Natural color "),
    );
    const symbol = document.createElement("span");
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = color ? "−" : "+";
    button.append(symbol);
  });
  const photo = $(".portrait-figure");
  $(".about-portrait").addEventListener(
    "pointermove",
    (event) => {
      if (paused || !finePointer.matches) return;
      const bounds = photo.getBoundingClientRect();
      photo.style.transform = `perspective(1200px) rotateY(${((event.clientX - bounds.left) / bounds.width - 0.5) * 3}deg) rotateX(${(0.5 - (event.clientY - bounds.top) / bounds.height) * 2}deg)`;
    },
    { passive: true },
  );
  $(".about-portrait").addEventListener(
    "pointerleave",
    () => (photo.style.transform = ""),
  );

  let scrollFrame = 0;
  function updateScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty(
      "--scroll-progress",
      max > 0 ? scrollY / max : 0,
    );
    const section = $$("main>section[id]")
      .filter(
        (element) => element.getBoundingClientRect().top <= innerHeight * 0.38,
      )
      .at(-1)?.id;
    $$("nav a").forEach((link) => {
      const current = link.hash === `#${section}`;
      link.classList.toggle("is-current", current);
      if (current) link.setAttribute("aria-current", "location");
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

  // A vertical tab index drives one generous preview. On phones CSS puts it after the chosen title.
  const projectTabs = $$(".project-tab");
  function selectProject(button, moveFocus = false) {
    const changed = button.getAttribute("aria-selected") !== "true";
    projectTabs.forEach((tab) => {
      const selected = tab === button;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      $("#" + tab.getAttribute("aria-controls")).hidden = !selected;
    });
    $(".exhibit-stage").style.order = String(
      projectTabs.indexOf(button) * 2 + 2,
    );
    if (moveFocus) button.focus({ preventScroll: true });
    if (changed) enter($("#" + button.getAttribute("aria-controls")));
  }
  projectTabs.forEach((button) => {
    button.addEventListener("click", () => selectProject(button));
    // Actual pointer movement previews a study; scrolling under a parked cursor must not switch it.
    button.addEventListener("pointermove", (event) => {
      if (
        finePointer.matches &&
        event.pointerType === "mouse" &&
        (event.movementX !== 0 || event.movementY !== 0) &&
        !document.activeElement.closest(".exhibit-stage")
      )
        selectProject(button);
    });
    button.addEventListener("keydown", (event) => {
      const index = projectTabs.indexOf(button);
      let next;
      if (event.key === "ArrowDown") next = (index + 1) % projectTabs.length;
      if (event.key === "ArrowUp")
        next = (index - 1 + projectTabs.length) % projectTabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = projectTabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectProject(projectTabs[next], true);
      }
    });
  });

  // All values are a fictional six-month cohort. Workdays = rounded rate × 40 people × 20 days / 100.
  const samples = {
    hybrid: [3.1, 4.2, 3.4, 2.7, 3.2, 2.6],
    office: [5.1, 4.8, 5.6, 4.4, 4.9, 5.2],
    remote: [2.8, 3.5, 3.1, 2.5, 2.7, 2.4],
  };
  const months = ["January", "February", "March", "April", "May", "June"];
  let arrangement = "hybrid",
    metric = "rate",
    selectedMonth = null;
  function drawSample() {
    const rates = samples[arrangement];
    const values =
      metric === "rate" ? rates : rates.map((rate) => Math.round(rate * 8));
    const average =
      values.reduce((sum, value) => sum + value, 0) / values.length;
    const total = values.reduce((sum, value) => sum + value, 0);
    const format = (value) =>
      metric === "rate" ? value.toFixed(1) : String(value);
    const title = arrangement[0].toUpperCase() + arrangement.slice(1);
    const unit = metric === "rate" ? "%" : " days";
    $("#chart-title").textContent =
      `${arrangement.toUpperCase()} / ${metric === "rate" ? "ABSENCE RATE" : "WORKDAYS LOST"}`;
    const displayed =
      selectedMonth === null
        ? metric === "rate"
          ? average
          : total
        : values[selectedMonth];
    const number = document.createTextNode(format(displayed));
    const suffix = document.createElement("span");
    suffix.textContent = unit;
    $("#chart-stat").replaceChildren(number, suffix);
    $("#chart-stat-label").textContent =
      selectedMonth === null
        ? metric === "rate"
          ? "average absence rate"
          : "total sample workdays lost"
        : months[selectedMonth].toLowerCase();
    $$(".chart-column").forEach((button, index) => {
      $(".bar", button).style.setProperty(
        "--bar-height",
        `${(values[index] / (metric === "rate" ? 6.5 : 52)) * 88}%`,
      );
      $(".bar-value", button).textContent = format(values[index]);
      button.setAttribute(
        "aria-label",
        `${months[index]}: ${format(values[index])}${unit} in the ${arrangement} sample`,
      );
      button.setAttribute("aria-pressed", String(selectedMonth === index));
      button.classList.toggle("is-selected", selectedMonth === index);
    });
    const peak = values.indexOf(Math.max(...values));
    $("#lab-summary").textContent =
      selectedMonth === null
        ? `${title} sample: ${format(metric === "rate" ? average : total)}${unit} ${metric === "rate" ? "on average" : "across six months"}. ${months[peak]} is highest at ${format(values[peak])}${unit}. Select a bar to look closer.`
        : `${months[selectedMonth]}: ${format(values[selectedMonth])}${unit} in the ${arrangement} sample. A single month is a starting point for questions, not the whole story.`;
  }
  $$("[data-arrangement]").forEach((button) =>
    button.addEventListener("click", () => {
      arrangement = button.dataset.arrangement;
      selectedMonth = null;
      $$("[data-arrangement]").forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      drawSample();
    }),
  );
  $("#metric-select").addEventListener("change", (event) => {
    metric = event.target.value;
    selectedMonth = null;
    drawSample();
  });
  $$(".chart-column").forEach((button) =>
    button.addEventListener("click", () => {
      const index = Number(button.dataset.month);
      selectedMonth = selectedMonth === index ? null : index;
      drawSample();
    }),
  );
  drawSample();

  const skillData = {
    visualize: {
      title: "Make the complex\nfeel clear.",
      description:
        "I turn business requirements into useful KPIs, data models, and dashboards that technical and non-technical teams can work with.",
      tools: ["Power BI", "DAX", "Power Query", "Tableau"],
      nodes: ["QUESTION", "MODEL", "STORY"],
      output: "KPI dashboards and stakeholder reporting.",
    },
    structure: {
      title: "A reliable story\nstarts underneath.",
      description:
        "I access, query, and prepare datasets, build ETL workflows, and apply consistent data-quality checks so reporting has a reliable foundation.",
      tools: ["SQL", "MySQL", "PostgreSQL", "ETL", "Data modeling"],
      nodes: ["SOURCE", "CLEAN", "CONNECT"],
      output: "Reporting-ready datasets, data models, and integrations.",
    },
    investigate: {
      title: "Follow the question.\nCheck the pattern.",
      description:
        "I use exploratory analysis, trend comparisons, and performance reporting to understand what is changing and where to look next.",
      tools: ["Excel", "EDA", "Statistical modeling", "KPI reporting"],
      nodes: ["OBSERVE", "TEST", "EXPLAIN"],
      output: "Practical findings and business recommendations.",
    },
  };
  const skillTabs = $$(".skill-tabs [role=tab]");
  function selectSkill(button, focus = false) {
    const data = skillData[button.dataset.skill];
    skillTabs.forEach((tab) => {
      const active = tab === button;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.classList.toggle("is-active", active);
    });
    $("#skill-panel").setAttribute("aria-labelledby", button.id);
    $("#skill-title").replaceChildren(
      ...data.title
        .split("\n")
        .flatMap((line, index) =>
          index
            ? [document.createElement("br"), document.createTextNode(line)]
            : [document.createTextNode(line)],
        ),
    );
    $("#skill-description").textContent = data.description;
    $("#skill-tools").replaceChildren(
      ...data.tools.map((tool) => {
        const span = document.createElement("span");
        span.textContent = tool;
        return span;
      }),
    );
    ["one", "two", "three"].forEach(
      (id, index) => ($("#skill-node-" + id).textContent = data.nodes[index]),
    );
    $("#skill-output").textContent = data.output;
    $(".skill-number").textContent = `0${skillTabs.indexOf(button) + 1}`;
    if (focus) button.focus();
    enter($("#skill-panel"));
  }
  skillTabs.forEach((button) => {
    button.addEventListener("click", () => selectSkill(button));
    button.addEventListener("keydown", (event) => {
      const index = skillTabs.indexOf(button);
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % skillTabs.length;
      if (event.key === "ArrowLeft")
        next = (index - 1 + skillTabs.length) % skillTabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = skillTabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectSkill(skillTabs[next], true);
      }
    });
  });

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

  const studyDialog = $("#project-dialog"),
    contactDialog = $("#contact-dialog");
  let studyTrigger = null,
    contactTrigger = null;
  function openContact(trigger = document.activeElement) {
    contactTrigger = trigger;
    contactDialog.showModal();
    document.body.classList.add("dialog-open");
    $("#name").focus({ preventScroll: true });
  }
  $$(".contact-trigger").forEach((button) =>
    button.addEventListener("click", () => openContact(button)),
  );
  $$(".study-open").forEach((button) =>
    button.addEventListener("click", () => {
      const data = projects[button.dataset.study];
      studyTrigger = button;
      $("#dialog-category").textContent = data.category;
      $("#dialog-title").textContent = data.title;
      $("#dialog-summary").textContent = data.summary;
      $("#dialog-tags").replaceChildren(
        ...data.tools.map((tool) => {
          const tag = document.createElement("span");
          tag.textContent = tool;
          return tag;
        }),
      );
      $("#dialog-body").replaceChildren(
        ...data.sections.map(([heading, content]) => {
          const section = document.createElement("section"),
            h = document.createElement("h3"),
            p = document.createElement("p");
          h.textContent = heading;
          p.textContent = content;
          section.append(h, p);
          return section;
        }),
      );
      studyDialog.showModal();
      studyDialog.scrollTop = 0;
      document.body.classList.add("dialog-open");
    }),
  );
  $$("dialog").forEach((dialog) => {
    $(".dialog-close", dialog).addEventListener("click", () => dialog.close());
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
      if (!$$("dialog[open]").length)
        document.body.classList.remove("dialog-open");
      const trigger = dialog === studyDialog ? studyTrigger : contactTrigger;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    });
  });
  $("#discuss-project").addEventListener("click", () => {
    studyDialog.close();
    $("#interest").value = "A project collaboration";
    requestAnimationFrame(() => openContact(studyTrigger));
  });
  $("#copy-email").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("fayas818@gmail.com");
      $("#copy-status").textContent = "Copied. See you in the inbox.";
    } catch {
      $("#copy-status").textContent = "Copy this address: fayas818@gmail.com";
    }
  });

  // Static hosting creates an email draft, not a server delivery. Preserve the input and show a fallback.
  $("#contact-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form),
      name = data.get("name").trim(),
      email = data.get("email").trim(),
      message = data.get("body").trim();
    if (!name || message.length < 10) {
      $("#form-status").textContent =
        "Please add your name and a message with at least 10 non-space characters.";
      (!name ? $("#name") : $("#message")).focus();
      return;
    }
    const subject = `${data.get("subject")} — ${name}`;
    const body = `Hi Fayaz,\n\n${message}\n\nFrom: ${name}\nReply to: ${email}`;
    const href = `mailto:fayas818@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $("#draft-fallback").href = href;
    $("#draft-fallback").hidden = false;
    $("#form-status").textContent =
      "Your draft is ready. Send it in your email app to complete your message. If nothing opens, use the draft link below or email me directly.";
    window.location.href = href;
  });

  // The round invitation gently follows a fine pointer; touch gets the same real dialog action.
  $$(".round-link").forEach((button) => {
    button.addEventListener(
      "pointermove",
      (event) => {
        if (paused || !finePointer.matches) return;
        const bounds = button.getBoundingClientRect();
        button.style.transform = `translate(${(event.clientX - bounds.left - bounds.width / 2) * 0.12}px,${(event.clientY - bounds.top - bounds.height / 2) * 0.12}px)`;
      },
      { passive: true },
    );
    button.addEventListener(
      "pointerleave",
      () => (button.style.transform = ""),
    );
  });

  // Progressive enhancement: readable content remains the default, with no scroll hijacking.
  if ("IntersectionObserver" in window) {
    document.documentElement.classList.add("js-ready");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.1 },
    );
    $$(
      ".section-heading,.about-grid,.impact-strip,.skills-grid,.contact-layout",
    ).forEach((element) => {
      element.classList.add("reveal");
      observer.observe(element);
    });
  }
})();
