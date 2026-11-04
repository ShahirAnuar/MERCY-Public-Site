# UiTM Affiliate and Paid-Purchase Entitlements Design

**Date:** 4 November 2026  
**Scope:** The Guide App Malaysia checkout, affiliate accounting, UiTM Faculty of Pharmacy access, and paid-purchase entitlements.

## Locked business rules

1. The public list price remains **RM25.00**.
2. A standard affiliate earns **RM20.00** on an eligible RM25.00 sale without a coupon.
3. An affiliate coupon reduces both the buyer price and affiliate target by the coupon face value. Examples:
   - no coupon: buyer RM25, affiliate RM20;
   - RM5 coupon: buyer RM20, affiliate RM15;
   - RM15 coupon: buyer RM10, affiliate RM5.
4. Actual Stripe processing fees come from the publisher remainder. With the illustrative 3% + RM1 fee, the publisher remainder is RM3.25 at RM25 and RM3.40 at RM20.
5. Existing approved OKU, orphanage/orphan-school and KKM clean-profit benefits remain unchanged. UiTM is removed from the 100%-clean-profit affiliate class.
6. A verified **UiTM Faculty of Pharmacy staff member** receives one free personal app licence. A free staff licence is not a paid purchase, earns no commission, and does not trigger paid-purchase entitlements.
7. A verified **UiTM Faculty of Pharmacy student** may purchase the normal customer edition for **RM20.00**. After successful payment, the student is automatically offered the affiliate opportunity.
8. A UiTM student affiliate may:
   - sell to the public at RM25 using the full-price affiliate link; or
   - offer a verified UiTM student a RM5 coupon so that student pays RM20.
9. Every **paid** The Guide App purchase includes:
   - one ticket entitlement for the UiTM event **“The Digital Age and The Inevitable Rise of The Polymaths”**; and
   - first-batch access entitlement to **“Morality: The Vocation of Consciousness & The AI Dilemma”** when released.
10. Entitlements are tied to the checkout email and PaymentIntent/Checkout Session. Refunds, reversals and disputes revoke or hold the related entitlements.
11. The existing free **Affiliate version — Not for sale** remains a separate personal affiliate licence. It is not the paid customer edition and does not include paid-purchase entitlements.
12. Earlier purchases and already-settled commissions retain their historical policy; the new calculation applies prospectively after deployment.

## Technical model

- Store prices, programme and entitlement version in Stripe Price/Payment Link metadata.
- Record the actual fee, affiliate commission, publisher remainder, source and entitlement flags on the PaymentIntent.
- Keep webhook processing idempotent by Checkout Session and PaymentIntent.
- Accept and provision RM1–RM15 affiliate promotion-code tiers.
- Keep UiTM proof private. Public pages explain benefits but do not expose documents or approval state.
- Use a separate RM20 UiTM student Price/Payment Link, shared only after verification; affiliate-to-student sales continue to use the public RM25 checkout plus an owned RM5 coupon.
