"use client";

import { useEffect } from "react";

/** Marks the "On this page" link for the section being read. `within` narrows where the links are found. */
export function TocSpy({ ids, within = "" }: { ids: string[]; within?: string }) {
  useEffect(() => {
    const links = new Map(ids.map((id) => [id, [...document.querySelectorAll(`${within} a[href="#${id}"]`)]]));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          links.forEach((copies) => copies.forEach((link) => link.removeAttribute("aria-current")));
          links.get(entry.target.id)?.forEach((link) => link.setAttribute("aria-current", "true"));
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const id of ids) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, [ids, within]);
  return null;
}
