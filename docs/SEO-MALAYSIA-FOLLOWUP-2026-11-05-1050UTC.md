# MERCY Malaysia campaign follow-up — 5 November 2026

## Decision and coordination
Read current remote main a880cf48eb7a852315c5c52195137a5131ba08c3 and latest sales/referral checkpoints. No additional public-page edits justified; preserved newer international Amazon guidance and the existing attribution fix. This documentation file is the only changed file. Public dates, prices, commissions, eligibility, authentication, payment and payout settings unchanged.

## Deployment and fresh live verification
At approximately 10:50 UTC (18:50 Malaysia), fresh HTTPS raw reads with a verification query returned:
| Destination | HTTP | SHA256 |
| --- | --- | --- |
| /buy/ | 200 | 9e3b798374705b154ff134cc7c93966b6b5f7ad260cd1ede4312b0617e4fe6c7 |
| /affiliate-program/ | 200 | 3dd4f5feba20aa620270f32652073d7b2f5fa08274e0e48cf46049d8cc04dcac |
| /assets/purchase-referral-navigation.js | 200 | 4ab2c1fb2505717f8edeeae5df43481cf989c7ae8d11f9c49c66486b2d079da2 |

Both pages have the expected self-canonical, one H1, parseable JSON-LD and referral helper; no HTML robots directive or X-Robots-Tag prohibiting indexation was returned. This does not confirm actual search indexing. Affiliate title now reflects international enquiries from the newer sales update. robots.txt and llms.txt also returned 200 and were not modified.

Referral implementation 6d3c18ae788f7cdaed0c8bae1ecca8c693dfd8cd: Pages run 42013344203 completed successfully at 10:46:24 UTC. The later international-guidance run was cancelled and superseded by record commit a880cf48; its run 42013562981 was in progress when inspected. Fresh live affiliate HTML includes the newer title and the helper. No new deployment is needed for public assets in this review.

## Search evidence
Validated Windsor field IDs and account sc-domain:mercyseries.com, then requested date/query/page/country/clicks/impressions/data_fetched_at for 8 October–4 November inclusive. Returned 29 rows with original fetch timestamp 2026-11-05T10:24:04 UTC, dated 10 October–1 November. Code-computed row totals: 1 click, 36 impressions. These are bounded query rows, not complete site totals. Neither destination appears in these rows.
| Fixed query group | Observation |
| --- | --- |
| kerja affiliate | Not observed |
| affiliate job | Not observed |
| jual dari rumah | Not observed |
| dropship | Not observed |
| buku kanak2 islam | Not observed |
| buku anak istimewa | Not observed |
| anak istimewa islam | Not observed |
No target row is not evidence of zero demand or zero impressions. No new search-data refresh, campaign lift or seven-day sales comparison can be established from this cached result.

## Allowances and capability reuse
Reuse dated 5 November Keyword Tool research, Parallel Search extraction (known stale), GEO Tool Check scores 89/88 and crawler checks, and AgentMarkup deterministic validation from the linked campaign/referral records. Technical scores are not traffic/citation/sales measures. No duplicate calls to unavailable providers or exhausted reports.
Latest sales checkpoint supersedes original saved-list counts: 18 Malaysia and 20 international phrases; live tracking remains 25/25 terms, one Malaysia location, 10/10 AI prompts, monthly reporting and exhausted daily report allowance. SearchFit no MERCY brand; SEOcrawl billing_context_missing; VibeSEO no MERCY project/eligible plan. No setup changed in this review. Curated robots/llms/schema preserved; no package install/regeneration or geospatial tools.

## Separate limits
Latest public eligibility wording reflects the purchase prerequisite and named exemptions. The current registration UI sends ordinary applicant/contact/consent fields without a purchase-verification step, and the backend mismatch is documented in the latest sales checkpoint: otherwise valid Malaysian applicants can become active without purchase/exemption verification. This review does not change eligibility or invent enforcement.
No authenticated order or registration report was available to this review; paid units, receipts, refunds, verified fees/commissions, net contribution, completed registrations and referral-to-sale conversion remain unavailable. No fabricated registration or checkout was submitted. Continue campaign monitoring; no reason to disable the recurring task.
