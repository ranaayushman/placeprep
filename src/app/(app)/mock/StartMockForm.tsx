"use client";

import { useState } from "react";
import { startMock } from "../start-actions";
import { SystemCheck } from "./SystemCheck";

export function StartMockForm({
  examId,
  hasWriting,
  questionCount,
  minutes,
}: {
  examId: string;
  hasWriting: boolean;
  questionCount: number;
  minutes: number;
}) {
  const [ready, setReady] = useState(false);
  const [camera, setCamera] = useState(true);

  return (
    <>
      <SystemCheck onReady={setReady} camera={camera} />
      <form action={startMock} className="card flex flex-wrap items-center justify-between gap-4">
        <input type="hidden" name="exam" value={examId} />
        <label className="flex w-full items-start gap-2 text-sm">
          <input type="checkbox" name="camera" checked={camera} onChange={(e) => setCamera(e.target.checked)} className="mt-0.5" />
          <span>
            <span className="font-medium">Camera proctoring</span>
            <span className="block text-slate-500">
              {camera
                ? "Your camera checks for your face and where you look (nothing is recorded or uploaded)."
                : "Off: no camera checks. Full screen and tab-switch warnings still apply, and your result is marked “camera off”."}
            </span>
          </span>
        </label>
        {hasWriting ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="writing" defaultChecked /> Include the writing test (essay, 20 min)
          </label>
        ) : (
          <span className="text-sm text-slate-500">{questionCount} questions · {minutes} min</span>
        )}
        <button disabled={!ready} className="btn-primary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50">
          {ready ? "I understand — start the test" : "Complete system check first"}
        </button>
      </form>
    </>
  );
}
