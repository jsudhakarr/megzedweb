# Payments

## Overview
This repository uses a unified **Payment Gateways** system with a single `payment_transactions` table for all gateways (including Google Play). Admins can enable/disable gateways, change ordering, and manage configuration secrets securely (encrypted at rest).

Key goals:
- Gateways are managed in Admin Panel and can be enabled/disabled instantly.
- The app fetches only **enabled** gateways for its platform.
- Every payment is verified **server-side** and stored in a single transaction table.
- Google Play remains compatible with the existing Android purchase flow.

---

## Admin: Enable/Disable Google Play
1. Go to **Admin → Payment Gateways**.
2. Create or edit the `google_play` gateway.
3. Toggle **Enabled**.
4. Set **Supported Platforms** to `android`.
5. Add required config values (below).

If `google_play` is disabled, **the app will no longer receive Google Play as a gateway** from `/api/v1/payment-gateways`.

---

## Adding a New Gateway
1. Admin → Payment Gateways → **Add Gateway**.
2. Choose a `code` (e.g. `razorpay`, `cashfree`, `payu`).
3. Set the `name`, `mode`, `currency`, and `supported_platforms`.
4. Add gateway secrets in **Gateway Config (Secrets)**.
5. Add any non-secret keys in **Public Config (Safe keys)**.
6. Save and enable.

The gateway becomes available to the app after caching expires (10 minutes) or immediately after an admin update.

---

## Required Config Keys
### `google_play`
Secrets (encrypted):
- `service_account_json` (service account JSON contents)

Optional:
- `allowed_product_ids` (comma-separated list)

Public config:
- `package_name` (e.g. `com.example.app`)

### `razorpay`
Secrets (encrypted):
- `key_id` / `key_secret` (single pair), or
- `test_key_id` + `test_key_secret` and `live_key_id` + `live_key_secret`

### `cashfree`
- `app_id`
- `secret_key`

### `payu`
- `merchant_key`
- `merchant_salt`

### `phonepe_pg`
- `merchant_id`
- `salt_key`

### Manual Gateways
- `upi_manual`: `upi_id`, `instructions`
- `bank_transfer`: `account_name`, `account_number`, `ifsc`, `instructions`

Public config can include safe values like `publishableKey`, `merchantName`, or `instructions`.

---

## Public API
### List Enabled Gateways
`GET /api/v1/payment-gateways`

Headers:
- `X-Platform: android|ios|web`

Response:
- `code`, `name`, `sort_order`, `mode`, `currency`
- `public_config`
- `instructions`

Only enabled gateways for the requesting platform are returned.

---

## Payment Flow
### Create Payment Intent (legacy / flexible)
`POST /api/v1/payments/create-intent`

Body:
- `gateway_code`
- `amount`, `currency`
- `purpose` (e.g. `coins`, `package`)
- `reference_id` (optional)
- `meta` (optional)

Creates a `payment_transactions` row (status `created` or `pending` for manual).

### Init Payment (coin packages)
`POST /api/v1/payments/init`

Body:
- `gateway_code` (one of `google_play`, `razorpay`, `upi_manual`, `bank_transfer`)
- `package_id` (coin package id) or `coins_amount`
- `platform` (optional; otherwise uses `X-Platform`)

Creates a transaction and returns gateway-specific data:
- Razorpay: `razorpay_key_id`, `razorpay_order_id`, `amount_paise`, `currency`
- Google Play: `product_id`, `package_name`
- Manual: `instructions`

### Confirm Payment
`POST /api/v1/payments/confirm`

Body:
- `gateway_code`
- `transaction_id`
- `payload` (optional verification payload)
- Razorpay: `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`
- Google Play: `product_id`, `purchase_token`, `package_name`

Razorpay and Google Play accept top-level fields that are merged into `payload`.
Manual gateways must use `/api/v1/payments/manual/submit`.

Server verifies the payment and marks it paid **idempotently**.

---

## Google Play Verification
### Endpoint
`POST /api/v1/google-play/verify`

Body:
- `product_id`
- `purchase_token`
- (optional) `purchase_type` = `product` | `subscription`

Server calls the Android Publisher API and credits coins on success. This endpoint:
- Checks the `google_play` admin toggle.
- Validates purchase tokens idempotently.
- Updates the unified `payment_transactions` table.
- Credits wallet coins atomically.

---

## Manual Payments (UPI / Bank Transfer)
### Submit Proof
`POST /api/v1/payments/manual/submit`

Body:
- `gateway_code` (`upi_manual` or `bank_transfer`)
- `transaction_id`
- `utr` (reference number)
- `paid_at` (date)
- `amount`
- `screenshot` (optional)

Admin can mark manual transactions as paid from **Payment Transactions**. This is blocked for online gateways and Google Play.

---

## Webhooks
Gateway webhooks should target:
`POST /api/v1/webhooks/payments/{gateway_code}`

The handler logs payloads and can be extended with signature validation and mapping to transactions.

---

## Sandbox Testing
- Set gateway `mode` to `sandbox`.
- Use test credentials in the secrets.
- Use test purchase tokens for Google Play if available.
- Use `/api/v1/payment-gateways` to confirm the app sees the gateway toggle.

---

## Security & Idempotency Notes
- `config_json` is encrypted at rest (Laravel encrypted casts).
- Secrets are **never** returned from APIs.
- Payment confirmations are idempotent (safe to call multiple times).
- Gateway interactions are logged without leaking secrets.
- Manual mark-paid is restricted to manual gateways only.
