import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { leaderboard } from "@/lib/admin";
import { listExams } from "@/lib/exam/exams";

export const dynamic = "force-dynamic";

const IST_MS = 330 * 60_000;
/** Excel has no time zones: shift so the cell shows the IST date. */
const ist = (d: Date | null) => (d ? new Date(d.getTime() + IST_MS) : null);
const TOP3 = ["FFFDE68A", "FFE5E7EB", "FFFED7AA"]; // gold, silver, bronze fills

/** Same view as /admin/leaderboard (same ?by= and ?exam=), as a formatted .xlsx. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const params = new URL(req.url).searchParams;
  const by = params.get("by") === "attempted" ? "attempted" : "score";
  const exam = by === "score" ? (await listExams()).find((e) => e.id === params.get("exam")) : undefined;
  const rows = await leaderboard(exam?.id, by);

  const wb = new ExcelJS.Workbook();
  wb.creator = "PlacePrep";
  const ws = wb.addWorksheet("Leaderboard");
  const view = by === "attempted" ? "Ranked by questions attempted" : `Ranked by mock score · ${exam?.short ?? "All mocks"}`;
  const today = new Date(Date.now() + IST_MS).toISOString().slice(0, 10);
  ws.addRow([`PlacePrep leaderboard · ${view} · exported ${today} (IST)`]).font = { bold: true, size: 13 };
  ws.addRow([by === "attempted" ? "Accuracy is over graded questions." : "Average % decides the rank; best mock breaks ties. Rank is blank for practice-only students."]).font = { italic: true, color: { argb: "FF64748B" } };

  ws.columns = [
    { key: "rank", width: 7 },
    { key: "name", width: 24 },
    { key: "email", width: 32 },
    { key: "college", width: 28 },
    { key: "mocks", width: 8 },
    { key: "avgPct", width: 10, style: { numFmt: "0.0%" } },
    { key: "bestPct", width: 10, style: { numFmt: "0.0%" } },
    { key: "bestScore", width: 11 },
    { key: "bestMax", width: 11 },
    { key: "totalScore", width: 12 },
    { key: "totalMax", width: 12 },
    { key: "secPerQ", width: 13, style: { numFmt: "0.0" } },
    { key: "lastMock", width: 13, style: { numFmt: "dd mmm yyyy" } },
    { key: "totalAnswered", width: 12 },
    { key: "totalAcc", width: 10, style: { numFmt: "0.0%" } },
    { key: "practiceAnswered", width: 12 },
    { key: "practiceAcc", width: 12, style: { numFmt: "0.0%" } },
  ];
  const header = ws.addRow([
    "Rank", "Student", "Email", "College", "Mocks", "Avg score %", "Best score %", "Best mock marks", "Best mock out of",
    "Total mock marks", "Total mock out of", "Mock speed (sec/question)", "Last mock", "Questions answered", "Accuracy %",
    "Practice answered", "Practice accuracy %",
  ]);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.alignment = { wrapText: true, vertical: "middle" };
  header.height = 32;
  header.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } }));

  for (const r of rows) {
    const row = ws.addRow({
      rank: r.rank, name: r.name, email: r.email, college: r.college,
      mocks: r.mocks || null, avgPct: r.avgPct, bestPct: r.bestPct,
      bestScore: r.bestScore, bestMax: r.bestMax, totalScore: r.totalScore, totalMax: r.totalMax,
      secPerQ: r.mockSecPerQ, lastMock: ist(r.lastMockAt),
      totalAnswered: r.totalAnswered || null, totalAcc: r.totalAcc,
      practiceAnswered: r.practiceAnswered || null, practiceAcc: r.practiceAcc,
    });
    if (r.rank != null && r.rank <= 3) row.eachCell({ includeEmpty: true }, (c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOP3[r.rank! - 1] } }));
    if (r.rank == null) row.font = { color: { argb: "FF94A3B8" } }; // practice only, unranked
  }

  const headerRow = header.number;
  ws.views = [{ state: "frozen", ySplit: headerRow, xSplit: 2 }];
  ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow + rows.length, column: ws.columns.length } };

  const name = `placeprep-leaderboard-${by === "attempted" ? "attempted" : (exam?.id ?? "all-mocks")}-${today}.xlsx`;
  return new NextResponse(Buffer.from(await wb.xlsx.writeBuffer()), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
