/**
 * Every scroll animation on the home page. The page is complete without this
 * file: the text is server-rendered, and it only runs when the visitor has not
 * asked for reduced motion.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import { SUNRISE } from "@/lib/examples";
import { DISC, tithiName } from "@/lib/moon";
import { moonState } from "@/lib/moon-state";

const WIDE = "(min-width: 1000px) and (min-aspect-ratio: 11/10)";
const NARROW = "(max-width: 999.98px), (max-aspect-ratio: 11/10)";

const one = <T extends Element = HTMLElement>(selector: string) => document.querySelector(selector) as T;
const all = <T extends Element = HTMLElement>(selector: string) => [...document.querySelectorAll<T>(selector)];
const clamp01 = gsap.utils.clamp(0, 1);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

export function startHomeMotion(moon: HTMLElement): () => void {
  gsap.registerPlugin(ScrollTrigger);
  const stopScroll = smoothWheel();
  const media = gsap.matchMedia();

  media.add({ wide: WIDE, narrow: NARROW }, (context) => {
    const stopMoon = moonJourney(moon, Boolean(context.conditions?.wide));

    // One scene per task, so starting up never blocks a tap or a scroll.
    const scenes = [heroExit, statement, ribbon, drift, sunrise, tryIt, counters, reveals, sky];
    let timer = 0;
    const next = () => {
      const scene = scenes.shift();
      if (!scene) {
        ScrollTrigger.refresh();
        return;
      }
      context.add(scene);
      timer = window.setTimeout(next);
    };
    timer = window.setTimeout(next);

    return () => {
      window.clearTimeout(timer);
      stopMoon();
    };
  });

  // Fonts change text height, which moves every scene below them.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => {
    media.revert();
    stopScroll();
    moonState.onToday = null;
  };
}

/** Eased mouse-wheel scrolling. Touch screens and keyboards keep native scroll. */
function smoothWheel(): () => void {
  if (!matchMedia("(pointer: fine)").matches) return () => {};
  const lenis = new Lenis({ lerp: 0.11, anchors: { offset: -88 } });
  const tick = (time: number) => lenis.raf(time * 1000);
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}

const OLD_MOON = 325;

type Spot = { x: number; y: number; d: number };
type Key = Spot & { at: number; alpha: number };

/**
 * One moon for the whole page. Its place and size come from a list of key
 * points along the scroll, so it never fights itself, and its phase follows the
 * story: today's real moon in the hero, a full 30-tithi month in the dial.
 */
function moonJourney(moon: HTMLElement, wide: boolean) {
  const tithi = one("[data-scene='tithi']");
  const dial = one("[data-dial]");
  const credit = one("[data-credit]");
  const orbits = one("[data-moon-orbits]");
  const showDial = dialRenderer();

  const toX = gsap.quickTo(moon, "x", { duration: 0.55, ease: "power3.out" });
  const toY = gsap.quickTo(moon, "y", { duration: 0.55, ease: "power3.out" });
  // quickTo needs real properties, and "scale" is only a shorthand.
  const toScaleX = gsap.quickTo(moon, "scaleX", { duration: 0.55, ease: "power3.out" });
  const toScaleY = gsap.quickTo(moon, "scaleY", { duration: 0.55, ease: "power3.out" });

  const hero = { value: moonState.elongation };
  const pointer = { x: 0, y: 0 };
  let keys: Key[] = [];
  let tithiTop = 0;
  let tithiEnd = 0;
  let creditTop = 0;

  const measure = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
    tithiTop = docTop(tithi);
    tithiEnd = tithiTop + tithi.offsetHeight - H;
    creditTop = docTop(credit);

    const stickyTop = dial.closest("[data-sticky]")!.getBoundingClientRect().top;
    const box = dial.getBoundingClientRect();
    const inDial: Spot = { x: box.left + box.width / 2, y: box.top - stickyTop + box.height / 2, d: box.width * 0.6 };

    const size = moon.offsetWidth * DISC;
    const short = H <= 740;
    const start: Spot = wide
      ? { x: W * 0.78, y: H * 0.52, d: size }
      : { x: W * (short ? 0.66 : 0.64), y: H * (short ? 0.22 : 0.25), d: size };
    const aside: Spot = wide
      ? { x: W * 0.93, y: H * 0.52, d: Math.min(W * 0.36, H * 0.74) }
      : { x: W * 0.94, y: H * 0.13, d: Math.min(W * 0.42, H * 0.25) };
    const away: Spot = { x: inDial.x + (wide ? W * 0.14 : 0), y: -H * 0.32, d: inDial.d * 0.7 };
    const last: Spot = { x: W / 2, y: wide ? H * 0.98 : H * 0.92, d: size * (wide ? 1.1 : 1) };

    keys = [
      { at: 0, ...start, alpha: 1 },
      { at: H * 0.85, ...aside, alpha: 1 },
      { at: tithiTop - H, ...aside, alpha: 1 },
      { at: tithiTop, ...inDial, alpha: 1 },
      { at: tithiEnd, ...inDial, alpha: 1 },
      { at: tithiEnd + H * 0.6, ...away, alpha: 0 },
      { at: creditTop - H, ...last, y: H * 1.5, alpha: 0 },
      { at: creditTop, ...last, alpha: 1 },
    ];
  };

  const place = (scroll: number, instant = false) => {
    let i = 0;
    while (i < keys.length - 2 && scroll >= keys[i + 1].at) i++;
    const a = keys[i];
    const b = keys[i + 1];
    const t = smooth(clamp01((scroll - a.at) / (b.at - a.at || 1)));
    // The moon leans a little towards the pointer in the hero, then settles.
    const lean = clamp01(1 - scroll / (window.innerHeight * 0.6));
    const x = mix(a.x, b.x, t) + pointer.x * 22 * lean;
    const y = mix(a.y, b.y, t) + pointer.y * 16 * lean;
    const scale = mix(a.d, b.d, t) / (moon.offsetWidth * DISC);
    const alpha = mix(a.alpha, b.alpha, t);

    // quickTo takes an optional start value; giving the same value jumps there.
    const jump = instant ? [x, y, scale] : [undefined, undefined, undefined];
    toX(x, jump[0]);
    toY(y, jump[1]);
    toScaleX(scale, jump[2]);
    toScaleY(scale, jump[2]);
    moon.style.opacity = alpha.toFixed(3);
    moonState.hidden = alpha < 0.005;
    orbits.style.opacity = String(clamp01(1 - scroll / (window.innerHeight * 0.5)));

    if (scroll < tithiTop) {
      // A thin old moon beside the statement, then new moon as the dial arrives.
      const old = Math.max(hero.value, OLD_MOON);
      const toOld = smooth(clamp01(scroll / keys[1].at));
      const toNew = smooth(clamp01((scroll - keys[2].at) / (tithiTop - keys[2].at || 1)));
      moonState.elongation = mix(mix(hero.value, old, toOld), 360, toNew);
      showDial(0);
    } else if (scroll <= tithiEnd) {
      const progress = (scroll - tithiTop) / (tithiEnd - tithiTop || 1);
      moonState.elongation = progress * 360;
      showDial(progress);
    } else {
      moonState.elongation = scroll >= creditTop - window.innerHeight ? 180 : 360;
      showDial(1);
    }
  };

  gsap.set(moon, { xPercent: -50, yPercent: -50, transformOrigin: "50% 50%" });
  measure();
  place(window.scrollY, true);
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onRefresh: () => {
      measure();
      place(window.scrollY, true);
    },
    onUpdate: (self) => place(self.scroll()),
  });

  const onPointer = (event: PointerEvent) => {
    pointer.x = event.clientX / window.innerWidth - 0.5;
    pointer.y = event.clientY / window.innerHeight - 0.5;
    place(window.scrollY);
  };
  if (matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", onPointer, { passive: true });
  }

  moonState.onToday = (elongation) => {
    gsap.to(hero, {
      value: elongation,
      duration: 2.6,
      ease: "power2.inOut",
      onUpdate: () => place(window.scrollY),
    });
  };

  return () => window.removeEventListener("pointermove", onPointer);
}

/** Draws one step of the 30-tithi dial. `progress` runs 0 to 1 over the moon month. */
function dialRenderer() {
  const segments = all<SVGPathElement>("[data-seg]");
  const head = one<SVGGElement>("[data-head]");
  const number = one("[data-tithi-number]");
  const name = one("[data-tithi-name]");
  const gap = one("[data-tithi-gap]");
  const stages = all("[data-stage]");
  const stageStarts = stages.map((el) => Number(el.dataset.stage));
  let lastIndex = -1;
  let lastGap = -1;
  let lastStage = -1;

  return (progress: number) => {
    const degrees = progress * 360;
    head.setAttribute("transform", `rotate(${degrees.toFixed(2)} 320 320)`);

    const index = Math.min(Math.floor(progress * 30), 29);
    if (index !== lastIndex) {
      lastIndex = index;
      segments.forEach((segment, i) => segment.toggleAttribute("data-on", i <= index));
      number.textContent = String(index + 1);
      name.textContent = tithiName(index);
    }
    const shown = Math.round(degrees);
    if (shown !== lastGap) {
      lastGap = shown;
      gap.textContent = `${shown}°`;
    }
    let stage = 0;
    stageStarts.forEach((start, i) => {
      if (progress >= start) stage = i;
    });
    if (stage !== lastStage) {
      lastStage = stage;
      stages.forEach((el, i) => el.toggleAttribute("data-active", i === stage));
    }
  };
}

function heroExit() {
  gsap.to("[data-hero-copy]", {
    y: -70,
    opacity: 0,
    ease: "none",
    scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "62% top", scrub: 0.3 },
  });
  gsap.to("[data-hero-ghost]", {
    yPercent: 24,
    ease: "none",
    scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: 0.3 },
  });
}

function statement() {
  gsap.fromTo(
    "[data-word]",
    { opacity: 0.5 }, // still readable: large text keeps 3:1 contrast at this level
    {
      opacity: 1,
      ease: "none",
      stagger: 0.14,
      scrollTrigger: { trigger: "[data-statement]", start: "top 45%", end: "bottom bottom", scrub: 0.3 },
    },
  );
}

function ribbon() {
  const text = one<SVGTextPathElement>("[data-ribbon-text]");
  ScrollTrigger.create({
    trigger: "[data-ribbon]",
    start: "top bottom",
    end: "bottom top",
    scrub: 0.4,
    onUpdate: (self) => text.setAttribute("startOffset", String(-140 - self.progress * 1100)),
  });
}

function drift() {
  const scene = one("[data-scene='drift']");
  const dots = all("[data-drift-dot]");
  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: scene, start: "top top", end: "bottom bottom", scrub: 0.4 },
  });
  timeline.fromTo("[data-drift-line]", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 10 }, 0.4);
  dots.forEach((dot, i) => {
    timeline.from(dot, { scale: 0, duration: 0.5, ease: "back.out(3)" }, 0.4 + (i / (dots.length - 1)) * 9.6);
  });
  all("[data-drift-note]").forEach((note) => {
    timeline.from(note, { opacity: 0, y: 14, duration: 0.8, ease: "power2.out" }, Number(note.dataset.driftNote));
  });
  all("[data-drift-mark]").forEach((mark) => {
    timeline.fromTo(mark, { backgroundSize: "0% 100%" }, { backgroundSize: "100% 100%", duration: 0.8 }, Number(mark.dataset.driftMark));
  });
  timeline.to({}, { duration: 1 });
}

function sunrise() {
  const scene = one("[data-scene='sunrise']");
  const clock = one("[data-clock]");
  const running = one("[data-running]");
  const finale = one("[data-sunrise-end]");
  const cards = all("[data-city]").map((card) => ({
    card,
    minutes: Number(card.dataset.minutes),
    sun: card.querySelector<HTMLElement>("[data-sun]")!,
    day: card.querySelector<HTMLElement>("[data-day]")!,
  }));
  const span = SUNRISE.endMinutes - SUNRISE.startMinutes;
  const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
  let shownClock = "";
  let changed: boolean | null = null;

  const render = (progress: number) => {
    const now = SUNRISE.startMinutes + clamp01(progress / 0.9) * span;
    const text = `${pad(now / 60)}:${pad(now % 60)}`;
    if (text !== shownClock) {
      shownClock = text;
      clock.textContent = text;
    }
    const isNew = now >= SUNRISE.changeMinutes;
    if (isNew !== changed) {
      changed = isNew;
      running.textContent = isNew ? SUNRISE.after : SUNRISE.before;
      running.toggleAttribute("data-new", isNew);
    }
    for (const { card, minutes, sun, day } of cards) {
      const height = (now - minutes) / 34; // 0 on the horizon, 1 well above it
      sun.style.setProperty("--rise", clamp01(0.5 + height * 0.5).toFixed(3));
      card.style.setProperty("--day", clamp01(0.5 + height * 1.1).toFixed(3));
      day.toggleAttribute("data-show", now >= minutes);
    }
    finale.toggleAttribute("data-show", progress > 0.93);
  };

  ScrollTrigger.create({
    trigger: scene,
    start: "top top",
    end: "bottom bottom",
    onRefresh: (self) => render(self.progress),
    onUpdate: (self) => render(self.progress),
  });
  render(0);
}

function tryIt() {
  gsap.fromTo(
    "[data-tryit-panel]",
    { scale: 0.9, y: 50 },
    {
      scale: 1,
      y: 0,
      ease: "none",
      scrollTrigger: { trigger: "[data-tryit]", start: "top bottom", end: "top 25%", scrub: 0.4 },
    },
  );
}

function counters() {
  for (const el of all("[data-count]")) {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals ?? 0);
    const format = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const value = { n: 0 };
    gsap.to(value, {
      n: target,
      duration: 1.8,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = format(value.n);
      },
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  }
}

function reveals() {
  gsap.set("[data-reveal]", { y: 46, opacity: 0 });
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 90%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.08 }),
  });
}

function sky() {
  const tithi = one("[data-scene='tithi']");
  const iris = one("[data-sky='iris']");
  gsap.fromTo(iris, { autoAlpha: 0 }, { autoAlpha: 1, ease: "none", scrollTrigger: { trigger: tithi, start: "top bottom", end: "top top", scrub: true } });
  gsap.fromTo(
    iris,
    { autoAlpha: 1 },
    { autoAlpha: 0, ease: "none", immediateRender: false, scrollTrigger: { trigger: tithi, start: "bottom bottom", end: "bottom top", scrub: true } },
  );
  gsap.fromTo(
    "[data-sky='dusk']",
    { autoAlpha: 0 },
    { autoAlpha: 1, ease: "none", scrollTrigger: { trigger: "[data-credit]", start: "top bottom", end: "top 30%", scrub: true } },
  );
}
