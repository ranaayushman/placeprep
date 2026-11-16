/**
 * Google SDE (new grad / L3, India) preparation path shown on /google. Researched Nov 2026 from Google's
 * own hiring pages where they exist, plus candidate reports (LeetCode Discuss, Glassdoor) and prep guides,
 * which disagree on details. Process facts carry a `confidence` so the page never states a guess as fact.
 * Problems link to LeetCode by name only (no statements copied). The topic order follows the usual
 * dependency chain: arrays → patterns → trees → graphs → DP.
 */

export type Confidence = "official" | "widely reported" | "candidate reports";

export const GOOGLE_PROCESS: { step: string; detail: string; confidence: Confidence }[] = [
  { step: "Apply", detail: "Apply to “Software Engineer, University Graduate” on careers.google.com (India: Bengaluru, Hyderabad, Pune). A referral from a Googler gets your resume read faster; it does not skip any round.", confidence: "widely reported" },
  { step: "Online assessment", detail: "Usually 2 coding problems in about 60–90 minutes, on a platform like HackerRank. Some candidates also get the Google Hiring Assessment: a work-style questionnaire with no code.", confidence: "candidate reports" },
  { step: "Phone / video screen", detail: "One 45-minute coding interview in a shared doc with no autocomplete and no code run. You talk through the approach, write clean code and state the complexity.", confidence: "widely reported" },
  { step: "Interview loop", detail: "3–4 interviews of 45 minutes: mostly data structures and algorithms, plus one Googleyness & Leadership (behavioural) round. No system design for L3. Since 2025, Google holds at least one round in person for engineering roles to curb AI cheating.", confidence: "widely reported" },
  { step: "Hiring committee", detail: "Each interviewer writes independent feedback and a score. A committee of engineers who did not interview you decides from the packet, so every round counts and one great round cannot rescue a weak one.", confidence: "widely reported" },
  { step: "Team match & offer", detail: "After the committee says yes, you talk to teams until one picks you, then the offer. Application to offer typically takes 6–12 weeks.", confidence: "widely reported" },
];

/** What interviewers score you on, as Google itself describes its hiring. */
export const GOOGLE_ATTRIBUTES: { name: string; what: string }[] = [
  { name: "General cognitive ability", what: "How you break down an open problem: ask clarifying questions, find a brute force, improve it, and reason about trade-offs out loud." },
  { name: "Role-related knowledge", what: "Data structures, algorithms and complexity, and turning an idea into correct, readable code without an IDE." },
  { name: "Leadership", what: "Taking ownership in a group: a project, a club, a hackathon. Stepping up, and stepping back to let others lead." },
  { name: "Googleyness", what: "Comfort with ambiguity, collaboration, humility, doing the right thing for the user. Have 6–8 true stories ready (STAR format)." },
];

export type PathProblem = { title: string; slug: string; level: "Easy" | "Medium" | "Hard" };
export type PathTopic = { name: string; why: string; problems: PathProblem[] };
export type PathPhase = { id: string; title: string; weeks: string; goal: string; topics: PathTopic[]; habits: string[] };

const p = (title: string, slug: string, level: PathProblem["level"]): PathProblem => ({ title, slug, level });

export const GOOGLE_PATH: PathPhase[] = [
  {
    id: "foundations",
    title: "Foundations",
    weeks: "Weeks 1–2",
    goal: "One language you can write fluently without an IDE (C++ or Java), Big-O for everything you write, and the array/string/hash-map toolkit.",
    habits: ["Write every solution in a plain text editor first: no autocomplete, as in the interview doc.", "State time and space complexity before you run anything.", "Use the PlacePrep DSA track for the first array problems, then move to these."],
    topics: [
      {
        name: "Arrays & hashing",
        why: "The most common opener. Hash maps turn O(n²) searches into O(n).",
        problems: [p("Two Sum", "two-sum", "Easy"), p("Contains Duplicate", "contains-duplicate", "Easy"), p("Group Anagrams", "group-anagrams", "Medium"), p("Top K Frequent Elements", "top-k-frequent-elements", "Medium"), p("Product of Array Except Self", "product-of-array-except-self", "Medium"), p("Longest Consecutive Sequence", "longest-consecutive-sequence", "Medium"), p("Valid Sudoku", "valid-sudoku", "Medium")],
      },
      {
        name: "Bits & maths",
        why: "Short warm-ups and follow-ups; XOR and counting tricks come up as twists.",
        problems: [p("Single Number", "single-number", "Easy"), p("Number of 1 Bits", "number-of-1-bits", "Easy"), p("Counting Bits", "counting-bits", "Easy")],
      },
    ],
  },
  {
    id: "patterns",
    title: "Core patterns",
    weeks: "Weeks 3–6",
    goal: "Recognise the pattern within 5 minutes: two pointers, sliding window, prefix sums, intervals, binary search (including on the answer), stacks and linked lists.",
    habits: ["After each problem, write one line: “the signal that told me it was <pattern>”.", "Re-solve every problem you needed a hint for, 3 days later, cold.", "Two timed problems a day, 25 minutes each."],
    topics: [
      { name: "Two pointers", why: "Sorted arrays and in-place work; a classic O(n) improvement.", problems: [p("Valid Palindrome", "valid-palindrome", "Easy"), p("3Sum", "3sum", "Medium"), p("Container With Most Water", "container-with-most-water", "Medium"), p("Trapping Rain Water", "trapping-rain-water", "Hard")] },
      { name: "Sliding window", why: "“Longest/shortest subarray or substring such that…” is almost always this.", problems: [p("Longest Substring Without Repeating Characters", "longest-substring-without-repeating-characters", "Medium"), p("Longest Repeating Character Replacement", "longest-repeating-character-replacement", "Medium"), p("Minimum Window Substring", "minimum-window-substring", "Hard"), p("Sliding Window Maximum", "sliding-window-maximum", "Hard")] },
      { name: "Prefix sums & intervals", why: "Range questions and scheduling; intervals show up a lot in reports.", problems: [p("Subarray Sum Equals K", "subarray-sum-equals-k", "Medium"), p("Merge Intervals", "merge-intervals", "Medium"), p("Insert Interval", "insert-interval", "Medium"), p("Non-overlapping Intervals", "non-overlapping-intervals", "Medium"), p("My Calendar I", "my-calendar-i", "Medium")] },
      { name: "Binary search", why: "Not just sorted arrays: “binary search on the answer” is a favourite follow-up.", problems: [p("Binary Search", "binary-search", "Easy"), p("Search in Rotated Sorted Array", "search-in-rotated-sorted-array", "Medium"), p("Find Minimum in Rotated Sorted Array", "find-minimum-in-rotated-sorted-array", "Medium"), p("Koko Eating Bananas", "koko-eating-bananas", "Medium"), p("Split Array Largest Sum", "split-array-largest-sum", "Hard"), p("Median of Two Sorted Arrays", "median-of-two-sorted-arrays", "Hard")] },
      { name: "Stacks & monotonic stack", why: "Parsing and “next greater element” problems.", problems: [p("Valid Parentheses", "valid-parentheses", "Easy"), p("Min Stack", "min-stack", "Medium"), p("Daily Temperatures", "daily-temperatures", "Medium"), p("Decode String", "decode-string", "Medium"), p("Largest Rectangle in Histogram", "largest-rectangle-in-histogram", "Hard")] },
      { name: "Linked lists & design", why: "Pointer care under pressure; LRU Cache is one of the most reported design questions.", problems: [p("Reverse Linked List", "reverse-linked-list", "Easy"), p("Merge Two Sorted Lists", "merge-two-sorted-lists", "Easy"), p("Linked List Cycle", "linked-list-cycle", "Easy"), p("Copy List with Random Pointer", "copy-list-with-random-pointer", "Medium"), p("LRU Cache", "lru-cache", "Medium"), p("Merge k Sorted Lists", "merge-k-sorted-lists", "Hard")] },
    ],
  },
  {
    id: "trees-graphs",
    title: "Trees & graphs",
    weeks: "Weeks 7–10",
    goal: "The heaviest area in Google reports. Recursion on trees, then BFS/DFS on graphs and grids, topological sort, union-find and shortest paths.",
    habits: ["Draw the tree or graph on paper before coding; interviewers like seeing it.", "For every graph problem say out loud: nodes, edges, directed?, weighted?, BFS or DFS?", "Practise iterative BFS and recursive DFS until you can write both in 3 minutes."],
    topics: [
      { name: "Binary trees & BST", why: "Recursion fluency; many Google rounds start with a tree.", problems: [p("Maximum Depth of Binary Tree", "maximum-depth-of-binary-tree", "Easy"), p("Binary Tree Level Order Traversal", "binary-tree-level-order-traversal", "Medium"), p("Binary Tree Right Side View", "binary-tree-right-side-view", "Medium"), p("Validate Binary Search Tree", "validate-binary-search-tree", "Medium"), p("Kth Smallest Element in a BST", "kth-smallest-element-in-a-bst", "Medium"), p("Lowest Common Ancestor of a Binary Tree", "lowest-common-ancestor-of-a-binary-tree", "Medium"), p("Construct Binary Tree from Preorder and Inorder Traversal", "construct-binary-tree-from-preorder-and-inorder-traversal", "Medium"), p("Binary Tree Maximum Path Sum", "binary-tree-maximum-path-sum", "Hard"), p("Serialize and Deserialize Binary Tree", "serialize-and-deserialize-binary-tree", "Hard")] },
      { name: "Heaps", why: "Top-K, streaming medians and scheduling; reports often open with a priority-queue problem.", problems: [p("Kth Largest Element in an Array", "kth-largest-element-in-an-array", "Medium"), p("K Closest Points to Origin", "k-closest-points-to-origin", "Medium"), p("Task Scheduler", "task-scheduler", "Medium"), p("Find Median from Data Stream", "find-median-from-data-stream", "Hard")] },
      { name: "Tries", why: "Prefix search and word games; a Google classic.", problems: [p("Implement Trie (Prefix Tree)", "implement-trie-prefix-tree", "Medium"), p("Design Add and Search Words Data Structure", "design-add-and-search-words-data-structure", "Medium"), p("Word Search II", "word-search-ii", "Hard")] },
      { name: "Graph traversal & grids", why: "BFS/DFS, connected components, multi-source BFS.", problems: [p("Number of Islands", "number-of-islands", "Medium"), p("Clone Graph", "clone-graph", "Medium"), p("Rotting Oranges", "rotting-oranges", "Medium"), p("Pacific Atlantic Water Flow", "pacific-atlantic-water-flow", "Medium"), p("Word Ladder", "word-ladder", "Hard")] },
      { name: "Topological sort & union-find", why: "Dependencies, ordering and connectivity.", problems: [p("Course Schedule", "course-schedule", "Medium"), p("Course Schedule II", "course-schedule-ii", "Medium"), p("Redundant Connection", "redundant-connection", "Medium"), p("Accounts Merge", "accounts-merge", "Medium"), p("Evaluate Division", "evaluate-division", "Medium")] },
      { name: "Shortest paths & MST", why: "Dijkstra and its variants; weighted-grid twists are common.", problems: [p("Network Delay Time", "network-delay-time", "Medium"), p("Path With Minimum Effort", "path-with-minimum-effort", "Medium"), p("Cheapest Flights Within K Stops", "cheapest-flights-within-k-stops", "Medium"), p("Min Cost to Connect All Points", "min-cost-to-connect-all-points", "Medium"), p("Swim in Rising Water", "swim-in-rising-water", "Hard")] },
    ],
  },
  {
    id: "dp",
    title: "DP, backtracking & greedy",
    weeks: "Weeks 11–13",
    goal: "Define the state and the recurrence before coding. Go from recursion to memoisation to a table, and explain each step.",
    habits: ["Write the state in one sentence: “dp[i] = … using the first i items”.", "Solve every DP problem top-down first, then convert it.", "For greedy, say why the greedy choice is safe; interviewers ask."],
    topics: [
      { name: "Backtracking", why: "Generate-all problems; tests clean recursion and pruning.", problems: [p("Subsets", "subsets", "Medium"), p("Permutations", "permutations", "Medium"), p("Combination Sum", "combination-sum", "Medium"), p("Word Search", "word-search", "Medium"), p("Palindrome Partitioning", "palindrome-partitioning", "Medium"), p("N-Queens", "n-queens", "Hard")] },
      { name: "Greedy", why: "Short code, but you must justify it.", problems: [p("Jump Game", "jump-game", "Medium"), p("Jump Game II", "jump-game-ii", "Medium"), p("Gas Station", "gas-station", "Medium"), p("Partition Labels", "partition-labels", "Medium")] },
      { name: "1-D dynamic programming", why: "The DP entry point; Word Break and Coin Change are frequent.", problems: [p("Climbing Stairs", "climbing-stairs", "Easy"), p("House Robber", "house-robber", "Medium"), p("Decode Ways", "decode-ways", "Medium"), p("Coin Change", "coin-change", "Medium"), p("Word Break", "word-break", "Medium"), p("Longest Increasing Subsequence", "longest-increasing-subsequence", "Medium"), p("Partition Equal Subset Sum", "partition-equal-subset-sum", "Medium")] },
      { name: "2-D & interval DP", why: "Strings and grids; the step up from 1-D.", problems: [p("Unique Paths", "unique-paths", "Medium"), p("Longest Palindromic Substring", "longest-palindromic-substring", "Medium"), p("Maximal Square", "maximal-square", "Medium"), p("Longest Common Subsequence", "longest-common-subsequence", "Medium"), p("Best Time to Buy and Sell Stock with Cooldown", "best-time-to-buy-and-sell-stock-with-cooldown", "Medium"), p("Edit Distance", "edit-distance", "Medium"), p("Burst Balloons", "burst-balloons", "Hard")] },
      { name: "Range queries (stretch)", why: "Segment tree / Fenwick tree: rarely required for L3, but a strong signal when a follow-up needs it.", problems: [p("Range Sum Query - Mutable", "range-sum-query-mutable", "Medium"), p("Count of Smaller Numbers After Self", "count-of-smaller-numbers-after-self", "Hard")] },
    ],
  },
  {
    id: "interview",
    title: "Interview simulation",
    weeks: "Weeks 14–16",
    goal: "Turn knowledge into 45-minute performances: clarify, brute force, optimise, code, test, and handle the follow-up, all while talking.",
    habits: [
      "3 mock interviews a week with a friend or a peer platform, in a shared doc, camera on.",
      "Use this script every time: restate the problem → ask about edge cases → brute force + complexity → better idea → code → dry-run on an example → complexity.",
      "Write 6–8 STAR stories (conflict, failure, leading without authority, ambiguity, helping a teammate, a hard bug) and say each one aloud in under 2 minutes.",
      "One-page resume: every line has an impact and a number. Be ready to go deep on every project.",
      "In the last week, re-solve the 20 problems you found hardest. Learn nothing new.",
    ],
    topics: [],
  },
];

export const PATH_PROBLEM_COUNT = GOOGLE_PATH.reduce((n, ph) => n + ph.topics.reduce((m, t) => m + t.problems.length, 0), 0);
