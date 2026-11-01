"use client";

import { useEffect, useRef, type Ref } from "react";

import { DISC, litPath } from "@/lib/moon";
import { createMoonRenderer, type MoonRenderer } from "@/lib/moon-gl";
import { moonState } from "@/lib/moon-state";

import s from "./home.module.css";

const SURFACE = new URL("../../engine/moon-surface.webp", import.meta.url).href;
const SVG_BOX = 50 / DISC;
const MAX_PIXELS = 1400;

/**
 * The moon that travels down the home page. An SVG moon shows first, and if
 * WebGL is missing it stays; otherwise the WebGL moon fades in over it.
 */
export function Moon({ wrapRef }: { wrapRef: Ref<HTMLDivElement> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const lit = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const path = lit.current;
    if (!el || !path) return;
    const motion = document.documentElement.dataset.motion === "on";
    let renderer: MoonRenderer | null = null;
    let frame = 0;
    let drawn = NaN;
    let lastTime = 0;

    const draw = (time: number) => {
      const spin = motion ? Math.sin(time * 0.00007) * 0.16 : 0;
      if (renderer) renderer.render(moonState.elongation, spin);
      else path.setAttribute("d", litPath(moonState.elongation));
      drawn = moonState.elongation;
    };

    const size = () => {
      if (!renderer) return;
      // Sharp on phones, without asking a big screen to fill millions of extra pixels.
      renderer.resize(Math.min(Math.round(el.clientWidth * Math.min(window.devicePixelRatio, 2)), MAX_PIXELS));
      draw(lastTime);
    };

    const loop = (time: number) => {
      frame = requestAnimationFrame(loop);
      if (moonState.hidden) return;
      // The slow drift only needs about 24 frames a second; scrolling redraws at once.
      if (moonState.elongation !== drawn || time - lastTime > 41) {
        lastTime = time;
        draw(time);
      }
    };

    // Phones can take the GPU back when memory runs low; the SVG moon carries on.
    const onLost = () => {
      renderer = null;
      delete el.dataset.ready;
    };
    el.addEventListener("webglcontextlost", onLost);

    let live = true;
    const start = (surface: HTMLImageElement) => {
      renderer = createMoonRenderer(el, surface, DISC);
      if (renderer) {
        size();
        el.dataset.ready = "true";
      }
      if (motion) frame = requestAnimationFrame(loop);
      window.addEventListener("resize", size);
    };

    if (!motion) {
      moonState.onToday = (elongation) => {
        moonState.elongation = elongation;
        draw(0);
      };
    }

    // The surface decodes in the background, and until then the SVG moon shows.
    const surface = new Image();
    surface.src = SURFACE;
    surface
      .decode()
      .then(() => {
        if (live) start(surface);
      })
      .catch(() => {
        if (live && motion) frame = requestAnimationFrame(loop);
      });

    return () => {
      live = false;
      cancelAnimationFrame(frame);
      el.removeEventListener("webglcontextlost", onLost);
      window.removeEventListener("resize", size);
      moonState.onToday = null;
    };
  }, []);

  return (
    <div ref={wrapRef} className={s.moon} aria-hidden="true">
      <svg className={s.moonOrbits} data-moon-orbits viewBox="-100 -100 200 200">
        <g className={s.orbitA}>
          <ellipse rx="96" ry="30" />
          <circle cx="96" r="2.2" />
        </g>
        <g className={s.orbitB}>
          <ellipse rx="86" ry="46" />
          <circle cx="-86" r="1.6" />
        </g>
      </svg>
      <svg className={s.moonSvg} viewBox={`${-SVG_BOX} ${-SVG_BOX} ${2 * SVG_BOX} ${2 * SVG_BOX}`}>
        <defs>
          <radialGradient id="moonNight" cx="0.42" cy="0.38" r="0.75">
            <stop offset="0" stopColor="#5a4de0" />
            <stop offset="1" stopColor="#2c2296" />
          </radialGradient>
          <radialGradient id="moonDay" cx="0.5" cy="0.42" r="0.7">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#d9d3ff" />
          </radialGradient>
        </defs>
        <circle r="50" fill="url(#moonNight)" />
        <path ref={lit} d={litPath(40)} fill="url(#moonDay)" />
      </svg>
      <canvas ref={canvas} className={s.moonCanvas} />
    </div>
  );
}
