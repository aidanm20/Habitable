import { gsap } from "gsap";
import coverSvgUrl from "./assets/bg/coverSVG.svg?url";

export const COVER_SOURCE_SIZE = {
    width: 1920,
    height: 2160,
};

const LAYER_DEPTHS = {
    coverBackback: { depth: 0, startOffset: 0 },
    coverStars: { depth: 0.08, startOffset: 0.02 },
    coverMoon: { depth: 0.12, startOffset: 0.03 },
    coverBack: { depth: 0.18, startOffset: 0.05 },
    coverTree: { depth: 0.28, startOffset: 0.08 },
    coverGroundTreeOver: { depth: 0.4, startOffset: 0.12 },
    coverTreehouse: { depth: 0.52, startOffset: 0.16 },
    coverFrontGround: { depth: 0.62, startOffset: 0.2 },
    coverAboutSign: { depth: 0.68, startOffset: 0.22 },
    coverTelescope: { depth: 0.74, startOffset: 0.24 },
    coverFireplace: { depth: 0.8, startOffset: 0.26 },
    coverFire: { depth: 0.84, startOffset: 0.28 },
    coverTent: { depth: 0.9, startOffset: 0.3 },
    coverFrontGrass: { depth: 1, startOffset: 0.34 },
};

const INTRO_ANCHOR_LAYER_ID = "coverBack";

const coverLayoutSubscribers = new Set();

let latestCoverMetrics = getCoverMetrics();

function createFallbackController() {
    return {
        animateTo: () => null,
        getProgress: () => 0,
        setProgress: () => {},
        destroy: () => {},
    };
}

function getCoverViewport(container) {
    const rect = container?.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            left: 0,
            top: 0,
        };
    }

    return {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
    };
}

function getCoverMetrics(
    viewportWidth = window.innerWidth,
    viewportHeight = window.innerHeight,
    viewportLeft = 0,
    viewportTop = 0,
) {
    const scale = Math.max(
        viewportWidth / COVER_SOURCE_SIZE.width,
        viewportHeight / COVER_SOURCE_SIZE.height,
    );
    const renderedWidth = COVER_SOURCE_SIZE.width * scale;
    const renderedHeight = COVER_SOURCE_SIZE.height * scale;

    return {
        scale,
        renderedWidth,
        renderedHeight,
        travel: Math.max(0, renderedHeight - viewportHeight),
        viewportWidth,
        viewportHeight,
        viewportLeft,
        viewportTop,
        offsetX: viewportLeft + ((viewportWidth - renderedWidth) / 2),
        offsetY: viewportTop + viewportHeight - renderedHeight,
    };
}

function getContainerCoverMetrics(container) {
    const { width, height, left, top } = getCoverViewport(container);
    return getCoverMetrics(width, height, left, top);
}

function getIntroAnchorSpread(metrics = latestCoverMetrics) {
    const anchorLayer = LAYER_DEPTHS[INTRO_ANCHOR_LAYER_ID];
    if (!anchorLayer) {
        return 0;
    }

    return metrics.travel * (anchorLayer.startOffset + anchorLayer.depth);
}

function getRootY(progress, metrics = latestCoverMetrics) {
    const introAnchorY = -getIntroAnchorSpread(metrics);
    const finalY = -metrics.travel;
    return gsap.utils.interpolate(introAnchorY, finalY, progress);
}

function emitCoverLayout(metrics) {
    latestCoverMetrics = metrics;
    coverLayoutSubscribers.forEach((callback) => callback(metrics));
}

export function subscribeToCoverLayout(callback) {
    if (typeof callback !== "function") {
        return () => {};
    }

    coverLayoutSubscribers.add(callback);
    callback(latestCoverMetrics);

    return () => {
        coverLayoutSubscribers.delete(callback);
    };
}

export function projectCoverPoint(sourceX, sourceY, progress = 1) {
    const { scale, offsetX, viewportTop } = latestCoverMetrics;

    return {
        left: offsetX + (sourceX * scale),
        top: viewportTop + (sourceY * scale) + getRootY(progress),
    };
}

function sizeCoverSvg(svg, metrics = latestCoverMetrics) {
    const { renderedWidth, renderedHeight } = metrics;
    svg.style.width = `${renderedWidth}px`;
    svg.style.height = `${renderedHeight}px`;
}

function getLayerStates(layers, metrics = latestCoverMetrics) {
    const { travel } = metrics;

    return layers.map(({ element, depth, startOffset }) => ({
        element,
        spreadY: travel * (startOffset + depth),
    }));
}

function applyProgress(svg, layerStates, progress, metrics = latestCoverMetrics) {
    const rootY = getRootY(progress, metrics);

    gsap.set(svg, { y: rootY });

    layerStates.forEach(({ element, spreadY }) => {
        gsap.set(element, {
            y: spreadY * (1 - progress),
        });
    });
}

export async function setupCoverParallax(containerSelector = "#coverBackBack") {
    const container = document.querySelector(containerSelector);
    if (!container) {
        return createFallbackController();
    }

    const response = await fetch(coverSvgUrl);
    const svgMarkup = await response.text();
    container.innerHTML = svgMarkup;

    const svg = container.querySelector("svg");
    if (!svg) {
        return createFallbackController();
    }

    let metrics = getContainerCoverMetrics(container);

    svg.setAttribute("preserveAspectRatio", "xMidYMin slice");
    svg.setAttribute("aria-hidden", "true");
    sizeCoverSvg(svg, metrics);
    gsap.set(svg, {
        xPercent: -50,
        force3D: true,
        transformOrigin: "50% 0%",
    });

    const layers = Object.entries(LAYER_DEPTHS)
        .map(([id, config]) => ({
            element: svg.querySelector(`#${id}`),
            depth: config.depth,
            startOffset: config.startOffset,
        }))
        .filter(({ element }) => element);

    layers.forEach(({ element }) => {
        gsap.set(element, {
            clearProps: "transform",
            force3D: true,
            transformOrigin: "50% 0%",
        });
    });

    const state = { progress: 0 };
    let layerStates = getLayerStates(layers, metrics);
    let resizeFrame = 0;
    let progressTween = null;
    const resizeObserver =
        typeof ResizeObserver === "function"
            ? new ResizeObserver(() => {
                handleResize();
            })
            : null;

    applyProgress(svg, layerStates, state.progress, metrics);
    emitCoverLayout(metrics);

    const rebuild = () => {
        metrics = getContainerCoverMetrics(container);
        sizeCoverSvg(svg, metrics);
        layerStates = getLayerStates(layers, metrics);
        applyProgress(svg, layerStates, state.progress, metrics);
        emitCoverLayout(metrics);
    };

    const handleResize = () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(rebuild);
    };

    window.addEventListener("resize", handleResize);
    resizeObserver?.observe(container);

    return {
        animateTo(targetProgress, vars = {}) {
            const {
                duration = 1,
                ease = "power2.inOut",
                onComplete,
                onStart,
                onUpdate,
            } = vars;

            progressTween?.kill();
            progressTween = gsap.to(state, {
                progress: gsap.utils.clamp(0, 1, targetProgress),
                duration,
                ease,
                onStart,
                onUpdate: () => {
                    applyProgress(svg, layerStates, state.progress, metrics);
                    onUpdate?.(state.progress);
                },
                onComplete: () => {
                    progressTween = null;
                    onComplete?.();
                },
            });

            return progressTween;
        },
        getProgress() {
            return state.progress;
        },
        setProgress(progress) {
            progressTween?.kill();
            progressTween = null;
            state.progress = gsap.utils.clamp(0, 1, progress);
            applyProgress(svg, layerStates, state.progress, metrics);
        },
        destroy() {
            progressTween?.kill();
            cancelAnimationFrame(resizeFrame);
            window.removeEventListener("resize", handleResize);
            resizeObserver?.disconnect();
            container.innerHTML = "";
        },
    };
}
