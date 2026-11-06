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

  return (
    <>
      <SystemCheck onReady={setReady} />
      <form action={startMock} className="card flex flex-wrap items-center justify-between gap-4">
        <input type="hidden" name="exam" value={examId} />
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
