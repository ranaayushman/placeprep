import { describe, expect, it } from "vitest";
import { normalize, normOptions, normStem } from "@/lib/community/normalize";
import { questionSchema } from "@/lib/community/validate";

describe("normalize", () => {
  it.each([
    ["  Hello,   World!  ", "hello world"],
    ["ＡＢＣ　１２３", "abc 123"], // full-width → NFKC
    ["x+y=10; x−y=4", "x y 10 x y 4"],
    ["Don't—stop.", "don t stop"],
    ["Line\nbreak\ttab", "line break tab"],
    ["!!!", ""],
    ["Café", "café"],
  ])("%j → %j", (input, out) => expect(normalize(input)).toBe(out));

  it("sorts options so their order never matters, and folds code into the stem", () => {
    expect(normOptions(["B", "a", "C", "d"])).toBe("a | b | c | d");
    expect(normOptions(["d", "C", "a", "B"])).toBe(normOptions(["B", "a", "C", "d"]));
    expect(normStem("What does this print?", "printf(\"%d\", 5);")).toBe("what does this print printf d 5");
  });
});

const valid = {
  section: "verbal",
  topic: "v-fill",
  company: "Infosys",
  stem: "Fill in the blank: She has been waiting ___ morning.",
  options: ["since", "for", "from", "by"],
  answerIndex: 0,
  explanation: "Since marks a starting point in time (morning).",
  sourceType: "MEMORY_BASED_PYQ",
  ownWords: true,
} as const;
const err = (v: object) => {
  const r = questionSchema.safeParse(v);
  return r.success ? null : r.error.issues.map((i) => i.message).join("; ");
};

describe("question validation", () => {
  it("accepts a valid question", () => expect(err(valid)).toBeNull());
  it.each([
    ["duplicate options", { ...valid, options: ["since", "Since!", "from", "by"] }, /different/],
    ["empty option", { ...valid, options: ["since", "  ", "from", "by"] }, /option/i],
    ["missing answer", { ...valid, answerIndex: undefined }, /correct option/],
    ["answer out of range", { ...valid, answerIndex: 4 }, /correct option/],
    ["HTML in the stem", { ...valid, stem: "Fill in the blank <b>now</b> please ___" }, /HTML/],
    ["HTML in an option", { ...valid, options: ["<i>since</i>", "for", "from", "by"] }, /HTML/],
    ["a link in the stem", { ...valid, stem: "Fill in the blank from https://example.com/q1 ___" }, /Links/],
    ["a bare domain in the stem", { ...valid, stem: "See prepsite.com for this one: ___ blank" }, /Links/],
    ["short explanation", { ...valid, explanation: "since" }, /explanation/i],
    ["topic from another section", { ...valid, topic: "m-percent" }, /topic/],
    ["no own-words confirmation", { ...valid, ownWords: false }, /own words/],
    ["Other company without a name", { ...valid, company: "Other" }, /company/],
  ])("rejects %s", (_, input, message) => expect(err(input)).toMatch(message));

  it("keeps C code verbatim, including angle brackets", () => {
    const r = questionSchema.parse({ ...valid, section: "technical", topic: "t-programming", stem: "What does this C program print?", code: "#include <stdio.h>\nint main(){ printf(\"%d\", 1); }" });
    expect(r.code).toContain("<stdio.h>");
  });
});
