import { gsap } from "gsap";
import fire1Url from './assets/fire/fire1.png';
import fire2Url from './assets/fire/fire2.png';
import fire3Url from './assets/fire/fire3.png';
import fire4Url from './assets/fire/fire4.png';

const PROMPTS = [
  "What does home mean to you?",
  "What do you wish someone knew about finding home?",
  "Describe a moment you felt you belonged.",
  "What would make home feel possible?",
];

const MAX_SPARKS = 8;
const FIRE_FRAMES = [fire1Url, fire2Url, fire3Url, fire4Url];

let messages = [];
let fireAnimInterval = null;
let fireAnimImg = null;
let promptIndex = 0;
let sparksActive = false;
let spawnInterval = null;
const activeTimelines = new Set();

let fireZone, sparksContainer, composePanel, composePrompt, composeText,
    composeNickname, composeSubmit, composeClose, messageModal, modalText,
    modalMeta, modalClose;

let hoveredSpark = null;

function resolveRefs() {
  fireZone        = document.getElementById("fireClickZone");
  sparksContainer = document.getElementById("sparksContainer");
  composePanel    = document.getElementById("composePanel");
  composePrompt   = document.getElementById("composePrompt");
  composeText     = document.getElementById("composeText");
  composeNickname = document.getElementById("composeNickname");
  composeSubmit   = document.getElementById("composeSubmit");
  composeClose    = document.getElementById("composeClose");
  messageModal    = document.getElementById("messageModal");
  modalText       = document.getElementById("modalText");
  modalMeta       = document.getElementById("modalMeta");
  modalClose      = document.getElementById("modalClose");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function relativeTime(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "moments ago";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function truncateText(text) {
  const words = text.trim().split(/\s+/);
  if (words.length <= 4) return text;
  return words.slice(0, 4).join(" ") + "…";
}

// ─── Spark (GSAP-driven) ─────────────────────────────────────────────────────

function spawnSpark(message, opts = {}) {
  if (!sparksContainer) return;

  // Cap — remove oldest, kill its timeline
  const existing = sparksContainer.querySelectorAll(".spark");
  if (existing.length >= MAX_SPARKS) {
    const oldest = existing[0];
    if (oldest._tl) { oldest._tl.kill(); activeTimelines.delete(oldest._tl); }
    oldest.remove();
  }

  const el = document.createElement("div");
  el.className = "spark";
  el.textContent = truncateText(message.text);
  sparksContainer.appendChild(el);

  // Fire center in container-local coordinates
  const fireRect = fireZone?.getBoundingClientRect();
  const cRect    = sparksContainer.getBoundingClientRect();
  const fireCX   = fireRect ? fireRect.left - cRect.left + fireRect.width  / 2 : cRect.width  / 2;
  const fireCY   = fireRect ? fireRect.top  - cRect.top  + fireRect.height / 2 : cRect.height * 0.78;

  const totalH  = cRect.height * 0.86;
  const amp     = rand(70, 120);      // peak horizontal swing per half-cycle
  const totalDur = rand(16, 26);
  const delay    = opts.initial ? rand(0, 7) : 0;

  // Start position
  let startX = fireCX, startY = fireCY;
  if (opts.initial) {
    startX += rand(-100, 100);
    startY  = fireCY - rand(0.06, 0.78) * totalH;
  } else {
    startX += rand(-35, 35);
  }

  gsap.set(el, { left: 0, top: 0, x: startX, y: startY, opacity: 0 });

  // Serpentine waypoints — alternating swing direction
  const dir = Math.random() < 0.5 ? 1 : -1;
  const waypoints = [
    { x: startX + amp * dir  * rand(0.8, 1.1), y: startY - totalH * 0.17 },
    { x: startX - amp * dir  * rand(0.7, 1.0), y: startY - totalH * 0.34 },
    { x: startX + amp * dir  * rand(0.9, 1.2), y: startY - totalH * 0.51 },
    { x: startX - amp * dir  * rand(0.5, 0.9), y: startY - totalH * 0.68 },
    { x: startX + amp * dir  * rand(0.3, 0.6), y: startY - totalH * 0.85 },
    { x: startX - amp * dir  * rand(0.1, 0.3), y: startY - totalH * 1.00 },
  ];

  const segDur  = (totalDur * 0.82) / waypoints.length;
  const overlap = (segDur * 0.45).toFixed(2);

  const tl = gsap.timeline({
    delay,
    onComplete: () => { el.remove(); activeTimelines.delete(tl); },
  });
  activeTimelines.add(tl);
  el._tl = tl;

  // Fade in
  tl.to(el, { opacity: rand(0.75, 0.95), duration: rand(1.5, 2.5), ease: "power1.out" });

  // Serpentine motion — overlapping tweens produce smooth curves
  waypoints.forEach((wp, i) => {
    tl.to(el, { x: wp.x, y: wp.y, duration: segDur, ease: "sine.inOut" },
      i === 0 ? ">" : `>-${overlap}`);
  });

  // Fade out near top
  const fadeStart = `>-${rand(2.5, 4).toFixed(1)}`;
  tl.to(el, { opacity: 0, duration: rand(2, 3.5), ease: "power2.in" }, fadeStart);

  el.addEventListener("click", (e) => { e.stopPropagation(); openMessageModal(message); });
}

// ─── Compose panel ───────────────────────────────────────────────────────────

let composePanelOpen = false;

function openComposePanel() {
  if (composePanelOpen) return;
  composePanelOpen = true;
  composePrompt.textContent = PROMPTS[promptIndex % PROMPTS.length];
  promptIndex++;
  composeText.value = "";
  composeNickname.value = "";
  composePanel.setAttribute("aria-hidden", "false");

  gsap.fromTo(
    composePanel,
    { opacity: 0, y: 70, xPercent: -50 },
    { opacity: 1, y: 0, xPercent: -50, duration: 0.65, ease: "power3.out",
      onComplete: () => composeText.focus() }
  );
}

function closeComposePanel() {
  if (!composePanelOpen) return;
  gsap.to(composePanel, {
    opacity: 0, y: 50, xPercent: -50, duration: 0.4, ease: "power2.in",
    onComplete: () => {
      composePanelOpen = false;
      composePanel.setAttribute("aria-hidden", "true");
      gsap.set(composePanel, { clearProps: "y,opacity" });
    },
  });
}

async function submitMessage() {
  const text = composeText.value.trim();
  if (!text) { composeText.focus(); return; }

  composeSubmit.disabled = true;
  composeSubmit.textContent = "sending…";

  try {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, nickname: composeNickname.value.trim() || null }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const saved = await res.json();
    messages.unshift(saved);
    closeComposePanel();
    setTimeout(() => spawnSpark(saved), 450);
  } catch (err) {
    console.error("Failed to submit message:", err);
    composeSubmit.textContent = "try again";
  } finally {
    composeSubmit.disabled = false;
    if (composeSubmit.textContent === "sending…") composeSubmit.textContent = "release ✦";
  }
}

// ─── Message modal ───────────────────────────────────────────────────────────

function openMessageModal(message) {
  modalText.textContent = `"${message.text}"`;
  const parts = [];
  if (message.nickname) parts.push(message.nickname);
  parts.push(relativeTime(message.timestamp));
  modalMeta.textContent = parts.join("  ·  ");

  messageModal.setAttribute("aria-hidden", "false");
  document.getElementById("forumOverlay")?.classList.add("message-modal-open");
  gsap.fromTo(messageModal, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" });
}

function closeMessageModal() {
  gsap.to(messageModal, {
    opacity: 0, duration: 0.3, ease: "power2.in",
    onComplete: () => {
      messageModal.setAttribute("aria-hidden", "true");
      document.getElementById("forumOverlay")?.classList.remove("message-modal-open");
    },
  });
}

// ─── Hover tracking (document-level, reliable on animating elements) ─────────

function attachHoverTracking() {
  document.addEventListener("pointermove", (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const spark = el?.classList.contains("spark") ? el : el?.closest(".spark");

    if (spark !== hoveredSpark) {
      if (hoveredSpark) {
        hoveredSpark._tl?.timeScale(1);
        hoveredSpark.classList.remove("spark--hovered");
      }
      hoveredSpark = spark ?? null;
      if (hoveredSpark) {
        hoveredSpark._tl?.timeScale(0);
        hoveredSpark.classList.add("spark--hovered");
      }
    }
  });

  document.addEventListener("pointerleave", () => {
    if (hoveredSpark) {
      hoveredSpark._tl?.timeScale(1);
      hoveredSpark.classList.remove("spark--hovered");
      hoveredSpark = null;
    }
  });
}

// ─── Fire animation ──────────────────────────────────────────────────────────

function startFireAnimation() {
  const coverFire = document.getElementById("coverFire");
  if (!coverFire) return;
  const svgEl = coverFire.closest("svg");
  if (!svgEl) return;

  fireAnimImg = document.createElementNS("http://www.w3.org/2000/svg", "image");
  fireAnimImg.setAttribute("x", "0");
  fireAnimImg.setAttribute("y", "0");
  fireAnimImg.setAttribute("width", "1920");
  fireAnimImg.setAttribute("height", "2160");
  fireAnimImg.setAttribute("href", FIRE_FRAMES[0]);
  coverFire.insertAdjacentElement("afterend", fireAnimImg);
  coverFire.style.display = "none";

  let frame = 0;
  fireAnimInterval = setInterval(() => {
    frame = (frame + 1) % FIRE_FRAMES.length;
    fireAnimImg.setAttribute("href", FIRE_FRAMES[frame]);
  }, 120);
}

function stopFireAnimation() {
  clearInterval(fireAnimInterval);
  fireAnimInterval = null;
  const coverFire = document.getElementById("coverFire");
  if (coverFire) coverFire.style.display = "";
  fireAnimImg?.remove();
  fireAnimImg = null;
}

// ─── Fire glow ───────────────────────────────────────────────────────────────

function attachFireGlow() {
  const coverFire = document.getElementById("coverFire");
  if (!coverFire || !fireZone) return;
  fireZone.addEventListener("mouseenter", () => coverFire.classList.add("fire-glowing"));
  fireZone.addEventListener("mouseleave", () => coverFire.classList.remove("fire-glowing"));
}

// ─── Spawn loop ──────────────────────────────────────────────────────────────

function startSpawnLoop() {
  if (spawnInterval) return;
  spawnInterval = setInterval(() => {
    if (!sparksActive || messages.length === 0) return;
    spawnSpark(messages[Math.floor(Math.random() * messages.length)]);
  }, 5000);
}

function stopSpawnLoop() {
  clearInterval(spawnInterval);
  spawnInterval = null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function initForum() {
  resolveRefs();

  try {
    const res = await fetch("/api/messages");
    if (res.ok) messages = await res.json();
  } catch (err) {
    console.warn("Could not load messages:", err);
  }

  fireZone?.addEventListener("click", openComposePanel);
  attachFireGlow();
  attachHoverTracking();

  composeSubmit?.addEventListener("click", submitMessage);
  composeClose?.addEventListener("click", closeComposePanel);
  composeText?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitMessage();
  });

  modalClose?.addEventListener("click", closeMessageModal);
  messageModal?.addEventListener("click", (e) => {
    if (e.target === messageModal) closeMessageModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (messageModal?.getAttribute("aria-hidden") === "false") closeMessageModal();
      else if (composePanelOpen) closeComposePanel();
    }
  });
}

export function resumeForum() {
  startFireAnimation();
  sparksActive = true;
  const seed = messages.slice(0, 20);
  seed.forEach((msg, i) => {
    setTimeout(() => spawnSpark(msg, { initial: true }), i * 220);
  });
  startSpawnLoop();
}

export function pauseForum() {
  stopFireAnimation();
  sparksActive = false;
  stopSpawnLoop();
  activeTimelines.forEach(tl => tl.kill());
  activeTimelines.clear();
  hoveredSpark = null;
  if (sparksContainer) sparksContainer.innerHTML = "";
  if (composePanelOpen) closeComposePanel();
  if (messageModal?.getAttribute("aria-hidden") === "false") closeMessageModal();
}
