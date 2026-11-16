import type { HardItem } from "./genc-hard";

// Every answer recomputed by a script (answer key, and no distractor equal to it) before being written here.
export const HARD_ALPHA: HardItem[] = [
  {"prompt": "Find the next term of the series.", "options": ["T", "S", "N", "U"], "answer": 0, "explanation": "Two series alternate: B, E, I, N (+3, +4, +5, so next +6 = T) and Z, W, T, Q (−3 each). The 9th term belongs to the first series: T.", "code": "B, Z, E, W, I, T, N, Q, ?"},
  {"prompt": "Find the next term of the series.", "options": ["OL", "OK", "NL", "PL"], "answer": 0, "explanation": "First letters A, C, F, J move +2, +3, +4, so next +5 = O; second letters Z, X, U, Q move −2, −3, −4, so next −5 = L.", "code": "AZ, CX, FU, JQ, ?"},
  {"prompt": "If every letter is given the value of its position counted from the right end of the English alphabet (Z = 1, A = 26), what is the total value of the word CODE?", "options": ["81", "27", "79", "83"], "answer": 0, "explanation": "From the right, C = 24, O = 12, D = 23 and E = 22, totalling 81 (equivalently 4 × 27 − (3 + 15 + 4 + 5) = 108 − 27)."},
  {"prompt": "The second half of the English alphabet (N to Z) is written in reverse order while the first half stays as it is. Which letter is 5th to the right of the 10th letter from the right end?", "options": ["R", "V", "M", "U"], "answer": 0, "explanation": "The row becomes A … M Z Y X … N. The 10th from the right is position 17, which is now W; 5 to its right is position 22, which is now R."},
  {"prompt": "The first thirteen letters of the English alphabet are written in reverse order and the rest are left unchanged. Which letter is 7th to the left of the 20th letter from the left end?", "options": ["A", "M", "G", "N"], "answer": 0, "explanation": "The 20th letter is still T (second half unchanged). 7 to its left is position 13, which in the reversed first half (M L K … A) holds A."},
  {"prompt": "Every letter whose position in the English alphabet is a multiple of 3 is removed. In the letters that remain, which one is 10th from the right end?", "options": ["M", "N", "K", "P"], "answer": 0, "explanation": "Removing C, F, I, L, O, R, U, X leaves 18 letters: A B D E G H J K M N P Q S T V W Y Z. The 10th from the right is the 9th from the left: M."},
  {"prompt": "Find the next term of the series.", "options": ["Z", "Y", "X", "A"], "answer": 0, "explanation": "Positions 1, 2, 5, 10, 17 increase by 1, 3, 5, 7, so the next increase is 9: 17 + 9 = 26 = Z.", "code": "A, B, E, J, Q, ?"},
  {"prompt": "Find the next term of the series (the alphabet wraps from Z back to A).", "options": ["X", "W", "Y", "V"], "answer": 0, "explanation": "The steps are +3, +4, +5, +6 (Y → B wraps past Z), so the next is +7: Q (17) + 7 = 24 = X.", "code": "Y, B, F, K, Q, ?"},
  {"prompt": "Find the next term of the series (the alphabet wraps from Z back to A).", "options": ["QVA", "QVZ", "PVA", "QWA"], "answer": 0, "explanation": "The first letters move +5 (B, G, L, Q), the second +6 (D, J, P, V) and the third +7 (F, M, T, then 20 + 7 = 27 → A).", "code": "BDF, GJM, LPT, ?"},
  {"prompt": "Three of the following letter groups follow the same rule. Which group is the odd one out?", "options": ["KOM", "BYD", "EVG", "HSJ"], "answer": 0, "explanation": "In each group the 2nd letter is the alphabet-opposite of the 1st (positions add to 27) and the 3rd is two after the 1st. K's opposite is P, not O, so KOM breaks the rule."},
  {"prompt": "In a code, each letter is first replaced by its alphabet-opposite (A ↔ Z, B ↔ Y, …) and the result is then moved two places forward. How is GENC written in this code?", "options": ["VXOZ", "TVMX", "VXNZ", "UXOZ"], "answer": 0, "explanation": "Opposites of G, E, N, C are T, V, M, X; moving each two places forward gives V, X, O, Z."},
  {"prompt": "The English alphabet is written in reverse order (Z first). Which letter lies exactly midway between the 5th letter from the left and the 6th letter from the right of this new arrangement?", "options": ["N", "M", "O", "L"], "answer": 0, "explanation": "In Z Y X … A, the 5th from the left is V (position 5) and the 6th from the right is F (position 21). Midway is position 13, which holds N."},
  {"prompt": "How many letters of the English alphabet have a prime-numbered position counted from the left and a perfect-square position counted from the right?", "options": ["3", "2", "4", "5"], "answer": 0, "explanation": "Position from the right is 27 − n, so it is a square (1, 4, 9, 16, 25) when n = 26, 23, 18, 11, 2. Of these, 23, 11 and 2 are prime: W, K and B."},
  {"prompt": "Find the missing term of the series.", "options": ["P", "O", "Q", "R"], "answer": 0, "explanation": "Positions 1, 2, 4, 7, 11 rise by 1, 2, 3, 4, so the next rise is 5: 11 + 5 = 16 = P, and P + 6 = V confirms it.", "code": "A, B, D, G, K, ?, V"},
  {"prompt": "Find the missing term of the series.", "options": ["L", "M", "K", "J"], "answer": 0, "explanation": "Z, U, Q, N fall by 5, 4, 3, so the next fall is 2: N (14) − 2 = 12 = L, and L − 1 = K confirms it.", "code": "Z, U, Q, N, ?, K"},
  {"prompt": "How many pairs of letters in the word CHAMPIONSHIP have as many letters between them in the word as there are between them in the English alphabet (counting in either direction)?", "options": ["7", "5", "6", "8"], "answer": 0, "explanation": "The pairs are CA, HN, AH, AI, ON, SP and HI: 7 in all (for example A and H are 7 apart in the alphabet and 7 apart in the word)."},
  {"prompt": "How many pairs of letters in the word UNDERSTAND have as many letters between them in the word as there are between them in the English alphabet (counting in either direction)?", "options": ["6", "4", "5", "7"], "answer": 0, "explanation": "The pairs are DE, EA, RS, RT, RN and ST: 6 in all (for example R and N are 4 apart in the alphabet and 4 apart in the word)."},
  {"prompt": "In the row below, how many vowels are immediately preceded by a consonant and immediately followed by a digit or a symbol?", "options": ["3", "2", "4", "1"], "answer": 0, "explanation": "Only K E 7, Q I 9 and M O & qualify; the other vowels (# U P, 3 A L, 5 E T) are preceded by a digit or symbol or followed by a letter. Total 3.", "code": "B K E 7 # U P 3 A L $ Q I 9 D M O & S 5 E T"},
  {"prompt": "If the first half of the row below (its first 11 elements) is written in reverse order, which element will be 4th to the right of the 9th element from the left?", "options": ["I", "Q", "#", "9"], "answer": 0, "explanation": "Reversing the first 11 elements gives $ L A 3 P U # 7 E K B, followed by Q I 9 D …. The 9th element is E, and 4 to its right is the 13th element, I.", "code": "B K E 7 # U P 3 A L $ Q I 9 D M O & S 5 E T"},
  {"prompt": "The letters of CERTIFICATE in odd positions (1st, 3rd, 5th, …) are written in reverse order, followed by the letters in even positions in their original order. Which letter is 4th from the right in the new arrangement?", "options": ["T", "I", "C", "A"], "answer": 0, "explanation": "Odd positions C R I I A E reversed give E A I I R C; even positions E T F C T follow, giving EAIIRCETFCT. The 4th from the right is T."},
];

const ASSUME = ["Only I is implicit", "Only II is implicit", "Both I and II are implicit", "Neither I nor II is implicit"];
const FOLLOW = ["Only I follows", "Only II follows", "Both I and II follow", "Neither I nor II follows"];
const CAUSE = ["I is the cause and II is its effect", "II is the cause and I is its effect", "I and II are effects of a common cause", "I and II are effects of independent causes"];
const [I, II, BOTH, NEITHER] = [0, 1, 2, 3];

const assume = (statement: string, i: string, ii: string, answer: number, explanation: string): HardItem => ({
  prompt: `Statement: ${statement}\nAssumption I: ${i}\nAssumption II: ${ii}\nWhich assumption is implicit in the statement?`,
  options: ASSUME, answer, explanation,
});
const conclude = (statement: string, i: string, ii: string, answer: number, explanation: string): HardItem => ({
  prompt: `Statement: ${statement}\nConclusion I: ${i}\nConclusion II: ${ii}\nWhich conclusion follows from the statement?`,
  options: FOLLOW, answer, explanation,
});
const act = (statement: string, i: string, ii: string, answer: number, explanation: string): HardItem => ({
  prompt: `Statement: ${statement}\nCourse of action I: ${i}\nCourse of action II: ${ii}\nWhich course of action logically follows?`,
  options: FOLLOW, answer, explanation,
});
const cause = (i: string, ii: string, answer: number, explanation: string): HardItem => ({
  prompt: `Statement I: ${i}\nStatement II: ${ii}\nHow are the two statements related?`,
  options: CAUSE, answer, explanation,
});

export const HARD_STATEMENT: HardItem[] = [
  assume("“Candidates must attach two passport-size photographs; forms without them will be rejected.” — an application notice.",
    "Forms without photographs will be rejected.", "Candidates are able to obtain passport-size photographs.", II,
    "I is stated in so many words, so it is not an assumption; the notice does take for granted that candidates can get the photographs (II)."),
  assume("“If you are not satisfied, return the product within 30 days for a full refund.” — a company's policy.",
    "Some buyers may be dissatisfied with the product.", "Most buyers will return the product.", I,
    "A refund policy exists because some buyers may be unhappy (I); no seller offers it expecting most buyers to return the goods (II)."),
  assume("Rita told her friend, “Take the expressway; you will reach the venue sooner than by the city road.”",
    "The friend wants to reach the venue quickly.", "The expressway is shorter than the city road.", I,
    "Advice about the quicker route assumes the friend cares about time (I); a road can be faster without being shorter, so II is not needed."),
  assume("The bank has asked all customers to update their KYC details online by the 31st to avoid suspension of their accounts.",
    "Customers have access to the bank's online facility.", "Customers do not want their accounts suspended.", BOTH,
    "Asking for an online update assumes customers can go online (I), and the threat of suspension works only if they want to avoid it (II)."),
  assume("The school has made yoga sessions compulsory for all students from Class VI onwards.",
    "Students below Class VI do not benefit from yoga.", "Yoga is harmful for younger children.", NEITHER,
    "The rule may start at Class VI for timetable or staffing reasons; it relies on neither the claim that younger pupils gain nothing (I) nor that yoga harms them (II)."),
  assume("“Our new phone's battery lasts two full days on a single charge.” — an advertisement.",
    "Buyers consider battery life when choosing a phone.", "Phones of other brands need charging every day.", I,
    "Advertising battery life assumes it matters to buyers (I); the claim stands on its own and does not need rival phones to be worse (II)."),

  conclude("Only those who cleared the written test were called for the interview, and only a few applicants cleared the written test.",
    "Most applicants were not called for the interview.", "Everyone who cleared the written test was called for the interview.", I,
    "Only the few who cleared could be called, so most were not (I). “Only those who cleared” does not mean “all who cleared”, so II does not follow."),
  conclude("No laptop in the store costs less than ₹40,000. Some laptops in the store cost more than ₹80,000.",
    "Some laptops in the store cost between ₹40,000 and ₹80,000.", "Every laptop in the store costs at least ₹40,000.", II,
    "II merely restates the first sentence. Every laptop might cost over ₹80,000, so I does not follow."),
  conclude("Ramesh is older than Suresh, and Suresh is not older than Mahesh.",
    "Ramesh is older than Mahesh.", "Mahesh is older than Suresh.", NEITHER,
    "Mahesh may be the same age as Suresh or older, and either way his age relative to Ramesh is unknown, so neither conclusion is forced."),
  conclude("If it rains, the match will be postponed. The match was not postponed.",
    "It did not rain.", "The match was played on the scheduled day.", I,
    "Rain would have meant postponement, so no postponement means no rain (I). A match that was not postponed could still have been cancelled, so II does not follow."),
  conclude("If it rains, the match will be postponed. The match was postponed.",
    "It rained.", "The match will not be played at all.", NEITHER,
    "The match could have been postponed for another reason, so I does not follow (affirming the consequent), and postponement says nothing about cancellation (II)."),
  conclude("Every member of the chess club is also a member of the quiz club. Neha is not a member of the quiz club.",
    "Neha is not a member of the chess club.", "Some members of the quiz club are not members of the chess club.", I,
    "Chess membership implies quiz membership, so Neha cannot be in the chess club (I). The two clubs could have exactly the same members, so II does not follow."),
  conclude("The museum is closed on every Monday and on every national holiday. This year 15 August, a national holiday, falls on a Thursday.",
    "The museum will be closed on 15 August this year.", "The museum will be closed on at least two days of the week that contains 15 August.", BOTH,
    "15 August is a holiday, so I follows; that week also contains a Monday, a different day, so it has at least two closed days (II)."),

  act("Several passengers on a long-distance train fell ill after eating the food served on board.",
    "The catering contractor's kitchen should be inspected and food samples tested.", "Food service on all trains in the country should be stopped.", I,
    "Inspecting the source addresses the problem directly (I); stopping food on every train because of one incident is an extreme, impractical step (II)."),
  act("Chain-snatching incidents in a residential locality have risen sharply over the last two months.",
    "Police patrolling in the locality should be increased.", "Residents should be advised to take precautions while walking in public places.", BOTH,
    "Both are practical and address the problem: more patrols deter offenders (I) and precautions reduce opportunities (II)."),
  act("A few employees reached the office late on a day of very heavy rainfall.",
    "Those employees should be issued warning letters.", "Office hours should be permanently shifted one hour later.", NEITHER,
    "Lateness on one exceptional day is not misconduct deserving a warning (I), nor a reason to change working hours for good (II)."),
  act("The reservoir supplying a city has fallen to its lowest level in a decade, and the monsoon is still two months away.",
    "The city should build a new dam so that the shortage ends before the monsoon.", "Water supply should be rationed until the monsoon arrives.", II,
    "The problem is immediate; a dam takes years to build and cannot relieve the next two months (I), whereas rationing does (II)."),

  cause("The prices of vegetables in the city markets have shot up this week.", "Floods have destroyed standing crops in the districts that supply the city.", II,
    "Flood damage cuts the supply of vegetables, which pushes up their prices, so II is the cause and I its effect."),
  cause("The central bank raised its policy interest rate sharply last month.", "Many borrowers with floating-rate home loans now pay higher monthly instalments.", I,
    "Floating-rate loans track the policy rate, so the rate hike (I) causes the higher instalments (II)."),
];
