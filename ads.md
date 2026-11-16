# PlacePrep — AdSense Readiness & SEO Improvement Report

**Website:** https://www.placeprep.me  
**Repository:** https://github.com/ranaayushman/placeprep  
**Report date:** 15 November 2026  
**Scope:** Source-code review, AdSense implementation, SEO, public content strategy, cookie consent, and technical recommendations.

---

# 1. Executive Summary

PlacePrep already has a reasonable technical foundation for monetisation.

The application includes:

- Google AdSense publisher verification metadata.
- A valid-looking `ads.txt` publisher declaration.
- A custom cookie-consent implementation.
- An AdSense component that checks advertising consent.
- An exclusion for active mock-test pages.
- Privacy, Terms, and Cookie Policy pages.
- A generated sitemap and robots configuration.

However, there is one important architectural weakness:

**Most of the current product experience is behind authentication, while the public website has relatively little independently useful educational content.**

This creates a discoverability and monetisation problem.

A placement-preparation platform should not depend entirely on its logged-in application for search traffic. It should also function as a useful educational resource for students who have not registered.

My recommendation is to develop PlacePrep into two connected products:

1. **Public educational website:** Searchable company guides, aptitude tutorials, worked examples, and preparation resources.
2. **Authenticated practice platform:** Mock exams, topic drills, analytics, progress tracking, and coding exercises.

The public website should attract students through useful content. The application should convert interested visitors into active users.

Do not compromise the student experience by filling active tests with advertisements.

---

# 2. Current Technical Assessment

The following findings are based on the repository files inspected during the review. They are not a full production penetration test or live Google crawler simulation.

## 2.1 Application architecture

The repository uses:

- Next.js 15
- React 19
- TypeScript
- PostgreSQL
- Drizzle ORM
- Supabase
- Tailwind CSS
- Vitest

The project has a reasonably clear separation between public routes, authenticated application routes, shared components, and business logic.

This is a good foundation for adding public SEO pages without rebuilding the existing application.

## 2.2 AdSense publisher verification

**File:** `src/app/layout.tsx`

The metadata contains:

`google-adsense-account: ca-pub-1010726208873742`

**Finding:** Publisher verification metadata is already present.

**Recommendation:** Keep this declaration. Do not add another competing publisher-verification implementation without a specific reason.

The publisher ID is also present in `public/ads.txt`:

`google.com, pub-1010726208873742, DIRECT, f08c47fec0942fa0`

The publisher ID matches the metadata.

**Action:** Verify that the deployed URL `https://www.placeprep.me/ads.txt` returns HTTP 200 and contains the expected entry.

Also confirm that the AdSense account itself reports the site as verified. Source-code presence alone does not establish account verification.

---

# 3. Ad Placement Architecture

## 3.1 Existing implementation

**File:** `src/components/AdSlot.tsx`

The component currently:

- Checks the saved advertising preference.
- Listens for consent updates.
- Loads the AdSense script after the user allows advertising.
- Requires an ad slot ID.
- Avoids rendering on routes beginning with `/attempt`.
- Handles ad-blocker-related push failures.

This is a useful starting point.

## 3.2 Current placement problem

**File:** `src/app/(app)/dashboard/page.tsx`

The inspected dashboard contains:

`<AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD} ... />`

This is an authenticated page.

A public crawler cannot normally access the dashboard as an authenticated student. Consequently, this is not a good primary location for establishing public advertising inventory.

The public homepage does not currently contain an AdSlot placement.

## 3.3 Recommended placement strategy

| Page | Advertising recommendation |
|---|---|
| Homepage | Optional, unobtrusive placement |
| Company preparation guides | Recommended |
| Aptitude tutorials | Recommended |
| Worked examples | Optional, carefully positioned |
| Public practice explanations | Optional |
| Login | Avoid |
| Registration | Avoid |
| Dashboard | Low priority |
| Active mock tests | Never |
| Coding editor | Never |
| Exam results | Avoid intrusive advertising |

The objective is not to maximise the number of ads.

The objective is to create a useful public website with appropriate advertising opportunities.

## 3.4 Recommended component architecture

Keep one reusable AdSlot component.

Use different environment variables for different placements:

- `NEXT_PUBLIC_ADSENSE_SLOT_HOME`
- `NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE`
- `NEXT_PUBLIC_ADSENSE_SLOT_COMPANY`
- `NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD`

Do not hardcode individual slot IDs inside page components.

Create a consistent placement system so that ads can be enabled or disabled independently.

Important implementation requirement:

The current component uses a `pushed` ref to avoid repeated pushes. Before introducing client-side route navigation or multiple ad placements, test the component carefully. Each rendered ad unit must be initialised correctly, without duplicate pushes or accidental reuse of an existing ad element.

Also, do not assume that loading the script after consent automatically satisfies every Google consent requirement. Review the applicable Google consent requirements for your target regions and configure the relevant consent mechanism.

---

# 4. Cookie Consent Review

**File:** `src/components/CookieConsent.tsx`

The current implementation supports four categories:

1. Necessary
2. Preferences
3. Analytics
4. Advertising

It includes:

- Accept all
- Necessary only
- Customise
- Save preferences
- Reject non-essential

This is a good foundation.

## 4.1 What should be improved

### A. Initial banner wording

The initial banner currently discusses necessary, preference, and performance cookies, but advertising cookies are not clearly explained there.

Suggested wording:

"We use necessary cookies to keep PlacePrep secure and functional. With your permission, we may also use optional analytics and advertising technologies to improve the platform and display relevant ads."

### B. Consent persistence

The consent implementation stores the user's choice in local storage and a cookie.

Review the following:

- Whether consent expiry is enforced.
- Whether users can withdraw consent.
- Whether changes are respected by every optional tracking integration.
- Whether the cookie is configured with appropriate security attributes.
- Whether consent is refreshed when the policy or purposes materially change.

### C. Advertising consent

The AdSlot component checks the advertising preference before loading the script.

Keep this behaviour consistent across all public pages.

### D. Google consent requirements

Check Google's current consent requirements for the regions in which PlacePrep operates.

If applicable, use a Google-certified consent management platform and the required consent signals. A custom banner should not be assumed to satisfy every regional requirement merely because it has an accept and reject button.

---

# 5. SEO Architecture

## 5.1 Current sitemap

**File:** `src/app/sitemap.ts`

The current sitemap includes:

- `/`
- `/login`
- `/register`
- `/privacy`
- `/terms`
- `/cookies`

The sitemap is valid as a starting point, but it does not expose the educational content structure that PlacePrep needs to build organic search traffic.

## 5.2 Recommended sitemap

The sitemap should eventually contain:

```text
/
├── companies/
│   ├── infosys/
│   ├── capgemini/
│   ├── tcs-nqt/
│   ├── cognizant/
│   ├── accenture/
│   └── wipro/
│
├── aptitude/
│   ├── percentages/
│   ├── profit-and-loss/
│   ├── time-and-work/
│   ├── probability/
│   ├── permutations-and-combinations/
│   ├── speed-distance-time/
│   └── averages/
│
├── reasoning/
│   ├── syllogism/
│   ├── blood-relations/
│   ├── seating-arrangement/
│   └── number-series/
│
├── programming/
│   ├── pseudocode/
│   ├── arrays/
│   ├── strings/
│   └── basic-programming/
│
├── resources/
│   ├── placement-preparation-roadmap/
│   ├── aptitude-preparation-strategy/
│   └── placement-interview-preparation/
│
├── privacy/
├── terms/
└── cookies/
```

This is a proposed structure, not a recommendation to create empty pages for every route.

Only publish pages that contain original, complete, useful material.

## 5.3 Login and registration indexing

Consider removing `/login` and `/register` from the sitemap.

They are functional account pages, not educational landing pages.

You can also consider setting an appropriate `noindex` directive on these pages.

Do not block them in `robots.txt` if search engines need to crawl the page to see the `noindex` directive.

## 5.4 Canonical URLs

The application uses:

`https://www.placeprep.me`

as its default metadata base URL.

Make sure this matches the canonical version of the production domain.

Choose one version:

- `https://www.placeprep.me`
- `https://placeprep.me`

Redirect the other version permanently to the preferred host.

All sitemap URLs, canonical tags, Open Graph URLs, and internal links should use the same preferred host.

---

# 6. Robots Configuration

**File:** `src/app/robots.ts`

The repository contains a generated robots configuration.

It allows general crawling and disallows several authenticated routes, including:

- `/admin/`
- `/api/`
- `/dashboard/`
- `/practice/`
- `/mock/`
- `/attempt/`
- `/results/`
- `/analytics/`
- `/history/`
- `/community/`

This is a reasonable starting point.

However, robots.txt is not an access-control mechanism.

Authentication and server-side authorisation must continue to protect private data.

Recommended checks:

- Visit `/robots.txt` in production.
- Confirm that `/sitemap.xml` is referenced correctly.
- Confirm that public guides are crawlable.
- Confirm that private API and account information are not exposed.
- Check that the deployed robots file reflects the current application routes.

---

# 7. The Most Important Improvement: Public Educational Content

This is where I would invest most of the development effort.

The homepage currently explains what PlacePrep does, why students should use it, and how the mock experience works.

That is useful for conversion.

However, students often search for answers to much more specific questions.

Examples:

- How to prepare for Capgemini placement tests?
- What topics are asked in Infosys aptitude?
- How to solve percentage questions quickly?
- What is the difference between permutations and combinations?
- How to prepare for pseudocode assessments?
- How to prepare for TCS NQT?

PlacePrep should have useful pages that answer these questions.

## 7.1 First five pages to build

### Page 1: Infosys Placement Preparation

Suggested URL:

`/companies/infosys`

Content:

- Overview of the assessment.
- Section-wise preparation.
- Important aptitude topics.
- Practice strategy.
- Original worked examples.
- Common mistakes.
- Frequently asked questions.
- Links to relevant PlacePrep practice sections.

Be careful to distinguish publicly documented information from reported or historical exam patterns. Company assessments can change.

### Page 2: Capgemini Placement Preparation

Suggested URL:

`/companies/capgemini`

Content:

- Assessment preparation overview.
- Quantitative aptitude.
- Logical reasoning.
- English communication.
- Pseudocode and technical assessment preparation.
- Original sample problems.
- Preparation roadmap.

Clearly identify the assessment version and date of any pattern information. Do not claim that an old pattern is the current official format.

### Page 3: Percentages

Suggested URL:

`/aptitude/percentages`

Content:

- Percentage fundamentals.
- Fraction-to-percentage conversions.
- Percentage increase and decrease.
- Successive percentage changes.
- Solved examples.
- Common shortcuts.
- Practice questions.

### Page 4: Time and Work

Suggested URL:

`/aptitude/time-and-work`

Content:

- Work-rate fundamentals.
- Individual and combined work.
- Efficiency-based questions.
- Pipes and cisterns.
- Solved examples.
- Practice exercises.

### Page 5: Probability

Suggested URL:

`/aptitude/probability`

Content:

- Basic probability.
- Sample spaces.
- Independent events.
- Mutually exclusive events.
- Conditional probability.
- Placement-style solved questions.

## 7.2 Recommended content quality

Every educational page should provide:

1. A clear explanation.
2. Original examples.
3. Step-by-step solutions.
4. Common mistakes.
5. A useful practice opportunity.
6. Relevant internal links.
7. A meaningful FAQ section where appropriate.
8. A last-reviewed date when the subject can change.

Avoid generating dozens of shallow pages with only a changed company name or topic heading.

The content should genuinely help a student even if they never register.

---

# 8. Public Website and Application Separation

I recommend keeping the current application architecture.

There is no need to rebuild PlacePrep.

Instead, expand the public side of the existing Next.js application.

A possible structure:

```text
src/
├── app/
│   ├── page.tsx
│   │
│   ├── companies/
│   │   ├── page.tsx
│   │   ├── infosys/
│   │   │   └── page.tsx
│   │   ├── capgemini/
│   │   │   └── page.tsx
│   │   └── tcs-nqt/
│   │       └── page.tsx
│   │
│   ├── aptitude/
│   │   ├── page.tsx
│   │   ├── percentages/
│   │   │   └── page.tsx
│   │   ├── time-and-work/
│   │   │   └── page.tsx
│   │   └── probability/
│   │       └── page.tsx
│   │
│   ├── resources/
│   │   └── ...
│   │
│   └── (app)/
│       ├── dashboard/
│       ├── practice/
│       ├── mock/
│       └── ...
│
├── components/
│   ├── AdSlot.tsx
│   ├── CookieConsent.tsx
│   ├── ArticleLayout.tsx
│   ├── Breadcrumbs.tsx
│   └── TableOfContents.tsx
│
└── lib/
    └── content/
        └── ...
```

Prefer server-rendered public educational pages with descriptive metadata.

The existing authenticated application should remain protected by its current server-side authentication and authorisation checks.

---

# 9. Metadata and Structured Data

The current homepage has:

- Title and description.
- Canonical URL.
- Open Graph metadata.
- Twitter card metadata.
- WebSite structured data.
- EducationalOrganization structured data.
- Course structured data.

This is a good foundation.

For the new pages, add appropriate metadata:

- Unique page title.
- Unique meta description.
- Canonical URL.
- Open Graph title and description.
- Relevant social image.

Use structured data only where it accurately describes the visible content.

Potential schema types:

| Page | Potential schema |
|---|---|
| Homepage | WebSite, Organization |
| Company guide | Article, BreadcrumbList |
| Aptitude tutorial | Article, BreadcrumbList |
| Resource index | CollectionPage |
| Public practice page | Relevant educational schema where accurate |

Do not add fake ratings, fabricated reviews, or misleading structured data.

Structured data does not guarantee a rich search result.

---

# 10. Performance and Technical SEO

The repository uses Next.js standalone output and a fairly modern frontend stack.

This is a reasonable base, but production performance still needs measurement.

Recommended checks:

### Core Web Vitals

Measure:

- Largest Contentful Paint (LCP).
- Interaction to Next Paint (INP).
- Cumulative Layout Shift (CLS).

### Frontend

- Optimise images.
- Avoid loading unnecessary JavaScript on public articles.
- Use server components where possible.
- Avoid large client-side dependencies for simple educational pages.
- Lazy-load non-critical elements.
- Prevent advertisements from causing layout shifts by reserving appropriate space.

### Technical SEO

- Check HTTP status codes.
- Check canonical tags.
- Check redirects.
- Check sitemap validity.
- Check mobile rendering.
- Check internal links.
- Check duplicate titles and descriptions.
- Check for accidental `noindex` directives.

Use Google Search Console and PageSpeed Insights to measure the deployed website rather than assuming that source-code configuration guarantees good results.

---

# 11. Policy and Trust Improvements

The repository already contains Privacy, Terms, and Cookie Policy pages.

The Privacy Policy explains:

- Account information.
- Assessment data.
- Camera processing.
- Third-party services.
- Advertising.
- Data rights.

The Terms also contain a non-affiliation disclaimer.

These are useful foundations.

Before monetisation, check that all claims accurately describe the actual production implementation.

In particular:

- Confirm that camera processing behaves exactly as described.
- Confirm that advertising consent controls every advertising integration.
- Confirm that the named third-party providers are actually used.
- Confirm that data retention and deletion statements match backend behaviour.
- Confirm that support contact details are monitored.

Avoid making absolute privacy or security promises unless the implementation supports them.

---

# 12. Google Search Console and AdSense Monitoring

## Search Console

After publishing the new public pages:

1. Verify the correct domain property.
2. Submit the sitemap.
3. Inspect the homepage.
4. Inspect each newly published guide.
5. Request indexing for important new pages.
6. Monitor indexing reports.
7. Monitor search queries and impressions.
8. Fix crawl errors and canonical issues.

Do not repeatedly request indexing for the same URL without meaningful changes.

## AdSense

After publishing the improvements:

1. Confirm the publisher metadata is accessible.
2. Confirm `ads.txt` is accessible.
3. Confirm the preferred domain works.
4. Confirm public pages load without authentication.
5. Confirm privacy and cookie disclosures are accurate.
6. Confirm that advertisements are not injected into active mock tests.
7. Allow Google to crawl and review the updated site.

Your current review status was previously reported as "Getting ready" and the application had been under review for less than seven days.

That status alone does not establish a rejection or a technical failure.

There is no guaranteed approval timeline, and these improvements cannot guarantee approval.

---

# 13. Implementation Roadmap

## Phase 1 — Technical foundation

**Priority: Critical**

- [ ] Verify production `ads.txt`.
- [ ] Verify the AdSense verification metadata.
- [ ] Confirm canonical domain and redirects.
- [ ] Validate `/robots.txt`.
- [ ] Validate `/sitemap.xml`.
- [ ] Remove login and registration from the sitemap.
- [ ] Review cookie-consent behaviour.
- [ ] Confirm no ads appear during active tests.

## Phase 2 — Public SEO pages

**Priority: Very High**

- [ ] Create a reusable article layout.
- [ ] Create breadcrumbs.
- [ ] Create a table-of-contents component.
- [ ] Create a company-guide layout.
- [ ] Create an aptitude-guide layout.
- [ ] Publish the Infosys guide.
- [ ] Publish the Capgemini guide.
- [ ] Publish the TCS NQT guide.
- [ ] Publish the percentages tutorial.
- [ ] Publish the time-and-work tutorial.
- [ ] Publish the probability tutorial.

## Phase 3 — Search optimisation

**Priority: High**

- [ ] Add the new routes to the sitemap.
- [ ] Add unique metadata to each page.
- [ ] Add canonical URLs.
- [ ] Add internal linking.
- [ ] Add appropriate structured data.
- [ ] Check mobile responsiveness.
- [ ] Check page performance.
- [ ] Submit the updated sitemap.

## Phase 4 — Advertising

**Priority: High, after public content is ready**

- [ ] Create appropriate AdSense ad units.
- [ ] Configure slot IDs through environment variables.
- [ ] Add ad placements to suitable public pages.
- [ ] Test advertising consent.
- [ ] Test consent withdrawal.
- [ ] Verify no duplicate ad initialisation.
- [ ] Monitor ad rendering and layout shifts.

## Phase 5 — Growth

**Priority: Ongoing**

- [ ] Publish genuinely useful placement resources.
- [ ] Add more company preparation guides.
- [ ] Expand aptitude tutorials.
- [ ] Track Search Console impressions.
- [ ] Improve pages based on actual search queries.
- [ ] Track registrations from organic search.
- [ ] Improve content based on student feedback.

---

# 14. Priority Matrix

| Improvement | Impact | Priority |
|---|---|---|
| Public educational content | Very high | P0 |
| Sitemap expansion | High | P0 |
| Public ad placements | High | P1 |
| Consent and AdSense compliance review | Very high | P0 |
| Canonical domain consistency | High | P1 |
| Internal linking | High | P1 |
| Structured data | Medium | P2 |
| Article component system | High | P1 |
| Performance optimisation | High | P1 |
| More dashboard advertisements | Low | P3 |

---

# 15. Final Recommendation

I would not turn PlacePrep into a website that exists primarily to display advertisements.

The product has a stronger opportunity: become a useful placement-preparation resource for Indian students.

Think of the growth model this way:

**Search traffic → Educational content → Practice experience → Student registration → Retention**

The educational pages bring students to the website.

The free practice platform gives them a reason to stay.

The advertisements help support the infrastructure without making the learning experience worse.

Your existing application is a good starting point. The next step is not a major rewrite. It is building a proper public content layer around the existing product.

**My recommended immediate target:** finish the technical checks, publish six high-quality public guides, connect them to the practice application, and then reassess AdSense after Google has had an opportunity to crawl the updated website.

---

**Report limitations:** This document reflects a source-code review of selected repository files. It does not represent a complete security audit, live production crawl, Google Search Console inspection, AdSense account inspection, or guaranteed prediction of approval. Any implementation should be tested against the deployed application before release.