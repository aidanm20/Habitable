import { gsap } from "gsap";

const THEME_COLORS = {
  Stay:   "#F0C867",
  Afford: "#82C4A8",
  Keep:   "#C98585",
  Find:   "#85A8C9",
  Belong: "#A885C9",
  Build:  "#C9A065",
};

const NODE_SIZES = [6, 7, 7, 8, 6, 9, 7, 8, 6, 7, 8, 6, 7, 9, 6, 7, 8, 7, 6, 8, 7, 6, 9, 7, 8, 6, 7, 8, 6, 7];

export async function initConnect() {
  const mapWrap = document.getElementById("connectMapWrap");
  const svg = document.getElementById("connectMap");
  const cardEl = document.getElementById("resourceCard");
  const closeBtn = document.getElementById("cardClose");
  const filtersToggle = document.getElementById("filtersToggle");
  const filtersDropdown = document.getElementById("filtersDropdown");

  if (!svg || !cardEl || !mapWrap) return;

  // ── Dropdown toggle ────────────────────────────────────────
  let dropdownOpen = false;
  let dropdownTween = null;

  if (filtersToggle && filtersDropdown) {
    // Measure natural height once by briefly making it auto
    filtersDropdown.style.height = "auto";
    filtersDropdown.style.opacity = "1";
    const naturalH = filtersDropdown.scrollHeight;
    filtersDropdown.style.height = "0";
    filtersDropdown.style.opacity = "0";

    filtersToggle.addEventListener("click", () => {
      if (dropdownTween) dropdownTween.kill();
      if (dropdownOpen) {
        dropdownOpen = false;
        filtersToggle.setAttribute("aria-expanded", "false");
        filtersDropdown.setAttribute("aria-hidden", "true");
        dropdownTween = gsap.to(filtersDropdown, {
          height: 0, opacity: 0, duration: 0.28, ease: "power2.in",
          onComplete: () => filtersDropdown.classList.remove("is-open"),
        });
      } else {
        dropdownOpen = true;
        filtersToggle.setAttribute("aria-expanded", "true");
        filtersDropdown.setAttribute("aria-hidden", "false");
        filtersDropdown.classList.add("is-open");
        dropdownTween = gsap.to(filtersDropdown, {
          height: naturalH, opacity: 1, duration: 0.32, ease: "power2.out",
        });
      }
    });
  }

  const resources = await fetch("/resources.json").then((r) => r.json());

  const NS = "http://www.w3.org/2000/svg";

  function getMapDims() {
    return { W: mapWrap.offsetWidth, H: mapWrap.offsetHeight };
  }

  // Jitter overlapping nodes so clusters spread into visible mini-constellations
  const jittered = jitterPositions(resources);

  function toSVGCoords(x, y) {
    const { W, H } = getMapDims();
    const padX = W * 0.07;
    const padY = H * 0.08;
    return {
      cx: padX + (x / 100) * (W - padX * 2),
      cy: padY + (y / 100) * (H - padY * 2),
    };
  }

  function buildSVG() {
    const { W, H } = getMapDims();
    if (!W || !H) return; // container not laid out yet — skip

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);

    // Reset card state — SVG elements are recreated so old references are invalid
    if (selectedGroup) {
      selectedGroup = null;
      cardEl.classList.remove("is-open");
      cardEl.querySelector(".card-body")?.remove();
      if (!cardEl.querySelector(".card-prompt")) {
        const prompt = document.createElement("p");
        prompt.className = "card-prompt";
        prompt.innerHTML = "Select a resource<br>to learn more.";
        cardEl.appendChild(prompt);
      }
    }

    // Clear existing
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Defs: glow filter
    const defs = document.createElementNS(NS, "defs");
    defs.innerHTML = `
      <filter id="glow-node" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="glow-node-hot" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    `;
    svg.appendChild(defs);

    // Lines layer
    const linesG = document.createElementNS(NS, "g");
    linesG.setAttribute("class", "constellation-lines");
    drawConstellationLines(linesG, jittered, NS, W, H);
    svg.appendChild(linesG);

    // Axis labels layer
    const axisG = document.createElementNS(NS, "g");
    axisG.setAttribute("class", "axis-labels-group");
    axisG.setAttribute("pointer-events", "none");
    drawAxisLabels(axisG, NS, W, H);
    svg.appendChild(axisG);

    // Nodes layer
    const nodesG = document.createElementNS(NS, "g");
    nodesG.setAttribute("class", "constellation-nodes");

    jittered.forEach((resource, i) => {
      const { cx, cy } = toSVGCoords(resource._x, resource._y);
      const color = THEME_COLORS[resource.theme] || "#ffffff";
      const r = NODE_SIZES[i % NODE_SIZES.length];

      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "node-group");
      g.setAttribute("data-id", resource.id);
      g.setAttribute("data-theme", resource.theme);
      g.style.cursor = "pointer";
      g.style.animationDelay = `${(i * 0.37) % 5}s`;
      g.classList.add("node-twinkle");

      // Outer ring (shown when selected)
      const ring = document.createElementNS(NS, "circle");
      ring.setAttribute("cx", cx);
      ring.setAttribute("cy", cy);
      ring.setAttribute("r", r + 5);
      ring.setAttribute("fill", "none");
      ring.setAttribute("stroke", color);
      ring.setAttribute("stroke-width", "1");
      ring.setAttribute("opacity", "0");
      ring.setAttribute("class", "node-ring");

      // Main circle
      const circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      circle.setAttribute("r", r);
      circle.setAttribute("fill", color);
      circle.setAttribute("stroke", "rgba(255,255,255,0.4)");
      circle.setAttribute("stroke-width", "1");
      circle.setAttribute("filter", "url(#glow-node)");
      circle.setAttribute("class", "node-circle");

      g.appendChild(ring);
      g.appendChild(circle);
      nodesG.appendChild(g);

      g.addEventListener("mouseenter", () => {
        circle.setAttribute("filter", "url(#glow-node-hot)");
        circle.setAttribute("r", r + 2);
      });
      g.addEventListener("mouseleave", () => {
        if (!g.classList.contains("selected")) {
          circle.setAttribute("filter", "url(#glow-node)");
          circle.setAttribute("r", r);
        }
      });
      g.addEventListener("click", () => openCard(resource, g));
    });

    svg.appendChild(nodesG);
    applyFilters();
  }

  // Active filters: { identity: Set, access: Set, geo: Set }
  const activeFilters = { identity: new Set(), access: new Set(), geo: new Set() };

  function applyFilters() {
    const noFiltersActive =
      activeFilters.identity.size === 0 &&
      activeFilters.access.size === 0 &&
      activeFilters.geo.size === 0;

    svg.querySelectorAll(".node-group").forEach((g) => {
      const id = g.getAttribute("data-id");
      const res = resources.find((r) => r.id === id);
      if (!res) return;

      let visible = true;
      if (!noFiltersActive) {
        const identityOk =
          activeFilters.identity.size === 0 ||
          [...activeFilters.identity].some((v) =>
            res.identityCommunity.map((s) => s.toLowerCase()).includes(v.toLowerCase())
          );
        const accessOk =
          activeFilters.access.size === 0 ||
          [...activeFilters.access].some((v) =>
            res.accessMode.map((s) => s.toLowerCase()).includes(v.toLowerCase())
          );
        const geoOk =
          activeFilters.geo.size === 0 ||
          [...activeFilters.geo].some((v) =>
            res.geography.map((s) => s.toLowerCase()).includes(v.toLowerCase())
          );
        visible = identityOk && accessOk && geoOk;
      }

      if (visible) {
        g.classList.remove("node-dimmed");
        gsap.to(g, { opacity: 1, duration: 0.4, ease: "power1.out", overwrite: true });
      } else {
        g.classList.add("node-dimmed");
        gsap.to(g, { opacity: 0, duration: 0.35, ease: "power1.in", overwrite: true });
      }
    });
  }

  // Chip filter buttons
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const filterKey = chip.dataset.filter;
      const val = chip.dataset.value;
      const set = activeFilters[filterKey];

      if (set.has(val)) {
        set.delete(val);
        chip.classList.remove("active");
      } else {
        set.add(val);
        chip.classList.add("active");
      }
      applyFilters();
    });
  });

  let selectedGroup = null;

  function openCard(resource, group) {
    // Deselect previous
    if (selectedGroup && selectedGroup !== group) {
      selectedGroup.classList.remove("selected");
      const prevCircle = selectedGroup.querySelector(".node-circle");
      const prevRing = selectedGroup.querySelector(".node-ring");
      const prevR = parseInt(prevCircle.getAttribute("r"));
      prevCircle.setAttribute("filter", "url(#glow-node)");
      prevCircle.setAttribute("r", prevR > 8 ? prevR - 2 : prevR);
      prevRing.setAttribute("opacity", "0");
    }

    selectedGroup = group;
    group.classList.add("selected");
    const circle = group.querySelector(".node-circle");
    const ring = group.querySelector(".node-ring");
    circle.setAttribute("filter", "url(#glow-node-hot)");
    ring.setAttribute("opacity", "0.6");

    const color = THEME_COLORS[resource.theme] || "#F0C867";
    const tags = [
      ...(resource.identityCommunity || []),
      ...(resource.accessMode || []),
      ...(resource.geography || []),
    ]
      .slice(0, 6)
      .map(
        (t) =>
          `<span class="resource-tag" style="border-color:${color}33;color:${color}">${t}</span>`
      )
      .join("");

    cardEl.querySelector(".card-prompt")?.remove();
    cardEl.querySelector(".card-body")?.remove();

    const body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML = `
      <div class="card-theme-dot" style="background:${color}"></div>
      <p class="card-theme-name" style="color:${color}">${resource.theme} · ${resource.stage}</p>
      <h2 class="card-name">${resource.name}</h2>
      <p class="card-desc">${resource.description || ""}</p>
      <div class="card-tags">${tags}</div>
      ${resource.eligibilityNotes ? `<p class="card-eligibility">${resource.eligibilityNotes}</p>` : ""}
      <a class="card-link" href="${resource.url}" target="_blank" rel="noopener noreferrer">
        Visit resource <span aria-hidden="true">→</span>
      </a>
    `;
    cardEl.appendChild(body);
    cardEl.classList.add("is-open");
  }

  closeBtn.addEventListener("click", () => {
    cardEl.classList.remove("is-open");
    if (selectedGroup) {
      selectedGroup.classList.remove("selected");
      const ring = selectedGroup.querySelector(".node-ring");
      const circle = selectedGroup.querySelector(".node-circle");
      ring.setAttribute("opacity", "0");
      circle.setAttribute("filter", "url(#glow-node)");
      selectedGroup = null;
    }
    cardEl.querySelector(".card-body")?.remove();
    const prompt = document.createElement("p");
    prompt.className = "card-prompt";
    prompt.innerHTML = "Select a resource<br>to learn more.";
    cardEl.appendChild(prompt);
  });

  buildSVG();

  // Rebuild when the map container changes size — debounced to let layout settle
  let roTimer;
  new ResizeObserver(() => {
    clearTimeout(roTimer);
    roTimer = setTimeout(buildSVG, 80);
  }).observe(mapWrap);
}

// ─── helpers ───────────────────────────────────────────────────────────────

function jitterPositions(resources) {
  const placed = [];
  return resources.map((res) => {
    let x = res.x;
    let y = res.y;
    const THRESH = 4.5;
    const conflicts = placed.filter(
      (p) => Math.abs(p._x - x) < THRESH && Math.abs(p._y - y) < THRESH
    );
    if (conflicts.length > 0) {
      const angle = (conflicts.length * 137.5 * Math.PI) / 180;
      const dist = 4.5 + conflicts.length * 2.2;
      x = clamp(x + Math.cos(angle) * dist, 2, 97);
      y = clamp(y + Math.sin(angle) * dist, 2, 97);
    }
    const entry = { ...res, _x: x, _y: y };
    placed.push(entry);
    return entry;
  });
}

function drawConstellationLines(g, resources, NS, W, H) {
  const padX = W * 0.07;
  const padY = H * 0.08;

  function toCoord(x, y) {
    return {
      cx: padX + (x / 100) * (W - padX * 2),
      cy: padY + (y / 100) * (H - padY * 2),
    };
  }

  const themes = [...new Set(resources.map((r) => r.theme))];
  themes.forEach((theme) => {
    const group = resources.filter((r) => r.theme === theme);
    const color = THEME_COLORS[theme] || "#ffffff";

    // nearest-neighbor: connect each node to its closest 1-2 in same theme
    group.forEach((a, ai) => {
      const others = group
        .map((b, bi) => ({ b, bi, d: dist(a._x, a._y, b._x, b._y) }))
        .filter(({ bi }) => bi !== ai)
        .sort((m, n) => m.d - n.d)
        .slice(0, 2);

      others.forEach(({ b }) => {
        const ca = toCoord(a._x, a._y);
        const cb = toCoord(b._x, b._y);
        const line = document.createElementNS(NS, "line");
        line.setAttribute("x1", ca.cx);
        line.setAttribute("y1", ca.cy);
        line.setAttribute("x2", cb.cx);
        line.setAttribute("y2", cb.cy);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", "0.7");
        line.setAttribute("opacity", "0.18");
        line.setAttribute("data-theme", theme);
        g.appendChild(line);
      });
    });
  });
}

function drawAxisLabels(g, NS, W, H) {
  const padX = W * 0.07;
  const padY = H * 0.08;
  const usableW = W - padX * 2;
  const usableH = H - padY * 2;

  // X-axis theme labels (horizontal %)
  const xThemes = [
    { label: "Stay",   x: 9 },
    { label: "Afford", x: 25 },
    { label: "Keep",   x: 42 },
    { label: "Find",   x: 57 },
    { label: "Belong", x: 72 },
    { label: "Build",  x: 89 },
  ];
  xThemes.forEach(({ label, x }) => {
    const svgX = padX + (x / 100) * usableW;
    const text = document.createElementNS(NS, "text");
    text.setAttribute("x", svgX);
    text.setAttribute("y", H - 10);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("class", "axis-x-label");
    text.setAttribute("fill", THEME_COLORS[label] || "rgba(255,255,255,0.4)");
    text.textContent = label;
    g.appendChild(text);
  });

  // Y-axis stage labels (vertical %)
  const yStages = [
    { label: "Now",    y: 9 },
    { label: "Next",   y: 39 },
    { label: "Settle", y: 65 },
    { label: "Grow",   y: 91 },
  ];
  yStages.forEach(({ label, y }) => {
    const svgY = padY + (y / 100) * usableH;
    const text = document.createElementNS(NS, "text");
    text.setAttribute("x", 10);
    text.setAttribute("y", svgY + 4);
    text.setAttribute("text-anchor", "start");
    text.setAttribute("class", "axis-y-label");
    text.textContent = label;
    g.appendChild(text);
  });
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
