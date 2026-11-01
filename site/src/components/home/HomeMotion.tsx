"use client";

import { useEffect, useRef } from "react";

import { Moon } from "./Moon";
import { startHomeMotion } from "./motion";
import s from "./home.module.css";

/** The fixed backdrop and moon, and the start of all scroll animation. */
export function HomeMotion() {
  const moon = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (document.documentElement.dataset.motion !== "on" || !moon.current) return;
    return startHomeMotion(moon.current);
  }, []);

  return (
    <>
      <div className={s.sky} aria-hidden="true">
        <div className={s.skyDawn} />
        <div className={s.skyIris} data-sky="iris" />
        <div className={s.skyDusk} data-sky="dusk" />
      </div>
      <Moon wrapRef={moon} />
    </>
  );
}
