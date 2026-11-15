import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { allTests, normalizeOutput, PROBLEM_BY_ID, PROBLEMS, verdict } from "@/lib/code/problems";
import { runCode } from "@/lib/code/runner";

const has = (cmd: string) => {
  try {
    execFileSync(cmd, ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
const hasCompiler = has(process.env.CXX ?? "g++");
const hasJava = has(process.env.JAVA_HOME ? `${process.env.JAVA_HOME}/bin/javac` : "javac");

describe("problem bank", () => {
  it("has unique ids, at least one sample and three hidden tests each, and every expected output ends with a newline", () => {
    expect(new Set(PROBLEMS.map((p) => p.id)).size).toBe(PROBLEMS.length);
    for (const p of PROBLEMS) {
      expect(p.samples.length, p.id).toBeGreaterThanOrEqual(1);
      expect(p.tests.length, p.id).toBeGreaterThanOrEqual(3);
      for (const t of allTests(p)) expect(t.output.endsWith("\n"), `${p.id}: ${t.output}`).toBe(true);
    }
  });

  it("normalizes trailing whitespace but nothing else", () => {
    expect(normalizeOutput("4 5 1 \n\n")).toBe("4 5 1");
    expect(normalizeOutput("a\r\nb\r\n")).toBe("a\nb");
    expect(normalizeOutput("1\n2")).not.toBe(normalizeOutput("1 2"));
    expect(normalizeOutput("YES\n")).not.toBe(normalizeOutput("yes\n"));
  });
});

/** Reference solutions: compiled and run against every test, so the hidden tests are proven right. */
const SOLUTIONS: Record<string, string> = {
  "move-zeros": `#include <bits/stdc++.h>
using namespace std;int main(){int n;cin>>n;vector<long long>a(n);for(auto&x:a)cin>>x;vector<long long>o;int z=0;for(auto x:a){if(x)o.push_back(x);else z++;}while(z--)o.push_back(0);for(size_t i=0;i<o.size();i++)cout<<(i?" ":"")<<o[i];cout<<"\\n";}`,
  "toggle-bits": `#include <bits/stdc++.h>
using namespace std;int main(){long long n;cin>>n;int b=0;while((1LL<<b)<=n)b++;cout<<((~n)&((1LL<<b)-1))<<"\\n";}`,
  "count-near": `#include <bits/stdc++.h>
using namespace std;int main(){int n;cin>>n;vector<long long>a(n);for(auto&x:a)cin>>x;long long num,d;cin>>num>>d;int c=0;for(auto x:a)if(llabs(x-num)<=d)c++;cout<<(c?c:-1)<<"\\n";}`,
  "difference-of-sums": `#include <bits/stdc++.h>
using namespace std;int main(){long long n,m,a=0,b=0;cin>>n>>m;for(long long i=1;i<=m;i++)(i%n?a:b)+=i;cout<<a-b<<"\\n";}`,
  "sort-012": `#include <bits/stdc++.h>
using namespace std;int main(){int n;cin>>n;int c[3]={0,0,0};for(int i=0;i<n;i++){int x;cin>>x;c[x]++;}bool f=true;for(int v=0;v<3;v++)while(c[v]--){cout<<(f?"":" ")<<v;f=false;}cout<<"\\n";}`,
  "reverse-words": `#include <bits/stdc++.h>
using namespace std;int main(){string s,w;getline(cin,s);stringstream ss(s);vector<string>v;while(ss>>w)v.push_back(w);reverse(v.begin(),v.end());for(size_t i=0;i<v.size();i++)cout<<(i?" ":"")<<v[i];cout<<"\\n";}`,
  "second-largest": `#include <bits/stdc++.h>
using namespace std;int main(){int n;cin>>n;set<long long>s;for(int i=0;i<n;i++){long long x;cin>>x;s.insert(x);}if(s.size()<2){cout<<-1<<"\\n";return 0;}auto it=s.rbegin();++it;cout<<*it<<"\\n";}`,
  palindrome: `#include <bits/stdc++.h>
using namespace std;int main(){string s,t;getline(cin,s);for(char c:s)if(isalnum((unsigned char)c))t+=tolower(c);string r(t.rbegin(),t.rend());cout<<(t==r?"YES":"NO")<<"\\n";}`,
  "max-subarray": `#include <bits/stdc++.h>
using namespace std;int main(){int n;cin>>n;long long best=LLONG_MIN,cur=0;for(int i=0;i<n;i++){long long x;cin>>x;cur=max(x,cur+x);best=max(best,cur);}cout<<best<<"\\n";}`,
  "balanced-brackets": `#include <bits/stdc++.h>
using namespace std;int main(){string s;cin>>s;stack<char>st;map<char,char>m={{')','('},{']','['},{'}','{'}};for(char c:s){if(m.count(c)){if(st.empty()||st.top()!=m[c]){cout<<"NO\\n";return 0;}st.pop();}else st.push(c);}cout<<(st.empty()?"YES":"NO")<<"\\n";}`,
};

describe.skipIf(!hasCompiler)("C++ runner", () => {
  it("has a reference solution for every problem, and each passes all of its tests", async () => {
    expect(Object.keys(SOLUTIONS).sort()).toEqual(PROBLEMS.map((p) => p.id).sort());
    for (const [id, code] of Object.entries(SOLUTIONS)) {
      const tests = allTests(PROBLEM_BY_ID.get(id)!);
      const results = await runCode("cpp", code, tests.map((t) => t.input));
      results.forEach((r, i) => {
        expect(r.status, `${id} test ${i}: ${r.stderr}`).toBe("ok");
        expect(normalizeOutput(r.stdout), `${id} test ${i}`).toBe(normalizeOutput(tests[i].output));
      });
    }
  }, 120_000);

  it("reports compile errors, runtime errors, time limits and output limits", async () => {
    const [ce] = await runCode("cpp", "int main() { return 0 }", [""]);
    expect(ce.status).toBe("compile_error");
    expect(ce.stderr).toMatch(/expected|error/);
    const [re] = await runCode("cpp", "#include <cstdlib>\nint main() { std::abort(); }", [""]);
    expect(re.status).toBe("runtime_error");
    const [tle] = await runCode("cpp", "int main() { while (true) {} }", [""]);
    expect(tle.status).toBe("timeout");
    const [ole] = await runCode("cpp", "#include <cstdio>\nint main() { while (true) std::puts(\"spam\"); }", [""]);
    expect(ole.status).toBe("output_limit");
  }, 60_000);

  it("runs several inputs from one compile and feeds stdin to each", async () => {
    const results = await runCode("cpp", "#include <iostream>\nint main(){int a,b;std::cin>>a>>b;std::cout<<a+b<<std::endl;}", ["1 2\n", "10 20\n"]);
    expect(results.map((r) => [r.status, r.stdout.trim()])).toEqual([["ok", "3"], ["ok", "30"]]);
  }, 30_000);
});

const JAVA_SOLUTIONS: Record<string, string> = {
  "move-zeros": `import java.util.*;public class Main{public static void main(String[] a){Scanner s=new Scanner(System.in);int n=s.nextInt();long[] v=new long[n];int k=0;for(int i=0;i<n;i++){long x=s.nextLong();if(x!=0)v[k++]=x;}StringBuilder sb=new StringBuilder();for(int i=0;i<n;i++){sb.append(i<k?v[i]:0);sb.append(i+1<n?" ":"\\n");}System.out.print(sb);}}`,
  "balanced-brackets": `import java.util.*;public class Main{public static void main(String[] a){String s=new Scanner(System.in).next();Deque<Character> st=new ArrayDeque<>();Map<Character,Character> m=Map.of(')','(',']','[','}','{');for(char c:s.toCharArray()){if(m.containsKey(c)){if(st.isEmpty()||st.pop()!=m.get(c)){System.out.println("NO");return;}}else st.push(c);}System.out.println(st.isEmpty()?"YES":"NO");}}`,
};

describe.skipIf(!hasJava)("Java runner", () => {
  it("passes reference solutions and reports compile, runtime and time-limit errors", async () => {
    for (const [id, code] of Object.entries(JAVA_SOLUTIONS)) {
      const tests = allTests(PROBLEM_BY_ID.get(id)!);
      const results = await runCode("java", code, tests.map((t) => t.input));
      results.forEach((r, i) => {
        expect(r.status, `${id} test ${i}: ${r.stderr}`).toBe("ok");
        expect(normalizeOutput(r.stdout), `${id} test ${i}`).toBe(normalizeOutput(tests[i].output));
      });
    }
    const [ce] = await runCode("java", "public class Main { public static void main(String[] a) { int x = ; } }", [""]);
    expect(ce.status).toBe("compile_error");
    expect(ce.stderr).toContain("Main.java");
    const [re] = await runCode("java", "public class Main { public static void main(String[] a) { int[] v = new int[1]; v[2] = 0; } }", [""]);
    expect(re.status).toBe("runtime_error");
    expect(re.stderr).toContain("ArrayIndexOutOfBounds");
    const [tle] = await runCode("java", "public class Main { public static void main(String[] a) { while (true) {} } }", [""]);
    expect(tle.status).toBe("timeout");
  }, 120_000);
});

describe("verdict", () => {
  const ok = (stdout: string) => ({ status: "ok" as const, stdout });
  it("compares outputs loosely and names failures like LeetCode", () => {
    expect(verdict(ok("4 5 1 9 5 0 0 0 \n\n"), "4 5 1 9 5 0 0 0\n")).toBe("Accepted");
    expect(verdict(ok("4 5 1 9 5 0 0 0"), "4 5 1 9 5 0 0 1")).toBe("Wrong Answer");
    expect(verdict(ok("anything"))).toBe("Accepted"); // custom case: nothing to compare with
    expect(verdict({ status: "timeout", stdout: "" }, "x")).toBe("Time Limit Exceeded");
  });
});
