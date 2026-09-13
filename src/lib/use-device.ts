"use client";

import { useSyncExternalStore } from "react";

export type DeviceKind = "mobile" | "desktop";

const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|Opera Mini|IEMobile|BlackBerry/i;

function noopSubscribe() {
  return () => {};
}

/**
 * Reads the device kind from the browser. Safe to call during SSR: React uses
 * `getServerSnapshot` while hydrating and re-renders with the real value after.
 */
function getSnapshot(): DeviceKind {
  if (typeof window === "undefined") return "mobile";
  const userAgent = navigator.userAgent ?? "";
  const mobileUa = MOBILE_UA.test(userAgent);

  // iPads on iPadOS 13+ report a desktop Safari user agent, so also look for
  // coarse pointer input on a viewport that is not a wide desktop.
  const touchTablet =
    (navigator.maxTouchPoints ?? 0) > 1 &&
    window.matchMedia("(pointer: coarse)").matches &&
    !window.matchMedia("(min-width: 1280px)").matches;

  return mobileUa || touchTablet ? "mobile" : "desktop";
}

/** Matches the server render (the cardápio is mobile-first). */
function getServerSnapshot(): DeviceKind {
  return "mobile";
}

/**
 * Detects whether the visitor is on a phone/tablet or a desktop browser.
 * Used to pick the best WhatsApp entry point: on desktop `wa.me` redirects to
 * api.whatsapp.com and is often blocked, so WhatsApp Web is preferred there.
 */
export function useDeviceKind(): DeviceKind {
  return useSyncExternalStore(noopSubscribe, getSnapshot, getServerSnapshot);
}
