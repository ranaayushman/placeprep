/**
 * Hard verbal tier for the GenC mocks: multi-rule grammar traps, precise collocations, advanced
 * vocabulary in context, spot-the-error and para jumbles. Original items; `answer` indexes `options`.
 */
import type { HardItem } from "./genc-hard";

const q = (prompt: string, options: string[], answer: number, explanation: string): HardItem => ({ prompt, options, answer, explanation });

const CS = (topic: string) => `Choose the grammatically correct sentence about ${topic}.`;
const REP = (s: string) => `Choose the best replacement for the quoted part of the sentence:\n${s}`;

export const HARD_CORRECTION: HardItem[] = [
  q(CS("the lab's samples"), ["The quality of the samples, as well as the speed of the tests, have improved since the new lab opened.", "The quality of the samples, as well as the speed of the tests, has improved since the new lab opened.", "The quality of the samples, as well as the speed of the tests, has improved since the new lab has opened.", "The quality of the samples, as well as the speed of the tests, have been improved since the new lab opened."], 1, "The subject is “the quality” (singular); “as well as …” does not add to it. “Since” marking a past point takes the simple past: “since the new lab opened”."),
  q(CS("the vendor"), ["Not only the vendor missed the deadline, but it also overcharged us.", "Not only did the vendor missed the deadline, but it also overcharged us.", "Not only did the vendor miss the deadline, but it also overcharged us.", "Not only had the vendor miss the deadline, but it also overcharged us."], 2, "A clause opening with “Not only” inverts with an auxiliary plus the base verb: “did the vendor miss”. “Did … missed” marks the past twice."),
  q(CS("the council's bridge"), ["It is high time the council repairs the bridge, which has been unsafe for years.", "It is high time the council has repaired the bridge, which has been unsafe for years.", "It is high time the council repaired the bridge, which is unsafe since years.", "It is high time the council repaired the bridge, which has been unsafe for years."], 3, "“It is high time” is followed by the past tense (“repaired”). A state lasting up to now takes the present perfect with “for”, never “is … since years”."),
  q(CS("a job offer"), ["I wish I accepted the offer last year.", "I wish I had accepted the offer last year.", "I wish I would have accepted the offer last year.", "I wish I have accepted the offer last year."], 1, "A wish about the past takes the past perfect: “I wish I had accepted”. “Would have” is never used after “wish” for one's own past action."),
  q(CS("Rohan"), ["Rohan is one of those analysts who never double-checks his figures.", "Rohan is one of those analysts who never double-check his figures.", "Rohan is one of those analysts who never double-check their figures.", "Rohan is one of those analysts that never double-checks their figures."], 2, "In “one of those analysts who …” the relative pronoun refers to “analysts”, so the verb and pronoun are plural: “double-check their figures”."),
  q(CS("Meera"), ["Meera is the only one of the trainees who have cleared all three rounds.", "Meera is the only one of the trainees who has cleared all three rounds.", "Meera is the only one of the trainee who has cleared all three rounds.", "Meera is the only one of the trainees whom has cleared all three rounds."], 1, "With “the only one of … who”, the relative clause describes the single person (“the only one”), so the verb is singular: “who has cleared”."),
  q(CS("Anita's report"), ["Having finished the report, the printer jammed before Anita could print it.", "Having finished the report, Anita found that the printer had jammed.", "Having finished the report, the printer had jammed when Anita tried to print it.", "Having been finished the report, Anita found that the printer had jammed."], 1, "The participle phrase must attach to the person who finished the report, so “Anita” must be the subject; the other versions make the printer finish the report or garble the participle."),
  q(CS("the new policy"), ["The new policy is aimed not only at reducing costs but also at improving morale.", "The new policy is aimed not only at reducing costs but also to improve morale.", "The new policy not only is aimed at reducing costs but also at improving morale.", "The new policy is aimed not only at reducing costs but also at improve morale."], 0, "Correlatives need parallel elements: “not only at reducing … but also at improving”. Misplacing “not only” or switching to an infinitive breaks the parallel."),
  q(CS("locking the lab"), ["Either the interns or the supervisor are responsible for locking the lab.", "Either the interns or the supervisor is responsible to lock the lab.", "Either the interns or the supervisor is responsible for locking the lab.", "Either the interns nor the supervisor is responsible for locking the lab."], 2, "With “either … or”, the verb agrees with the nearer subject (“the supervisor” → “is”). The collocation is “responsible for doing”, and “either” pairs with “or”, not “nor”."),
  q(CS("customer complaints"), ["This year there were less complaints than last year, although the number of users doubled.", "This year there were fewer complaints than last year, although the amount of users doubled.", "This year there were lesser complaints than last year, although the number of users doubled.", "This year there were fewer complaints than last year, although the number of users doubled."], 3, "Countable nouns take “fewer” and “number”; “less” and “amount” are for uncountable nouns. “Lesser” means smaller in importance, not in count."),
  q(CS("the committee"), ["The committee comprises of five members.", "The committee comprises five members.", "The committee is composed by five members.", "The committee consists five members."], 1, "“Comprise” takes a direct object with no “of”. The other verbs need prepositions: “is composed of”, “consists of”."),
  q("Choose the correct indirect form of: She said, “I will finish the draft tomorrow.”", ["She said that she would finish the draft the next day.", "She said that she will finish the draft the next day.", "She said that I would finish the draft the next day.", "She said that she would have finished the draft the next day."], 0, "A past reporting verb backshifts “will” to “would”, “tomorrow” becomes “the next day”, and “I” becomes “she”. Mixing “will” with “the next day” is inconsistent."),
  q("Choose the correct indirect form of: He asked me, “Have you submitted the form?”", ["He asked me whether had I submitted the form.", "He asked me that whether I had submitted the form.", "He asked me whether I had submitted the form.", "He asked me whether I have submitted the form?"], 2, "A reported yes/no question uses “whether/if”, statement word order, backshift (“had submitted”), no “that” and no question mark."),
  q(CS("the jury"), ["The jury has reached it's verdict and will announce it after lunch.", "The jury has reached its verdict and will announce it after lunch.", "The jury have reached its verdict and will announce it after lunch.", "The jury has reached its verdict and will announce them after lunch."], 1, "A collective noun treated as one unit takes a singular verb and the possessive “its” consistently. “It's” means “it is”; mixing “have” with “its” is inconsistent."),
  q(CS("the new rules"), ["The new rules will effect only those employees who joined after 2020.", "The new rules will have an affect only on those employees who joined after 2020.", "The new rules will affect only those employees whom joined after 2020.", "The new rules will affect only those employees who joined after 2020."], 3, "“Affect” is the verb (to influence) and “effect” the noun (or a verb meaning ‘bring about’). “Whom” cannot be the subject of “joined”."),
  q(CS("the audit"), ["Only after the audit was complete did the firm realise how much it had lost.", "Only after the audit was complete the firm realised how much it had lost.", "Only after the audit was complete did the firm realised how much it had lost.", "Only after was the audit complete did the firm realise how much it had lost."], 0, "“Only after …” at the start inverts the main clause (“did the firm realise”), not the time clause. After “did”, the verb stays in base form."),
  q(CS("the proposal"), ["Seldom I have seen a proposal so carefully argued.", "Seldom have I saw a proposal so carefully argued.", "Seldom have I seen a proposal so carefully argued.", "Seldom I have seen a so carefully argued proposal."], 2, "A negative adverb like “seldom” at the start forces inversion (“have I seen”), and the perfect needs the past participle “seen”, not “saw”."),
  q(CS("the laptops in the store"), ["Every one of the laptops in the store, including the two on display, were tested.", "Every one of the laptops in the store, including the two on display, was tested.", "Everyone of the laptops in the store, including the two on display, was tested.", "Every one of the laptop in the store, including the two on display, was tested."], 1, "“Every one of” is singular whatever comes between; it is written as two words when followed by “of”, and takes a plural noun (“laptops”)."),
  q(CS("the candidate"), ["The candidate whom we thought would win withdrew at the last minute.", "The candidate which we thought would win withdrew at the last minute.", "The candidate who we thought would win, withdrew at the last minute.", "The candidate who we thought would win withdrew at the last minute."], 3, "The pronoun is the subject of “would win” (“we thought he would win”), so “who” is correct; “we thought” is only an inserted clause. A comma must not separate subject from verb."),
  q(CS("the outage"), ["Had the team tested the code properly, the outage would not have happened.", "Had the team tested the code properly, the outage would not happen.", "If the team would have tested the code properly, the outage would not have happened.", "Had the team test the code properly, the outage would not have happened."], 0, "A past unreal condition uses “had + past participle” (or inverted “Had … tested”) with “would have + past participle”; “would” never goes in the if-clause."),
  q(CS("the documents"), ["The documents had laid on his desk for weeks before anyone noticed them.", "The documents had lain on his desk for weeks before anyone noticed them.", "The documents had lay on his desk for weeks before anyone noticed them.", "The documents had lied on his desk for weeks before anyone noticed them."], 1, "Intransitive “lie” (rest) goes lie–lay–lain. “Laid” belongs to transitive “lay”, and “lied” to “lie” meaning tell an untruth."),
  q(CS("the Pune office"), ["Our Pune office is larger than any office in the company.", "Our Pune office is more larger than any other office in the company.", "Our Pune office is larger than any other office in the company.", "Our Pune office is larger than all other office in the company."], 2, "Comparing one member with the rest of its own group needs “any other”; without “other” the office is compared with itself. “More larger” is a double comparative."),
  q(CS("Arjun"), ["Beside being a skilled coder, Arjun is an excellent mentor.", "Besides being a skilled coder, Arjun is excellent mentor.", "Besides to be a skilled coder, Arjun is an excellent mentor.", "Besides being a skilled coder, Arjun is an excellent mentor."], 3, "“Besides” means ‘in addition to’ and takes a gerund; “beside” means ‘next to’. A singular countable noun needs an article: “an excellent mentor”."),
  q(REP("Under no circumstances “employees should share” their passwords with anyone."), ["employees should share", "should employees share", "employees share", "do employees should share"], 1, "A negative phrase like “Under no circumstances” at the start requires inversion of the modal and subject: “should employees share”. Two auxiliaries (“do … should”) cannot combine."),
  q(REP("The reason he resigned “is because” he was overlooked for promotion."), ["is because", "is that", "was due to", "is due to that"], 1, "“The reason … is that …” is the formal pattern; “reason … because” is redundant, and “due to” cannot introduce a full clause."),
  q(REP("The list of approved vendors, along with their contact details, “were sent” to every branch."), ["were sent", "have been sent", "was sent", "were send"], 2, "The head noun is “list” (singular); neither “of approved vendors” nor “along with …” changes the number of the verb."),
  q(REP("The manager, “who's report” was criticised, defended it at the meeting."), ["who's report", "whom report", "who report", "whose report"], 3, "The possessive relative is “whose”; “who's” is a contraction of “who is/has”."),
  q(REP("The professor “made us to rewrite” the whole chapter."), ["made us to rewrite", "made us rewrite", "made us rewriting", "made us to have rewritten"], 1, "Active “make + object” takes a bare infinitive: “made us rewrite”. The “to” appears only in the passive (“we were made to rewrite”)."),
  q(REP("“Being a rainy day,” the match was postponed."), ["Being a rainy day,", "As being a rainy day,", "It being a rainy day,", "Since being a rainy day,"], 2, "Without its own subject the participle attaches to “the match”, which is not a rainy day. The absolute construction “It being a rainy day” supplies the subject."),
];

const FB = (s: string) => `Fill in the blank: ${s}`;
const FBS = (s: string) => `Fill in the blanks: ${s}`;

export const HARD_FILL: HardItem[] = [
  q(FBS("The success of the campaign was largely ___ to the volunteers, who worked ___ any pay."), ["due / without", "due / for", "because / without", "credit / without"], 0, "“Due to” works as a predicate after “was” (‘caused by’); people work “without” pay. “Because” needs “of”, and “credit” needs “a credit to”."),
  q(FBS("The new manager is averse ___ taking risks, which is why she insists ___ a detailed plan."), ["from / on", "to / on", "to / for", "against / in"], 1, "The collocations are “averse to” and “insist on”."),
  q(FBS("He was accused ___ leaking the data and charged ___ breach of contract."), ["for / with", "of / for", "of / with", "with / of"], 2, "One is “accused of” an act but “charged with” an offence; swapping the prepositions is the common trap."),
  q(FB("Hardly ___ the meeting begun when the fire alarm went off."), ["has", "did", "was", "had"], 3, "“Hardly … when” describes one past event just before another, so it takes the inverted past perfect: “Hardly had the meeting begun”."),
  q(FB("If the shipment ___ on time last week, we would not be facing these penalties now."), ["had arrived", "would have arrived", "has arrived", "would arrive"], 0, "A mixed conditional: an unreal past condition (“had arrived … last week”) with a present result (“would not be facing … now”). “Would” never goes in the if-clause."),
  q(FB("The professor's comments were meant to be constructive, but the student took them as a ___ on his ability."), ["reflex", "reflection", "deflection", "refraction"], 1, "“A reflection on” someone means something that suggests a fault in them; the other words are look-alikes with unrelated meanings."),
  q(FBS("Please ensure that the contract is signed ___ both parties ___ the end of the week."), ["from / by", "by / till", "by / by", "with / until"], 2, "The agent takes “by” (“signed by both parties”) and a deadline also takes “by”; “till/until” would wrongly mean the signing goes on up to that time."),
  q(FB("The committee was ___ in its decision: all twelve members voted in favour."), ["anonymous", "unilateral", "uniform", "unanimous"], 3, "“Unanimous” means everyone agreed. “Anonymous” means nameless and “unilateral” means decided by one side."),
  q(FB("Despite repeated warnings, he continued to ___ the safety protocols and was eventually dismissed."), ["flout", "flaunt", "float", "flounce"], 0, "To “flout” rules is to openly disregard them; “flaunt” means show off, a frequently confused look-alike."),
  q(FB("The report was so ___ that it covered every possible scenario."), ["exhausting", "exhaustive", "exhausted", "exhaustible"], 1, "“Exhaustive” means complete and thorough; “exhausting” means tiring and “exhausted” means tired out."),
  q(FB("The board will not ___ any deviation from the approved budget."), ["count", "encounter", "countenance", "counteract"], 2, "To “countenance” something is to permit or tolerate it; the other options do not fit with “any deviation”."),
  q(FB("The two firms decided to ___ their resources to bid for the contract."), ["pull", "poll", "pore", "pool"], 3, "To “pool” resources is to combine them; “pull”, “poll” and “pore” are sound-alikes with different meanings."),
  q(FBS("Each of the candidates ___ asked to bring ___ own laptop."), ["was / his or her", "were / his or her", "were / its", "was / its"], 0, "“Each of” takes a singular verb, and a pronoun for a person cannot be “its”."),
  q(FB("By the time the auditors arrive tomorrow, we ___ all the files."), ["will sort", "will have sorted", "would have sorted", "have sorted"], 1, "An action completed before a future point takes the future perfect: “will have sorted”. The time clause itself stays in the present (“arrive”)."),
  q(FB("The data on ___ the manager relied turned out to be outdated."), ["that", "whom", "which", "what"], 2, "After a preposition, a relative pronoun for a thing must be “which”; “that” cannot follow a preposition, and “whom” is for people."),
  q(FB("Not until the final whistle blew ___ that the team had qualified."), ["the players realised", "had the players realise", "did the players realised", "did the players realise"], 3, "When “Not until …” opens the sentence, the main clause inverts with “did + base verb”: “did the players realise”."),
  q(FBS("The manager congratulated her ___ her promotion and wished her success ___ her new role."), ["on / in", "on / at", "at / in", "with / in"], 0, "One congratulates someone “on” an achievement and wishes them success “in” a role."),
  q(FB("The new rules apply to all staff, ___ of seniority."), ["irregardless", "irrespective", "respective", "respectively"], 1, "“Irrespective of” means without regard to. “Irregardless” is non-standard, and “respective(ly)” means relating to each in turn."),
  q(FB("The speaker was ___ by the hostile question and paused for several seconds."), ["taken back", "taken abroad", "taken aback", "taken about"], 2, "The idiom for being startled is “taken aback”; “taken back” means returned or retracted."),
  q(FB("The proposal was rejected, not because it was expensive, ___ because it was impractical."), ["and", "rather", "or", "but"], 3, "“Not … but …” is the correlative pair that contrasts the rejected reason with the real one."),
  q(FB("This is the ___ of the two plans, so we will adopt it."), ["better", "best", "more better", "most good"], 0, "Comparing exactly two items takes the comparative: “the better of the two”."),
  q(FB("The ___ of the new policy will be felt mostly by small traders."), ["affects", "effects", "affection", "effectuation"], 1, "The noun meaning results is “effects”; “affect” is normally a verb."),
  q(FB("He has been ___ of the decision since it was announced, calling it short-sighted."), ["critic", "criticism", "critical", "criticising"], 2, "The pattern is the adjective “critical of”; “criticising” would take a direct object without “of”."),
  q(FB("Little ___ that the decision would cost him his job."), ["he knew", "he did know", "knew he", "did he know"], 3, "A negative adverb like “little” at the start triggers auxiliary inversion: “Little did he know”."),
  q(FB("She is one of the few people who ___ able to explain the theory without notes."), ["are", "is", "has been", "was"], 0, "“Who” refers to “people” (plural), so the verb is “are”; the present tense matches “is” in the main clause."),
  q(FBS("The prices of raw materials have risen ___ 12 per cent ___ last year."), ["with / since", "by / since", "by / for", "of / from"], 1, "A change is measured “by” an amount, and the present perfect counts from a starting point with “since”."),
];

const SYN = (w: string, s: string) => `Choose the word or phrase closest in meaning to “${w}” as used in the sentence:\n${s}`;
const ANT = (w: string, s: string) => `Choose the word most nearly OPPOSITE in meaning to “${w}” as used in the sentence:\n${s}`;

export const HARD_VOCAB: HardItem[] = [
  q(SYN("ostensibly", "The trip was ostensibly for research, but most of it was spent sightseeing."), ["seemingly", "genuinely", "secretly", "partly"], 0, "“Ostensibly” means apparently or on the surface; the “but” clause shows the stated purpose was not the real one."),
  q(SYN("laconic", "The CEO's laconic reply left the reporters wanting more."), ["rude", "terse", "evasive", "lengthy"], 1, "“Laconic” means using very few words. Being brief is not the same as dodging the question, so “evasive” is wrong."),
  q(SYN("diffident", "Her diffident manner hid a sharp mind."), ["different", "arrogant", "shy", "indifferent"], 2, "“Diffident” means lacking self-confidence. It is often confused with “different” and “indifferent”."),
  q(ANT("candid", "The witness gave a candid account of events."), ["frank", "detailed", "confused", "guarded"], 3, "“Candid” means open and frank, so its opposite is “guarded” (cautious, holding back)."),
  q(SYN("equanimity", "The new manager was known for her equanimity under pressure."), ["composure", "fairness", "anxiety", "equality"], 0, "“Equanimity” is calmness of mind. The “equ-” root tempts readers towards fairness or equality."),
  q(SYN("specious", "His explanation was specious, though it convinced many."), ["roomy", "misleadingly plausible", "thoroughly accurate", "unusually specific"], 1, "“Specious” means sounding right but actually false. “Roomy” is the meaning of the look-alike “spacious”."),
  q(ANT("salutary", "The policy had a salutary effect on the company's finances."), ["beneficial", "welcoming", "harmful", "temporary"], 2, "“Salutary” means beneficial, so its opposite is “harmful”. “Welcoming” comes from confusing it with “salute”."),
  q(SYN("mitigate", "The committee tried to mitigate the damage caused by the leak."), ["fight against", "exaggerate", "measure", "lessen"], 3, "To “mitigate” is to make less severe. “Fight against” is the meaning of the often-confused “militate”."),
  q(SYN("obviate", "The lawyer sought to obviate the need for a trial by settling early."), ["prevent", "make obvious", "postpone", "justify"], 0, "To “obviate” a need is to remove or prevent it; it has nothing to do with “obvious”."),
  q(SYN("apposite", "The professor's remarks were apposite to the discussion."), ["opposite", "relevant", "contrary", "excessive"], 1, "“Apposite” means apt or relevant. The near-spelling of “opposite” is the trap."),
  q(ANT("perfunctory", "He gave the report a perfunctory glance before signing it."), ["careless", "quick", "thorough", "official"], 2, "“Perfunctory” means done hastily and without care, so its opposite is “thorough”. “Careless” and “quick” are near-synonyms."),
  q(SYN("sanguine", "The startup's founder was sanguine about the next round of funding."), ["anxious", "angry", "secretive", "optimistic"], 3, "“Sanguine” means hopeful or optimistic about the future."),
  q(SYN("promulgated", "The new rules were promulgated last month."), ["officially announced", "secretly drafted", "repealed", "widely criticised"], 0, "To “promulgate” is to make a law or rule known publicly and officially."),
  q(ANT("prolix", "The speaker's prolix style lost the audience."), ["wordy", "concise", "loud", "confusing"], 1, "“Prolix” means tediously long-winded, so its opposite is “concise”; “wordy” is a synonym."),
  q(SYN("complicit", "Two officials were accused of being complicit in the fraud."), ["complex", "complacent", "involved", "ignorant"], 2, "“Complicit” means involved with others in wrongdoing. “Complex” and “complacent” are sound-alike traps."),
  q(SYN("at variance", "The two accounts of the meeting were at variance."), ["in agreement", "under review", "of different lengths", "in disagreement"], 3, "“At variance” means in conflict or disagreement."),
  q(ANT("conciliatory", "The manager's tone during the dispute was conciliatory."), ["antagonistic", "appeasing", "conclusive", "concise"], 0, "“Conciliatory” means trying to calm or pacify; its opposite is “antagonistic”. “Appeasing” is a synonym."),
  q(SYN("glossed over", "The report glossed over the inconsistencies in the data."), ["explained in detail", "dealt with briefly to avoid attention", "highlighted", "corrected"], 1, "To “gloss over” something is to treat it quickly or superficially so that it escapes notice."),
  q(SYN("inveterate", "Her inveterate optimism sometimes annoyed her colleagues."), ["pretended", "occasional", "long-established", "inventive"], 2, "“Inveterate” describes a habit or feeling that is firmly established and unlikely to change; “inventive” is a sound-alike."),
  q(ANT("parsimonious", "The new finance head is known to be parsimonious."), ["stingy", "precise", "talkative", "generous"], 3, "“Parsimonious” means extremely unwilling to spend; its opposite is “generous”. “Stingy” is a synonym."),
  q(SYN("equivocal", "The diplomat's response was deliberately equivocal."), ["ambiguous", "equal", "firm", "hostile"], 0, "“Equivocal” means open to more than one interpretation, often to avoid commitment."),
];

const ERR = "The sentence is split into four parts. Choose the part that contains an error.";
const error = (parts: [string, string, string, string], answer: number, explanation: string): HardItem => ({ prompt: `${ERR}\n${parts.map((p, i) => `(${"ABCD"[i]}) ${p}`).join(" ")}`, options: parts.map((p, i) => `(${"ABCD"[i]}) ${p}`), answer, explanation });

export const HARD_ERROR: HardItem[] = [
  error(["The list of items", "that were damaged in transit", "have been sent", "to the insurer."], 2, "The subject is “the list” (singular): “has been sent”. “Were damaged” is right because it agrees with “items”."),
  error(["Not only the supplier delayed", "the shipment, but it", "also refused", "to refund the advance."], 0, "A sentence opening with “Not only” needs inversion: “Not only did the supplier delay”."),
  error(["He is one of those managers", "who believes", "that discipline matters", "more than talent."], 1, "“Who” refers to “managers” (plural): “who believe”."),
  error(["The quality of the", "products manufactured", "at the new plant are", "better than expected."], 2, "The subject is “quality” (singular), not “products”: “is better”."),
  error(["Every one of", "the engineers and", "designers have", "signed the agreement."], 2, "“Every one of” is singular however long the noun phrase after it: “has signed”."),
  error(["If I would have", "known about the strike,", "I would have", "taken the earlier train."], 0, "A past unreal condition uses “had known” in the if-clause, never “would have”."),
  error(["The reason for", "the delay is because", "the vendor shipped", "the wrong parts."], 1, "“The reason … is because” is redundant; use “is that”."),
  error(["She hardly", "never takes", "a day off,", "even when unwell."], 1, "“Hardly” is already negative, so “hardly never” is a double negative: “hardly ever takes”."),
  error(["Neither the CEO", "nor the directors", "was willing", "to comment on the deal."], 2, "With “neither … nor”, the verb agrees with the nearer subject (“the directors”): “were willing”."),
  error(["Of all the proposals", "we received,", "hers was", "the more practical."], 3, "When more than two are compared, use the superlative: “the most practical”."),
  error(["He insisted", "to see", "the manager", "before leaving."], 1, "“Insist” takes “on” + gerund: “insisted on seeing”."),
  error(["There are", "less vacancies", "this year than", "there were last year."], 1, "“Vacancies” is countable: “fewer vacancies”."),
  error(["The data", "that was collected", "by the team", "comprises of three surveys."], 3, "“Comprise” takes a direct object without “of”: “comprises three surveys” (or “consists of”)."),
  error(["Each of the", "laptops issued to", "new joiners come", "with a two-year warranty."], 2, "The subject is “each” (singular), so the verb is “comes”."),
  error(["He", "has submitted", "the report", "yesterday evening."], 1, "A finished past time (“yesterday evening”) takes the simple past, not the present perfect: “submitted”."),
  error(["Hardly anybody", "in the department", "know how", "the new tool works."], 2, "“Anybody” is singular: “knows how”."),
  error(["The manager asked", "me where", "was I going", "with the files."], 2, "A reported question uses statement order: “where I was going”."),
  error(["I look forward", "to work", "with you", "on this project."], 1, "In “look forward to”, “to” is a preposition, so it takes a gerund: “to working”."),
  error(["She was", "angry on me", "for missing", "the deadline."], 1, "One is “angry with” a person; “angry on” is not standard English."),
];

const jumble = (lines: string[], options: string[], answer: number, explanation: string): HardItem => ({
  prompt: `Arrange the sentences ${lines.map((_, i) => "PQRST"[i]).join(", ")} to form a coherent paragraph.\n${lines.map((l, i) => `${"PQRST"[i]}. ${l}`).join("\n")}`,
  options, answer, explanation,
});

export const HARD_JUMBLE: HardItem[] = [
  jumble([
    "John Snow, however, suspected the water, and he mapped every death in the area.",
    "In 1854, a cholera outbreak killed hundreds of people in a single London neighbourhood.",
    "The map showed the deaths clustered around one public pump, whose handle was then removed.",
    "Most doctors at the time blamed the disease on foul air.",
  ], ["QSPR", "QPSR", "SQPR", "QSRP"], 0, "Q sets the scene and S's “at the time” needs it. P's “however” contrasts with S's foul-air theory, and R's “The map” needs P's mapping."),
  jumble([
    "At first, orders came only from regular customers who lived nearby.",
    "Today, online sales account for more than half of their income.",
    "A small bakery began selling its bread online during the lockdown.",
    "Within months, however, word spread, and the owners had to hire two delivery riders.",
  ], ["RSPQ", "RPSQ", "PRSQ", "RPQS"], 1, "The sequence is introduction (R), “At first” (P), “Within months, however” (S), then “Today” (Q)."),
  jumble([
    "To fix this, the team wrote automated tests for the most-used features.",
    "As a result, testing takes hours instead of weeks, and fewer bugs reach customers.",
    "This took nearly two weeks and still let many bugs slip through.",
    "Every software release at the firm used to be tested manually.",
    "These tests now run every time a developer pushes code.",
  ], ["SPRTQ", "SRTPQ", "SRPTQ", "RSPTQ"], 2, "S states the old practice, R's “This” refers to it, P's “To fix this” answers R, T's “These tests” refers to P, and Q gives the result."),
  jumble([
    "The term caught on so quickly that within a decade it had entered many languages.",
    "It comes from a Czech word for forced labour, which suits the play's plot.",
    "The word “robot” first appeared in a 1920 play by the Czech writer Karel Čapek.",
    "In that plot, artificial workers built in a factory eventually rebel against their makers.",
  ], ["RSQP", "QRSP", "RQPS", "RQSP"], 3, "R introduces the word, Q's “It” refers back to “the word” and mentions the plot, S's “In that plot” needs Q, and P describes how the term spread afterwards."),
  jumble([
    "In fact, there is little evidence for this.",
    "But these effects are temporary and disappear after rest.",
    "Reading in poor light can certainly cause strain and headaches.",
    "Many people believe that reading in dim light damages the eyes.",
  ], ["SPRQ", "SRPQ", "PSRQ", "SPQR"], 0, "S states the belief, P (“In fact … this”) rejects it, R concedes a short-term effect, and Q (“But these effects”) limits that concession."),
  jumble([
    "Arun joined the company as a trainee straight out of college.",
    "She offered him a role building the firm's new data platform, which he accepted.",
    "Two years later, he was leading a small team of developers.",
    "His success there caught the attention of the head of the cloud division.",
  ], ["PRQS", "PRSQ", "RPSQ", "PSRQ"], 1, "Chronology runs joining (P), “Two years later” (R), the success that got noticed (S), then “She”, the division head from S (Q)."),
  jumble([
    "Bamboo is technically a grass, not a tree.",
    "This rapid growth makes it a promising replacement for timber in construction.",
    "Builders, however, must first treat it, since untreated bamboo is easily attacked by insects.",
    "Some species can grow nearly a metre in a single day.",
  ], ["PQSR", "SPQR", "PSQR", "PSRQ"], 2, "P names the subject, S's “Some species” refers to bamboo, Q's “This rapid growth” needs S, and R's “however” qualifies Q's claim."),
  jumble([
    "Gradually, though, the quieter streets began to attract more pedestrians.",
    "When the city introduced a congestion charge, shop owners in the centre protested.",
    "By the end of the year, most shops reported higher sales than before the charge.",
    "For the first few months, their fears seemed justified, as footfall dropped.",
    "They feared that fewer shoppers would come into town.",
  ], ["QSTPR", "QTPSR", "TQSPR", "QTSPR"], 3, "Q introduces the shop owners, T (“They feared”) refers to them, S's “their fears” needs T, P's “Gradually, though” reverses S, and R closes the year."),
  jumble([
    "Such a phrase is also far easier to remember than a jumble of symbols.",
    "A good password is long rather than merely complicated.",
    "Length, then, offers both security and convenience.",
    "A phrase of four random words, for example, is harder to crack than a short string of symbols.",
  ], ["QPSR", "QSPR", "SQPR", "QSRP"], 1, "Q makes the claim, S gives an example, P's “Such a phrase … also” builds on S, and R's “then” concludes."),
  jumble([
    "Shorter routes are completed faster, so their trails are reinforced more often.",
    "Computer scientists have borrowed this idea to solve routing problems.",
    "Ants leave chemical trails as they travel between their nest and a food source.",
    "Over time, the colony therefore settles on the shortest path.",
    "Other ants follow these trails and reinforce them with their own chemicals.",
  ], ["RPTSQ", "RTPSQ", "RTSPQ", "TRPSQ"], 1, "R introduces trails, T's “these trails” refers to R, P explains why shorter trails win, S's “therefore” concludes from P, and Q applies “this idea”."),
  jumble([
    "The chairperson decided to wait a little longer rather than cancel.",
    "The meeting had been scheduled for ten o'clock.",
    "By half past ten, however, only three of the eight members had arrived.",
    "Her patience was rewarded when the rest arrived together, delayed by the same traffic jam.",
  ], ["QPRS", "RQPS", "QRPS", "QRSP"], 2, "Q gives the schedule, R's “however” contrasts with it, P is the chairperson's reaction, and S's “Her patience” refers to P's waiting."),
  jumble([
    "As import taxes fell in the following century, tea became an everyday drink for all classes.",
    "They kept their tea leaves in locked wooden boxes called caddies.",
    "Tea reached Britain in the seventeenth century.",
    "At first it was so expensive that only the wealthy could afford it.",
  ], ["RQSP", "SRQP", "RSPQ", "RSQP"], 3, "R introduces tea, S's “At first” follows, Q's “They” refers to S's “the wealthy”, and P's “in the following century” moves the story forward."),
  jumble([
    "Shortly after submitting everything, she was called for an interview.",
    "The application required an essay, two references and a research proposal.",
    "A week after it, she received an email offering her the scholarship.",
    "Priya applied for a scholarship to study abroad.",
    "She finished the essay quickly, but the proposal took her nearly a month.",
  ], ["SQTPR", "SQPTR", "STQPR", "QSTPR"], 0, "S introduces Priya, Q lists the requirements, T works through them, P's “submitting everything” follows T, and R's “after it” refers to P's interview."),
  jumble([
    "Early telephones had no dials.",
    "This arrangement lasted until automatic exchanges made operators unnecessary for most calls.",
    "Instead, a caller lifted the receiver and spoke to an operator at the exchange.",
    "The operator then connected the call by plugging a cable into the right socket.",
  ], ["PSRQ", "PRSQ", "RPSQ", "PRQS"], 1, "R's “Instead” follows P's “no dials”, S's “The operator then” continues R, and Q's “This arrangement” sums up R and S."),
  jumble([
    "They continue doing the work they were good at instead of helping their team do it.",
    "The result is that they are overworked while their team members feel ignored.",
    "The fix is to delegate, even when doing the task oneself seems quicker.",
    "Many first-time managers make the same mistake.",
  ], ["SQPR", "PSQR", "SPQR", "SPRQ"], 2, "S announces a mistake, P's “They” describes it, Q gives “The result”, and R offers “The fix”."),
];
