# MERCY legacy affiliate service — retired 6 November 2026

Public affiliate enrolment, the former KKM staff/pensioner and UiTM offers, and this standalone coupon service are withdrawn. Every `/api/affiliate/*` HTTP route now returns `410 Gone` before identity verification or Stripe provisioning. Do not point the current participant dashboard at this legacy service.

Current free app access and sales participation require private eligibility approval for an orphan, orphanage or OKU participant through the canonical MERCY beneficiary service. See [current initiatives](https://mercyseries.com/affiliate-program/) and [private applications](https://mercyseries.com/community-access/). The canonical service owns current discount limits, all-clean-profit accounting and direct-sale orphanage allocations.

This service retains signed webhook verification only so historical `charge.refunded` events can reverse existing legacy ledger records. Signed paid checkout events are acknowledged without creating new legacy commissions. Existing ledger helpers and tests describe historical records; they are not a current offer. Preserve historical earnings and payment records.

If this service is already running, deploy this retirement update with its existing protected Stripe secrets to close its old routes. Do not create a new webhook destination for it or provision new codes. Current payments and beneficiary accounting belong to the canonical service.

Run `node --test` in this directory to verify the withdrawal gate, webhook signatures, historical refunds and legacy calculation helpers. No third-party dependencies are required.
