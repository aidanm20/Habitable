import "./style.css";
import { gsap } from "gsap";
import { setupCoverParallax } from "./app.js";
import learnBgImageUrl from "./assets/bg/2.jpg?url";

const LEARN_BG_SOURCE_SIZE = {
    width: 2360,
    height: 1640,
};

const LEARN_BOOK_AREA = {
    left: 325,
    top: 690,
    width: 1500 - 325,
    height: 1530 - 690,
};

async function startTextDraw() {
    const text = document.querySelector(".draw-text");
    if (!text || typeof text.getComputedTextLength !== "function") {
        return;
    }

    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }

    const length = Math.ceil(text.getComputedTextLength());
    text.style.strokeDasharray = `${length} ${length}`;
    text.style.strokeDashoffset = `${length}`;

    // Force style flush so animation starts from hidden stroke.
    text.getBoundingClientRect();
    text.classList.add("animate-draw");
}

window.addEventListener("load", () => {
    startTextDraw();
});

setupCoverParallax();

const introButton = document.querySelector(".introButton");
const introContent = document.querySelector("#introContent");
const hubBg = document.querySelector("#coverScene");
const hubOverlay = document.querySelector("#hubOverlay");
const connectBg = document.querySelector("#connectBg");
const learnBg = document.querySelector("#learnBg");
const storyBg = document.querySelector("#storyBg");
const connectTrigger = document.querySelector(".hub-connect");
const learnTrigger = document.querySelector(".hub-learn");
const storyTrigger = document.querySelector(".hub-story");
const connectOverlay = document.querySelector("#connectOverlay");
const connectBack = document.querySelector("#connectBack");
const learnOverlay = document.querySelector("#learnOverlay");
const learnBack = document.querySelector("#learnBack");
const learnBookHotspot = document.querySelector("#learnBookHotspot");
const storyOverlay = document.querySelector("#storyOverlay");
const storyBack = document.querySelector("#storyBack");

function positionLearnBookHotspot() {
    if (!learnOverlay || !learnBookHotspot) {
        return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scale = Math.max(
        viewportWidth / LEARN_BG_SOURCE_SIZE.width,
        viewportHeight / LEARN_BG_SOURCE_SIZE.height,
    );

    const renderedWidth = LEARN_BG_SOURCE_SIZE.width * scale;
    const renderedHeight = LEARN_BG_SOURCE_SIZE.height * scale;
    const offsetX = (viewportWidth - renderedWidth) / 2;
    const offsetY = (viewportHeight - renderedHeight) / 2;

    learnBookHotspot.style.left = `${offsetX + (LEARN_BOOK_AREA.left * scale)}px`;
    learnBookHotspot.style.top = `${offsetY + (LEARN_BOOK_AREA.top * scale)}px`;
    learnBookHotspot.style.width = `${LEARN_BOOK_AREA.width * scale}px`;
    learnBookHotspot.style.height = `${LEARN_BOOK_AREA.height * scale}px`;
}

if (learnBookHotspot) {
    learnBookHotspot.href = learnBgImageUrl;
    positionLearnBookHotspot();
    window.addEventListener("resize", positionLearnBookHotspot);
}

const tl = gsap.timeline({
    paused: true,
    defaults: { duration: 1.2, ease: "power2.inOut" },
    onComplete: () => {
        introContent.style.display = "none";
    },
});

tl.to(hubBg, { opacity: 1 }, 0)
    .to(hubOverlay, { opacity: 1 }, 0.2)
    .to(introContent, { opacity: 0 }, 0);

const connectInTl = gsap.timeline({
    paused: true,
    defaults: { duration: 0.9, ease: "power2.inOut" },
    onStart: () => {
        hubOverlay.style.pointerEvents = "none";
    },
    onComplete: () => {
        connectOverlay.style.pointerEvents = "auto";
    },
});

connectInTl
    .to(hubOverlay, { opacity: 0 }, 0)
    .to(connectBg, { opacity: 1 }, 0)
    .to(connectOverlay, { opacity: 1 }, 0.1);

const connectOutTl = gsap.timeline({
    paused: true,
    defaults: { duration: 0.9, ease: "power2.inOut" },
    onStart: () => {
        connectOverlay.style.pointerEvents = "none";
    },
    onComplete: () => {
        hubOverlay.style.pointerEvents = "auto";
    },
});

connectOutTl
    .to(connectOverlay, { opacity: 0 }, 0)
    .to(connectBg, { opacity: 0 }, 0)
    .to(hubOverlay, { opacity: 1 }, 0.1);

const learnInTl = gsap.timeline({
    paused: true,
    defaults: { duration: 0.9, ease: "power2.inOut" },
    onStart: () => {
        hubOverlay.style.pointerEvents = "none";
    },
    onComplete: () => {
        learnOverlay.style.pointerEvents = "auto";
    },
});

learnInTl
    .to(hubOverlay, { opacity: 0 }, 0)
    .to(learnBg, { opacity: 1 }, 0)
    .to(learnOverlay, { opacity: 1 }, 0.1);

const learnOutTl = gsap.timeline({
    paused: true,
    defaults: { duration: 0.9, ease: "power2.inOut" },
    onStart: () => {
        learnOverlay.style.pointerEvents = "none";
    },
    onComplete: () => {
        hubOverlay.style.pointerEvents = "auto";
    },
});

learnOutTl
    .to(learnOverlay, { opacity: 0 }, 0)
    .to(learnBg, { opacity: 0 }, 0)
    .to(hubOverlay, { opacity: 1 }, 0.1);

const storyInTl = gsap.timeline({
    paused: true,
    defaults: { duration: 0.9, ease: "power2.inOut" },
    onStart: () => {
        hubOverlay.style.pointerEvents = "none";
    },
    onComplete: () => {
        storyOverlay.style.pointerEvents = "auto";
    },
});

storyInTl
    .to(hubOverlay, { opacity: 0 }, 0)
    .to(storyBg, { opacity: 1 }, 0)
    .to(storyOverlay, { opacity: 1 }, 0.1);

const storyOutTl = gsap.timeline({
    paused: true,
    defaults: { duration: 0.9, ease: "power2.inOut" },
    onStart: () => {
        storyOverlay.style.pointerEvents = "none";
    },
    onComplete: () => {
        hubOverlay.style.pointerEvents = "auto";
    },
});

storyOutTl
    .to(storyOverlay, { opacity: 0 }, 0)
    .to(storyBg, { opacity: 0 }, 0)
    .to(hubOverlay, { opacity: 1 }, 0.1);

function fade() {
    introButton.disabled = true;
    tl.restart();
}

introButton.addEventListener("click", fade);
connectTrigger.addEventListener("click", () => connectInTl.restart());
connectBack.addEventListener("click", () => connectOutTl.restart());
learnTrigger.addEventListener("click", () => learnInTl.restart());
learnBack.addEventListener("click", () => learnOutTl.restart());
storyTrigger.addEventListener("click", () => storyInTl.restart());
storyBack.addEventListener("click", () => storyOutTl.restart());
