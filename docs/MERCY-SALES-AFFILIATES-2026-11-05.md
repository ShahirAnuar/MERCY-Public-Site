# MERCY sales and affiliate improvements — 5 November 2026

## Implemented

- Buying page: separate prominent Malaysia and international purchase choices; comparison of print, Kindle and The Guide App; original checkout scripts and Stripe components retained.
- Affiliate page: latest book-purchase prerequisite and exact exemptions; international email enquiry route without unsupported commission or payout promises; links to a new BM/English sharing kit.
- Sharing kit: uses an affiliate's existing issued purchase URL, preserving referral/coupon/campaign parameters; includes accurate commission disclosure, copy controls, and a separate international book caption. It does not send messages, register an account or issue coupons.
- Affiliate terms: restored purchase-before-affiliate wording and removed the contradictory UiTM student ticket sentence by referring to its separate section 3B policy. Prices and commission offers were preserved.
- Book page, sitemap and llms.txt link the sales and recruitment resources.
- Ubersuggest saved lists: Malaysia 14→18 terms; international 12→20 terms, renamed “MERCY — Kindle sales and international affiliates.” These are research lists, not additional live ranking slots.
- Five existing hourly MERCY SEO/GEO prompts now prioritize paid orders and completed affiliate registrations, with distinct responsibilities and attribution protection. Enabled hourly in Asia/Singapore. No additional duplicate schedules or ad spending.

## Backend repair

The deployed v48 source used an RM15 starting commission for RM25 standard app sales, while the public offer and latest approved terms specified RM20. Source commit `956655276f5fb337b680a5c7555560cb9cfb86dc` corrects new sales to `AFFILIATE_RM20_2500_V4`, subtracts the chosen coupon, retains actual-fee checks and approved special clean-profit treatment, and preserves recorded historical policies/paid records. Seven relevant backend test suites passed, including all coupon tiers, historical reconciliation, webhook and payout guards. The build and ESM validation passed; saved Sites version 49 references that exact commit. Production deployment of version 49 succeeded at 10:42 UTC (18:42 Malaysia/Singapore time); public `/api/affiliate/status` readback confirmed the RM20 V4 policy, RM25 list price and RM15 maximum coupon.

## Remaining material limits

- Desktop Commander reports device DESKTOP-A2HFCEP offline; no PC control performed.
- Self-service affiliate registration/payouts accept Malaysia only. International interest uses email enquiries; no supported international commission arrangement was invented.
- The live registration service does not verify the book-purchase prerequisite or approved exemption before activating a new account. Public policy wording is corrected; this is not a claim of server-side enforcement. A complete fix needs authenticated receipt review, pending-account UX and exemption verification, including individual orphans and UiTM staff/student distinctions.
- Ubersuggest: 25/25 ranking terms, 10/10 AI prompts and 3/3 daily reports used; AI tracking refreshes monthly. SearchFit lacks a MERCY brand; SEOcrawl reports billing_context_missing; VibeSEO lacks a MERCY project/eligible setup. Existing unrelated projects unchanged.
- Scheduler returns no next-run timestamp despite enabled hourly configurations. Historical Malaysia SEO execution observed; future dispatch remains unverified.
- Search Console returned 20 rows, 1 click and 36 impressions for 7 Oct–3 Nov; no buy/affiliate rows or target phrases appeared in that bounded result. These are not complete site totals. A small Ubersuggest sample of five OpenAI answers counted zero matched MERCY mentions. Neither observation establishes all-engine visibility or sales.

## Verification

Checked HTML IDs/anchors, JSON-LD syntax, JavaScript syntax, sitemap XML, and preservation of existing payment and registration scripts. Sharing-kit checks covered exact parameter preservation and 13 invalid/private-link cases. No real payment or fake affiliate registration was submitted. Sales growth, new registrations and net profit require first-party measurement and are not claimed by these changes.

## Publication and international Amazon option

Public-site commit f71433418d695c9ca438191848536795fc22e328 was published through GitHub Pages; the updated buying page and sharing kit were observed live in the browser. A follow-up adds a conditional independent route for existing approved Amazon Associates to generate their own eligible product links through SiteStripe. Amazon owns those accounts, commissions and payout terms; MERCY app registration is still Malaysia-only. The guidance links official Amazon policies, SiteStripe help and exclusions and does not promise title eligibility, a rate or earnings.

## Global site conversion/health checkpoint — 18:50 Singapore/Malaysia time

- Latest remote coordination inspected: main commit a880cf48eb7a852315c5c52195137a5131ba08c3; read this sales checkpoint and the Malaysia referral deployment record before editing. Preserved newer sales/recruitment copy.
- Evidenced global-page gap: /mercy/ linked directly to /buy/ and /affiliate-program/ without loading the existing referral-navigation helper. global-site.js has no equivalent query propagation. Incoming affiliate/coupon/campaign parameters were therefore lost on these routes.
- Published bounded fix e180b27ae815694115e89fd00de9fc60874be9e2: added exactly one existing helper script reference to mercy/index.html. No helper, buy/, affiliate-program/, checkout, policy, pricing, authentication, payment, rights or tracking configuration edits.
- Five deterministic Node VM routing checks passed: referral/coupon/campaign plus fragment preservation; affiliate destination with existing language parameter; different explicit affiliate protected from incoming coupon; Amazon destination unchanged; anchor-only link unchanged. These are navigation checks, not completed orders or registrations.
- Live readback 2026-11-05T10:50:50Z: /mercy/ HTTP 200, exact source match, one helper reference, canonical https://mercyseries.com/mercy/, Book/Person/WebPage JSON-LD preserved. Scope is direct synopsis-to-buy/affiliate links; propagation through other intermediate public pages is not established.
- Reused current coverage: paid Kindle controls observed AU (latest 17:52), MX (4 Nov), BR (14:45); matching listings but paid access unconfirmed US/UK/CA/FR/JP; DE/ES/IT/NL/IN unverified. Paperback and hardcover controls previously verified US/AU/CA. PL/SE/IE/BE print remains unverified. These sampled storefront observations do not prove country rights, account-specific access, or sales.
- No first-party paid-order/registration/receipt/refund/fee/net-contribution reports available in this pass. Seven-day conversion or sales lift cannot be calculated. Reused quota/setup blockers above; no repeated paid or exhausted reports. Registration eligibility enforcement remains the existing recorded blocker; no backend change made here.

## Global guide conversion/health checkpoint — 21:50 Singapore/Malaysia time

- Before edits inspected remote main ca6e854111e40afc8434b3b212bad2a51086cd53, this checkpoint and docs/MERCY-FOUR-CAMPAIGNS-2026-11-05.md via its commit diff. The newer campaign routes, helper allowlist, source ownership and sales copy were preserved. Saved research lists are now 30 Malaysia and 30 international phrases per that newer campaign record; these do not increase live tracking slots.
- Confirmed live open-guide HTML matched current source and lacked the referral helper. Its /mercy/#editions purchase route therefore dropped incoming affiliate/coupon/campaign parameters. The newer helper already supported /mercy/ but omitted /learn/.
- Bounded change: fc176cb8e2a5bdae24df42cba1ddc2195c676927 adds /learn/ and /learn/index.html to the existing helper allowlist; cba8d41ebacb460252d21fdb2e353b2475d6044b adds one deferred, versioned helper reference to learn/index.html. No existing allowed route or helper algorithm removed. No buy/, affiliate-program/, payment, pricing, commission, authentication, rights or tracking configuration edits.
- Eight deterministic Node VM checks using the proposed production helper passed: guide-to-edition fragment and parameters; synopsis-to-open-guide preserving reading-guide=1; explicit destination affiliate/coupon protection; repeated campaign values; explicit language; Amazon/dashboard/anchor exclusions. No real order or registration submitted.
- Live readback 2026-11-05T13:50:50Z: /learn/?reading-guide=1 HTTP 200, exact source match, one helper reference, expected self-canonical and WebPage schema retained. Versioned helper endpoint HTTP 200, application/javascript, 2140 bytes. Delivered helper bytes and browser click execution were not independently compared in this pass; routing behavior was tested from remote source.
- Country coverage reused from previous timestamped observations, not rescanned: paid Kindle controls AU/MX/BR; matching catalogues with paid access unconfirmed US/UK/CA/FR/JP; DE/ES/IT/NL/IN unverified. Verified print controls US/AU/CA paperback and hardcover; PL/SE/IE/BE print unverified. Catalogue/control evidence does not establish country rights, account-specific access or sales.
- Reused 20:49 Search Console no-row result for 4 November, exhausted report quotas and known setup blockers. No new authenticated paid-order, gross receipt, refund, fee, commission, net contribution or registration report. Commercial lift remains unmeasured; eligibility-enforcement limitation remains separate backend work.
