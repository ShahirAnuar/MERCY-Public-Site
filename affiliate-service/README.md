# MERCY — Affiliate Coupon API

A deployable Node.js 22 service that automatically provisions **seven real Stripe promotion codes (RM1–RM7)** for every **already registered and active** MERCY affiliate. The server validates the user's Google sign-in against MERCY's existing order/affiliate identity service, then uses server-held Stripe credentials. It never accepts an affiliate ID supplied by the browser.

## Deployment
This code requires a real server (Replit, Render, Cloud Run or equivalent). **GitHub Pages and ShipStatic host static files and cannot run this service.**

1. Deploy the `affiliate-service/` folder to a trusted Node.js host using `npm start`. No third-party npm packages are required.
2. Set the host's protected secret **STRIPE_RESTRICTED_KEY** to a Stripe key with permission to read/create coupons and promotion codes. Create a least-privileged restricted key and keep it out of source code.
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
