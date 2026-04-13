import "./style.css";
import { gsap } from "gsap";
import { projectCoverPoint, setupCoverParallax, subscribeToCoverLayout } from "./app.js";
import { initConnect } from "./connect.js";
import { initForum, resumeForum, pauseForum } from "./forum.js";
const BG_SOURCE_SIZE = {
    width: 2360,
    height: 1640,
};

function createAreaFromMapCoords(x1, y1, x2, y2) {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const right = Math.max(x1, x2);
    const bottom = Math.max(y1, y2);

    return {
        left,
        top,
        width: right - left,
        height: bottom - top,
    };
}

const HUB_LABEL_AREAS = {
    connect: createAreaFromMapCoords(149, 1709, 499, 1994),
    forum: createAreaFromMapCoords(600, 1757, 984, 2018),
    play: createAreaFromMapCoords(695, 1328, 1131, 1682),
    learn: createAreaFromMapCoords(1594, 1759, 1277, 1558),
    story: createAreaFromMapCoords(1569, 1803, 1805, 2019),
};

const HUB_LABEL_OFFSETS = {
    connect: { x: 0, y: 0 },
    forum: { x: 0, y: 0 },
    play: { x: 0, y: 0 },
    learn: { x: 0, y: 0 },
    story: { x: 0, y: 0 },
};

const INTRO_PARALLAX_DURATION = 1.8;

const LEARN_BOOK_AREA = {
    left: 325,
    top: 690,
    width: 1500 - 325,
    height: 1530 - 690,
};

const STORY_AREA = {
    left: 215,
    top: 357,
    width: 773 - 215,
    height: 628 - 357,
};

const ABOUT_AREA = {
    left: 223,
    top: 634,
    width: 932 - 223,
    height: 841 - 634,
};

const BOOK_PAGES = [
    {
        title: "First Time Homebuyer Guide",
        description:
            "A comprehensive guide to understanding mortgages, down payments, and the home buying process, written with Gen Z in mind.",
        linkLabel: "Open Resource",
        linkUrl: "https://www.consumerfinance.gov/owning-a-home/",
    },
    {
        title: "Habitable: The New Science of Housing",
        description:
            "A foundational white paper exploring how underutilized land near national parks can be transformed into workforce housing through digital fabrication, training programs, and investment strategies.",
        linkLabel: "Read White Paper",
        linkUrl: "https://www.habitable.us/about/white-paper",
    },
    {
        title: "Community Land Trusts Explained",
        description:
            "Learn how community land trusts keep housing permanently affordable by separating land ownership from the homes built on it.",
        linkLabel: "Learn More",
        linkUrl: "https://groundedsolutions.org/strengthening-neighborhoods/community-land-trusts",
    },
    {
        title: "Know Your Tenant Rights",
        description:
            "A state-by-state overview of tenant protections, eviction procedures, and how to advocate for yourself as a renter.",
        linkLabel: "View Rights",
        linkUrl: "https://www.hud.gov/topics/rental_assistance",
    },
    {
        title: "Housing Policy 101",
        description:
            "Understand zoning, affordable housing policy, and how young people can influence decisions that shape their communities.",
        linkLabel: "Explore Policy",
        linkUrl: "https://www.nlihc.org/explore-issues",
    },
    {
        title: "Budgeting for Housing",
        description:
            "Practical strategies for saving toward housing while managing student debt, gig income, and rising living costs.",
        linkLabel: "Start Budgeting",
        linkUrl: "https://www.nerdwallet.com/article/finance/how-to-budget",
    },
    {
        title: "Building Third Places",
        description:
            "Learn how to create community gathering spaces, from gardens to maker workshops, that foster belonging in rural areas.",
        linkLabel: "Explore Ideas",
        linkUrl: "https://www.ruralhome.org/our-initiatives/",
    },
    {
        title: "Alternative Building Methods",
        description:
            "An introduction to cob, straw bale, and earthship construction, lowering costs while reconnecting housing with the land.",
        linkLabel: "Learn Methods",
        linkUrl: "https://www.buildnaturally.com/",
    },
    {
        title: "Rural Housing Assistance",
        description:
            "A directory of USDA and state-level programs that help young people afford housing in rural areas.",
        linkLabel: "View Programs",
        linkUrl: "https://www.rd.usda.gov/programs-services/single-family-housing-programs",
    },
    {
        title: "YIMBY Advocacy Toolkit",
        description:
            "Step-by-step guidance for attending city council meetings, writing public comments, and organizing around housing policy.",
        linkLabel: "Take Action",
        linkUrl: "https://yimbyaction.org/resources/",
    },
    {
        title: "Tiny Homes & ADUs",
        description:
            "How tiny homes and accessory dwelling units are creating new, affordable pathways to home ownership and the challenges ahead.",
        linkLabel: "Learn More",
        linkUrl: "https://www.aarp.org/livable-communities/housing/info-2019/accessory-dwelling-units-702.html",
    },
];

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

    text.getBoundingClientRect();
    text.classList.add("animate-draw");
}

const coverReady = setupCoverParallax();

const introButton = document.querySelector(".introButton");
const introContent = document.querySelector("#introContent");
const hubOverlay = document.querySelector("#hubOverlay");
const hubNoteTop = document.querySelector(".hub-note-top");
const connectBg = document.querySelector("#connectBg");
const learnBg = document.querySelector("#learnBg");
const storyBg = document.querySelector("#storyBg");
const connectItem = document.querySelector(".hub-connect-item");
const learnItem = document.querySelector(".hub-learn-item");
const connectTrigger = document.querySelector(".hub-connect");
const learnTrigger = document.querySelector(".hub-learn");
const playTrigger = document.querySelector(".hub-play");
const forumTrigger = document.querySelector(".hub-forum");
const storyTrigger = document.querySelector(".hub-story");
const connectOverlay = document.querySelector("#connectOverlay");
const connectBack = document.querySelector("#connectBack");
const learnOverlay = document.querySelector("#learnOverlay");
const learnBack = document.querySelector("#learnBack");
const learnBookHotspot = document.querySelector("#learnBookHotspot");
const storyOverlay = document.querySelector("#storyOverlay");
const storyBack = document.querySelector("#storyBack");
const forumOverlay = document.querySelector("#forumOverlay");
const forumBack = document.querySelector("#forumBack");
const coverScene = document.querySelector("#coverScene");
const storyHotspot = document.querySelector("#storyHotspot");
const aboutHotspot = document.querySelector("#aboutHotspot");
const bookModal = document.querySelector("#bookModal");
const bookModalBackdrop = document.querySelector("#bookModalBackdrop");
const bookModalClose = document.querySelector("#bookModalClose");
const bookContainer = document.querySelector("#bookContainer");

function dismissHubNote() {
    if (!hubNoteTop || hubNoteTop.classList.contains("is-dismissed")) {
        return;
    }

    hubNoteTop.classList.add("is-dismissed");
}

function getHubSafeMargins() {
    return {
        x: Math.min(Math.max(window.innerWidth * 0.04, 16), 36),
        top: Math.min(Math.max(window.innerHeight * 0.03, 16), 36),
        bottom: Math.min(Math.max(window.innerHeight * 0.04, 16), 42),
    };
}

function positionHotspot(hotspot, area) {
    if (!hotspot) {
        return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scale = Math.max(
        viewportWidth / BG_SOURCE_SIZE.width,
        viewportHeight / BG_SOURCE_SIZE.height,
    );

    const renderedWidth = BG_SOURCE_SIZE.width * scale;
    const renderedHeight = BG_SOURCE_SIZE.height * scale;
    const offsetX = (viewportWidth - renderedWidth) / 2;
    const offsetY = (viewportHeight - renderedHeight) / 2;

    hotspot.style.left = `${offsetX + (area.left * scale)}px`;
    hotspot.style.top = `${offsetY + (area.top * scale)}px`;
    hotspot.style.width = `${area.width * scale}px`;
    hotspot.style.height = `${area.height * scale}px`;
}

function positionMappedHotspots() {
    positionHotspot(learnBookHotspot, LEARN_BOOK_AREA);
    positionHotspot(storyHotspot, STORY_AREA);
    positionHotspot(aboutHotspot, ABOUT_AREA);
}

function getHubLabelAnchorPoint(labelKey) {
    const area = HUB_LABEL_AREAS[labelKey];
    if (!area) {
        return null;
    }

    const offset = HUB_LABEL_OFFSETS[labelKey] ?? { x: 0, y: 0 };

    return {
        x: area.left + (area.width / 2) + offset.x,
        y: area.top + (area.height / 2) + offset.y,
    };
}

function positionHubAnchor(element, labelKey) {
    if (!element) {
        return;
    }

    const point = getHubLabelAnchorPoint(labelKey);
    if (!point) {
        return;
    }

    const { left, top } = projectCoverPoint(point.x, point.y, 1);
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
}

function clampHubAnchor(element) {
    if (!element) {
        return;
    }

    const { x, top, bottom } = getHubSafeMargins();
    const rect = element.getBoundingClientRect();
    let deltaX = 0;
    let deltaY = 0;

    if (rect.left < x) {
        deltaX = x - rect.left;
    } else if (rect.right > (window.innerWidth - x)) {
        deltaX = (window.innerWidth - x) - rect.right;
    }

    if (rect.top < top) {
        deltaY = top - rect.top;
    } else if (rect.bottom > (window.innerHeight - bottom)) {
        deltaY = (window.innerHeight - bottom) - rect.bottom;
    }

    if (!deltaX && !deltaY) {
        return;
    }

    const currentLeft = Number.parseFloat(element.style.left || "0");
    const currentTop = Number.parseFloat(element.style.top || "0");

    element.style.left = `${currentLeft + deltaX}px`;
    element.style.top = `${currentTop + deltaY}px`;
}

function positionHubAnchors() {
    const anchors = [
        [connectItem, "connect"],
        [learnItem, "learn"],
        [playTrigger, "play"],
        [forumTrigger, "forum"],
        [storyTrigger, "story"],
    ];

    anchors.forEach(([element, labelKey]) => {
        positionHubAnchor(element, labelKey);
    });

    anchors.forEach(([element]) => {
        clampHubAnchor(element);
    });
}

let layoutFrame = 0;

function syncInteractiveLayout() {
    positionMappedHotspots();
    positionHubAnchors();
}

function scheduleInteractiveLayout() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = window.requestAnimationFrame(() => {
        layoutFrame = 0;
        syncInteractiveLayout();
    });
}

function getPageHTML(pageData, pageNumber) {
    if (!pageData) {
        return `<div class="book-page-inner empty"></div>`;
    }

    return `
        <div class="book-page-inner">
            <div class="book-page-number">${pageNumber}</div>
            <h2>${pageData.title}</h2>
            <p>${pageData.description}</p>
            <a class="book-page-link" href="${pageData.linkUrl}" target="_blank" rel="noopener noreferrer">
                ${pageData.linkLabel} &rarr;
            </a>
        </div>
    `;
}

let bookInitialized = false;

function openBookModal() {
    if (!bookModal) {
        return;
    }

    bookModal.classList.add("is-open");
    bookModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("book-modal-open");

    if (!bookInitialized) {
        initBook();
        bookInitialized = true;
    }
}

function closeBookModal() {
    if (!bookModal) {
        return;
    }

    bookModal.classList.remove("is-open");
    bookModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("book-modal-open");
}

function initBook() {
    if (!bookContainer) {
        return;
    }

    let spreadIndex = 0;
    let isAnimating = false;
    const totalSpreads = Math.ceil(BOOK_PAGES.length / 2);

    bookContainer.innerHTML = `
        <div class="resource-book">
            <button class="book-nav book-prev" type="button" aria-label="Previous pages">&#x2039;</button>
            <div class="book-scene">
                <div class="book-spine"></div>
                <article class="book-page book-page-left book-page-static"></article>
                <article class="book-page book-page-right book-page-static"></article>
                <div class="book-flip-panel" aria-hidden="true">
                    <div class="book-flip-face book-flip-front"></div>
                    <div class="book-flip-face book-flip-back"></div>
                </div>
                <div class="book-flip-shadow-left"></div>
                <div class="book-flip-shadow-right"></div>
            </div>
            <button class="book-nav book-next" type="button" aria-label="Next pages">&#x203a;</button>
        </div>
    `;

    const scene     = bookContainer.querySelector(".book-scene");
    const leftPage  = bookContainer.querySelector(".book-page-left");
    const rightPage = bookContainer.querySelector(".book-page-right");
    const flipPanel = bookContainer.querySelector(".book-flip-panel");
    const flipFront = bookContainer.querySelector(".book-flip-front");
    const flipBack  = bookContainer.querySelector(".book-flip-back");
    const shadowL   = bookContainer.querySelector(".book-flip-shadow-left");
    const shadowR   = bookContainer.querySelector(".book-flip-shadow-right");
    const prevBtn   = bookContainer.querySelector(".book-prev");
    const nextBtn   = bookContainer.querySelector(".book-next");

    const dotsWrap = document.createElement("div");
    dotsWrap.className = "book-progress";
    for (let i = 0; i < totalSpreads; i++) {
        const dot = document.createElement("div");
        dot.className = "book-progress-dot";
        dotsWrap.appendChild(dot);
    }
    scene.appendChild(dotsWrap);

    function renderPage(el, pageData, pageNum) {
        el.innerHTML = getPageHTML(pageData, pageNum);
    }

    function updateDots() {
        const current = spreadIndex / 2;
        dotsWrap.querySelectorAll(".book-progress-dot").forEach((d, i) => {
            d.classList.toggle("is-active", i === current);
        });
    }

    function renderSpread() {
        renderPage(leftPage,  BOOK_PAGES[spreadIndex],     spreadIndex + 1);
        renderPage(rightPage, BOOK_PAGES[spreadIndex + 1], spreadIndex + 2);
        prevBtn.disabled = spreadIndex === 0;
        nextBtn.disabled = spreadIndex + 2 >= BOOK_PAGES.length;
        updateDots();
    }

    function flip(direction) {
        if (isAnimating) return;
        const isForward = direction === "forward";
        if (isForward && spreadIndex + 2 >= BOOK_PAGES.length) return;
        if (!isForward && spreadIndex === 0) return;

        isAnimating = true;
        prevBtn.disabled = true;
        nextBtn.disabled = true;

        const nextIdx = isForward ? spreadIndex + 2 : spreadIndex - 2;

        if (isForward) {
            renderPage(flipFront, BOOK_PAGES[spreadIndex + 1], spreadIndex + 2);
            renderPage(flipBack,  BOOK_PAGES[nextIdx],          nextIdx + 1);
        } else {
            renderPage(flipFront, BOOK_PAGES[spreadIndex],     spreadIndex + 1);
            renderPage(flipBack,  BOOK_PAGES[nextIdx + 1],     nextIdx + 2);
        }

        gsap.set(flipPanel, { clearProps: "transform" });
        flipPanel.classList.remove("flip-forward", "flip-backward", "is-flipping");
        flipPanel.classList.add(isForward ? "flip-forward" : "flip-backward", "is-flipping");

        const targetShadow = isForward ? shadowL : shadowR;
        const flipDuration = 0.62;

        const tl = gsap.timeline({
            onComplete: () => {
                flipPanel.classList.remove("is-flipping", "flip-forward", "flip-backward");
                gsap.set(flipPanel, { clearProps: "transform" });
                gsap.set([shadowL, shadowR], { opacity: 0 });
                isAnimating = false;
                renderSpread();
            },
        });

        tl.to(flipPanel, {
            rotateY: isForward ? -180 : 180,
            duration: flipDuration,
            ease: "power2.inOut",
        }, 0);

        tl.call(() => {
            spreadIndex = nextIdx;
            renderPage(leftPage,  BOOK_PAGES[spreadIndex],     spreadIndex + 1);
            renderPage(rightPage, BOOK_PAGES[spreadIndex + 1], spreadIndex + 2);
            updateDots();
        }, null, flipDuration / 2);

        tl.fromTo(targetShadow,
            { opacity: 0 },
            { opacity: 0.42, duration: flipDuration / 2, ease: "power1.in" },
            0,
        );
        tl.to(targetShadow,
            { opacity: 0, duration: flipDuration / 2, ease: "power1.out" },
            flipDuration / 2,
        );

    }

    function onKeyDown(e) {
        if (!bookModal.classList.contains("is-open")) return;
        if (e.key === "ArrowRight") flip("forward");
        if (e.key === "ArrowLeft")  flip("backward");
    }
    document.addEventListener("keydown", onKeyDown);

    nextBtn.addEventListener("click", () => flip("forward"));
    prevBtn.addEventListener("click", () => flip("backward"));
    renderSpread();
}

if (learnBookHotspot) {
    learnBookHotspot.setAttribute("href", "#");
    learnBookHotspot.addEventListener("click", (event) => {
        event.preventDefault();
        openBookModal();
    });
}

storyHotspot?.setAttribute("href", "https://www.habitable.us/stories");
aboutHotspot?.setAttribute("href", "https://www.habitable.us/about/team");

[connectItem, learnItem, playTrigger, forumTrigger, storyTrigger].forEach((target) => {
    target?.addEventListener("pointerenter", dismissHubNote, { once: true });
});

scheduleInteractiveLayout();
window.addEventListener("resize", scheduleInteractiveLayout);
subscribeToCoverLayout(() => {
    scheduleInteractiveLayout();
});

if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
        scheduleInteractiveLayout();
    });
}

bookModalBackdrop?.addEventListener("click", closeBookModal);
bookModalClose?.addEventListener("click", closeBookModal);

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeBookModal();
    }
});

const connectInTl = gsap.timeline({
    paused: true,
    defaults: { duration: 0.9, ease: "power2.inOut" },
    onStart: () => {
        if (hubOverlay) {
            hubOverlay.style.pointerEvents = "none";
        }
    },
    onComplete: () => {
        if (connectOverlay) {
            connectOverlay.style.pointerEvents = "auto";
        }
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
        if (connectOverlay) {
            connectOverlay.style.pointerEvents = "none";
        }
    },
    onComplete: () => {
        if (hubOverlay) {
            hubOverlay.style.pointerEvents = "auto";
        }
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
        if (hubOverlay) {
            hubOverlay.style.pointerEvents = "none";
        }
    },
    onComplete: () => {
        if (learnOverlay) {
            learnOverlay.style.pointerEvents = "auto";
        }
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
        if (learnOverlay) {
            learnOverlay.style.pointerEvents = "none";
        }
    },
    onComplete: () => {
        if (hubOverlay) {
            hubOverlay.style.pointerEvents = "auto";
        }
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
        if (hubOverlay) {
            hubOverlay.style.pointerEvents = "none";
        }
    },
    onComplete: () => {
        if (storyOverlay) {
            storyOverlay.style.pointerEvents = "auto";
        }
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
        if (storyOverlay) {
            storyOverlay.style.pointerEvents = "none";
        }
    },
    onComplete: () => {
        if (hubOverlay) {
            hubOverlay.style.pointerEvents = "auto";
        }
    },
});

storyOutTl
    .to(storyOverlay, { opacity: 0 }, 0)
    .to(storyBg, { opacity: 0 }, 0)
    .to(hubOverlay, { opacity: 1 }, 0.1);

async function fade() {
    if (introButton) {
        introButton.disabled = true;
    }

    const coverController = await coverReady;

    if (hubOverlay) {
        hubOverlay.style.pointerEvents = "none";
        hubOverlay.style.opacity = "0";
    }

    coverController.animateTo(1, {
        duration: INTRO_PARALLAX_DURATION,
        ease: "power2.inOut",
        onComplete: () => {
            if (hubOverlay) {
                hubOverlay.style.opacity = "1";
                hubOverlay.style.pointerEvents = "auto";
            }

            scheduleInteractiveLayout();
        },
    });

    if (introContent) {
        gsap.killTweensOf(introContent);
        gsap.to(introContent, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => {
                introContent.style.display = "none";
            },
        });
    }
}

// Fire source position in the cover SVG (1920 × 2160) — adjust to fine-tune centering
const FIRE_SOURCE = { x: 780, y: 1880 };
const FORUM_SCALE = 1.8;
let forumActive = false;

function calcForumOrigin() {
    const firePos = projectCoverPoint(FIRE_SOURCE.x, FIRE_SOURCE.y, 1);
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    return {
        ox: (cx - firePos.left * FORUM_SCALE) / (1 - FORUM_SCALE),
        oy: (cy - firePos.top  * FORUM_SCALE) / (1 - FORUM_SCALE),
    };
}

// Recalculate transform origin whenever the cover layout changes while forum is open
subscribeToCoverLayout(() => {
    if (!forumActive || !coverScene) return;
    const { ox, oy } = calcForumOrigin();
    gsap.set(coverScene, { transformOrigin: `${ox}px ${oy}px` });
});

function enterForum() {
    if (!coverScene) return;
    const { ox, oy } = calcForumOrigin();
    gsap.set(coverScene, { transformOrigin: `${ox}px ${oy}px` });
    if (hubOverlay) hubOverlay.style.pointerEvents = "none";

    gsap.timeline()
        .to(hubOverlay, { opacity: 0, duration: 0.4, ease: "power2.out" }, 0)
        .to(coverScene, { scale: FORUM_SCALE, duration: 1.4, ease: "power2.inOut" }, 0)
        .to(forumOverlay, { opacity: 1, duration: 0.4, ease: "power2.out" }, 1.0)
        .call(() => {
            forumActive = true;
            if (forumOverlay) forumOverlay.style.pointerEvents = "auto";
            resumeForum();
        });
}

function exitForum() {
    if (!coverScene) return;
    forumActive = false;
    if (forumOverlay) forumOverlay.style.pointerEvents = "none";
    pauseForum();

    gsap.timeline()
        .to(forumOverlay, { opacity: 0, duration: 0.3, ease: "power2.in" }, 0)
        .to(coverScene, { scale: 1, duration: 1.2, ease: "power2.inOut" }, 0.15)
        .to(hubOverlay, { opacity: 1, duration: 0.5, ease: "power2.out" }, 1.0)
        .call(() => {
            gsap.set(coverScene, { clearProps: "transform,transformOrigin" });
            if (hubOverlay) hubOverlay.style.pointerEvents = "auto";
        });
}

introButton?.addEventListener("click", fade);
connectTrigger?.addEventListener("click", () => connectInTl.restart());
connectBack?.addEventListener("click", () => connectOutTl.restart());
learnTrigger?.addEventListener("click", () => learnInTl.restart());
learnBack?.addEventListener("click", () => learnOutTl.restart());
storyTrigger?.addEventListener("click", () => storyInTl.restart());
storyBack?.addEventListener("click", () => storyOutTl.restart());
forumTrigger?.addEventListener("click", enterForum);
forumBack?.addEventListener("click", exitForum);
window.addEventListener("load", () => {
  startTextDraw();
  initConnect();
  initForum();
});
