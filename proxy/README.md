# ZarinPal PHP Proxy (cPanel)

Small PHP API that proxies ZarinPal payment **request** and **verify** calls. Deploy this folder to the `pay.neginheal.ir` subdomain document root on cPanel so your main API can reach ZarinPal through an Iranian-hosted endpoint.

## Deploy to cPanel

1. Create subdomain `pay.neginheal.ir` in cPanel and upload the entire `proxy/` folder contents to its document root.
2. Copy `config.example.php` to `config.php` and set:
   - `merchant_id`
   - ZarinPal production URLs (`payment.zarinpal.com` / `www.zarinpal.com`)
   - `site_url` — your registered merchant domain (e.g. `https://neginheal.ir`); sent as `Referer`/`Origin` on outbound ZarinPal calls
   - `api_key` — long random secret shared with your Nest API
3. Ensure PHP **cURL** extension is enabled (default on most cPanel hosts).
4. Confirm `.htaccess` is uploaded; Apache `mod_rewrite` must be enabled.

Health check:

```bash
curl https://pay.neginheal.ir/health
```

Swagger UI (API docs):

- **https://pay.neginheal.ir/docs**
- **https://pay.neginheal.ir/swagger.php**

OpenAPI spec: **https://pay.neginheal.ir/openapi.json**

## Authentication

All `POST` endpoints require:

```http
X-Proxy-Key: <api_key from config.php>
Content-Type: application/json
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/docs` | — | Swagger UI |
| `GET` | `/openapi.json` | — | OpenAPI 3 spec |
| `GET` | `/health` | — | Health check |
| `POST` | `/payment/request` | `X-Proxy-Key` | Start payment |
| `POST` | `/payment/verify` | `X-Proxy-Key` | Verify payment |

### `GET /health`

Returns service status.

### `POST /payment/request`

Starts a ZarinPal payment.

**Request**

```json
{
  "amountIrt": 150000,
  "callbackUrl": "https://neginheal.ir/payment/zarinpal/callback?courseId=abc123",
  "description": "Demo purchase: دوره مدیتیشن",
  "metadata": {
    "email": "user@example.com",
    "mobile": "09121234567",
    "courseId": "abc123",
    "userId": "user-uuid",
    "username": "sara"
  }
}
```

Null or missing metadata fields are sent to ZarinPal as empty strings.

**Success response**

```json
{
  "ok": true,
  "authority": "A00000000000000000000000000123456789",
  "paymentUrl": "https://www.zarinpal.com/pg/StartPay/A00000000000000000000000000123456789",
  "amountIrr": 1500000,
  "zarinpalCode": 100,
  "message": "Success"
}
```

### `POST /payment/verify`

Verifies a payment after the user returns from ZarinPal.

**Request**

```json
{
  "authority": "A00000000000000000000000000123456789",
  "amountIrt": 150000,
  "status": "OK"
}
```

If `status` is present and not `OK`, the proxy returns `cancelled` without calling ZarinPal.

**Success response**

```json
{
  "ok": true,
  "status": "success",
  "refId": "123456789",
  "zarinpalCode": 100,
  "message": "Verified"
}
```

## Why `site_url` matters

Your ZarinPal merchant account is registered under **neginheal.ir**. ZarinPal checks that API traffic looks like it comes from that registered site — not from a foreign API server, and not from an unrelated cPanel hostname. The proxy runs on Iranian hosting (so ZarinPal is reachable), and sets outbound `Referer` / `Origin` headers to `site_url` so requests match the domain in your ZarinPal panel. The `callback_url` in each payment request still points to `https://neginheal.ir/payment/zarinpal/callback`, which is where the user actually returns after paying.

## Nest API configuration

Proxy URL and API key are stored in **System Settings → ZarinPal config** (`ZARINPAL_CONFIG`):

- `proxyBaseUrl` — e.g. `https://pay.neginheal.ir`
- `proxyApiKey` — same value as `api_key` in proxy `config.php`

Ensure `APP_URL=https://neginheal.ir` in the API `.env` for payment callbacks.

## Local test

From the repo root:

```bash
cp proxy/config.example.php proxy/config.php
php -S localhost:8090 -t proxy
```

```bash
curl -s http://localhost:8090/health

curl -s -X POST http://localhost:8090/payment/request \
  -H 'Content-Type: application/json' \
  -H 'X-Proxy-Key: bbbbbbbb-cccc-dddd-eeee-ffffffffffff' \
  -d '{
    "amountIrt": 150000,
    "callbackUrl": "http://localhost:8080/payment/zarinpal/callback?courseId=test",
    "description": "Test purchase",
    "metadata": {
      "email": "user@example.com",
      "mobile": "09121234567",
      "courseId": "test",
      "userId": "user-1",
      "username": "sara"
    }
  }'
```

## Logs

Request logs are written to `logs/` as one file per UTC day, e.g. `logs/2025-06-27.log`. Each line is a JSON object (JSON Lines format).

Logged fields include route, `http_status`, total `duration_ms`, and `zarinpal_duration_ms` for outbound ZarinPal calls. Payment metadata is limited to `courseId` and `userId`; email, mobile, username, API keys, merchant IDs, and full callback query strings are not stored. Payment authorities are redacted (last 8 characters only).

Successful `GET /health` responses are not logged to reduce noise. The `logs/` directory is blocked from web access via `.htaccess`. Ensure `logs/` is writable by PHP on deploy (created automatically if missing).
