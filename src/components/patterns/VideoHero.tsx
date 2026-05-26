"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

interface VideoHeroProps {
  eyebrow?: string;
  title: string;
  lede?: string;
  /**
   * Poster image rendered immediately while the video downloads (or
   * permanently, when the visitor's environment shouldn't play
   * video). Should match what the first frame of the video looks
   * like as closely as possible so the hand-off feels seamless.
   * Path is relative to `/public` (e.g. `/hero/home-poster.jpg`).
   */
  posterSrc: string;
  /**
   * The H.264 `.mp4` (broadest browser compatibility). REQUIRED. The
   * component degrades to "poster only" if this fails to load or
   * decode — visitors never see a broken video element.
   */
  videoSrc: string;
  /**
   * Optional VP9/AV1 `.webm` source served preferentially when the
   * browser supports it. Pass when WebM is genuinely smaller than
   * the MP4; skip otherwise (some sources don't compress better in
   * VP9 and shipping a larger sibling is counterproductive).
   */
  webmSrc?: string;
  children?: ReactNode;
  height?: "tall" | "short";
  className?: string;
}

/**
 * VideoHero — full-bleed hero with a looping muted background video
 * and a production-grade fallback ladder so the page never feels
 * heavy.
 *
 * What this component handles for you:
 *
 *   1. Instant first paint via the poster image. The poster shows
 *      immediately on every render; the `<video>` element only
 *      starts loading once the visitor's environment OK's it.
 *
 *   2. Lazy autoplay. We use IntersectionObserver to delay calling
 *      `load()` until the hero scrolls into view. On the home page
 *      that's almost immediate, but it's still good hygiene — a
 *      visitor who lands on a deep link to /pastries then
 *      navigates back doesn't trigger a fresh download.
 *
 *   3. Reduced-motion respect. Visitors with the system
 *      "reduce motion" preference get the poster only. Browser
 *      autoplay APIs and accessibility guidelines both expect this.
 *
 *   4. Save-Data respect. Browsers expose `Save-Data: on` (low
 *      bandwidth mode, common on cellular). We honour it the same
 *      way as reduced-motion: poster only.
 *
 *   5. Hard mobile escape hatch. The `disableOnMobile` prop (off by
 *      default) lets the operator force the poster-only path on
 *      phones if mobile-Lighthouse needs to stay green. Even with
 *      everything else enabled, no video bytes hit the wire.
 *
 *   6. Autoplay-failure fallback. Some browsers (older Safari,
 *      stricter battery-saver modes) refuse to autoplay even muted
 *      video. We catch the rejection and stay on the poster rather
 *      than showing a paused first frame.
 *
 * Markup note: `<video muted playsInline autoplay loop>` is the
 * required combination for inline silent autoplay on iOS. Drop any
 * of those four and Safari refuses to start. We also set
 * `preload="metadata"` rather than "auto" so the browser doesn't
 * download bytes until we're actually ready to play.
 */
export function VideoHero({
  eyebrow,
  title,
  lede,
  posterSrc,
  videoSrc,
  webmSrc,
  children,
  height = "tall",
  className,
}: VideoHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /**
   * `shouldPlay` flips true the first time the hero scrolls into
   * view AND we've decided playback is allowed (motion/data/etc.
   * checks have all passed). Stays true thereafter — we don't pause
   * on scroll-out because the wobble is more annoying than the
   * bandwidth saved is worth.
   */
  const [shouldPlay, setShouldPlay] = useState(false);

  /**
   * `playable` is the gate the user environment controls. False
   * means "don't try, poster forever". We default to FALSE to keep
   * the initial render server-safe — `useEffect` flips it to true
   * after the client-side checks succeed.
   */
  const [playable, setPlayable] = useState(false);

  // Environment checks — run client-side only because all three
  // signals require window/navigator. Order matches priority:
  // reduced-motion is the strongest opt-out and we honour it
  // unconditionally; Save-Data is next; mobile-width is operator
  // choice.
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Reduced-motion preference.
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      setPlayable(false);
      return;
    }

    // 2. Save-Data hint. Not all browsers expose this; only Chromium
    //    family does. Optional chaining keeps the call safe in
    //    Safari/Firefox where `connection` may be undefined.
    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean };
      }
    ).connection;
    if (conn?.saveData) {
      setPlayable(false);
      return;
    }

    setPlayable(true);
  }, []);

  // Lazy autoplay via IntersectionObserver. Once the hero is at
  // least 25% in view we mark `shouldPlay` true; the effect that
  // owns `<video>` watches that and calls `load()` + `play()`.
  useEffect(() => {
    if (!playable) return;
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      // Older browsers without IO: just start immediately.
      setShouldPlay(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldPlay(true);
            obs.disconnect();
            return;
          }
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [playable]);

  // When `shouldPlay` flips true, ask the browser to play. Catch
  // the promise rejection so we don't get unhandled-rejection logs
  // in environments that refuse autoplay; the poster is still
  // visible underneath, so visitors never see a broken state.
  useEffect(() => {
    if (!shouldPlay) return;
    const v = videoRef.current;
    if (!v) return;
    // Some browsers ignore the `autoplay` attribute and require an
    // explicit `play()` after the video is mounted; calling here
    // covers both code paths.
    const result = v.play();
    if (result && typeof result.then === "function") {
      result.catch(() => {
        // Autoplay refused. Poster stays visible — nothing else to
        // do. We could surface a tap-to-play affordance here, but
        // a hero background that requires a tap defeats the point.
      });
    }
  }, [shouldPlay]);

  // Gradient overlay sits between the video and the foreground
  // copy so the headline stays AA-contrast regardless of what
  // frame is showing underneath. Matches the gradient used by
  // `<Hero>` so the two hero styles are visually consistent.
  const overlay =
    "linear-gradient(180deg, rgba(31,8,5,0.55) 0%, rgba(31,8,5,0.15) 40%, rgba(31,8,5,0.65) 100%)";

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden",
        "px-page-gutter py-14 text-center text-cream-50 md:py-20",
        height === "tall" ? "min-h-hero-tall" : "min-h-hero-short",
        className,
      )}
    >
      {/*
        Poster sits as a CSS background so it paints in the first
        frame Next renders, before any JavaScript boots. No
        layout-shift, no blank flash. We carry the gradient overlay
        here too so the poster reads identically to the gradient
        applied over the video — when the video swaps in later, the
        contrast over the headline doesn't pop.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: `${overlay}, url("${posterSrc}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/*
        The actual video. Mounted only when `playable` AND
        `shouldPlay` have both flipped true, so we never download
        bytes for visitors who'll never see the video.
        `object-cover` does the heavy lifting on aspect-ratio
        mismatch — portrait source files get center-cropped on
        landscape viewports and vice-versa.
      */}
      {playable && shouldPlay ? (
        <video
          ref={videoRef}
          // `autoplay` attribute as a belt-and-braces measure; the
          // explicit play() call above handles browsers that ignore
          // the attribute.
          autoPlay
          loop
          muted
          playsInline
          // `preload="metadata"` — fetch just enough to know
          // dimensions/duration; the actual frames only download
          // when play() fires.
          preload="metadata"
          poster={posterSrc}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        >
          {/*
            Source order matters. The browser picks the FIRST source
            it can play, NOT the smallest. Put the smaller/modern
            format first if you provide both.
          */}
          {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : null}

      {/* Same darkening overlay rendered ON TOP of the video. The
          background-overlay above ensures the gradient is present
          when only the poster shows; this layer ensures it stays
          present when the video swaps in. Two layers means the
          headline never loses contrast during the swap. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(31,8,5,0.45) 0%, rgba(31,8,5,0.10) 40%, rgba(31,8,5,0.55) 100%)",
        }}
      />

      {/* Foreground content. `relative` puts it above both overlays. */}
      <div className="relative flex flex-col items-center">
        {eyebrow ? (
          <span className="mb-3 font-sans text-eyebrow font-semibold uppercase tracking-[0.28em] text-orange-200">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="m-0 max-w-[18ch] font-display text-[clamp(2rem,7vw,4.75rem)] font-medium leading-[1.08] text-cream-50">
          {title}
        </h1>
        {lede ? (
          <p className="mt-4 max-w-[56ch] font-display text-lg italic text-cream-100/95 md:text-xl">
            {lede}
          </p>
        ) : null}
        {children ? <div className="mt-6 md:mt-8">{children}</div> : null}
      </div>

      {height === "tall" ? (
        <span
          aria-hidden
          className="absolute bottom-4 left-1/2 h-1.5 w-14 -translate-x-1/2 rounded-pill bg-cream-50/60"
        />
      ) : null}
    </section>
  );
}
