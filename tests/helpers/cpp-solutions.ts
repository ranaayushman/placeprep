/** Reference solutions: compiled and run against every test, so the hidden tests are proven right. */
export const SOLUTIONS: Record<string, string> = {
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
  "perfect-number": `#include <bits/stdc++.h>
using namespace std;int main(){long long n;cin>>n;long long s=0;for(long long i=1;i<n;i++)if(n%i==0)s+=i;cout<<(n>1&&s==n?"Perfect":"Not Perfect")<<"\\n";}`,
  "sum-of-two-primes": `#include <bits/stdc++.h>
using namespace std;int main(){int n;cin>>n;vector<bool>p(n+1,true);p[0]=p[1]=false;for(int i=2;i*i<=n;i++)if(p[i])for(int j=i*i;j<=n;j+=i)p[j]=false;for(int a=2;a<=n/2;a++)if(p[a]&&p[n-a]){cout<<a<<" and "<<n-a<<"\\n";return 0;}}`,
  "class-monitor": `#include <bits/stdc++.h>
using namespace std;int main(){int n;cin>>n;long long m;cin>>m;int c=0;for(int i=1;i<n;i++){long long x;cin>>x;if(x<m){m=x;c++;}}cout<<c<<"\\n";}`,
  "string-alternation": `#include <bits/stdc++.h>
using namespace std;int main(){string a,b,r;cin>>a>>b;for(size_t i=0;i<a.size()||i<b.size();i++){if(i<a.size())r+=a[i];if(i<b.size())r+=b[i];}cout<<r<<"\\n";}`,
  "k-set-bits": `#include <bits/stdc++.h>
using namespace std;int main(){long long n;int k;cin>>n>>k;long long c=0;for(long long x=1;x<n;x++)if(__builtin_popcountll(x)==k)c++;cout<<c<<"\\n";}`,
  "odd-sum-subarrays": `#include <bits/stdc++.h>
using namespace std;int main(){int n;cin>>n;vector<long long>a(n);for(auto&x:a)cin>>x;long long c=0;for(int i=0;i<n;i++){long long s=0;for(int j=i;j<n;j++){s+=a[j];if(s%2)c++;}}cout<<c<<"\\n";}`,
  "longest-palindrome": `#include <bits/stdc++.h>
using namespace std;int main(){string s;cin>>s;int n=s.size(),best=1;for(int i=0;i<n;i++)for(int j=i;j<n;j++){bool ok=true;for(int a=i,b=j;a<b;a++,b--)if(s[a]!=s[b]){ok=false;break;}if(ok)best=max(best,j-i+1);}cout<<best<<"\\n";}`,
  "kth-largest": `#include <bits/stdc++.h>
using namespace std;int main(){int n,k;cin>>n>>k;vector<long long>a(n);for(auto&x:a)cin>>x;sort(a.rbegin(),a.rend());cout<<a[k-1]<<"\\n";}`,
  "count-inversions": `#include <bits/stdc++.h>
using namespace std;int main(){int n;cin>>n;vector<long long>a(n);for(auto&x:a)cin>>x;long long c=0;for(int i=0;i<n;i++)for(int j=i+1;j<n;j++)if(a[i]>a[j])c++;cout<<c<<"\\n";}`,
  // GenC pool
  "char-frequency": `#include <bits/stdc++.h>
using namespace std;int main(){string s;cin>>s;map<char,int>c;string order;for(char ch:s){if(!c.count(ch))order+=ch;c[ch]++;}for(char ch:order)cout<<ch<<" "<<c[ch]<<"\\n";}`,
  "string-match": `#include <bits/stdc++.h>
using namespace std;int main(){string t,p;cin>>t>>p;int c=0;for(size_t i=0;i+p.size()<=t.size();i++)if(t.compare(i,p.size(),p)==0)c++;cout<<c<<"\\n";}`,
  "first-non-repeating": `#include <bits/stdc++.h>
using namespace std;int main(){string s;cin>>s;int c[26]={0};for(char ch:s)c[ch-'a']++;for(char ch:s)if(c[ch-'a']==1){cout<<ch<<"\\n";return 0;}cout<<-1<<"\\n";}`,
  "missing-number": `#include <bits/stdc++.h>
using namespace std;int main(){long long n,x,s=0;cin>>n;while(cin>>x)s+=x;cout<<n*(n+1)/2-s<<"\\n";}`,
  "merge-sorted": `#include <bits/stdc++.h>
using namespace std;int main(){int n;cin>>n;vector<long long>a(n);for(auto&x:a)cin>>x;int m;cin>>m;vector<long long>b(m);for(auto&x:b)cin>>x;a.insert(a.end(),b.begin(),b.end());sort(a.begin(),a.end());for(size_t i=0;i<a.size();i++)cout<<(i?" ":"")<<a[i];cout<<"\\n";}`,
  "symmetric-matrix": `#include <bits/stdc++.h>
using namespace std;int main(){int n;cin>>n;vector<vector<long long>>a(n,vector<long long>(n));for(auto&r:a)for(auto&x:r)cin>>x;for(int i=0;i<n;i++)for(int j=0;j<n;j++)if(a[i][j]!=a[j][i]){cout<<"NO\\n";return 0;}cout<<"YES\\n";}`,
  "pairs-target-sum": `#include <bits/stdc++.h>
using namespace std;int main(){int n;cin>>n;vector<long long>a(n);for(auto&x:a)cin>>x;long long t,c=0;cin>>t;for(int i=0;i<n;i++)for(int j=i+1;j<n;j++)if(a[i]+a[j]==t)c++;cout<<c<<"\\n";}`,
  "matrix-row-col-max": `#include <bits/stdc++.h>
using namespace std;int main(){int n,m;cin>>n>>m;vector<long long>r(n,0),c(m,0);for(int i=0;i<n;i++)for(int j=0;j<m;j++){long long x;cin>>x;r[i]+=x;c[j]+=x;}cout<<*max_element(r.begin(),r.end())+*max_element(c.begin(),c.end())<<"\\n";}`,
};
