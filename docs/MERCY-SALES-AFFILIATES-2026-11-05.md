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

The deployed v48 source used an RM15 starting commission for RM25 standard app sales, while the public offer and latest approved terms specified RM20. Source commit `956655276f5fb337b680a5c7555560cb9cfb86dc` corrects new sales to `AFFILIATE_RM20_2500_V4`, subtracts the chosen coupon, retains actual-fee checks and approved special clean-profit treatment, and preserves recorded historical policies/paid records. Seven relevant backend test suites passed, including all coupon tiers, historical reconciliation, webhook and payout guards. The build and ESM validation passed; saved Sites version 49 references that exact commit. Production deployment of version 49 succeeded at 10:42 UTC (18:42 Malaysia/Singapore time); public status readback is recorded separately.

## Remaining material limits

- Desktop Commander reports device DESKTOP-A2HFCEP offline; no PC control performed.
- Self-service affiliate registration/payouts accept Malaysia only. International interest uses email enquiries; no supported international commission arrangement was invented.
- The live registration service does not verify the book-purchase prerequisite or approved exemption before activating a new account. Public policy wording is corrected; this is not a claim of server-side enforcement. A complete fix needs authenticated receipt review, pending-account UX and exemption verification, including individual orphans and UiTM staff/student distinctions.
- Ubersuggest: 25/25 ranking terms, 10/10 AI prompts and 3/3 daily reports used; AI tracking refreshes monthly. SearchFit lacks a MERCY brand; SEOcrawl reports billing_context_missing; VibeSEO lacks a MERCY project/eligible setup. Existing unrelated projects unchanged.
- Scheduler returns no next-run timestamp despite enabled hourly configurations. Historical Malaysia SEO execution observed; future dispatch remains unverified.
- Search Console returned 20 rows, 1 click and 36 impressions for 7 Oct–3 Nov; no buy/affiliate rows or target phrases appeared in that bounded result. These are not complete site totals. A small Ubersuggest sample of five OpenAI answers counted zero matched MERCY mentions. Neither observation establishes all-engine visibility or sales.

## Verification

Checked HTML IDs/anchors, JSON-LD syntax, JavaScript syntax, sitemap XML, and preservation of existing payment and registration scripts. Sharing-kit checks covered exact parameter preservation and 13 invalid/private-link cases. No real payment or fake affiliate registration was submitted. Sales growth, new registrations and net profit require first-party measurement and are not claimed by these changes.
