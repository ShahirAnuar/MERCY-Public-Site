# MERCY affiliate programme backend — release-blocking implementation

**Specification as of 31 October 2026.** Website pages are static GitHub Pages. The order/access backend is hosted separately at `https://mercy-malaysia-orders-reviews.shahiranuar.chatgpt.site`. This repository alone **cannot** receive registrations, issue coupons, verify Stripe payments or pay affiliates. Do not treat the programme as live until tested.

## Business rules

- The Guide App digital base price: **RM16.00** (1,600 MYR cents).
- Each affiliate account has one stable, opaque **public affiliate identifier**, e.g. `AFF-<random A-Z0-9>`, independent of its private Google identity, purchase serial and device.
- Registration: **online self-service, no ordinary manual approval**, subject to verifying age, Malaysia eligibility, Google `sub`, mandatory consents and lawful promotional channel. No joining fee, inventory requirement or rewards for recruitment.
- Coupon issuance is **separate and subsequent** to registration. An authenticated affiliate may request coupons offering **RM1, 2, 3, 4, 5, 6 or 7 off**. Each issued customer-facing code is unique **for each affiliate + tier**; issuing the same tier again should return the existing active code by default. Backend never accepts a client-selected coupon identifier. Use Stripe Promotion Codes with unique alphanumeric strings mapped to an internal immutable affiliate ID, or equivalent secure lookup.
- Coupons are reusable for eligible distinct customers unless a separate published policy changes; limit to **one coupon per order**. No stacking. A coupon must identify its owner even when a buyer enters it without using an affiliate link. A plain affiliate link with no coupon still attributes the full-price sale.
- Each paid transaction qualifies for **exactly one** owning affiliate if attributable and eligible; never expose a buyer's activation serial, Google ID or access token in a public URL.
- Commissions are earned on paid, verified, non-fraudulent, non-refunded orders. No limits on the number of legitimate sales per affiliate.

## Financial guarantee: publisher RM7 AFTER assumed 3% + RM1 domestic processing

For discount `d` in MYR (integer 0…7), customer pays `P=RM(16-d)`. Assuming the payment fee is exactly `fee=round_to_sen(P*3%) + RM1`:

`affiliate_commission = P - fee - RM7.00`.

| d (RM) | Customer pays (RM) | Fee (RM) | Affiliate (RM) | Publisher (RM) |
|---:|---:|---:|---:|---:|
| 0 | 16.00 | 1.48 | **7.52** | **7.00** |
| 1 | 15.00 | 1.45 | 6.55 | 7.00 |
| 2 | 14.00 | 1.42 | 5.58 | 7.00 |
| 3 | 13.00 | 1.39 | 4.61 | 7.00 |
| 4 | 12.00 | 1.36 | 3.64 | 7.00 |
| 5 | 11.00 | 1.33 | 2.67 | 7.00 |
| 6 | 10.00 | 1.30 | 1.70 | 7.00 |
| 7 | 9.00 | 1.27 | 0.73 | 7.00 |

**3% is a Stripe processing fee, not a 'tax'.** Actual Stripe fees vary by payment method, card origin and currency; international cards can cost more, and other taxes and disbursement costs are excluded. To guarantee RM7 after *actual* payment fees, compute commission from the *actual settled payment processing fee* and reserve RM7, or restrict eligible transactions to payment methods consistent with the published schedule. Never promise RM7 after all taxes and costs unless verified. No credit for refunds and disputes; reconcile payout obligations accordingly.

## Secure API contracts to implement

### GET /api/affiliate/status
Returns `{"registrationOpen":true,"termsVersion":"2026-10-31"}` **only after** proper storage, CORS restrictions, rate limits, authenticated endpoints, and legal/privacy review are ready. False or HTTP non-200 keeps the public form disabled. Never falsely signal active registration.

### POST /api/affiliate/register
Headers: `Authorization: Bearer <Google ID JWT>`; JSON with `fullName,email,phone,country,channel,audience,marketingConsent,adultConfirmed,termsAccepted,privacyAcknowledged,termsVersion`. Verify the Google ID token signature/issuer/audience/expiry, match its verified email, enforce minimum 18 and geographic eligibility, reject unsupported direct-sales activity, prevent duplicate accounts, and store consent timestamps/version. **Automatically activate eligible accounts**; response `{"status":"active","affiliateId":"AFF-...","shareUrl":"https://mercyseries.com/buy/?affiliate=AFF-..."}`. Reject suspicious, ineligible, unverified or legally prohibited registrations; avoid manual approval as the normal path.

### GET /api/affiliate/me
Requires valid Google JWT, returns authenticated affiliate's `status, affiliateId, shareUrl`. Do not accept an account ID chosen by the client. Eventually include verified earnings/payout status (pending, available, paid, reversed).

### POST /api/affiliate/coupons/request
Requires valid Google JWT and **existing active affiliate account**. JSON: `{"discountAmountCents":100|200|300|400|500|600|700}`. Server generates and stores/returns code uniquely owned by this affiliate, linked to its Stripe Promotion Code and discount tier. Response `{"affiliateId":"AFF-...","discountAmountCents":<100…700>,"couponCode":"<unique alphanumeric>"}`. Do not return another affiliate's coupons or payment info. Do not use activation serials as codes.

### POST /api/affiliate/checkout
Body `{"affiliateCode":"AFF-..."}`. Verify the active affiliate and create a server-tracked Stripe Checkout Session at the **full RM16** price with `allow_promotion_codes: true` and immutable `metadata.affiliate_id` (not a buyer serial). Respond `{"checkoutUrl":"https://checkout.stripe.com/...","currency":"myr","amountCents":1600,"affiliateId":"AFF-...","promotionCodesEnabled":true}`. The public buy page verifies these values before redirecting. The affiliate customer types any coupon on **Stripe Checkout**, not on `/buy/`; Stripe applies the discount during checkout. Do not pre-apply or trust a coupon supplied from the public frontend. **The server remains authoritative.**

If the Stripe coupon entered belongs to another affiliate, resolve attribution by the actual redeemed Stripe Promotion Code owner, not the affiliate link owner, so one sale can never pay two affiliates. Record the source and conflict for audit and reject suspicious patterns. If there is an affiliate link but no coupon, use the linked affiliate. If neither exists, no affiliate commission is owed.

### Standard RM16 checkout
Update and verify the existing `buy.stripe.com` Payment Link used by `/buy/` to really charge **RM16** and enable **Allow promotion codes** (`allow_promotion_codes=true`). The Stripe payment page—not the MERCY website—must display the promotion-code entry control. Ensure the payment link's after-payment redirect returns to the reader with `{CHECKOUT_SESSION_ID}`, recognised by `/api/stripe/claim`. A buyer without an affiliate link can still type an affiliate's unique promotion code at checkout; the webhook must identify its owner. Do not assume updating public website text changes the linked Stripe product price or Stripe settings.

### Payment webhook and durable records
Use Stripe-signed idempotent payment confirmation and refunds/chargebacks. Retrieve the final Checkout Session discounts / applied promotion code and its Stripe `promotion_code` ID (not just the code the customer typed). Resolve `promotion_code` ID through the secure coupon-to-affiliate database mapping. For a payment-link sale with no affiliate URL, promotion code ownership still determines who earns. For affiliate-link sales with no promotion code, the authenticated session's `metadata.affiliate_id` determines the owner. Store linked `affiliate_id, promotion_code_id, coupon_id, buyer_order_id, Stripe checkout session/payment_intent, amount_paid, fee_actual, publisher_share, affiliate_share, status` in a database with unique transactional constraints. Credit commissions **only** on successful payment. Revoke/correct on refund/chargeback. On verified payment issue **a new private buyer serial** bound to the purchaser's verified Google account and limit to **two active devices server-side**. Keep the public affiliate ID and customer activation credentials separate.

## Payout and privacy compliance
Secure payout onboarding only after registration and earnings are verified; collect minimum bank/DuitNow details through protected authenticated forms, encrypt at rest, limit access, and protect against impersonation. Maintain income statements and an audit trail. Establish payout schedule/minimum and refund recovery terms before payouts go live. Publish correct company/controller details, final bilingual notices, rights request procedure and data retention schedule. Comply with Malaysia PDPA and its 2024 amendments; confirm Act 500 applicability with KPDN before permitting door-to-door or otherwise regulated direct selling. Commission only from verified sales (not recruitment).

## Go-live checklist
1. Google sign-in and immediate online account activation on eligible registration; no approval queue.
2. Unique affiliate ID assigned; link works without coupon.
3. Request every RM1–RM7 coupon **after** account creation; unique per affiliate/tier, only own coupons visible.
4. Confirm the **coupon entry appears inside Stripe Checkout** for both the RM16 normal Payment Link and affiliate-specific sessions; apply 0–RM7 discount and check displayed RM16–RM9 Stripe total prior to paying.
5. Confirm RM7 publisher allocation after actual designated fee and matching affiliate earnings, including full-price RM7.52 and RM7-coupon RM0.73.
6. Buyer activation serial is private, each buyer gets its own copy, two active devices enforced in backend.
7. 100+ distinct legitimate sales correctly credit same affiliate, without duplicate webhook earnings.
8. Fraud, refunded payments and cross-affiliate coupon switching do not produce rewards.
9. Privacy disclosure and valid informed consents; no collection before endpoint ready.
10. Documented payout ledger and secure bank/DuitNow onboarding, then test actual payout.

References: https://stripe.com/en-my/pricing ; https://docs.stripe.com/api/promotion_codes/object ; https://www.pdp.gov.my/en/akta/personal-data-protection-amendment-act-2024/ ; https://www.kpdn.gov.my/images/2024/awam/akta/kpdn/Act%20500.pdf

## Website checkout UX (updated 31 October 2026)

- `/buy/` has **no merchant-side coupon entry**. It explains that the customer enters a personal affiliate promotion code at the **secure Stripe checkout** step.
- With a valid `?affiliate=AFF-...`, the website asks the backend for a full-price RM16 Stripe Checkout Session that reports `promotionCodesEnabled: true` and bears the correct affiliate identity. Without a valid affiliate ID, the normal Stripe Payment Link is opened directly (its Allow promotion codes switch must be enabled separately in the Stripe Dashboard).
- Unique affiliate coupons are requested only by authenticated affiliates from `/affiliate-program/` and created as actual Stripe Promotion Codes, with durable ownership mapping. Never use buyer activation serials or expose buyer identities to affiliates.
- **Current implementation is frontend only.** No Stripe account access or backend implementation is available from this repository, and the coupon input inside Stripe is not live until it is enabled in Stripe.

## Immediate storefront requirement — never block purchases (31 October 2026)

**Live checkout fallback:** All digital purchases use the existing, verified ACTIVE RM16 Stripe Payment Link:
`https://buy.stripe.com/7sYeVc6n82KY4rm10ogA80d`.

- For `/buy/?affiliate=AFF-...`, client appends Stripe-supported `?client_reference_id=AFF-...` directly to the Payment Link. The affiliate code is public; never use customer serials, emails, access tokens, or private IDs in that URL.
- Buyers **always** open the same working Stripe checkout, even when affiliate registration/coupon/ledger backend API routes are unavailable. Do not intercept the click to call `/api/affiliate/checkout` or fail closed on a 404.
- For `?coupon=<alphanumeric>`, client optionally sets `prefilled_promo_code` on Stripe; Stripe itself determines validity. The Payment Link currently has `allow_promotion_codes=true`.
- Existing link after-payment redirect is `https://mercyseries.com/reader/?session_id={CHECKOUT_SESSION_ID}`. Buyer unlocks a purchased copy via normal verified payment/activation flow.
- Stripe sends Payment Link `client_reference_id` as Checkout Session's `client_reference_id` in `checkout.session.completed`. Backend should reconcile this **only after validating that the reference maps to a real active affiliate**, then cross-check actual redeemed promotion code owner and prevent duplicate payout credit; a user could tamper with a public URL.
- This checkout opening **does not mean** automatic affiliate commissions, unique coupon issuance, or payout processing work. They require separate secure backend implementation and testing; preserve Stripe event data for later manual reconciliation.
- **Never disable normal sales because an auxiliary affiliate endpoint is unavailable.** When possible, record incomplete attribution and reconcile later. If attribution cannot be verified, do not pretend a reward has been paid.
- Stripe documentation: https://docs.stripe.com/payment-links/url-parameters
