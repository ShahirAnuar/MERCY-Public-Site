# MERCY buyer and affiliate campaigns — 5 November 2026

Scope: MERCY books and The Guide, as confirmed by the owner in this chat. Nexus Finds offers are excluded. This record distinguishes published discovery content, configured research lists and verified acquisitions.

## Four destinations

| Campaign | Audience and discovery content | Conversion destination | Status |
| --- | --- | --- | --- |
| 1. MERCY local affiliates | Malaysian parents, teachers, book creators and family-reading communities; existing bilingual programme plus new audience guidance and internal discovery links | /affiliate-program/#eligibility, then existing registration | Public recruitment path ready; GET registration status reports open. No new applicant or purchase-enforcement verification claimed. |
| 2. Malaysia buyers | /malaysia/ introduces the English story in BM, inclusive reading questions, six-lens method, format choices and local buying links | /buy/ for Malaysia book and app purchases | 28 buyer keywords grouped by intent and relevance; new static page prepared for search discovery. |
| 3. Local Amazon/ClickBank affiliates | /affiliate-program/amazon-clickbank/ gives BM account guidance, actual MERCY identifiers, own-account tracking and disclosure | Official Amazon Associates application and ClickBank account instructions | Amazon application route ready. MERCY-specific ClickBank recruitment awaits a verified seller offer and tested HopLink. |
| 4. Worldwide buyers | /islamic-childrens-books/ introduces story, family/classroom use, free guide and format choices | Amazon Kindle B0HGVJ4RTN, paperback 6299274018, hardcover 6299274026, regional edition chooser | 40 buyer keywords mapped. Amazon US listings matched MERCY/Shahir in live reads; country price and orderability remain buyer-specific. ClickBank purchase route pending. |

The Guide App RM25 Malaysia checkout, Amazon MERCY editions and the international companion access process remain distinct. The international companion is described by the existing public source as included after a verified Amazon MERCY purchase and activation. No ClickBank checkout, seller nickname or product availability is invented.

## Keyword and content implementation

The accompanying [68-keyword CSV](MERCY-BUYER-KEYWORDS-2026-11-05.csv) contains exactly 28 Malaysian and 40 worldwide buyer terms, intent, priority, cluster, destination and metric provenance. The three owner seeds are included: `polymath`, corrected `buku kanak-kanak islam`, and `buku autism`.

Priorities are editorial product fit and buying intent. Cached volume/difficulty are retained where the service actually supplied them; they are not new live estimates. Blank fields mean unavailable. Cached zero estimates do not prove no demand. “Worldwide” is an English audience strategy, not a measured global aggregate or a claim of delivery to every country.

Core topics: illustrated Islamic stories in English; family reading; compassion, gratitude and forgiveness; father-and-child conversations; classroom/homeschool discussion; learning differently; MERCY title/author/edition searches; The Guide and six-lens connections. Polymath is an informational author bridge. Autism queries receive truthful story/suitability information, without treatment or clinical-guide claims. No Malay print edition is announced.

Local affiliate intent includes `program affiliate malaysia`, `affiliate buku islam`, `affiliate buku kanak-kanak`, `affiliate produk digital malaysia`, `kerja affiliate`, `affiliate job`, `jual dari rumah`, `komisen affiliate buku`, `MERCY affiliate`, `The Guide affiliate Malaysia`, `cara daftar affiliate MERCY`, and `affiliate untuk guru`. Retailer affiliate intent includes `Amazon affiliate Malaysia`, `cara daftar Amazon Associates`, `affiliate buku Amazon`, `SiteStripe Amazon Malaysia`, `ClickBank affiliate Malaysia`, and `cara daftar ClickBank`. These are content targets, not claims of live rank-tracking enrollment or measured search volume.

New pages use direct answers, visible FAQs with matching JSON-LD, canonical URLs, social metadata and crawlable HTML. Their links appear on the homepage, buy page, affiliate page and sharing kit. The sitemap, curated llms.txt and existing AgentMarkup configuration describe the new resources. Referral navigation preserves issued attribution through the new public campaign guides while leaving retailer, checkout and authentication destinations alone.

## Services used and current limits

| Service | Verified work or restriction |
| --- | --- |
| Ubersuggest | Authenticated. Existing MERCY saved research lists expanded Malaysia 18→30 and international 20→30, then read back. These lists are not additional tracked ranking slots. Existing tracking 25/25, AI prompts 10/10, daily reports 3/3; no upgrade or replacement of existing tracking. |
| Keyword Tool | Three successful suggestion searches: Malaysia Islamic books, Malaysia autism-book query and worldwide Islamic children's books. No volume/difficulty supplied. |
| GEO Tool Check | Existing buy and affiliate pages HTTP 200, raw HTML readable and indexable; diagnostic scores 91/100 and 98/100. Robots permits all 16 agents reported by that diagnostic. These scores are technical checks, not citation rates or sales. |
| AgentMarkup | Existing CLI dependency installed from the lockfile for local validation. Static HTML remains final metadata owner. Curated llms/robots are preserved; new discovery entries added to config. A pre-existing reading-guide Article schema lacked required url; repaired with matching URL, description and cover image. |
| Windsor Search Console | Connected sc-domain:mercyseries.com. Baseline 6 October–2 November 2026: seven returned page rows sum to 16 clicks/599 impressions. Buy and affiliate pages absent in returned rows: not observed, not proven zero. GSC does not report purchases or registrations. |
| Exa | Public discovery sample returned MERCY's homepage and related Malaysian/Islamic book pages; used to inspect relevance and possible future editorial distribution sources. No outreach performed or independent endorsement inferred. |
| Parallel Search | Discovery sample returned MERCY official/author/retailer sources and other Islamic book/affiliate sources. Brand and nonbrand queries were mixed, so no brand citation percentage, rank or trend is reported. Search excerpts can be cached. |
| SearchFit | Live brand list empty; no brand-creation capability exposed. No MERCY campaign activated. |
| SEOcrawl | Property discovery fails billing_context_missing. No campaign activated. |
| VibeSEO | Only the unrelated consultancy project is listed; no eligible active SEO plan or MERCY creation capability. Unrelated project unchanged. |

Geospatial plugins are outside generative search optimization and were not used. No paid ad campaign, paid upgrade, direct prospect message or new automation was created. Earlier chat reports of hourly schedules were not independently verified or changed through the available controls in this run.

## Verification and practical limits

Before publication: parse all JSON-LD and sitemap XML; check H1s, canonical URLs, IDs and local destinations; compare existing purchase/registration controls and nonmetadata scripts; validate referral round trips with real production helper code in a Node VM; run relevant existing commerce/UI checks and AgentMarkup.

Two pre-existing tests were separately reproduced from exact baseline commit dd334593f4a5d70141ca4e484f89f07cec1b3a07: affiliate-rate-ui.test.mjs still expects RM15/RM8.25 while baseline correctly displays approved RM20/RM3.25; registration-reader-selectors.test.mjs constructs an invalid Windows path from URL.pathname and fails before assertions. Neither commercial rules nor these unrelated tests were changed. Commerce UI and UiTM UI checks pass.

Publication is complete only after the exact source commit is on main and the new routes, stylesheet, helper, sitemap and discovery links are read back from mercyseries.com. Deployment/readback evidence is saved separately after release. No new affiliate, purchaser, Amazon order, ClickBank conversion or AI-answer citation is established by publication.

## Remaining dependencies

1. Verified ClickBank MERCY/The Guide seller product/listing, checkout and affiliate HopLink; a username alone is insufficient. Official references: [seller setup](https://support.clickbank.com/en/articles/10535160-how-do-i-get-started-as-a-clickbank-seller), [HopLinks](https://support.clickbank.com/en/articles/10535278-hoplinks-guide).
2. Account-owned SearchFit brand configuration, SEOcrawl billing context and an eligible VibeSEO MERCY project/plan before those services can participate.
3. Backend conversion reporting and server-side eligibility verification; Amazon/ClickBank seller reports for completed retailer purchases. Search impressions and technical audits cannot establish those outcomes.

