/** Tuning knobs for community questions. See README "Community questions". */

/** A student must have answered this many questions before they can upload. */
export const MIN_ANSWERED_TO_UPLOAD = 20;
/** Uploads per student in any rolling 24 hours (counted in the database, so it holds on Vercel). */
export const MAX_SUBMISSIONS_PER_DAY = 10;

/** Combined similarity at or above which a submission is almost certainly a copy. */
export const DUPLICATE_LIKELY = 0.85;
/** Combined similarity at or above which a submission is flagged for an admin. */
export const DUPLICATE_POSSIBLE = 0.5;
/** Trigram threshold for candidates, and the lowest match score we store. */
export const MATCH_FLOOR = 0.3;
export const STEM_WEIGHT = 0.7;
export const OPTIONS_WEIGHT = 0.3;
/**
 * A question line used by this many bank questions is an instruction ("Choose the grammatically
 * correct sentence."), not content; such pairs are scored on the options alone.
 */
export const SHARED_STEM_MIN = 3;

/** Open reports that hide a published question from practice until an admin looks. */
export const REPORTS_TO_HIDE = 3;
/** Answer-statistics check: minimum answers, and the two "answer key may be wrong" signals. */
export const STATS_MIN_ANSWERS = 20;
export const STATS_LOW_ACCURACY = 0.25;
export const STATS_DOMINANT_WRONG = 0.5;

export const COMMUNITY_SECTIONS = ["reasoning", "math", "verbal", "pseudocode", "puzzle", "technical"] as const;
export const COMPANIES = ["Infosys", "Deloitte", "Other"] as const;
export const SOURCE_TYPES = ["ORIGINAL", "MEMORY_BASED_PYQ", "OTHER"] as const;
