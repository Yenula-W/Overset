"use client";

import * as React from "react";
import {
  clamp,
  damp,
  lerp,
  phase,
  timeline,
} from "@/lib/marketing/scroll-scene";

// The live page sits on the clear writing area of desk-studio.webp.
const PAPER_ANCHOR = { x: 0.675, y: 0.375, width: 0.17 };

interface Geometry {
  start: number;
  travel: number;
  height: number;
  anchorX: number;
  anchorY: number;
  centerX: number;
  centerY: number;
  initialScale: number;
  finalScale: number;
}

/** Cache layout on resize; the animation frame only writes transforms/opacity. */
export function useDeskScroll(
  root: React.RefObject<HTMLElement | null>,
  onStep: (step: number) => void,
) {
  React.useLayoutEffect(() => {
    if (!root.current) return;
    const section = root.current;
    const stage = section.querySelector<HTMLElement>(".scroll-stage")!;
    const intro = section.querySelector<HTMLElement>(".scroll-intro")!;
    const desk = section.querySelector<HTMLElement>(".scroll-desk")!;
    const rail = section.querySelector<HTMLElement>(".scroll-rail")!;
    const paper = section.querySelector<HTMLElement>(".scroll-paper")!;
    const mobileStep = section.querySelector<HTMLElement>(
      ".scroll-mobile-step",
    )!;
    const finish = section.querySelector<HTMLElement>(".scroll-finish")!;
    const progressLine = section.querySelector<HTMLElement>(
      ".scroll-progress-fill",
    )!;
    const original = [
      ...section.querySelectorAll<HTMLElement>("[data-source]"),
    ];
    const translated = [
      ...section.querySelectorAll<HTMLElement>("[data-target]"),
    ];
    const boxes = [
      ...section.querySelectorAll<HTMLElement>("[data-detection]"),
    ];
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let geometry: Geometry;
    let frame = 0;
    let measurement = 0;
    let current = 0;
    let target = 0;
    let lastTime = 0;
    let lastStep = -2;
    let disposed = false;

    const opacity = (element: HTMLElement, value: number) => {
      const next = value.toFixed(4);
      if (element.style.opacity !== next) element.style.opacity = next;
    };

    function render(p: number) {
      const g = geometry;
      if (!g) return;
      const t = timeline(p);
      const reduced = mq.matches;
      const x = lerp(g.anchorX, g.centerX, t.lift);
      const y = lerp(g.anchorY, g.centerY, t.lift);
      const scale = lerp(g.initialScale, g.finalScale, t.lift);
      paper.style.transform = `translate3d(${(x - 210).toFixed(2)}px,${(y - 300).toFixed(2)}px,0) perspective(1200px) rotateX(${(50 * (1 - t.lift)).toFixed(3)}deg) rotateZ(${(-7 * (1 - t.lift)).toFixed(3)}deg) scale(${scale.toFixed(5)})`;
      desk.style.transform = `translate3d(${((g.centerX - g.anchorX) * t.lift).toFixed(2)}px,${((g.centerY - g.anchorY) * t.lift).toFixed(2)}px,0) scale(${(1 + 1.25 * t.lift).toFixed(5)})`;
      opacity(desk, reduced ? 0 : t.desk);
      opacity(intro, reduced ? 1 : t.intro);
      intro.style.transform = `translate3d(0,${reduced ? 0 : -32 * (1 - t.intro)}px,0)`;
      // Faded calls to action must not remain invisible keyboard stops.
      intro.inert = !reduced && t.intro === 0;
      opacity(rail, reduced ? 0 : t.controls);
      rail.style.transform = `translate3d(${-14 * (1 - t.controls)}px,-50%,0)`;
      opacity(mobileStep, reduced ? 0 : t.controls);
      opacity(finish, t.finished);
      finish.inert = t.finished < 0.99;
      finish.style.transform = `translate3d(0,${12 * (1 - t.finished)}px,0)`;
      original.forEach((element) => opacity(element, t.source));
      translated.forEach((element) => opacity(element, t.target));
      boxes.forEach((element, i) =>
        opacity(
          element,
          phase(p, 0.43 + i * 0.012, 0.48 + i * 0.012) *
            (1 - phase(p, 0.89, 0.94)),
        ),
      );
      progressLine.style.transform = `scaleX(${p.toFixed(5)})`;
      if (lastStep !== t.step) {
        lastStep = t.step;
        onStep(t.step);
      }
    }

    function tick(now: number) {
      frame = 0;
      const elapsed = lastTime ? Math.min(64, now - lastTime) : 16.67;
      lastTime = now;
      current = damp(current, target, elapsed);
      if (Math.abs(current - target) < 0.00005) current = target;
      render(current);
      if (current !== target) frame = requestAnimationFrame(tick);
      else lastTime = 0;
    }

    function onScroll() {
      if (!geometry || mq.matches || disposed) return;
      const y = window.scrollY;
      section.dataset.active = String(
        y > geometry.start - geometry.height &&
          y < geometry.start + geometry.travel + geometry.height,
      );
      target = clamp((y - geometry.start) / geometry.travel);
      // Native anchor navigation, leaving the pinned scene, and restoring a tab
      // must arrive at a complete frame, without a delayed catch-up animation.
      if (
        y < geometry.start ||
        y > geometry.start + geometry.travel ||
        document.hidden
      ) {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
        if (current !== target) render((current = target));
        return;
      }
      if (!frame && current !== target) frame = requestAnimationFrame(tick);
    }

    function measure() {
      measurement = 0;
      if (disposed) return;
      section.dataset.motion = mq.matches ? "reduced" : "full";
      // Read layout together, before any placement writes. `svh` keeps browser
      // address-bar changes from resizing the scene during touch scrolling.
      stage.style.removeProperty("height");
      section.style.removeProperty("height");
      const introHeight = intro.offsetHeight;
      const width = stage.clientWidth;
      const naturalHeight = stage.clientHeight;
      const height = mq.matches ? introHeight + 780 : naturalHeight;
      const gap = width < 700 ? 16 : 32;
      const imageWidth = Math.min(
        1280,
        width - gap * 2,
        Math.max(240, height - introHeight - 12) * 1.5,
      );
      const imageHeight = imageWidth / 1.5;
      const left = (width - imageWidth) / 2;
      const top = introHeight + (height - introHeight - imageHeight) / 2;
      const start = section.getBoundingClientRect().top + window.scrollY - 64;
      const travel = Math.max(1, section.offsetHeight - naturalHeight);
      geometry = {
        start,
        travel,
        height,
        anchorX: left + imageWidth * PAPER_ANCHOR.x,
        anchorY: top + imageHeight * PAPER_ANCHOR.y,
        centerX: width / 2,
        centerY: mq.matches ? introHeight + 325 : height / 2 - 20,
        initialScale: (imageWidth * PAPER_ANCHOR.width) / 420,
        finalScale: Math.min(
          1,
          (width - 52) / 420,
          (mq.matches ? 600 : height - 220) / 600,
        ),
      };
      if (mq.matches) {
        stage.style.height = `${height}px`;
        section.style.height = `${height}px`;
      }
      Object.assign(desk.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transformOrigin: `${PAPER_ANCHOR.x * 100}% ${PAPER_ANCHOR.y * 100}%`,
      });
      current = target = mq.matches
        ? 1
        : clamp((window.scrollY - start) / travel);
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      render(current);
      paper.style.visibility = "visible";
      section.dataset.ready = "true";
      section.dataset.active = String(
        window.scrollY > start - height &&
          window.scrollY < start + travel + height,
      );
    }

    function scheduleMeasure() {
      if (!measurement) measurement = requestAnimationFrame(measure);
    }

    measure();
    // Observe only the intro: observing the reduced-motion stage would feed its
    // own measured height back into ResizeObserver indefinitely.
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(intro);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("pageshow", scheduleMeasure);
    document.addEventListener("visibilitychange", onScroll);
    mq.addEventListener("change", scheduleMeasure);
    document.fonts.ready.then(() => {
      if (!disposed) scheduleMeasure();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(measurement);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("pageshow", scheduleMeasure);
      document.removeEventListener("visibilitychange", onScroll);
      mq.removeEventListener("change", scheduleMeasure);
    };
  }, [root, onStep]);
}
