"use client";

import { useSyncExternalStore } from "react";

function noopSubscribe() {
  return () => {};
}

/**
 * True when the page is running inside an iframe (for example an embedded
 * preview). Sandboxed iframes usually block navigation to external domains such
 * as wa.me with ERR_BLOCKED_BY_RESPONSE, so in that case the best we can do is
 * offer the number/message to copy instead of sending the visitor to an error
 * page.
 */
function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin access threw, which means we are definitely framed.
    return true;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsEmbedded(): boolean {
  return useSyncExternalStore(noopSubscribe, getSnapshot, getServerSnapshot);
}
