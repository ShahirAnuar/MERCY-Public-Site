# MERCY — Affiliate Coupon API

A deployable Node.js 22 service that automatically provisions **seven real Stripe promotion codes (RM1–RM7)** for every **already registered and active** MERCY affiliate. The server validates the user's Google sign-in against MERCY's existing order/affiliate identity service, then uses server-held Stripe credentials. It never accepts an affiliate ID supplied by the browser.

## Deployment
This code requires a real server (Replit, Render, Cloud Run or equivalent). **GitHub Pages and ShipStatic host static files and cannot run this service.**

1. Deploy the `affiliate-service/` folder to a trusted Node.js host using `npm start`. No third-party npm packages are required.
2. Set the host's protected secret **STRIPE_RESTRICTED_KEY** to a restricted Stripe key with permissions for coupons, promotion codes, Checkout Sessions, PaymentIntents, charges, and PaymentIntent metadata updates/search. Create a least-privileged key and keep it out of source code.
3. Use Node 22+. The host must serve HTTPS. Set `PORT` if the platform requires it. Domain origins allowed: `https://mercyseries.com` and `https://www.mercyseries.com`.
4. Verify `GET /healthz` returns `configured:true`. Never publish the secret or use the read-only health response to infer the service is end-to-end validated.
5. Test `GET /api/affiliate/coupons` with a valid **existing affiliate's Google ID token**, then `POST /api/affiliate/coupons/provision`. Check each of the seven returned codes inside the **same live Stripe account**, including the `metadata.affiliate_id` and discount amount.
6. Set the affiliate dashboard's `/affiliate-program/dashboard/coupon-service.json` `couponServiceUrl` to the new HTTPS service origin. Re-publish MERCY site; the dashboard will use the new service for coupons while leaving identity and the RM16 buy link on the existing backend. **Do not change the customer checkout link.**

### Routes
- `GET /healthz` — configuration status, no credentials.
- `GET /api/affiliate/coupons` — the signed-in affiliate's Stripe-confirmed codes.
- `POST /api/affiliate/coupons/provision` — create any missing RM1–RM7 codes, idempotently.
- `POST /api/affiliate/coupons/request` — create or return one chosen tier (body `{"discountAmountCents":200}`).
Each private route requires `Authorization: Bearer <Google ID token>`. The service authenticates that bearer with the existing `/api/affiliate/me` service and only uses the returned active affiliate ID. Codes have deterministic names (same affiliate + tier → same code).

### Important financial boundary
The seven Stripe codes **are real redeemable discounts**, and Stripe metadata records the owner. This does **not** automatically make paid affiliate commissions appear in a ledger. The existing MERCY backend still requires a signed Stripe `checkout.session.completed` / `checkout.session.async_payment_succeeded` handler, final price/fee reconciliation, and refunds/payout accounting. See `../docs/AFFILIATE-PROGRAM-BACKEND-REQUIREMENTS.md` and GitHub issue #9. Do not promise automatic payouts or claim another affiliate's identity.

### Verification
Run `npm test` from this directory. Tests mock Stripe HTTP responses, confirm owner mismatches fail closed, new codes are product-scoped, and existing codes are returned without duplicate writes. For a real integration check, use a Stripe sandbox first, then the live restricted key. Actual test sales should use Stripe sandbox, not charge real customers.

### Current real Stripe data (31 October 2026)
Live Stripe promotion codes `MERCYDDE33B64C781R1` through `R7` have already been created for affiliate `AFF-DDE33B64C781`. They are surfaced in that affiliate's authenticated dashboard by a dated verified-code fallback if the coupon API is not yet mounted. Future affiliates require deployment of this service to get their own seven automatically.

## Stripe webhook and commission reports

The service also implements a signed Stripe webhook at `POST /api/stripe/webhook` and a Google-authenticated earnings feed at `GET /api/affiliate/dashboard`. Configure a Stripe event destination pointing to your deployed HTTPS endpoint and subscribe to **`checkout.session.completed`**, **`checkout.session.async_payment_succeeded`**, and **`charge.refunded`**. Set **STRIPE_WEBHOOK_SECRET** in your hosting provider's protected secret storage. If the webhook is not configured, affiliate commissions will **not** accrue automatically.

The webhook verifies Stripe's event signature and requires a paid, single-quantity Guide digital product session. It reads the *actual redeemed* Stripe promotion code, verifies `metadata.affiliate_id` belongs to the MERCY programme, and uses the real balance transaction's processing fee. Full-price affiliate-link orders are attributed only if the public affiliate ID has a matching account-owned Stripe Promotion Code. Unknown, unscoped or conflicting codes do not generate commissions. Commission metadata is stored on the matching Stripe PaymentIntent, with a deterministic idempotency key and refund reversal.

The earnings endpoint searches only Stripe PaymentIntents tagged for the signed-in affiliate. It distinguishes commissions held for 14 days, available for manual payout, paid and reversed records; the dashboard never receives buyer names or private app activation serials. **Stripe search indexing is not instantaneous**; recent orders may take time to appear.

This is **commission accounting**, not an automatic transfer to affiliates. Payout onboarding, actual bank/DuitNow transfers, and marking paid commissions must be established separately and supported by bank/payment confirmation. Do not claim RM7 net after taxes or every payment method: the server uses *actual Stripe processing fees*, and will hold transactions where the merchant cannot retain RM7.

The service requires no third-party npm packages, but it **must run on an HTTPS server** and receive webhook events. ShipStatic and GitHub Pages cannot host these endpoints. Check `GET /healthz`, `npm test`, then perform a Stripe sandbox payment + coupon + webhook + refund validation before enabling production commission payouts.
