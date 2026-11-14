/**
 * Verbal types seen in the Deloitte NLA (Cyber Gurukul · Analyst Trainee) paper beyond the Infosys
 * style banks: spot-the-error (sentence split into four parts), active/passive voice and one-word
 * substitution. Original items; `answer` indexes `options`.
 */
type Item = { prompt: string; options: string[]; answer: number; explanation: string };

const ERR = "The sentence is split into four parts. Choose the part that contains an error.";
const error = (parts: [string, string, string, string], answer: number, explanation: string): Item => ({ prompt: `${ERR}\n${parts.map((p, i) => `(${"ABCD"[i]}) ${p}`).join(" ")}`, options: parts.map((p, i) => `(${"ABCD"[i]}) ${p}`), answer, explanation });

export const ERROR_SPOTTING: Item[] = [
  error(["The moral duty of a doctor", "is being cure", "his patients", "as quickly as possible."], 1, "The infinitive is needed: “is to cure”."),
  error(["Neither of the two candidates", "have submitted", "their documents", "before the deadline."], 1, "“Neither of” takes a singular verb: “has submitted”."),
  error(["She is one of the few students", "who has completed", "the assignment", "without any help."], 1, "“Who” refers to “students” (plural): “who have completed”."),
  error(["The committee", "has been discussing about", "the new proposal", "since morning."], 1, "“Discuss” takes a direct object; drop “about”."),
  error(["He asked me", "that where", "I was going", "so late at night."], 1, "An indirect question does not take “that”: “He asked me where I was going”."),
  error(["Each of the players", "were given", "a new jersey", "before the final match."], 1, "“Each of” is singular: “was given”."),
  error(["I prefer", "reading novels", "than", "watching films."], 2, "“Prefer” pairs with “to”, not “than”: prefer reading to watching."),
  error(["The teacher,", "along with her students,", "were present", "at the function."], 2, "“Along with” does not change the subject; “the teacher” is singular: “was present”."),
  error(["He has been working", "in this company", "since", "five years."], 2, "A duration takes “for”: “for five years”. “Since” marks a starting point."),
  error(["Although he was tired,", "but he continued", "working", "till midnight."], 1, "“Although” and “but” cannot be used together; drop “but”."),
  error(["One of my friend", "lives in Pune", "and works", "for a software company."], 0, "“One of” takes a plural noun: “one of my friends”."),
  error(["The police", "has arrested", "the suspects", "within two hours."], 1, "“Police” is plural: “have arrested”."),
  error(["Please return back", "the book", "to the library", "by Monday."], 0, "“Return” already means give back; “return back” is redundant."),
  error(["She is senior", "than me", "in the office", "by three years."], 1, "“Senior” takes “to”: “senior to me”."),
  error(["The furnitures", "in the new office", "were delivered", "yesterday."], 0, "“Furniture” is uncountable and has no plural: “The furniture … was delivered”."),
  error(["Hardly had he", "reached the station", "than the train", "left the platform."], 2, "“Hardly … when”, not “than”: “when the train left”."),
  error(["The number of students", "applying for the course", "have increased", "this year."], 2, "“The number of” is singular: “has increased”."),
  error(["My brother", "is elder", "than me", "by two years."], 1, "“Elder” is not used with “than”; use “older than me”."),
];

const VOICE_P = (s: string) => `Choose the correct passive form of: “${s}”`;
const VOICE_A = (s: string) => `Choose the correct active form of: “${s}”`;

export const VOICE: Item[] = [
  { prompt: VOICE_P("My coach is advising me about the game plan."), options: ["I am being advised by my coach about the game plan.", "I was advised by my coach about the game plan.", "I had been advised by my coach about the game plan.", "I am advised by my coach about the game plan."], answer: 0, explanation: "Present continuous → am/is/are + being + past participle." },
  { prompt: VOICE_P("The company launched a new product last week."), options: ["A new product was launched by the company last week.", "A new product has been launched by the company last week.", "A new product is launched by the company last week.", "A new product had been launched by the company last week."], answer: 0, explanation: "Simple past → was/were + past participle." },
  { prompt: VOICE_P("Someone has stolen my laptop."), options: ["My laptop has been stolen.", "My laptop was being stolen.", "My laptop had been stolen.", "My laptop is stolen by someone."], answer: 0, explanation: "Present perfect → has/have been + past participle; “someone” is dropped." },
  { prompt: VOICE_P("They will complete the project by June."), options: ["The project will be completed by June.", "The project will have completed by June.", "The project is completed by June.", "The project would be completed by June."], answer: 0, explanation: "Simple future → will be + past participle." },
  { prompt: VOICE_P("The manager is reviewing the applications."), options: ["The applications are being reviewed by the manager.", "The applications are reviewed by the manager.", "The applications were being reviewed by the manager.", "The applications have been reviewed by the manager."], answer: 0, explanation: "Present continuous → are being + past participle." },
  { prompt: VOICE_P("People speak English all over the world."), options: ["English is spoken all over the world.", "English was spoken all over the world.", "English is being spoken all over the world.", "English has been spoken all over the world."], answer: 0, explanation: "Simple present → is/are + past participle; the vague agent “people” is dropped." },
  { prompt: VOICE_P("Who wrote this report?"), options: ["By whom was this report written?", "By whom this report was written?", "Who was this report written?", "By whom is this report written?"], answer: 0, explanation: "“Who” becomes “by whom”, and the simple past becomes “was written”." },
  { prompt: VOICE_A("The letters were posted by the clerk yesterday."), options: ["The clerk posted the letters yesterday.", "The clerk had posted the letters yesterday.", "The clerk has posted the letters yesterday.", "The clerk was posting the letters yesterday."], answer: 0, explanation: "Simple past passive → simple past active." },
  { prompt: VOICE_P("The students had submitted the assignments before the deadline."), options: ["The assignments had been submitted by the students before the deadline.", "The assignments were submitted by the students before the deadline.", "The assignments have been submitted by the students before the deadline.", "The assignments had submitted by the students before the deadline."], answer: 0, explanation: "Past perfect → had been + past participle." },
  { prompt: VOICE_P("Close the door."), options: ["Let the door be closed.", "The door is closed.", "Let the door close.", "The door should close."], answer: 0, explanation: "An imperative becomes “Let + object + be + past participle”." },
  { prompt: VOICE_A("She was being interviewed by the panel when the lights went out."), options: ["The panel was interviewing her when the lights went out.", "The panel interviewed her when the lights went out.", "The panel had interviewed her when the lights went out.", "The panel has been interviewing her when the lights went out."], answer: 0, explanation: "Past continuous passive → past continuous active." },
  { prompt: VOICE_P("We must respect our elders."), options: ["Our elders must be respected.", "Our elders must respect us.", "Our elders are must respected.", "Our elders must have respected."], answer: 0, explanation: "Modal + verb → modal + be + past participle." },
  { prompt: VOICE_A("The new policy has been approved by the board."), options: ["The board has approved the new policy.", "The board approved the new policy.", "The board had approved the new policy.", "The board is approving the new policy."], answer: 0, explanation: "Present perfect passive → present perfect active." },
  { prompt: VOICE_P("The teacher will have checked the papers by Monday."), options: ["The papers will have been checked by the teacher by Monday.", "The papers will be checked by the teacher by Monday.", "The papers would have been checked by the teacher by Monday.", "The papers will have checked by the teacher by Monday."], answer: 0, explanation: "Future perfect → will have been + past participle." },
];

const OW = (phrase: string) => `Choose the one word that best replaces the phrase: “${phrase}”`;

export const ONE_WORD: Item[] = [
  { prompt: OW("unable to be avoided or escaped"), options: ["Inevitable", "Thrilling", "Bewildering", "Overwhelming"], answer: 0, explanation: "Inevitable: certain to happen; unavoidable." },
  { prompt: OW("a person who speaks many languages"), options: ["Polyglot", "Bilingual", "Monolingual", "Orator"], answer: 0, explanation: "Polyglot: knowing or using several languages. Bilingual means two." },
  { prompt: OW("a government elected by the people"), options: ["Democracy", "Monarchy", "Oligarchy", "Autocracy"], answer: 0, explanation: "Democracy: rule by the people, usually through elected representatives." },
  { prompt: OW("one who does not believe in the existence of God"), options: ["Atheist", "Theist", "Pagan", "Pilgrim"], answer: 0, explanation: "Atheist: a person who believes there is no God." },
  { prompt: OW("a place where bees are kept"), options: ["Apiary", "Aviary", "Aquarium", "Granary"], answer: 0, explanation: "Apiary: a place where bees are kept. An aviary holds birds." },
  { prompt: OW("handwriting that cannot be read"), options: ["Illegible", "Ineligible", "Illegal", "Illicit"], answer: 0, explanation: "Illegible: not clear enough to be read. Ineligible means not qualified." },
  { prompt: OW("a person who is new to a job or activity"), options: ["Novice", "Veteran", "Expert", "Mentor"], answer: 0, explanation: "Novice: a beginner." },
  { prompt: OW("a short story, often with animals, that teaches a moral"), options: ["Fable", "Legend", "Epic", "Memoir"], answer: 0, explanation: "Fable: a short tale with a moral, typically with animal characters." },
  { prompt: OW("lasting for a very short time"), options: ["Ephemeral", "Eternal", "Perennial", "Permanent"], answer: 0, explanation: "Ephemeral: short-lived." },
  { prompt: OW("one who always looks at the bright side of things"), options: ["Optimist", "Pessimist", "Realist", "Cynic"], answer: 0, explanation: "Optimist: a person who expects good outcomes." },
  { prompt: OW("a speech made without any preparation"), options: ["Extempore", "Rehearsed", "Soliloquy", "Monologue"], answer: 0, explanation: "Extempore: spoken without preparation." },
  { prompt: OW("a person who works for the welfare of humanity"), options: ["Philanthropist", "Misanthrope", "Patriot", "Anthropologist"], answer: 0, explanation: "Philanthropist: one who donates time or money to help others." },
  { prompt: OW("the killing of one's brother"), options: ["Fratricide", "Homicide", "Patricide", "Genocide"], answer: 0, explanation: "Fratricide: killing one's brother. Patricide is killing one's father." },
  { prompt: OW("an abnormal fear of heights"), options: ["Acrophobia", "Claustrophobia", "Hydrophobia", "Xenophobia"], answer: 0, explanation: "Acrophobia: fear of heights. Claustrophobia is fear of enclosed spaces." },
  { prompt: OW("a list of the books in a library"), options: ["Catalogue", "Glossary", "Almanac", "Manuscript"], answer: 0, explanation: "Catalogue: a systematic list, such as of a library's books." },
  { prompt: OW("a person who eats too much"), options: ["Glutton", "Gourmet", "Vegan", "Ascetic"], answer: 0, explanation: "Glutton: an excessive eater. A gourmet is a connoisseur of food." },
  { prompt: OW("that which cannot be corrected"), options: ["Incorrigible", "Incredible", "Invincible", "Indelible"], answer: 0, explanation: "Incorrigible: not able to be corrected or reformed." },
  { prompt: OW("a person who sacrifices his or her life for a cause"), options: ["Martyr", "Traitor", "Mercenary", "Hermit"], answer: 0, explanation: "Martyr: one who dies or suffers for a belief or cause." },
];
