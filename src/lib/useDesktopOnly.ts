"use client";

import { useSyncExternalStore } from "react";

// A touch device narrower than a laptop. A narrow desktop window (fine pointer) is not caught, so resizing never locks anyone out.
const QUERY = "(pointer: coarse) and (max-width: 1023px)";

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** True on phones and small tablets. Mock tests need a computer; everything else works on any device. */
export const useDesktopOnly = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
