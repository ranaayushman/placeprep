/**
 * Function-style reference solutions (only the `class Solution` a student types) for every FN_SPECS problem,
 * in each language. tests/fn-harness.test.ts wraps and runs them against every test.
 */
const s = String.raw;

export const FN_SOLUTIONS: Record<string, { cpp: string; java: string; python: string }> = {
  "move-zeros": {
    cpp: s`class Solution {
public:
    vector<int> moveZeros(vector<int>& nums) {
        int k = 0;
        for (int x : nums) if (x != 0) nums[k++] = x;
        while (k < (int)nums.size()) nums[k++] = 0;
        return nums;
    }
};`,
    java: s`class Solution {
    public int[] moveZeros(int[] nums) {
        int k = 0;
        for (int x : nums) if (x != 0) nums[k++] = x;
        while (k < nums.length) nums[k++] = 0;
        return nums;
    }
}`,
    python: s`class Solution:
    def moveZeros(self, nums: List[int]) -> List[int]:
        nz = [x for x in nums if x != 0]
        return nz + [0] * (len(nums) - len(nz))`,
  },
  "toggle-bits": {
    cpp: s`class Solution {
public:
    long long toggleBits(long long n) {
        long long mask = 1;
        while (mask <= n) mask <<= 1;
        return (mask - 1) ^ n;
    }
};`,
    java: s`class Solution {
    public long toggleBits(long n) {
        long mask = 1;
        while (mask <= n) mask <<= 1;
        return (mask - 1) ^ n;
    }
}`,
    python: s`class Solution:
    def toggleBits(self, n: int) -> int:
        return ((1 << n.bit_length()) - 1) ^ n`,
  },
  "count-near": {
    cpp: s`class Solution {
public:
    int countNear(vector<int>& nums, long long num, long long diff) {
        int c = 0;
        for (int x : nums) if (llabs(x - num) <= diff) c++;
        return c ? c : -1;
    }
};`,
    java: s`class Solution {
    public int countNear(int[] nums, long num, long diff) {
        int c = 0;
        for (int x : nums) if (Math.abs(x - num) <= diff) c++;
        return c > 0 ? c : -1;
    }
}`,
    python: s`class Solution:
    def countNear(self, nums: List[int], num: int, diff: int) -> int:
        c = sum(1 for x in nums if abs(x - num) <= diff)
        return c if c else -1`,
  },
  "difference-of-sums": {
    cpp: s`class Solution {
public:
    long long differenceOfSums(long long n, long long m) {
        long long r = 0;
        for (long long i = 1; i <= m; i++) r += (i % n ? i : -i);
        return r;
    }
};`,
    java: s`class Solution {
    public long differenceOfSums(long n, long m) {
        long r = 0;
        for (long i = 1; i <= m; i++) r += (i % n != 0 ? i : -i);
        return r;
    }
}`,
    python: s`class Solution:
    def differenceOfSums(self, n: int, m: int) -> int:
        total = m * (m + 1) // 2
        k = m // n
        div = n * k * (k + 1) // 2
        return total - 2 * div`,
  },
  "sort-012": {
    cpp: s`class Solution {
public:
    vector<int> sortColors(vector<int>& nums) {
        int c[3] = {0, 0, 0};
        for (int x : nums) c[x]++;
        vector<int> r;
        for (int v = 0; v < 3; v++) r.insert(r.end(), c[v], v);
        return r;
    }
};`,
    java: s`class Solution {
    public int[] sortColors(int[] nums) {
        int[] c = new int[3];
        for (int x : nums) c[x]++;
        int k = 0;
        for (int v = 0; v < 3; v++) while (c[v]-- > 0) nums[k++] = v;
        return nums;
    }
}`,
    python: s`class Solution:
    def sortColors(self, nums: List[int]) -> List[int]:
        return [v for v in range(3) for _ in range(nums.count(v))]`,
  },
  "reverse-words": {
    cpp: s`class Solution {
public:
    string reverseWords(string s) {
        stringstream ss(s);
        vector<string> w;
        string t;
        while (ss >> t) w.push_back(t);
        string r;
        for (int i = (int)w.size() - 1; i >= 0; i--) r += w[i] + (i ? " " : "");
        return r;
    }
};`,
    java: s`class Solution {
    public String reverseWords(String s) {
        List<String> w = new ArrayList<>(Arrays.asList(s.trim().split("\\s+")));
        Collections.reverse(w);
        return String.join(" ", w);
    }
}`,
    python: s`class Solution:
    def reverseWords(self, s: str) -> str:
        return " ".join(reversed(s.split()))`,
  },
  "second-largest": {
    cpp: s`class Solution {
public:
    long long secondLargest(vector<int>& nums) {
        set<int> st(nums.begin(), nums.end());
        if (st.size() < 2) return -1;
        return *next(st.rbegin());
    }
};`,
    java: s`class Solution {
    public long secondLargest(int[] nums) {
        TreeSet<Integer> st = new TreeSet<>();
        for (int x : nums) st.add(x);
        if (st.size() < 2) return -1;
        return st.lower(st.last());
    }
}`,
    python: s`class Solution:
    def secondLargest(self, nums: List[int]) -> int:
        u = sorted(set(nums))
        return u[-2] if len(u) > 1 else -1`,
  },
  palindrome: {
    cpp: s`class Solution {
public:
    bool isPalindrome(string s) {
        string t;
        for (char c : s) if (isalnum((unsigned char)c)) t += tolower(c);
        return t == string(t.rbegin(), t.rend());
    }
};`,
    java: s`class Solution {
    public boolean isPalindrome(String s) {
        StringBuilder t = new StringBuilder();
        for (char c : s.toCharArray()) if (Character.isLetterOrDigit(c)) t.append(Character.toLowerCase(c));
        return t.toString().equals(t.reverse().toString());
    }
}`,
    python: s`class Solution:
    def isPalindrome(self, s: str) -> bool:
        t = [c.lower() for c in s if c.isalnum()]
        return t == t[::-1]`,
  },
  "max-subarray": {
    cpp: s`class Solution {
public:
    long long maxSubarraySum(vector<int>& nums) {
        long long best = LLONG_MIN, cur = 0;
        for (int x : nums) { cur = max<long long>(x, cur + x); best = max(best, cur); }
        return best;
    }
};`,
    java: s`class Solution {
    public long maxSubarraySum(int[] nums) {
        long best = Long.MIN_VALUE, cur = 0;
        for (int x : nums) { cur = Math.max(x, cur + x); best = Math.max(best, cur); }
        return best;
    }
}`,
    python: s`class Solution:
    def maxSubarraySum(self, nums: List[int]) -> int:
        best, cur = nums[0], 0
        for x in nums:
            cur = max(x, cur + x)
            best = max(best, cur)
        return best`,
  },
  "balanced-brackets": {
    cpp: s`class Solution {
public:
    bool isBalanced(string s) {
        stack<char> st;
        map<char, char> m = {{')', '('}, {']', '['}, {'}', '{'}};
        for (char c : s) {
            if (m.count(c)) {
                if (st.empty() || st.top() != m[c]) return false;
                st.pop();
            } else st.push(c);
        }
        return st.empty();
    }
};`,
    java: s`class Solution {
    public boolean isBalanced(String s) {
        Deque<Character> st = new ArrayDeque<>();
        Map<Character, Character> m = Map.of(')', '(', ']', '[', '}', '{');
        for (char c : s.toCharArray()) {
            if (m.containsKey(c)) {
                if (st.isEmpty() || st.pop() != m.get(c)) return false;
            } else st.push(c);
        }
        return st.isEmpty();
    }
}`,
    python: s`class Solution:
    def isBalanced(self, s: str) -> bool:
        m = {")": "(", "]": "[", "}": "{"}
        st = []
        for c in s:
            if c in m:
                if not st or st.pop() != m[c]:
                    return False
            else:
                st.append(c)
        return not st`,
  },
  "perfect-number": {
    cpp: s`class Solution {
public:
    bool isPerfect(long long n) {
        if (n < 2) return false;
        long long sum = 1;
        for (long long i = 2; i * i <= n; i++) if (n % i == 0) { sum += i; if (i != n / i) sum += n / i; }
        return sum == n;
    }
};`,
    java: s`class Solution {
    public boolean isPerfect(long n) {
        if (n < 2) return false;
        long sum = 1;
        for (long i = 2; i * i <= n; i++) if (n % i == 0) { sum += i; if (i != n / i) sum += n / i; }
        return sum == n;
    }
}`,
    python: s`class Solution:
    def isPerfect(self, n: int) -> bool:
        if n < 2:
            return False
        total, i = 1, 2
        while i * i <= n:
            if n % i == 0:
                total += i + (n // i if i != n // i else 0)
            i += 1
        return total == n`,
  },
  "sum-of-two-primes": {
    cpp: s`class Solution {
    bool prime(int x) { if (x < 2) return false; for (int i = 2; i * i <= x; i++) if (x % i == 0) return false; return true; }
public:
    string twoPrimes(int n) {
        for (int a = 2; a <= n / 2; a++) if (prime(a) && prime(n - a)) return to_string(a) + " and " + to_string(n - a);
        return "";
    }
};`,
    java: s`class Solution {
    boolean prime(int x) { if (x < 2) return false; for (int i = 2; i * i <= x; i++) if (x % i == 0) return false; return true; }
    public String twoPrimes(int n) {
        for (int a = 2; a <= n / 2; a++) if (prime(a) && prime(n - a)) return a + " and " + (n - a);
        return "";
    }
}`,
    python: s`class Solution:
    def twoPrimes(self, n: int) -> str:
        def prime(x):
            return x > 1 and all(x % i for i in range(2, int(x ** 0.5) + 1))
        for a in range(2, n // 2 + 1):
            if prime(a) and prime(n - a):
                return f"{a} and {n - a}"
        return ""`,
  },
  "class-monitor": {
    cpp: s`class Solution {
public:
    int monitorChanges(vector<int>& ranks) {
        int best = ranks[0], c = 0;
        for (int r : ranks) if (r < best) { best = r; c++; }
        return c;
    }
};`,
    java: s`class Solution {
    public int monitorChanges(int[] ranks) {
        int best = ranks[0], c = 0;
        for (int r : ranks) if (r < best) { best = r; c++; }
        return c;
    }
}`,
    python: s`class Solution:
    def monitorChanges(self, ranks: List[int]) -> int:
        best, c = ranks[0], 0
        for r in ranks:
            if r < best:
                best, c = r, c + 1
        return c`,
  },
  "string-alternation": {
    cpp: s`class Solution {
public:
    string mergeAlternately(string a, string b) {
        string r;
        for (size_t i = 0; i < a.size() || i < b.size(); i++) {
            if (i < a.size()) r += a[i];
            if (i < b.size()) r += b[i];
        }
        return r;
    }
};`,
    java: s`class Solution {
    public String mergeAlternately(String a, String b) {
        StringBuilder r = new StringBuilder();
        for (int i = 0; i < a.length() || i < b.length(); i++) {
            if (i < a.length()) r.append(a.charAt(i));
            if (i < b.length()) r.append(b.charAt(i));
        }
        return r.toString();
    }
}`,
    python: s`class Solution:
    def mergeAlternately(self, a: str, b: str) -> str:
        r = []
        for i in range(max(len(a), len(b))):
            r.append(a[i:i + 1] + b[i:i + 1])
        return "".join(r)`,
  },
  "k-set-bits": {
    cpp: s`class Solution {
public:
    long long countWithKSetBits(int n, int k) {
        long long c = 0;
        for (int x = 1; x < n; x++) if (__builtin_popcount(x) == k) c++;
        return c;
    }
};`,
    java: s`class Solution {
    public long countWithKSetBits(int n, int k) {
        long c = 0;
        for (int x = 1; x < n; x++) if (Integer.bitCount(x) == k) c++;
        return c;
    }
}`,
    python: s`class Solution:
    def countWithKSetBits(self, n: int, k: int) -> int:
        return sum(1 for x in range(1, n) if bin(x).count("1") == k)`,
  },
  "odd-sum-subarrays": {
    cpp: s`class Solution {
public:
    long long countOddSumSubarrays(vector<int>& nums) {
        long long even = 1, odd = 0, res = 0;
        int p = 0;
        for (int x : nums) { p = (p + x) & 1; if (p) { res += even; odd++; } else { res += odd; even++; } }
        return res;
    }
};`,
    java: s`class Solution {
    public long countOddSumSubarrays(int[] nums) {
        long even = 1, odd = 0, res = 0;
        int p = 0;
        for (int x : nums) { p = (p + x) & 1; if (p == 1) { res += even; odd++; } else { res += odd; even++; } }
        return res;
    }
}`,
    python: s`class Solution:
    def countOddSumSubarrays(self, nums: List[int]) -> int:
        cnt = [1, 0]
        p = res = 0
        for x in nums:
            p = (p + x) & 1
            res += cnt[1 - p]
            cnt[p] += 1
        return res`,
  },
  "longest-palindrome": {
    cpp: s`class Solution {
public:
    int longestPalindrome(string s) {
        int n = s.size(), best = 1;
        for (int c = 0; c < n; c++)
            for (int w = 0; w < 2; w++) {
                int l = c, r = c + w;
                while (l >= 0 && r < n && s[l] == s[r]) { l--; r++; }
                best = max(best, r - l - 1);
            }
        return best;
    }
};`,
    java: s`class Solution {
    public int longestPalindrome(String s) {
        int n = s.length(), best = 1;
        for (int c = 0; c < n; c++)
            for (int w = 0; w < 2; w++) {
                int l = c, r = c + w;
                while (l >= 0 && r < n && s.charAt(l) == s.charAt(r)) { l--; r++; }
                best = Math.max(best, r - l - 1);
            }
        return best;
    }
}`,
    python: s`class Solution:
    def longestPalindrome(self, s: str) -> int:
        n, best = len(s), 1
        for c in range(n):
            for w in (0, 1):
                l, r = c, c + w
                while l >= 0 and r < n and s[l] == s[r]:
                    l -= 1
                    r += 1
                best = max(best, r - l - 1)
        return best`,
  },
  "kth-largest": {
    cpp: s`class Solution {
public:
    long long kthLargest(vector<int>& nums, int k) {
        sort(nums.rbegin(), nums.rend());
        return nums[k - 1];
    }
};`,
    java: s`class Solution {
    public long kthLargest(int[] nums, int k) {
        Arrays.sort(nums);
        return nums[nums.length - k];
    }
}`,
    python: s`class Solution:
    def kthLargest(self, nums: List[int], k: int) -> int:
        return sorted(nums, reverse=True)[k - 1]`,
  },
  "count-inversions": {
    cpp: s`class Solution {
    long long sortCount(vector<int>& a, int l, int r) {
        if (r - l < 2) return 0;
        int m = (l + r) / 2;
        long long c = sortCount(a, l, m) + sortCount(a, m, r);
        vector<int> t;
        int i = l, j = m;
        while (i < m || j < r) {
            if (j == r || (i < m && a[i] <= a[j])) t.push_back(a[i++]);
            else { c += m - i; t.push_back(a[j++]); }
        }
        copy(t.begin(), t.end(), a.begin() + l);
        return c;
    }
public:
    long long countInversions(vector<int>& nums) {
        return sortCount(nums, 0, nums.size());
    }
};`,
    java: s`class Solution {
    long sortCount(int[] a, int l, int r) {
        if (r - l < 2) return 0;
        int m = (l + r) / 2;
        long c = sortCount(a, l, m) + sortCount(a, m, r);
        int[] t = new int[r - l];
        int i = l, j = m, k = 0;
        while (i < m || j < r) {
            if (j == r || (i < m && a[i] <= a[j])) t[k++] = a[i++];
            else { c += m - i; t[k++] = a[j++]; }
        }
        System.arraycopy(t, 0, a, l, t.length);
        return c;
    }
    public long countInversions(int[] nums) {
        return sortCount(nums, 0, nums.length);
    }
}`,
    python: s`class Solution:
    def countInversions(self, nums: List[int]) -> int:
        def go(a):
            if len(a) < 2:
                return a, 0
            m = len(a) // 2
            left, x = go(a[:m])
            right, y = go(a[m:])
            out, c, i, j = [], x + y, 0, 0
            while i < len(left) or j < len(right):
                if j == len(right) or (i < len(left) and left[i] <= right[j]):
                    out.append(left[i])
                    i += 1
                else:
                    c += len(left) - i
                    out.append(right[j])
                    j += 1
            return out, c
        return go(nums)[1]`,
  },
  "char-frequency": {
    cpp: s`class Solution {
public:
    vector<string> charFrequency(string s) {
        int c[256] = {0};
        for (unsigned char ch : s) c[ch]++;
        vector<string> r;
        for (unsigned char ch : s) if (c[ch]) { r.push_back(string(1, ch) + " " + to_string(c[ch])); c[ch] = 0; }
        return r;
    }
};`,
    java: s`class Solution {
    public List<String> charFrequency(String s) {
        Map<Character, Integer> c = new LinkedHashMap<>();
        for (char ch : s.toCharArray()) c.merge(ch, 1, Integer::sum);
        List<String> r = new ArrayList<>();
        for (Map.Entry<Character, Integer> e : c.entrySet()) r.add(e.getKey() + " " + e.getValue());
        return r;
    }
}`,
    python: s`class Solution:
    def charFrequency(self, s: str) -> List[str]:
        c = {}
        for ch in s:
            c[ch] = c.get(ch, 0) + 1
        return [f"{ch} {n}" for ch, n in c.items()]`,
  },
  "string-match": {
    cpp: s`class Solution {
public:
    int countOccurrences(string text, string pattern) {
        int c = 0;
        for (size_t i = 0; i + pattern.size() <= text.size(); i++) if (text.compare(i, pattern.size(), pattern) == 0) c++;
        return c;
    }
};`,
    java: s`class Solution {
    public int countOccurrences(String text, String pattern) {
        int c = 0;
        for (int i = 0; i + pattern.length() <= text.length(); i++) if (text.startsWith(pattern, i)) c++;
        return c;
    }
}`,
    python: s`class Solution:
    def countOccurrences(self, text: str, pattern: str) -> int:
        return sum(1 for i in range(len(text) - len(pattern) + 1) if text.startswith(pattern, i))`,
  },
  "first-non-repeating": {
    cpp: s`class Solution {
public:
    string firstUnique(string s) {
        int c[26] = {0};
        for (char ch : s) c[ch - 'a']++;
        for (char ch : s) if (c[ch - 'a'] == 1) return string(1, ch);
        return "-1";
    }
};`,
    java: s`class Solution {
    public String firstUnique(String s) {
        int[] c = new int[26];
        for (char ch : s.toCharArray()) c[ch - 'a']++;
        for (char ch : s.toCharArray()) if (c[ch - 'a'] == 1) return String.valueOf(ch);
        return "-1";
    }
}`,
    python: s`class Solution:
    def firstUnique(self, s: str) -> str:
        for ch in s:
            if s.count(ch) == 1:
                return ch
        return "-1"`,
  },
  "missing-number": {
    cpp: s`class Solution {
public:
    int missingNumber(int n, vector<int>& nums) {
        long long sum = 1LL * n * (n + 1) / 2;
        for (int x : nums) sum -= x;
        return sum;
    }
};`,
    java: s`class Solution {
    public int missingNumber(int n, int[] nums) {
        long sum = (long) n * (n + 1) / 2;
        for (int x : nums) sum -= x;
        return (int) sum;
    }
}`,
    python: s`class Solution:
    def missingNumber(self, n: int, nums: List[int]) -> int:
        return n * (n + 1) // 2 - sum(nums)`,
  },
  "merge-sorted": {
    cpp: s`class Solution {
public:
    vector<int> mergeSorted(vector<int>& a, vector<int>& b) {
        vector<int> r;
        merge(a.begin(), a.end(), b.begin(), b.end(), back_inserter(r));
        return r;
    }
};`,
    java: s`class Solution {
    public int[] mergeSorted(int[] a, int[] b) {
        int[] r = new int[a.length + b.length];
        int i = 0, j = 0, k = 0;
        while (i < a.length || j < b.length) r[k++] = (j == b.length || (i < a.length && a[i] <= b[j])) ? a[i++] : b[j++];
        return r;
    }
}`,
    python: s`class Solution:
    def mergeSorted(self, a: List[int], b: List[int]) -> List[int]:
        return sorted(a + b)`,
  },
  "symmetric-matrix": {
    cpp: s`class Solution {
public:
    bool isSymmetric(vector<vector<int>>& matrix) {
        int n = matrix.size();
        for (int i = 0; i < n; i++) for (int j = 0; j < i; j++) if (matrix[i][j] != matrix[j][i]) return false;
        return true;
    }
};`,
    java: s`class Solution {
    public boolean isSymmetric(int[][] matrix) {
        int n = matrix.length;
        for (int i = 0; i < n; i++) for (int j = 0; j < i; j++) if (matrix[i][j] != matrix[j][i]) return false;
        return true;
    }
}`,
    python: s`class Solution:
    def isSymmetric(self, matrix: List[List[int]]) -> bool:
        return all(list(r) == c for r, c in zip(zip(*matrix), matrix))`,
  },
  "pairs-target-sum": {
    cpp: s`class Solution {
public:
    long long countPairs(vector<int>& nums, long long target) {
        unordered_map<long long, long long> seen;
        long long c = 0;
        for (int x : nums) { auto it = seen.find(target - x); if (it != seen.end()) c += it->second; seen[x]++; }
        return c;
    }
};`,
    java: s`class Solution {
    public long countPairs(int[] nums, long target) {
        Map<Long, Long> seen = new HashMap<>();
        long c = 0;
        for (int x : nums) { c += seen.getOrDefault(target - x, 0L); seen.merge((long) x, 1L, Long::sum); }
        return c;
    }
}`,
    python: s`class Solution:
    def countPairs(self, nums: List[int], target: int) -> int:
        seen = {}
        c = 0
        for x in nums:
            c += seen.get(target - x, 0)
            seen[x] = seen.get(x, 0) + 1
        return c`,
  },
  "matrix-row-col-max": {
    cpp: s`class Solution {
public:
    long long rowColMax(vector<vector<int>>& grid) {
        int n = grid.size(), m = grid[0].size();
        vector<long long> r(n, 0), c(m, 0);
        for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) { r[i] += grid[i][j]; c[j] += grid[i][j]; }
        return *max_element(r.begin(), r.end()) + *max_element(c.begin(), c.end());
    }
};`,
    java: s`class Solution {
    public long rowColMax(int[][] grid) {
        int n = grid.length, m = grid[0].length;
        long[] r = new long[n], c = new long[m];
        for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) { r[i] += grid[i][j]; c[j] += grid[i][j]; }
        return Arrays.stream(r).max().getAsLong() + Arrays.stream(c).max().getAsLong();
    }
}`,
    python: s`class Solution:
    def rowColMax(self, grid: List[List[int]]) -> int:
        return max(map(sum, grid)) + max(map(sum, zip(*grid)))`,
  },
  "dsa-min-max": {
    cpp: s`class Solution {
public:
    vector<int> minMax(vector<int>& temps) {
        int lo = temps[0], hi = temps[0];
        for (int t : temps) { lo = min(lo, t); hi = max(hi, t); }
        return {lo, hi};
    }
};`,
    java: s`class Solution {
    public int[] minMax(int[] temps) {
        int lo = temps[0], hi = temps[0];
        for (int t : temps) { lo = Math.min(lo, t); hi = Math.max(hi, t); }
        return new int[] {lo, hi};
    }
}`,
    python: s`class Solution:
    def minMax(self, temps: List[int]) -> List[int]:
        return [min(temps), max(temps)]`,
  },
  "dsa-reverse-array": {
    cpp: s`class Solution {
public:
    vector<int> reverseArray(vector<int>& nums) {
        for (int i = 0, j = (int)nums.size() - 1; i < j; i++, j--) swap(nums[i], nums[j]);
        return nums;
    }
};`,
    java: s`class Solution {
    public int[] reverseArray(int[] nums) {
        for (int i = 0, j = nums.length - 1; i < j; i++, j--) { int t = nums[i]; nums[i] = nums[j]; nums[j] = t; }
        return nums;
    }
}`,
    python: s`class Solution:
    def reverseArray(self, nums: List[int]) -> List[int]:
        i, j = 0, len(nums) - 1
        while i < j:
            nums[i], nums[j] = nums[j], nums[i]
            i, j = i + 1, j - 1
        return nums`,
  },
  "dsa-is-sorted": {
    cpp: s`class Solution {
public:
    bool isSorted(vector<int>& nums) {
        for (size_t i = 1; i < nums.size(); i++) if (nums[i] < nums[i - 1]) return false;
        return true;
    }
};`,
    java: s`class Solution {
    public boolean isSorted(int[] nums) {
        for (int i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) return false;
        return true;
    }
}`,
    python: s`class Solution:
    def isSorted(self, nums: List[int]) -> bool:
        return all(a <= b for a, b in zip(nums, nums[1:]))`,
  },
  "dsa-max-consecutive-ones": {
    cpp: s`class Solution {
public:
    int maxConsecutiveOnes(vector<int>& nums) {
        int best = 0, cur = 0;
        for (int x : nums) { cur = x == 1 ? cur + 1 : 0; best = max(best, cur); }
        return best;
    }
};`,
    java: s`class Solution {
    public int maxConsecutiveOnes(int[] nums) {
        int best = 0, cur = 0;
        for (int x : nums) { cur = x == 1 ? cur + 1 : 0; best = Math.max(best, cur); }
        return best;
    }
}`,
    python: s`class Solution:
    def maxConsecutiveOnes(self, nums: List[int]) -> int:
        best = cur = 0
        for x in nums:
            cur = cur + 1 if x == 1 else 0
            best = max(best, cur)
        return best`,
  },
  "dsa-remove-duplicates-sorted": {
    cpp: s`class Solution {
public:
    vector<int> removeDuplicates(vector<int>& nums) {
        int k = 1;
        for (size_t i = 1; i < nums.size(); i++) if (nums[i] != nums[k - 1]) nums[k++] = nums[i];
        nums.resize(k);
        return nums;
    }
};`,
    java: s`class Solution {
    public int[] removeDuplicates(int[] nums) {
        int k = 1;
        for (int i = 1; i < nums.length; i++) if (nums[i] != nums[k - 1]) nums[k++] = nums[i];
        return Arrays.copyOf(nums, k);
    }
}`,
    python: s`class Solution:
    def removeDuplicates(self, nums: List[int]) -> List[int]:
        k = 1
        for i in range(1, len(nums)):
            if nums[i] != nums[k - 1]:
                nums[k] = nums[i]
                k += 1
        return nums[:k]`,
  },
  "dsa-rotate-right": {
    cpp: s`class Solution {
public:
    vector<int> rotateRight(vector<int>& nums, long long k) {
        int n = nums.size();
        k %= n;
        reverse(nums.begin(), nums.end());
        reverse(nums.begin(), nums.begin() + k);
        reverse(nums.begin() + k, nums.end());
        return nums;
    }
};`,
    java: s`class Solution {
    public int[] rotateRight(int[] nums, long k) {
        int n = nums.length, r = (int) (k % n);
        int[] out = new int[n];
        for (int i = 0; i < n; i++) out[(i + r) % n] = nums[i];
        return out;
    }
}`,
    python: s`class Solution:
    def rotateRight(self, nums: List[int], k: int) -> List[int]:
        k %= len(nums)
        return nums[-k:] + nums[:-k] if k else nums`,
  },
  "genc-festival-switch": {
    cpp: s`class Solution {
public:
    long long festivalMode(int b, long long value) {
        for (int i = 2; i <= b; i += 2) value ^= 1LL << (i - 1);
        return value;
    }
};`,
    java: s`class Solution {
    public long festivalMode(int b, long value) {
        for (int i = 2; i <= b; i += 2) value ^= 1L << (i - 1);
        return value;
    }
}`,
    python: s`class Solution:
    def festivalMode(self, b: int, value: int) -> int:
        for i in range(2, b + 1, 2):
            value ^= 1 << (i - 1)
        return value`,
  },
  "genc-locker-splits": {
    cpp: s`class Solution {
public:
    long long countSplits(string code, int k) {
        const long long M = 1000000007;
        long long a = 1, b = 0; // ways for the prefix ending one and two digits back
        for (size_t i = 0; i < code.size(); i++) {
            int d = code[i] - '0';
            long long cur = (d >= 1 && d <= k) ? a : 0;
            if (i > 0 && code[i - 1] != '0' && (code[i - 1] - '0') * 10 + d <= k) cur = (cur + b) % M;
            b = a; a = cur;
        }
        return a;
    }
};`,
    java: s`class Solution {
    public long countSplits(String code, int k) {
        final long M = 1_000_000_007L;
        long a = 1, b = 0;
        for (int i = 0; i < code.length(); i++) {
            int d = code.charAt(i) - '0';
            long cur = (d >= 1 && d <= k) ? a : 0;
            if (i > 0 && code.charAt(i - 1) != '0' && (code.charAt(i - 1) - '0') * 10 + d <= k) cur = (cur + b) % M;
            b = a; a = cur;
        }
        return a;
    }
}`,
    python: s`class Solution:
    def countSplits(self, code: str, k: int) -> int:
        a, b = 1, 0
        for i, ch in enumerate(code):
            cur = a if 1 <= int(ch) <= k else 0
            if i > 0 and code[i - 1] != "0" and int(code[i - 1:i + 1]) <= k:
                cur += b
            a, b = cur % 1000000007, a
        return a`,
  },
  "genc-heavy-left": {
    cpp: s`class Solution {
public:
    int heavyLeftCuts(vector<long long>& nums) {
        long long total = 0, left = 0;
        for (long long x : nums) total += x;
        int c = 0;
        for (size_t i = 0; i + 1 < nums.size(); i++) { left += nums[i]; if (left > total - left) c++; }
        return c;
    }
};`,
    java: s`class Solution {
    public int heavyLeftCuts(long[] nums) {
        long total = 0, left = 0;
        for (long x : nums) total += x;
        int c = 0;
        for (int i = 0; i + 1 < nums.length; i++) { left += nums[i]; if (left > total - left) c++; }
        return c;
    }
}`,
    python: s`class Solution:
    def heavyLeftCuts(self, nums: List[int]) -> int:
        total, left, c = sum(nums), 0, 0
        for x in nums[:-1]:
            left += x
            c += left > total - left
        return c`,
  },
  "genc-vowel-gap": {
    cpp: s`class Solution {
public:
    int vowelGap(string s) {
        int c[26] = {0};
        for (char ch : s) c[ch - 'a']++;
        int hv = INT_MIN, lc = INT_MAX;
        for (int i = 0; i < 26; i++) {
            if (!c[i]) continue;
            char ch = 'a' + i;
            if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') hv = max(hv, c[i]); else lc = min(lc, c[i]);
        }
        return hv - lc;
    }
};`,
    java: s`class Solution {
    public int vowelGap(String s) {
        int[] c = new int[26];
        for (char ch : s.toCharArray()) c[ch - 'a']++;
        int hv = Integer.MIN_VALUE, lc = Integer.MAX_VALUE;
        for (int i = 0; i < 26; i++) {
            if (c[i] == 0) continue;
            if ("aeiou".indexOf('a' + i) >= 0) hv = Math.max(hv, c[i]); else lc = Math.min(lc, c[i]);
        }
        return hv - lc;
    }
}`,
    python: s`class Solution:
    def vowelGap(self, s: str) -> int:
        c = {ch: s.count(ch) for ch in set(s)}
        return max(n for ch, n in c.items() if ch in "aeiou") - min(n for ch, n in c.items() if ch not in "aeiou")`,
  },
  "genc-running-echo": {
    cpp: s`class Solution {
public:
    string runningEcho(string s) {
        int c[26] = {0};
        string r;
        for (size_t i = 0; i < s.size(); i++) { if (i) r += '+'; r += string(++c[s[i] - 'a'], s[i]); }
        return r;
    }
};`,
    java: s`class Solution {
    public String runningEcho(String s) {
        int[] c = new int[26];
        StringBuilder r = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (i > 0) r.append('+');
            r.append(String.valueOf(ch).repeat(++c[ch - 'a']));
        }
        return r.toString();
    }
}`,
    python: s`class Solution:
    def runningEcho(self, s: str) -> str:
        seen, out = {}, []
        for ch in s:
            seen[ch] = seen.get(ch, 0) + 1
            out.append(ch * seen[ch])
        return "+".join(out)`,
  },
  "genc-ascii-gap": {
    cpp: s`class Solution {
public:
    string gapPair(string s, int k) {
        for (size_t i = 0; i < s.size(); i++)
            for (size_t j = i + 1; j < s.size(); j++)
                if (abs(s[i] - s[j]) == k) return string{s[i], s[j]};
        return "-1";
    }
};`,
    java: s`class Solution {
    public String gapPair(String s, int k) {
        for (int i = 0; i < s.length(); i++)
            for (int j = i + 1; j < s.length(); j++)
                if (Math.abs(s.charAt(i) - s.charAt(j)) == k) return "" + s.charAt(i) + s.charAt(j);
        return "-1";
    }
}`,
    python: s`class Solution:
    def gapPair(self, s: str, k: int) -> str:
        for i in range(len(s)):
            for j in range(i + 1, len(s)):
                if abs(ord(s[i]) - ord(s[j])) == k:
                    return s[i] + s[j]
        return "-1"`,
  },
  "genc-unique-min-grid": {
    cpp: s`class Solution {
public:
    int smallestOneOff(vector<vector<int>>& grid) {
        map<int, int> c;
        for (auto& r : grid) for (int x : r) c[x]++;
        for (auto& [x, k] : c) if (x > 0 && k == 1) return x;
        return -1;
    }
};`,
    java: s`class Solution {
    public int smallestOneOff(int[][] grid) {
        TreeMap<Integer, Integer> c = new TreeMap<>();
        for (int[] r : grid) for (int x : r) c.merge(x, 1, Integer::sum);
        for (Map.Entry<Integer, Integer> e : c.entrySet()) if (e.getKey() > 0 && e.getValue() == 1) return e.getKey();
        return -1;
    }
}`,
    python: s`class Solution:
    def smallestOneOff(self, grid: List[List[int]]) -> int:
        flat = [x for r in grid for x in r]
        once = [x for x in set(flat) if x > 0 and flat.count(x) == 1]
        return min(once) if once else -1`,
  },
  "genc-step-sequence": {
    cpp: s`class Solution {
public:
    vector<long long> stepSequence(int n, vector<long long>& first) {
        vector<long long> t = first;
        while ((int)t.size() < n) t.push_back(t.back() + t[t.size() - 3]);
        t.resize(n);
        return t;
    }
};`,
    java: s`class Solution {
    public long[] stepSequence(int n, long[] first) {
        long[] t = new long[Math.max(n, 4)];
        for (int i = 0; i < 4; i++) t[i] = first[i];
        for (int i = 4; i < n; i++) t[i] = t[i - 1] + t[i - 3];
        return Arrays.copyOf(t, n);
    }
}`,
    python: s`class Solution:
    def stepSequence(self, n: int, first: List[int]) -> List[int]:
        t = list(first)
        while len(t) < n:
            t.append(t[-1] + t[-3])
        return t[:n]`,
  },
};
