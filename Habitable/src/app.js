import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import coverSvgUrl from "./assets/bg/coverSVG.svg?url";

gsap.registerPlugin(ScrollTrigger);

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

function getCoverMetrics(svg) {
    const viewBox = svg.viewBox?.baseVal;
    const sourceWidth = viewBox?.width || 1920;
    const sourceHeight = viewBox?.height || 2160;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scale = Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
    const renderedWidth = sourceWidth * scale;
    const renderedHeight = sourceHeight * scale;

    return {
        renderedWidth,
        renderedHeight,
        travel: Math.max(0, renderedHeight - viewportHeight),
    };
}

function sizeCoverSvg(svg) {
    const { renderedWidth, renderedHeight } = getCoverMetrics(svg);
    svg.style.width = `${renderedWidth}px`;
    svg.style.height = `${renderedHeight}px`;
}

function buildParallaxTimeline(svg, layers) {
    const { travel } = getCoverMetrics(svg);
    const finalY = -travel;
    const maxDepthOffset = travel * Math.max(...layers.map(({ depth }) => depth), 0);
    let maxLayerDistance = travel;

    layers.forEach(({ element, depth, startOffset }) => {
        const startY = finalY + travel + (travel * startOffset) + (maxDepthOffset * depth);
        maxLayerDistance = Math.max(maxLayerDistance, startY - finalY);

        gsap.set(element, {
            clearProps: "transform",
            force3D: true,
            transformOrigin: "50% 0%",
            y: startY,
        });
    });

    const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
            trigger: "#coverScroll",
            start: "top top",
            end: `+=${Math.max(maxLayerDistance, window.innerHeight * 1.35)}`,
            scrub: true,
            pin: true,
            invalidateOnRefresh: true,
        },
    });

    layers.forEach(({ element }) => {
        timeline.to(element, { y: finalY }, 0);
    });

    return timeline;
}

export async function setupCoverParallax(containerSelector = "#coverBackBack") {
    const container = document.querySelector(containerSelector);
    if (!container) {
        return () => {};
    }

    const response = await fetch(coverSvgUrl);
    const svgMarkup = await response.text();
    container.innerHTML = svgMarkup;

    const svg = container.querySelector("svg");
    if (!svg) {
        return () => {};
    }

    svg.setAttribute("preserveAspectRatio", "xMidYMin slice");
    svg.setAttribute("aria-hidden", "true");
    sizeCoverSvg(svg);

    const layers = Object.entries(LAYER_DEPTHS)
        .map(([id, config]) => ({
            element: svg.querySelector(`#${id}`),
            depth: config.depth,
            startOffset: config.startOffset,
        }))
        .filter(({ element }) => element);

    let timeline = buildParallaxTimeline(svg, layers);
    let resizeFrame = 0;

    const rebuild = () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
        sizeCoverSvg(svg);
        timeline = buildParallaxTimeline(svg, layers);
    };

    const handleResize = () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => {
            rebuild();
            ScrollTrigger.refresh();
        });
    };

    window.addEventListener("resize", handleResize);

    return () => {
        cancelAnimationFrame(resizeFrame);
        window.removeEventListener("resize", handleResize);
        timeline.scrollTrigger?.kill();
        timeline.kill();
        container.innerHTML = "";
    };
}
