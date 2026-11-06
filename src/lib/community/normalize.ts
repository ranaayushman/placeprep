/** Lowercase, Unicode NFKC, punctuation → space, whitespace collapsed, trimmed. */
export function normalize(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The compared "stem": the question plus its code block, since code questions share their prompt. */
export const normStem = (stem: string, code?: string | null) => normalize(code ? `${stem}\n${code}` : stem);

/** Options normalised, sorted (so order never matters) and joined. */
export const normOptions = (options: string[]) => options.map(normalize).sort().join(" | ");
