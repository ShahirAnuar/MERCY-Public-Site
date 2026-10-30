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
Body `{"affiliateCode":"AFF-..."|null,"couponCode":"..."|null}`. Look up and verify (and link) owner, coupon tier, and program eligibility server-side. Reject contradictory coupon/affiliate owners, stacking, inactive codes and fraudulent orders. Create a server-tracked Stripe Checkout Session with exactly the discounted price, `metadata.affiliate_id` and `metadata.coupon_id` (not buyer serial). Response `{"checkoutUrl":"https://checkout.stripe.com/...","currency":"myr","amountCents":1600-d*100,"discountAmountCents":d*100,"affiliateId":"AFF-..."}`. The client checks amount and domain before redirecting; **server remains authority**. The client currently calls this endpoint only when an affiliate identifier or coupon is present.

### Standard RM16 checkout
Update and verify the existing `buy.stripe.com` Payment Link used by `/buy/` to really charge RM16; also ensure existing payment completion redirects back to the reader and is recognised by `/api/stripe/claim`. Client warns customers to check Stripe's actual charge. Don't assume updating public website text changes Stripe's linked price.

### Payment webhook and durable records
Use Stripe-signed idempotent payment confirmation and refunds/chargebacks. Store linked `affiliate_id, coupon_id, buyer_order_id, Stripe checkout session/payment_intent, amount_paid, fee_actual, publisher_share, affiliate_share, status` in a database with unique transactional constraints. Credit commissions **only** on successful payment. Revoke/correct on refund/chargeback. On verified payment issue **a new private buyer serial** bound to the purchaser's verified Google account and limit to **two active devices server-side**. Keep the public affiliate ID and customer activation credentials separate.

## Payout and privacy compliance
Secure payout onboarding only after registration and earnings are verified; collect minimum bank/DuitNow details through protected authenticated forms, encrypt at rest, limit access, and protect against impersonation. Maintain income statements and an audit trail. Establish payout schedule/minimum and refund recovery terms before payouts go live. Publish correct company/controller details, final bilingual notices, rights request procedure and data retention schedule. Comply with Malaysia PDPA and its 2024 amendments; confirm Act 500 applicability with KPDN before permitting door-to-door or otherwise regulated direct selling. Commission only from verified sales (not recruitment).

## Go-live checklist
1. Google sign-in and immediate online account activation on eligible registration; no approval queue.
2. Unique affiliate ID assigned; link works without coupon.
3. Request every RM1–RM7 coupon **after** account creation; unique per affiliate/tier, only own coupons visible.
4. Check each customer's displayed RM16–RM9 Stripe amount prior to payment.
5. Confirm RM7 publisher allocation after actual designated fee and matching affiliate earnings, including full-price RM7.52 and RM7-coupon RM0.73.
6. Buyer activation serial is private, each buyer gets its own copy, two active devices enforced in backend.
7. 100+ distinct legitimate sales correctly credit same affiliate, without duplicate webhook earnings.
8. Fraud, refunded payments and cross-affiliate coupon switching do not produce rewards.
9. Privacy disclosure and valid informed consents; no collection before endpoint ready.
10. Documented payout ledger and secure bank/DuitNow onboarding, then test actual payout.

References: https://stripe.com/en-my/pricing ; https://docs.stripe.com/api/promotion_codes/object ; https://www.pdp.gov.my/en/akta/personal-data-protection-amendment-act-2024/ ; https://www.kpdn.gov.my/images/2024/awam/akta/kpdn/Act%20500.pdf
