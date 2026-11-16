import type { Language } from "./problems";

/**
 * LeetCode-style practice: the student writes only `class Solution { … }` and this file wraps it into a full
 * program that parses the problem's stdin, calls the method and prints the result in the expected format.
 * The tests stay plain stdin/stdout, so the same hidden tests judge both styles. Mock exams keep full
 * programs (the real papers do); only problems with an `fn` spec get this.
 */

type Scalar = "int" | "long" | "string" | "line";
/** One value read from stdin, in order. Arrays take their length from an earlier field (`len`, e.g. "n" or "n-1"). */
export type Field =
  | { name: string; type: Scalar }
  | { name: string; type: "int[]" | "long[]"; len: string }
  | { name: string; type: "int[][]"; rows: string; cols: string };
export type Returns =
  | { type: "int" | "long" | "string" | "int[]" | "long[]" | "lines" | "countAndList" }
  | { type: "bool"; yes: string; no: string };
/** `read` is stdin order; `args` is the method's parameter order (fields not listed, like counts, are read and dropped). */
export type FnSpec = { name: string; read: Field[]; args: string[]; returns: Returns };

const fieldOf = (s: FnSpec, n: string) => s.read.find((f) => f.name === n)!;
const lenExpr = (e: string) => e.replace(/\s+/g, ""); // "n-1" is valid C++, Java and Python as is

// ── C++ ──────────────────────────────────────────────────────────────────────────────────────────
const CPP_TYPE = { int: "int", long: "long long", string: "string", line: "string", "int[]": "vector<int>", "long[]": "vector<long long>", "int[][]": "vector<vector<int>>" } as const;
const CPP_RET = { int: "int", long: "long long", string: "string", bool: "bool", "int[]": "vector<int>", "long[]": "vector<long long>", lines: "vector<string>", countAndList: "vector<int>" } as const;

function cppRead(f: Field): string {
  if (f.type === "line") return `string ${f.name}; ws(cin); getline(cin, ${f.name}); if (!${f.name}.empty() && ${f.name}.back() == '\\r') ${f.name}.pop_back();`;
  if (f.type === "int[]" || f.type === "long[]") return `${CPP_TYPE[f.type]} ${f.name}(${lenExpr(f.len)}); for (auto& x : ${f.name}) cin >> x;`;
  if (f.type === "int[][]") return `vector<vector<int>> ${f.name}(${lenExpr(f.rows)}, vector<int>(${lenExpr(f.cols)})); for (auto& r : ${f.name}) for (auto& x : r) cin >> x;`;
  return `${CPP_TYPE[f.type]} ${f.name}; cin >> ${f.name};`;
}
function cppPrint(r: Returns): string {
  switch (r.type) {
    case "bool": return `cout << (res ? "${r.yes}" : "${r.no}") << "\\n";`;
    case "int[]": case "long[]": return `for (size_t i = 0; i < res.size(); i++) cout << (i ? " " : "") << res[i]; cout << "\\n";`;
    case "countAndList": return `cout << res.size() << "\\n"; for (size_t i = 0; i < res.size(); i++) cout << (i ? " " : "") << res[i]; cout << "\\n";`;
    case "lines": return `for (auto& l : res) cout << l << "\\n";`;
    default: return `cout << res << "\\n";`;
  }
}
// LeetCode convention: containers by reference, numbers and strings by value.
const cppParams = (s: FnSpec) => s.args.map((a) => { const f = fieldOf(s, a); return f.type.endsWith("]") ? `${CPP_TYPE[f.type]}& ${a}` : `${CPP_TYPE[f.type]} ${a}`; }).join(", ");

// ── Java ─────────────────────────────────────────────────────────────────────────────────────────
const JAVA_TYPE = { int: "int", long: "long", string: "String", line: "String", "int[]": "int[]", "long[]": "long[]", "int[][]": "int[][]" } as const;
const JAVA_RET = { int: "int", long: "long", string: "String", bool: "boolean", "int[]": "int[]", "long[]": "long[]", lines: "List<String>", countAndList: "int[]" } as const;

function javaRead(f: Field): string {
  if (f.type === "line") return `String ${f.name} = in.line();`;
  if (f.type === "string") return `String ${f.name} = in.token();`;
  if (f.type === "int") return `int ${f.name} = Integer.parseInt(in.token());`;
  if (f.type === "long") return `long ${f.name} = Long.parseLong(in.token());`;
  if (f.type === "int[]") return `int[] ${f.name} = new int[${lenExpr(f.len)}]; for (int i = 0; i < ${f.name}.length; i++) ${f.name}[i] = Integer.parseInt(in.token());`;
  if (f.type === "long[]") return `long[] ${f.name} = new long[${lenExpr(f.len)}]; for (int i = 0; i < ${f.name}.length; i++) ${f.name}[i] = Long.parseLong(in.token());`;
  if (f.type !== "int[][]") throw new Error(`unknown field type ${f.type}`);
  return `int[][] ${f.name} = new int[${lenExpr(f.rows)}][${lenExpr(f.cols)}]; for (int[] r : ${f.name}) for (int j = 0; j < r.length; j++) r[j] = Integer.parseInt(in.token());`;
}
function javaPrint(r: Returns): string {
  const join = `StringBuilder sb = new StringBuilder(); for (int i = 0; i < res.length; i++) { if (i > 0) sb.append(' '); sb.append(res[i]); }`;
  switch (r.type) {
    case "bool": return `System.out.println(res ? "${r.yes}" : "${r.no}");`;
    case "int[]": case "long[]": return `${join} System.out.println(sb);`;
    case "countAndList": return `${join} System.out.println(res.length); System.out.println(sb);`;
    case "lines": return `StringBuilder sb = new StringBuilder(); for (String l : res) sb.append(l).append('\\n'); System.out.print(sb);`;
    default: return `System.out.println(res);`;
  }
}
const JAVA_READER = `
final class PlacePrepInput {
    private final String s; private int p = 0;
    PlacePrepInput(String s) { this.s = s; }
    private void skip() { while (p < s.length() && Character.isWhitespace(s.charAt(p))) p++; }
    String token() { skip(); int b = p; while (p < s.length() && !Character.isWhitespace(s.charAt(p))) p++; return s.substring(b, p); }
    String line() { skip(); int b = p; while (p < s.length() && s.charAt(p) != '\\n') p++; String l = s.substring(b, p); return l.endsWith("\\r") ? l.substring(0, l.length() - 1) : l; }
}`;

// ── Python ───────────────────────────────────────────────────────────────────────────────────────
const PY_TYPE = { int: "int", long: "int", string: "str", line: "str", "int[]": "List[int]", "long[]": "List[int]", "int[][]": "List[List[int]]" } as const;
const PY_RET = { int: "int", long: "int", string: "str", bool: "bool", "int[]": "List[int]", "long[]": "List[int]", lines: "List[str]", countAndList: "List[int]" } as const;

function pyRead(f: Field): string {
  if (f.type === "line") return `${f.name} = _line()`;
  if (f.type === "string") return `${f.name} = _tok()`;
  if (f.type === "int" || f.type === "long") return `${f.name} = int(_tok())`;
  if (f.type === "int[]" || f.type === "long[]") return `${f.name} = [int(_tok()) for _ in range(${lenExpr(f.len)})]`;
  if (f.type !== "int[][]") throw new Error(`unknown field type ${f.type}`);
  return `${f.name} = [[int(_tok()) for _ in range(${lenExpr(f.cols)})] for _ in range(${lenExpr(f.rows)})]`;
}
function pyPrint(r: Returns): string {
  switch (r.type) {
    case "bool": return `print("${r.yes}" if res else "${r.no}")`;
    case "int[]": case "long[]": return `print(" ".join(map(str, res)))`;
    case "countAndList": return `print(len(res))\n    print(" ".join(map(str, res)))`;
    case "lines": return `for _l in res:\n        print(_l)`;
    default: return `print(res)`;
  }
}

/** Python's driver line numbers: the prelude adds this many lines before the student's code. */
export const PY_PRELUDE_LINES = 1;

export function starterFor(spec: FnSpec, lang: Exclude<Language, "sql">): string {
  if (lang === "cpp") return `class Solution {\npublic:\n    ${CPP_RET[spec.returns.type]} ${spec.name}(${cppParams(spec)}) {\n        \n    }\n};\n`;
  if (lang === "java") {
    const params = spec.args.map((a) => `${JAVA_TYPE[fieldOf(spec, a).type]} ${a}`).join(", ");
    return `class Solution {\n    public ${JAVA_RET[spec.returns.type]} ${spec.name}(${params}) {\n        \n    }\n}\n`;
  }
  const params = spec.args.map((a) => `${a}: ${PY_TYPE[fieldOf(spec, a).type]}`).join(", ");
  return `class Solution:\n    def ${spec.name}(self${params ? `, ${params}` : ""}) -> ${PY_RET[spec.returns.type]}:\n        pass\n`;
}

/** The full program that is compiled and judged: student's class + a generated main. */
export function wrapSolution(spec: FnSpec, lang: Exclude<Language, "sql">, code: string): string {
  if (lang === "cpp") {
    // #line keeps compiler errors on the student's own line numbers.
    return `#include <bits/stdc++.h>\nusing namespace std;\n#line 1\n${code}\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    ${spec.read.map(cppRead).join("\n    ")}\n    auto res = Solution().${spec.name}(${spec.args.join(", ")});\n    ${cppPrint(spec.returns)}\n    return 0;\n}\n`;
  }
  if (lang === "java") {
    // Imports go on the student's first line, so javac's line numbers match what they see.
    return `import java.util.*; import java.io.*; ${code}\n${JAVA_READER}\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        PlacePrepInput in = new PlacePrepInput(new String(System.in.readAllBytes()));\n        ${spec.read.map(javaRead).join("\n        ")}\n        ${JAVA_RET[spec.returns.type]} res = new Solution().${spec.name}(${spec.args.join(", ")});\n        ${javaPrint(spec.returns)}\n    }\n}\n`;
  }
  return `from typing import *; import sys as _sys\n${code}\n\n_data = _sys.stdin.read()\n_pos = 0\ndef _skip():\n    global _pos\n    while _pos < len(_data) and _data[_pos].isspace():\n        _pos += 1\ndef _tok():\n    global _pos\n    _skip()\n    b = _pos\n    while _pos < len(_data) and not _data[_pos].isspace():\n        _pos += 1\n    return _data[b:_pos]\ndef _line():\n    global _pos\n    _skip()\n    b = _pos\n    while _pos < len(_data) and _data[_pos] != "\\n":\n        _pos += 1\n    return _data[b:_pos].rstrip("\\r")\nif __name__ == "__main__":\n    ${spec.read.map(pyRead).join("\n    ")}\n    res = Solution().${spec.name}(${spec.args.join(", ")})\n    ${pyPrint(spec.returns)}\n`;
}

/** Python tracebacks point at the wrapped file; shift line numbers back to the student's. */
export const fixPythonLines = (stderr: string) => stderr.replace(/line (\d+)/g, (_, n) => `line ${Math.max(1, Number(n) - PY_PRELUDE_LINES)}`);
