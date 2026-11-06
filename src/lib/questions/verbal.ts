/**
 * Verbal Ability. All passages and sentences here are original, written in the style of the
 * reported Infosys verbal section (RC, sentence correction, fill-ups, para jumbles, vocabulary).
 * Static banks are finite — add more items to these arrays to grow the pool.
 */
import { rng, staticMcq } from "./rng";
import type { Question, Topic } from "./types";
import { MORE_FILL_BLANKS, MORE_PARA_JUMBLES, MORE_PASSAGES, MORE_SENTENCE_CORRECTION } from "./verbal-extra";

type Item = { prompt: string; options: string[]; answer: number; explanation: string };

const BASE_SENTENCE_CORRECTION: Item[] = [
  { prompt: "Choose the grammatically correct sentence.", options: ["Neither the manager nor the employees was ready for the audit.", "Neither the manager nor the employees were ready for the audit.", "Neither the manager or the employees were ready for the audit.", "Neither the manager nor the employees has been ready for the audit."], answer: 1, explanation: "With neither…nor, the verb agrees with the nearer subject (employees → were)." },
  { prompt: "Choose the grammatically correct sentence.", options: ["Each of the students have submitted the assignment.", "Each of the students has submitted the assignment.", "Each of the student has submitted the assignment.", "Each of the students have submitted their assignments."], answer: 1, explanation: "“Each” is singular and takes a singular verb; it is followed by a plural noun (each of the students)." },
  { prompt: "Choose the grammatically correct sentence.", options: ["I have been working here since five years.", "I am working here since five years.", "I have been working here for five years.", "I worked here since five years."], answer: 2, explanation: "Use “for” with a duration and the present perfect continuous for an action still going on." },
  { prompt: "Choose the grammatically correct sentence.", options: ["If I would have known, I would have helped.", "If I had known, I would have helped.", "If I knew, I would have helped.", "If I have known, I would help."], answer: 1, explanation: "Third conditional: If + past perfect, would have + past participle." },
  { prompt: "Choose the grammatically correct sentence.", options: ["The team are playing good today.", "The team is playing well today.", "The team is playing good today.", "The team are play well today."], answer: 1, explanation: "“Well” is the adverb; “team” as a single unit takes “is” in standard usage." },
  { prompt: "Choose the grammatically correct sentence.", options: ["She is one of those engineers who always meets deadlines.", "She is one of those engineers who always meet deadlines.", "She is one of those engineer who always meet deadlines.", "She is one of that engineers who always meets deadlines."], answer: 1, explanation: "“Who” refers to “engineers” (plural), so the verb is “meet”." },
  { prompt: "Choose the grammatically correct sentence.", options: ["Hardly had I reached the station when the train left.", "Hardly I had reached the station when the train left.", "Hardly had I reached the station than the train left.", "Hardly I reached the station when the train had left."], answer: 0, explanation: "“Hardly” at the start needs inversion (had I) and pairs with “when”, not “than”." },
  { prompt: "Choose the grammatically correct sentence.", options: ["He suggested me to apply for the job.", "He suggested that I apply for the job.", "He suggested me applying for the job.", "He suggested to me to apply for the job."], answer: 1, explanation: "“Suggest” is followed by a that-clause or a gerund, not by object + infinitive." },
  { prompt: "Choose the grammatically correct sentence.", options: ["The number of applicants have increased this year.", "A number of applicants has increased this year.", "The number of applicants has increased this year.", "The numbers of applicant has increased this year."], answer: 2, explanation: "“The number of” is singular (has); “a number of” would be plural." },
  { prompt: "Choose the grammatically correct sentence.", options: ["Between you and I, the plan is weak.", "Between you and me, the plan is weak.", "Between you and myself, the plan is weak.", "Among you and me, the plan is weak."], answer: 1, explanation: "A preposition takes the object pronoun: between you and me." },
  { prompt: "Choose the grammatically correct sentence.", options: ["Despite of the rain, the match continued.", "Despite the rain, the match continued.", "In spite the rain, the match continued.", "Although the rain, the match continued."], answer: 1, explanation: "“Despite” takes no “of”; “in spite of” needs “of”; “although” needs a clause." },
  { prompt: "Choose the grammatically correct sentence.", options: ["The furniture in these rooms are new.", "The furniture in these rooms is new.", "The furnitures in these rooms are new.", "The furnitures in these rooms is new."], answer: 1, explanation: "“Furniture” is uncountable: no plural form, singular verb (is). The verb agrees with “furniture”, not “rooms”." },
  { prompt: "Choose the grammatically correct sentence.", options: ["No sooner did he arrive than the meeting started.", "No sooner did he arrive when the meeting started.", "No sooner he arrived than the meeting started.", "No sooner had he arrive than the meeting started."], answer: 0, explanation: "“No sooner” takes inversion and pairs with “than”." },
  { prompt: "Choose the grammatically correct sentence.", options: ["I am looking forward to meet you.", "I am looking forward to meeting you.", "I look forward to meet you.", "I am looking forward for meeting you."], answer: 1, explanation: "In “look forward to”, “to” is a preposition, so it takes a gerund (meeting)." },
  { prompt: "Choose the grammatically correct sentence.", options: ["Ten kilometres are a long distance to walk.", "Ten kilometres is a long distance to walk.", "Ten kilometre is a long distance to walk.", "Ten kilometres were a long distances to walk."], answer: 1, explanation: "A quantity treated as one amount takes a singular verb." },
  { prompt: "Choose the grammatically correct sentence.", options: ["The report was written by her and I.", "The report was written by she and me.", "The report was written by her and me.", "The report was written from her and me."], answer: 2, explanation: "After “by”, both pronouns must be object forms: her and me." },
  { prompt: "Choose the sentence with correct parallel structure.", options: ["The job requires coding, testing, and to document the work.", "The job requires coding, testing, and documenting the work.", "The job requires to code, testing, and documentation of the work.", "The job requires code, to test, and documenting the work."], answer: 1, explanation: "Items in a list should share the same form: coding, testing, documenting." },
  { prompt: "Choose the grammatically correct sentence.", options: ["Scarcely had the bell rung than the students rushed out.", "Scarcely had the bell rung when the students rushed out.", "Scarcely the bell had rung when the students rushed out.", "Scarcely did the bell rung when the students rushed out."], answer: 1, explanation: "“Scarcely” pairs with “when” and needs inversion: Scarcely had…" },
  { prompt: "Choose the grammatically correct sentence.", options: ["He is senior than me in the company.", "He is senior to me in the company.", "He is more senior than me in the company.", "He is senior from me in the company."], answer: 1, explanation: "Latin comparatives (senior, junior, superior, prior) take “to”, not “than”." },
  { prompt: "Choose the grammatically correct sentence.", options: ["Please discuss about the issue with your mentor.", "Please discuss the issue with your mentor.", "Please discuss on the issue with your mentor.", "Please discuss regarding the issue with your mentor."], answer: 1, explanation: "“Discuss” is transitive — no preposition after it." },
];

const BASE_FILL_BLANKS: Item[] = [
  { prompt: "Fill in the blank: The new policy will come into effect ___ 1 April.", options: ["from", "on", "since", "at"], answer: 1, explanation: "Use “on” with specific dates." },
  { prompt: "Fill in the blank: She has been unwell ___ last Monday.", options: ["for", "from", "since", "by"], answer: 2, explanation: "“Since” marks a starting point in time." },
  { prompt: "Fill in the blank: The committee could not reach a ___ decision after hours of debate.", options: ["unanimous", "anonymous", "unanimity", "unanimously"], answer: 0, explanation: "An adjective is needed before “decision”; “unanimous” means agreed by all." },
  { prompt: "Fill in the blank: The software update is ___ with older versions of the operating system.", options: ["compatible", "comparable", "compulsory", "complacent"], answer: 0, explanation: "“Compatible” means able to work together." },
  { prompt: "Fill in the blank: He was ___ of the risks but went ahead anyway.", options: ["aware", "awareness", "awake", "wary to"], answer: 0, explanation: "“Aware of” is the correct collocation." },
  { prompt: "Fill in the blank: The manager asked the team to ___ the proposal before Friday.", options: ["review", "revue", "reviewing", "reviewed"], answer: 0, explanation: "After “to” we need the base form: review." },
  { prompt: "Fill in the blank: Her explanation was so ___ that everyone understood it at once.", options: ["lucid", "lurid", "ludicrous", "lethargic"], answer: 0, explanation: "“Lucid” means clear and easy to understand." },
  { prompt: "Fill in the blank: The company ___ its profits in research every year.", options: ["invests", "invest", "investing", "investment"], answer: 0, explanation: "Singular subject “company” in present simple → invests." },
  { prompt: "Fill in the blank: You must ___ to the safety rules at all times.", options: ["adhere", "adapt", "adopt", "admit"], answer: 0, explanation: "“Adhere to” means follow strictly." },
  { prompt: "Fill in the blank: The two reports ___ on several key points.", options: ["differ", "defer", "deter", "differs"], answer: 0, explanation: "Plural subject; “differ” means be unlike. “Defer” means postpone." },
  { prompt: "Fill in the blank: I would rather you ___ the meeting tomorrow.", options: ["attended", "attend", "will attend", "attending"], answer: 0, explanation: "“Would rather + subject” is followed by the past tense for present/future meaning." },
  { prompt: "Fill in the blank: The intern was praised for her ___ attention to detail.", options: ["meticulous", "miscellaneous", "mediocre", "momentary"], answer: 0, explanation: "“Meticulous” means extremely careful and precise." },
  { prompt: "Fill in the blank: He apologised ___ being late.", options: ["for", "about", "of", "to"], answer: 0, explanation: "Apologise for something; apologise to someone." },
  { prompt: "Fill in the blank: By the time we reached, the presentation ___.", options: ["had started", "has started", "starts", "was starting to"], answer: 0, explanation: "An action completed before another past action → past perfect." },
  { prompt: "Fill in the blank: The bridge was closed because it was found to be ___.", options: ["unsafe", "insafe", "nonsafe", "disafe"], answer: 0, explanation: "The correct negative prefix for “safe” is “un-”." },
  { prompt: "Fill in the blank: The project failed due to a ___ of planning.", options: ["lack", "lake", "lacking", "lacks"], answer: 0, explanation: "“A lack of” is the correct noun phrase." },
  { prompt: "Fill in the blank: The speaker's argument was ___; nobody could find a flaw in it.", options: ["cogent", "cryptic", "callous", "candid"], answer: 0, explanation: "“Cogent” means clear, logical and convincing." },
  { prompt: "Fill in the blank: Neither of the two options ___ acceptable to the client.", options: ["is", "are", "were", "have been"], answer: 0, explanation: "“Neither of” is singular → is." },
  { prompt: "Fill in the blank: The results were ___ than we had expected.", options: ["better", "more better", "best", "more good"], answer: 0, explanation: "“Better” is already comparative; “more better” is a double comparative." },
  { prompt: "Fill in the blank: The CEO will ___ the new office next week.", options: ["inaugurate", "insinuate", "infuriate", "inundate"], answer: 0, explanation: "“Inaugurate” means formally open." },
];

const BASE_PARA_JUMBLES: { parts: string[]; first: string; explanation: string }[] = [
  { first: "Cloud computing has changed how companies run software.", parts: ["Instead of buying servers, they rent computing power on demand.", "This turns a large upfront cost into a monthly bill.", "As a result, even small start-ups can scale like large firms."], explanation: "The opening sentence introduces the change; A explains what changed, B explains the cost effect of A, and C gives the result." },
  { first: "Every year, thousands of students prepare for campus placements.", parts: ["Most of them begin by practising aptitude questions.", "Once they clear the test, they face technical interviews.", "The final step is usually an HR conversation."], explanation: "The sequence follows the order of the hiring process: test → technical → HR." },
  { first: "Bees play a vital role in agriculture.", parts: ["They carry pollen from one flower to another.", "This process helps plants produce fruits and seeds.", "Without bees, many crops would yield far less food."], explanation: "What bees do → why it matters → consequence of their absence." },
  { first: "The printing press transformed European society.", parts: ["Before it, books were copied by hand and were very expensive.", "Printing made books cheaper and far more common.", "Ideas could therefore spread faster than ever before."], explanation: "Situation before → change brought by printing → consequence." },
  { first: "Good code reviews make teams stronger.", parts: ["A reviewer spots bugs the author might have missed.", "In explaining the changes, the author also clarifies their own thinking.", "Over time, knowledge spreads across the whole team."], explanation: "Benefit to the code → benefit to the author → long-term benefit to the team." },
  { first: "Monsoon rains are crucial for India's economy.", parts: ["Nearly half of the farmland depends on rainfall rather than irrigation.", "A weak monsoon therefore reduces crop output.", "This, in turn, can push up food prices across the country."], explanation: "Cause (dependence on rain) → effect (lower output) → wider effect (prices)." },
  { first: "Learning a new language takes steady practice.", parts: ["At first, even simple sentences feel difficult.", "With daily use, common words begin to come naturally.", "Eventually, the learner can think directly in the new language."], explanation: "The sentences follow the learner's progress from beginning to fluency." },
  { first: "Electric vehicles are becoming more popular in cities.", parts: ["Their running cost per kilometre is lower than that of petrol cars.", "However, charging stations are still limited in many areas.", "Governments are therefore offering incentives to build more of them."], explanation: "Advantage → limitation (signalled by “However”) → response to the limitation (“therefore… more of them” refers to stations)." },
];

function paraJumble(seed: number): Question {
  const r = rng(seed);
  const item = PARA_JUMBLES[seed % PARA_JUMBLES.length];
  const labels = ["P", "Q", "R"];
  const shuffled = r.shuffle([0, 1, 2]); // shuffled[k] = index of original part shown with label k
  const correctSeq = [0, 1, 2].map((orig) => labels[shuffled.indexOf(orig)]).join("");
  const allSeqs = ["PQR", "PRQ", "QPR", "QRP", "RPQ", "RQP"];
  const wrong = r.shuffle(allSeqs.filter((s) => s !== correctSeq)).slice(0, 3);
  const options = r.shuffle([correctSeq, ...wrong]);
  return {
    kind: "mcq",
    prompt: `The first sentence is given. Arrange P, Q and R to form a coherent paragraph.\n1. ${item.first}\n${labels.map((l, k) => `${l}. ${item.parts[shuffled[k]]}`).join("\n")}`,
    options,
    answer: options.indexOf(correctSeq),
    explanation: `${item.explanation} Correct order: ${correctSeq}.`,
  };
}

/** word → [synonym, antonym, ...distractors that are neither] */
const VOCAB: [string, string, string, string[]][] = [
  ["Abundant", "Plentiful", "Scarce", ["Ancient", "Hidden", "Fragile"]],
  ["Candid", "Frank", "Evasive", ["Sweet", "Bright", "Rapid"]],
  ["Diligent", "Hardworking", "Lazy", ["Clever", "Gentle", "Silent"]],
  ["Obsolete", "Outdated", "Modern", ["Broken", "Costly", "Hidden"]],
  ["Benevolent", "Kind", "Cruel", ["Wealthy", "Wise", "Famous"]],
  ["Concise", "Brief", "Wordy", ["Correct", "Costly", "Polite"]],
  ["Lethargic", "Sluggish", "Energetic", ["Sick", "Angry", "Hungry"]],
  ["Transparent", "Clear", "Opaque", ["Empty", "Light", "Thin"]],
  ["Prudent", "Wise", "Reckless", ["Proud", "Quick", "Quiet"]],
  ["Hostile", "Unfriendly", "Friendly", ["Busy", "Distant", "Tired"]],
  ["Meagre", "Scanty", "Ample", ["Thin", "Rough", "Plain"]],
  ["Vivid", "Bright", "Dull", ["Loud", "Large", "Fast"]],
  ["Ambiguous", "Unclear", "Explicit", ["Large", "Ancient", "Rude"]],
  ["Frugal", "Thrifty", "Extravagant", ["Fragile", "Friendly", "Fruitful"]],
  ["Augment", "Increase", "Reduce", ["Argue", "Allow", "Admire"]],
  ["Hinder", "Obstruct", "Assist", ["Hide", "Hurry", "Follow"]],
  ["Elated", "Overjoyed", "Dejected", ["Elevated", "Surprised", "Tired"]],
  ["Tranquil", "Calm", "Agitated", ["Clear", "Cold", "Remote"]],
  ["Feasible", "Practicable", "Impossible", ["Festive", "Simple", "Costly"]],
  ["Arrogant", "Haughty", "Humble", ["Angry", "Brave", "Strict"]],
  ["Lucrative", "Profitable", "Unprofitable", ["Lucky", "Legal", "Large"]],
  ["Reluctant", "Unwilling", "Eager", ["Relaxed", "Sad", "Rude"]],
  ["Genuine", "Authentic", "Fake", ["General", "Gentle", "Generous"]],
  ["Expand", "Enlarge", "Contract", ["Explain", "Expose", "Expect"]],
  ["Mandatory", "Compulsory", "Optional", ["Manual", "Major", "Mature"]],
  ["Vague", "Hazy", "Precise", ["Vast", "Vain", "Valid"]],
  ["Commence", "Begin", "Conclude", ["Comment", "Combine", "Compete"]],
  ["Superficial", "Shallow", "Profound", ["Superior", "Special", "Smooth"]],
  ["Affluent", "Wealthy", "Poor", ["Fluent", "Afraid", "Active"]],
  ["Gregarious", "Sociable", "Reserved", ["Greedy", "Grateful", "Grave"]],
];

function vocabulary(seed: number): Question {
  const r = rng(seed);
  const [word, syn, ant, others] = VOCAB[seed % VOCAB.length];
  const askSyn = Math.floor(seed / VOCAB.length) % 2 === 0;
  return staticMcq(r, {
    prompt: `Choose the word most ${askSyn ? "similar" : "opposite"} in meaning to: ${word.toUpperCase()}`,
    options: askSyn ? [syn, ...others] : [ant, ...others],
    answer: 0,
    explanation: `${word} means ${syn.toLowerCase()}; its opposite is ${ant.toLowerCase()}.`,
  });
}

const BASE_PASSAGES: { text: string; qs: Item[] }[] = [
  {
    text: "Remote work was once seen as a perk offered by a few technology firms. Within a few years it became normal for millions of office workers. Supporters argue that it saves commuting time and lets companies hire talent from anywhere. Critics point out that junior employees, in particular, lose the informal learning that happens when they sit near experienced colleagues. Many organisations have therefore settled on a hybrid model, asking staff to come to the office on fixed days. The debate is no longer about whether remote work is possible, but about which kinds of work benefit from being together in person.",
    qs: [
      { prompt: "According to the passage, who loses the most from fully remote work?", options: ["Junior employees", "Senior managers", "Technology firms", "Recruiters"], answer: 0, explanation: "The passage says junior employees lose informal learning from experienced colleagues." },
      { prompt: "What is the main idea of the passage?", options: ["The question has shifted from whether remote work works to where it works best.", "Remote work should be banned for junior staff.", "Hybrid work is more expensive than remote work.", "Technology firms invented remote work."], answer: 0, explanation: "The final sentence states the central point: the debate is now about which work benefits from being in person." },
      { prompt: "The word “perk” in the passage most nearly means:", options: ["A benefit", "A rule", "A risk", "A salary"], answer: 0, explanation: "A perk is an extra benefit given by an employer." },
      { prompt: "Which of these is NOT given as an argument in favour of remote work?", options: ["It improves employee health.", "It saves commuting time.", "It allows hiring from anywhere.", "None of the above"], answer: 0, explanation: "Health is never mentioned; the other two are stated by supporters." },
    ],
  },
  {
    text: "Plastic was celebrated in the twentieth century because it was cheap, light and durable. Those same qualities now make it a problem. Because plastic does not break down easily, a bottle thrown away today may survive for centuries. Recycling helps, but only a small share of plastic waste is actually recycled; much of it is too mixed or too dirty to process. Some researchers are developing enzymes that can digest certain plastics, while others argue that the real solution is to produce less plastic in the first place.",
    qs: [
      { prompt: "Why does the author say plastic's qualities are now “a problem”?", options: ["Its durability means it persists in the environment.", "It has become too expensive.", "It is too heavy to transport.", "It breaks too easily."], answer: 0, explanation: "Plastic does not break down easily, so waste survives for centuries." },
      { prompt: "According to the passage, why is most plastic waste not recycled?", options: ["It is often too mixed or dirty to process.", "Recycling is illegal in many places.", "People prefer enzymes.", "Recycled plastic is too strong."], answer: 0, explanation: "Stated directly in the fourth sentence." },
      { prompt: "Which approach do some people consider the “real solution”?", options: ["Producing less plastic", "Building more recycling plants", "Burning plastic waste", "Using enzymes only"], answer: 0, explanation: "The last sentence: some argue the real solution is to produce less plastic." },
      { prompt: "The tone of the passage is best described as:", options: ["Balanced and informative", "Angry and accusing", "Humorous", "Strongly optimistic"], answer: 0, explanation: "It lays out benefits, problems and possible solutions without strong emotion." },
    ],
  },
  {
    text: "Sleep is often the first thing people give up when they are busy. Yet studies of memory suggest this is a poor trade. During deep sleep, the brain replays and strengthens what was learned during the day. Students who stay up all night before an exam may feel they have gained extra hours, but they often recall less than those who studied for fewer hours and slept well. Short naps can also help, though they are not a full substitute for a regular night's rest.",
    qs: [
      { prompt: "What does the brain do during deep sleep, according to the passage?", options: ["Strengthens what was learned", "Forgets unimportant facts only", "Stops all activity", "Creates new skills from nothing"], answer: 0, explanation: "The brain replays and strengthens the day's learning." },
      { prompt: "The phrase “a poor trade” refers to:", options: ["Giving up sleep to gain time", "Buying cheap books", "Taking short naps", "Studying in groups"], answer: 0, explanation: "It describes sacrificing sleep when busy." },
      { prompt: "Which statement would the author most likely agree with?", options: ["A rested student often remembers more than a sleepless one.", "Naps fully replace a night's sleep.", "All-night study is the best exam strategy.", "Memory has nothing to do with sleep."], answer: 0, explanation: "The passage contrasts sleepless students recalling less with well-rested ones." },
      { prompt: "What is said about short naps?", options: ["They help but are not a full substitute.", "They are harmful.", "They are better than night sleep.", "They have no effect."], answer: 0, explanation: "Stated in the final sentence." },
    ],
  },
  {
    text: "Small businesses in India have moved rapidly to digital payments. A street vendor who once accepted only cash may now display a QR code. For customers, the convenience is obvious. For vendors, digital records create a history of income that banks can use to judge whether to lend them money. However, the shift has also exposed new risks: fraudsters send fake payment screenshots, and some sellers lack the skills to spot them. Financial literacy, the author argues, must grow alongside digital adoption.",
    qs: [
      { prompt: "How do digital payments help vendors get loans?", options: ["They create an income history banks can assess.", "Banks give loans to anyone with a QR code.", "They remove the need for loans.", "They lower interest rates by law."], answer: 0, explanation: "Digital records create a history of income that banks can use." },
      { prompt: "What new risk does the passage mention?", options: ["Fake payment screenshots", "Higher cash theft", "Slow internet speeds", "Rising rent"], answer: 0, explanation: "Fraudsters send fake payment screenshots." },
      { prompt: "What does the author conclude?", options: ["Financial literacy must keep pace with digital adoption.", "Vendors should return to cash.", "QR codes should be banned.", "Banks should stop lending."], answer: 0, explanation: "The last sentence gives the author's conclusion." },
      { prompt: "The word “exposed” in the passage most nearly means:", options: ["Revealed", "Protected", "Reduced", "Ignored"], answer: 0, explanation: "The shift revealed (brought to light) new risks." },
    ],
  },
  {
    text: "When engineers design a bridge, they plan for loads far greater than it will normally carry. This extra capacity, called a safety factor, protects against errors in calculation, poor materials and unexpected events such as storms. Software engineers borrow a similar idea when they design systems to handle several times their expected traffic. Building in this margin costs more at first, but a failure — a collapsed bridge or a crashed website on its busiest day — usually costs far more.",
    qs: [
      { prompt: "What is a “safety factor”, as used in the passage?", options: ["Extra capacity beyond the normal load", "A rule that bans heavy vehicles", "A type of building material", "An insurance policy"], answer: 0, explanation: "It is defined as extra capacity beyond normal loads." },
      { prompt: "How do software engineers apply this idea?", options: ["By designing for several times the expected traffic", "By building bridges", "By avoiding storms", "By reducing costs to the minimum"], answer: 0, explanation: "Stated in the third sentence." },
      { prompt: "What argument does the passage make about cost?", options: ["The upfront cost of margin is smaller than the cost of failure.", "Safety margins are always wasteful.", "Failures are cheap to fix.", "Bridges cost less than websites."], answer: 0, explanation: "Margin costs more at first, but failure usually costs far more." },
      { prompt: "Which title best suits the passage?", options: ["Designing for the Unexpected", "The History of Bridges", "Why Websites Crash", "Storms and Their Effects"], answer: 0, explanation: "The passage is about building in a margin for unexpected loads across fields." },
    ],
  },
];

/** Questions per passage. RC_POOL is ordered passage by passage, so indices g*RC_GROUP… form one passage. */
const SENTENCE_CORRECTION = [...BASE_SENTENCE_CORRECTION, ...MORE_SENTENCE_CORRECTION];
const FILL_BLANKS = [...BASE_FILL_BLANKS, ...MORE_FILL_BLANKS];
const PARA_JUMBLES = [...BASE_PARA_JUMBLES, ...MORE_PARA_JUMBLES];
const PASSAGES = [...BASE_PASSAGES, ...MORE_PASSAGES];

export const RC_GROUP = 4;
export const RC_PASSAGES = PASSAGES.length;
const RC_POOL = PASSAGES.flatMap((p) => p.qs.map((q) => ({ passage: p.text, ...q })));

function readingComprehension(seed: number): Question {
  const r = rng(seed);
  const item = RC_POOL[seed % RC_POOL.length];
  return staticMcq(r, item);
}

const bankTopic = (items: Item[]) => (seed: number) => staticMcq(rng(seed), items[seed % items.length]);

export const verbalTopics: Topic[] = [
  { id: "v-rc", section: "verbal", label: "Reading Comprehension", weight: 4, targetSec: 60, poolSize: RC_POOL.length, generate: readingComprehension },
  { id: "v-correction", section: "verbal", label: "Sentence Correction", weight: 4, targetSec: 50, poolSize: SENTENCE_CORRECTION.length, generate: bankTopic(SENTENCE_CORRECTION) },
  { id: "v-fill", section: "verbal", label: "Fill in the Blanks & Grammar", weight: 4, targetSec: 40, poolSize: FILL_BLANKS.length, generate: bankTopic(FILL_BLANKS) },
  { id: "v-jumble", section: "verbal", label: "Para Jumbles", weight: 2, targetSec: 75, poolSize: PARA_JUMBLES.length, generate: paraJumble },
  { id: "v-vocab", section: "verbal", label: "Synonyms & Antonyms", weight: 2, targetSec: 30, poolSize: VOCAB.length * 2, generate: vocabulary },
];

export const ESSAY_PROMPTS = [
  "Should companies allow employees to work from home permanently? Give reasons for your view.",
  "Technology has made people more connected but less social. Do you agree?",
  "Describe a problem in your college or city and propose a practical solution.",
  "Is a college degree still necessary to build a successful career in technology?",
  "Write an email to your manager requesting two days of leave for a family event, explaining how your work will be covered.",
  "What are the advantages and disadvantages of using AI tools in education?",
  "Write about a time you worked in a team to solve a difficult problem. What did you learn?",
  "Should plastic bags be completely banned? Discuss with examples.",
  "Online learning versus classroom learning: which is more effective, and why?",
  "Describe the most important invention of the last 50 years and its impact on daily life.",
];
