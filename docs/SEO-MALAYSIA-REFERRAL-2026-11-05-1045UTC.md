# Malaysia campaign referral preservation — 5 November 2026
## Source coordination
Remote main read at f71433418d695c9ca438191848536795fc22e328 after the separate sales update landed. Preserved all of its buying choices, international enquiry route, sharing kit, eligibility wording and newer changes. Existing shared worktree has unrelated pending changes and was not reset or published wholesale.

## Evidenced obstacle and bounded fix
Existing /buy/ checkout code correctly passes an incoming affiliate/coupon to Stripe. Public buy-to-affiliate and affiliate-to-buy links were bare paths, so a visitor navigating between them lost those incoming query parameters. Source confirms no equivalent propagation in global-site.js or site-language.js.

Changed only buy/index.html and affiliate-program/index.html by adding one deferred asset reference; added assets/purchase-referral-navigation.js. The helper copies the current query to same-origin links targeting these two public pages, retains repeated values and fragments, preserves explicit destination parameters, and avoids mixing an incoming coupon with a different explicit destination affiliate. No owner ID, generic referral ID, cookies, storage, requests or analytics are added. Anchor-only, Amazon, Stripe, dashboard, registration form and authentication links/code are unchanged. Propagation beyond these two page destinations remains outside this bounded fix.

Validation: deterministic Node VM checks passed affiliate/coupon/campaign propagation, duplicate query values, destination precedence, conflicting affiliate protection, fragments, external/Stripe/dashboard/mail exclusions. Existing script and form content are byte-preserved. Canonical/robots/llms/structured data and prices/commission/eligibility/payment settings unchanged.

## Fresh and reused evidence
Fresh public raw reads at 10:42:38 and 10:42:44 UTC: both HTTP 200, matching previous deployed hashes (buy 43b81966ee91b315f244ca1757998c6baed1649802edd059ef606c857fccc53e; affiliate 9e76dad5e7ad09155635a38e380a7d498be9676e0034a053a37738296a48df4e). These precede the separate f714334 update; subsequent deployment is verified below.
Fresh GEO Tool Check crawler policy read: checked AI agents allowed; curated robots unchanged.

Reuse docs/GEO-MALAYSIA-VERIFICATION-2026-11-05-1030UTC.md and docs/SEO-MALAYSIA-VERIFICATION-2026-11-05-1024UTC.md for same-day raw HTML, exact FAQ/schema checks, Keyword Tool, Parallel Search cache and Windsor target-query evidence. All seven target queries were not observed in the bounded returned dataset; not confirmed zero. Technical scores 89/88 are not ranking, citation or conversion evidence.

Reconcile latest docs/MERCY-SALES-AFFILIATES-2026-11-05.md: saved research lists now 18 Malaysia and 20 international terms (earlier 14/12 superseded), while Ubersuggest tracking stays 25/25, one location, 10/10 prompts, monthly refresh and exhausted daily reports. No repeated report regeneration or paid credits. The two fixed BM buyer/affiliate prompts remain as recorded at 10:30; no new provider answer/engine execution time/citation URL available. No search snippet used as AI-answer evidence.
SearchFit lacks MERCY brand; SEOcrawl billing_context_missing; VibeSEO lacks MERCY project/plan. Reused blockers without consuming unavailable services again. AgentMarkup capabilities used through deterministic delivered HTML/schema checks; no package regeneration. No spatial tools used.

## Commercial and measurement boundaries
Latest public policy copy now states ordinary applicants must first buy a MERCY copy, including via another affiliate/coupon, with listed exemptions. It does not establish backend enforcement. Inspected registerAffiliate in backend audit source still activates an otherwise valid Malaysian applicant without purchase/exemption verification; live enforcement is not claimed. The latest sales checkpoint independently records the same unresolved mismatch. No proof mechanism invented. International self-service registration/payout support remains Malaysia-only; email enquiries are not enrollment.
No authenticated order/registration report retrieved in this pass; paid units, receipts, refunds, fees, net contribution, registration counts and referral conversion are unavailable for this audit. No seven-day lift calculation or traffic/sales claim.

## Deployment
Published implementation commit 6d3c18ae788f7cdaed0c8bae1ecca8c693dfd8cd. GitHub Pages run 42013344203 completed successfully at 2026-11-05T10:46:24Z.
Live verification at 2026-11-05T10:46:32 UTC (18:46 Malaysia):
- /buy/: HTTP 200, helper reference present, valid JSON-LD, one H1; SHA256 9e3b798374705b154ff134cc7c93966b6b5f7ad260cd1ede4312b0617e4fe6c7.
- /affiliate-program/: HTTP 200, helper reference present, valid JSON-LD, one H1; SHA256 8ab446e189bd3b9400288ce8f42ae68c5ea238c74bf20636e5868b8d0cf11faf.
- /assets/purchase-referral-navigation.js: HTTP 200; SHA256 4ab2c1fb2505717f8edeeae5df43481cf989c7ae8d11f9c49c66486b2d079da2.
An initial read during Pages deployment returned the preceding sales update and asset 404; the post-success read above confirms publication. No failed deployment inferred from that intermediate read.
Confirmed both pages' existing scripts and forms are byte-preserved; exactly one new script reference per page. Functional routing checked in an isolated Node VM; no real checkout or registration submitted. The record-only follow-up commit does not alter public assets.
