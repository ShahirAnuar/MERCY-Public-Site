# MERCY / The Guide unlimited affiliate checkout — server implementation required

## Status as of 31 October 2026
The GitHub Pages client is prepared for referral sharing, QR-page sharing, a verified discount session, and a two-device UI check. The payment, referral wallet, and activation server are hosted separately at `mercy-malaysia-orders-reviews.shahiranuar.chatgpt.site`; this repository does **not** contain its implementation or Stripe credentials. Publishing the frontend alone does **not** activate an unlimited affiliate programme or a genuine two-device back-end limit.

## Price and commission rules
- Normal digital purchase price: **RM13.60**.
- Referred digital buyer price: **RM10.00** (server created Stripe Checkout Session; total must be verified as RM10).
- Valid referrer reward: **RM5.00 per completed, eligible, non-refunded purchase**, unbounded over time and over number of buyers.
- Fees, refunds, taxes, chargebacks, reversals, and payouts must be accounted for separately; RM10 minus RM5 is RM5 before fees.
- No commission for clicks, failed payments, duplicate webhooks, fraudulent orders, or self-purchases.
- On refund or chargeback, reverse or deduct any previously credited affiliate amount. Define and display withdrawal/payout timelines and eligibility terms before enabling real payouts.

## Referral identity MUST NOT be the device/user serial
- Keep `ref_<32 lowercase hexadecimal chars>` as the *public referral code* for a referrer, separate from private purchase serials.
- Referrals are URLs of the form `https://mercyseries.com/buy/?ref=ref_<32hex>`.
- `/api/referral` must authenticate the Google user and the purchased app, return the same reusable `shareUrl` after every referred sale, and must **never** switch `eligible` to false merely because a referral was redeemed. No one-time redemption limit.
- Never put activation tokens, secret serials, Google credentials, bank details, or device IDs in share URLs.
- Store distinct data: `referrals(referrer_id, public_code, created_at, status)`, `referral_orders(stripe_session_id UNIQUE, stripe_payment_intent_id UNIQUE, public_code, buyer_id, amount_paid, state)`, `affiliate_ledger(id, referrer_id, stripe_session_id UNIQUE, amount_myr=5, status)`.
- The referrer's Google account should not be disclosed to buyers.

## New backend checkout API (client already prepared)
`POST /api/referral/checkout` body: `{"referralCode":"ref_<32hex>"}`.

Server verifies the referral code is active and distinct from a serial, then creates a Stripe Checkout Session at exactly 1000 MYR sen, with the referral code in Stripe metadata or the server's order record. Do **not** use the existing RM13.60 Payment Link plus `client_reference_id` and assume that changes its price.

Return: `{"checkoutUrl":"https://checkout.stripe.com/...","amountCents":1000,"currency":"myr"}`.

The frontend checks those three fields before redirecting. Leave the normal RM13.60 Payment Link unchanged for non-referral purchases.

## Webhook and accounting
- On verified `checkout.session.completed` / confirmed paid order, assign the new buyer a unique activation serial/token and create exactly one pending RM5 ledger entry per real paid order with an eligible referrer. Tie issuance to final payment status, not client callbacks.
- Do **not** limit the number of ledger entries per referrer. An individual buyer may be credited only once per qualifying purchase.
- A single share URL may create thousands of independent purchases. Use unique payment IDs and transactional database writes for webhook idempotency.
- Verify Stripe webhook signatures, protect against fraud/self-referrals, and reconcile refunds and disputes. Keep an auditable earnings and payout history; do not promise payouts until a payout method and process exist.
- Provide affiliate earnings balance and approved/pending payout status in authenticated UI, with no display of other customers' identities.

## Two active devices per one Google account
- Enforce **two** concurrent device registrations on the server for `/api/stripe/claim`, `/api/access/check`, `/api/access/migrate`, and `/api/book`. The current client check is only a UX safeguard; it is not access control.
- Account identity must be verified using Google token signature, audience, issuer and stable `sub`, rather than relying on client-provided device IDs alone.
- Provide an authenticated device-management or support-assisted revoke path, so replacing a phone does not permanently lock out a purchaser.
- Revoke superseded device access tokens and check device status server-side before serving PDFs. Do not delete data from previously paid customers while migrating from a three-device allowance; handle existing users explicitly.

## Release checks
1. Normal purchase still charges RM13.60.
2. Valid new referral charges **exactly RM10**, no RM13.60 fallback, and activates its buyer.
3. Two or more distinct referral purchases via the same public code each earn exactly RM5; 1,000+ remain possible without expiry or exhaustion.
4. Failed/duplicate webhook, self-referral and refund create no duplicate/incorrect reward.
5. Public URLs contain no activation serial or access token.
6. Two devices activate successfully; a third is denied by the backend, then succeeds only after one device is revoked.
7. QR front-matter page shows share CTA where PDF text or supported browser QR detection recognizes the QR. On other pages the header/toolbar share action remains available.
8. TTS is absent and no OCR/Tesseract assets are loaded.
