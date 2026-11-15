"use client";

import { useEffect, useState } from "react";

/** Green tick when an Accepted submission for this problem is stored in this browser (see Workspace). */
export function SolvedMark({ id }: { id: string }) {
  const [solved, setSolved] = useState(false);
  useEffect(() => {
    const subs: { label: string }[] = JSON.parse(localStorage.getItem(`code:subs:${id}`) ?? "[]");
    setSolved(subs.some((s) => s.label === "Accepted"));
  }, [id]);
  return <span className="w-5 text-center text-sm text-emerald-600" aria-label={solved ? "Solved" : undefined}>{solved ? "✓" : ""}</span>;
}
