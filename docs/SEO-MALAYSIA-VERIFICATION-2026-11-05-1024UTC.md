# MERCY Malaysia SEO verification — 5 November 2026

## Scope and decision
Reviewed the live /buy/ and /affiliate-program/ pages and current main source. No public-page edit was justified. No public date refresh, schema replacement, price, commission, eligibility, authentication, checkout, account, bank or audience change was made. This audit record is the only changed file in this run.

## Source coordination and deployment
Implementation baseline: 6c6eddd58d0d2b62b46fdbd160c532f3ea749930; successful Pages run 42000295475.
Current main at inspection: 013c746270b38fff62cf4879263f8360745556ac; successful Pages run 42005977682, completed 2026-11-05T09:53:10Z.
Comparison shows the sole subsequent edit is mercy/index.html (Australian Kindle purchase route). It is preserved; neither Malaysia-owned page changed.
No new public-page deployment requested by this audit. The documentation commit may trigger the existing Pages workflow.

## Live/source verification
Fresh HTTPS raw-HTML downloads with a verification query on 5 November match both current source files after surrounding whitespace normalization. GEO Tool Check independently returned HTTP 200 for both pages, indexable, snippets allowed and no relevant AI crawler block.
- buy/index.html: title Buy MERCY: Kindle, Books & The Guide App | Malaysia; canonical https://mercyseries.com/buy/; one H1; JSON-LD parses; existing scripts match source.
- affiliate-program/index.html: title Affiliate MERCY Malaysia | Jual dari Rumah; canonical https://mercyseries.com/affiliate-program/; one H1; JSON-LD parses; existing scripts match source; registration section and three dashboard links remain present; three links to /buy/ remain.
- Both pages contain all seven requested query phrases with visible Malay answers. Kindle is distinguished from The Guide App and its local affiliate commissions. The open reading guide remains linked.
- Buy checkout code still reads affiliate and coupon parameters and maps valid values to Stripe client_reference_id and prefilled_promo_code. No payment was initiated.
- Raw buy HTML SHA256: 43b81966ee91b315f244ca1757998c6baed1649802edd059ef606c857fccc53e.
- Raw affiliate HTML SHA256: 9e76dad5e7ad09155635a38e380a7d498be9676e0034a053a37738296a48df4e.
Technical diagnostics remain buy 89/100 and affiliate 88/100. These are tool scores, not measured citations, rankings, traffic or sales. Heuristic suggestions overlook existing visible FAQs and commission figures; no content was added merely to increase a score.

## Search Console evidence
Validated field IDs with Windsor get_fields before querying account sc-domain:mercyseries.com.
Requested 2026-10-08 through 2026-11-04 inclusive, fields date/query/page/country/clicks/impressions/data_fetched_at.
Returned 29 query/page/country/date rows dated 10 October–1 November, fetched at 2026-11-05T10:24:04 (connector UTC timestamp).
Computed totals in these returned rows only: 1 click, 36 impressions. They are not site-wide totals.
All requested exact terms were evaluated as one fixed group:
| Query | Observation |
| --- | --- |
| kerja affiliate | Not observed |
| affiliate job | Not observed |
| jual dari rumah | Not observed |
| dropship | Not observed |
| buku kanak2 islam | Not observed |
| buku anak istimewa | Not observed |
| anak istimewa islam | Not observed |
A separate exact-query IN-filter request returned no rows. A page-filter request for the two canonical destinations, without query dimension, also returned no rows. Neither response establishes zero demand or zero total traffic; query privacy, processing lag and connector coverage apply. No measured campaign lift established.

## Connected capabilities and allowance handling
- Ubersuggest: reuse 5 November evidence in SEO-GEO-MERCY-KINDLE-MALAYSIA-2026-11-05.md: tracking 25/25, one Malaysia location, prompts 10/10 (8 international, 2 BM), 14 Malaysia + 12 Kindle saved phrases, monthly reporting and daily reports exhausted. No slots replaced, reports regenerated or paid credits consumed.
- Keyword Tool: reuse same-day completed seed research; no new expansion justified and no verified volume claim.
- GEO Tool Check: fresh two-page diagnostics above.
- Parallel Search: one grouped official-domain search covering all seven query groups returned official pages but stale affiliate RM16 and old buy-page extracts (search ID search_343b1d383f29929e93a016664b8fdea7). This is retrieval staleness, not deployment failure or an exact ranking measurement. Do not restore stale copy.
- Windsor: validated read-only requests above.
- AgentMarkup: package.json retains @agentmarkup/cli ^0.7.0. Static HTML owns delivered metadata. Deterministic live/source JSON-LD/canonical checks completed; no package/config changes or regeneration; curated robots/llms/schema preserved.
- SearchFit: reuse known no-MERCY-brand blocker; no repeated unavailable call.
- SEOcrawl AI: reuse billing_context_missing blocker; no retry.
- VibeSEO: reuse no MERCY project/eligible plan blocker; consultancy project untouched.
- BigGeo/GeoAI: not applicable to AI-search promotion; no spatial task.
No paid advertising, outreach, backlinks, hidden terms, duplicate landing pages or artificial clicks.

## Separate commercial-policy blockers — do not infer new rules
1. Current affiliate terms section 3B says the RM20 verified UiTM Faculty of Pharmacy student bundle meets the RM15 publisher-net threshold and qualifies for a ticket. Section 3C says that same student purchase does not automatically qualify. Confirmed in source and freshly downloaded live terms. Outside SEO edit scope; reconcile under a separately authorized commercial-policy change.
2. Existing standard affiliate page/terms describe self-service registration and a free affiliate copy without stating the prior buy-a-copy prerequisite from the 4 November instruction. Do not invent exemptions, enforcement or acceptance from SEO copy. Resolve this eligibility conflict separately before adding claims about who qualifies.
The active campaign can continue read-only measurement while these policy conflicts remain unresolved.
