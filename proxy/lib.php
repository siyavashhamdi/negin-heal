<?php

declare(strict_types=1);

function loadConfig(): array
{
    $configPath = __DIR__ . '/config.php';

    if (!is_file($configPath)) {
        jsonResponse(500, [
            'ok' => false,
            'error' => 'CONFIG_MISSING',
            'message' => 'Copy config.example.php to config.php and set your values.',
        ]);
    }

    /** @var array<string, mixed> $config */
    $config = require $configPath;

    $requiredKeys = [
        'merchant_id',
        'request_url',
        'verify_url',
        'start_pay_url',
        'min_amount_irr',
        'api_key',
        'site_url',
    ];

    foreach ($requiredKeys as $key) {
        if (!isset($config[$key]) || $config[$key] === '') {
            jsonResponse(500, [
                'ok' => false,
                'error' => 'CONFIG_INVALID',
                'message' => "Missing config value: {$key}",
            ]);
        }
    }

    return $config;
}

function initProxyRequestContext(string $route, string $method): void
{
    $GLOBALS['_proxy_log'] = [
        'route' => $route,
        'method' => $method,
        'started_at' => microtime(true),
        'zarinpal_duration_ms' => null,
        'extras' => [],
    ];
}

function proxyLogExtra(array $extras): void
{
    if (!isset($GLOBALS['_proxy_log']) || !is_array($GLOBALS['_proxy_log']['extras'] ?? null)) {
        return;
    }

    $GLOBALS['_proxy_log']['extras'] = array_merge($GLOBALS['_proxy_log']['extras'], $extras);
}

function proxyLogZarinpalDuration(float $durationMs): void
{
    if (isset($GLOBALS['_proxy_log'])) {
        $GLOBALS['_proxy_log']['zarinpal_duration_ms'] = round($durationMs, 2);
    }
}

function proxyLogDir(): string
{
    return __DIR__ . '/logs';
}

function sanitizeMetadataForLog(array $metadata): array
{
    $courseId = normalizeText($metadata['courseId'] ?? null);
    $userId = normalizeText($metadata['userId'] ?? null);

    return array_filter([
        'courseId' => $courseId !== '' ? $courseId : null,
        'userId' => $userId !== '' ? $userId : null,
    ], static fn ($value) => $value !== null);
}

function redactAuthority(?string $authority): ?string
{
    if ($authority === null || $authority === '') {
        return null;
    }

    if (strlen($authority) <= 8) {
        return '***';
    }

    return '***' . substr($authority, -8);
}

function sanitizeCallbackUrlForLog(string $url): string
{
    $parsed = parse_url($url);

    if (!is_array($parsed)) {
        return '[invalid]';
    }

    $host = normalizeText($parsed['host'] ?? null);
    $path = normalizeText($parsed['path'] ?? null);

    if ($host === '') {
        return '[invalid]';
    }

    return $host . ($path !== '' ? $path : '/');
}

function ensureProxyLogDir(): bool
{
    $logDir = proxyLogDir();

    if (is_dir($logDir)) {
        return is_writable($logDir);
    }

    if (!mkdir($logDir, 0750, true) && !is_dir($logDir)) {
        return false;
    }

    $htaccessPath = $logDir . '/.htaccess';

    if (!is_file($htaccessPath)) {
        file_put_contents($htaccessPath, <<<'HTACCESS'
<IfModule mod_authz_core.c>
  Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
  Deny from all
</IfModule>
HTACCESS);
    }

    return is_writable($logDir);
}

function writeProxyLog(int $statusCode, array $payload): void
{
    $ctx = $GLOBALS['_proxy_log'] ?? null;

    if (!is_array($ctx)) {
        return;
    }

    $route = (string) ($ctx['route'] ?? '');
    $startedAt = (float) ($ctx['started_at'] ?? microtime(true));

    if ($route === '/health' && $statusCode === 200) {
        return;
    }

    $entry = [
        'ts' => gmdate('c'),
        'route' => $route,
        'method' => (string) ($ctx['method'] ?? ''),
        'http_status' => $statusCode,
        'duration_ms' => round((microtime(true) - $startedAt) * 1000, 2),
    ];

    if ($ctx['zarinpal_duration_ms'] !== null) {
        $entry['zarinpal_duration_ms'] = $ctx['zarinpal_duration_ms'];
    }

    if (array_key_exists('ok', $payload)) {
        $entry['ok'] = (bool) $payload['ok'];
    }

    foreach (['error', 'message'] as $field) {
        if (isset($payload[$field]) && is_string($payload[$field]) && $payload[$field] !== '') {
            $entry[$field] = $payload[$field];
        }
    }

    if (isset($payload['status']) && is_string($payload['status']) && $payload['status'] !== '') {
        $entry['payment_status'] = $payload['status'];
    }

    if (isset($payload['zarinpalCode'])) {
        $entry['zarinpal_code'] = (int) $payload['zarinpalCode'];
    }

    if (isset($payload['amountIrr'])) {
        $entry['amount_irr'] = (int) $payload['amountIrr'];
    }

    if (isset($payload['refId']) && (is_string($payload['refId']) || is_numeric($payload['refId']))) {
        $refId = normalizeText($payload['refId']);
        if ($refId !== '') {
            $entry['ref_id'] = $refId;
        }
    }

    $extras = is_array($ctx['extras'] ?? null) ? $ctx['extras'] : [];

    foreach (['amount_irt', 'amount_irr', 'callback_path', 'authority'] as $field) {
        if (array_key_exists($field, $extras) && $extras[$field] !== null) {
            $entry[$field] = $extras[$field];
        }
    }

    if (
        array_key_exists('metadata', $extras)
        && is_array($extras['metadata'])
        && $extras['metadata'] !== []
    ) {
        $entry['metadata'] = $extras['metadata'];
    }

    if (!ensureProxyLogDir()) {
        return;
    }

    $logFile = proxyLogDir() . '/' . gmdate('Y-m-d') . '.log';
    $line = json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($line === false) {
        return;
    }

    file_put_contents($logFile, $line . "\n", FILE_APPEND | LOCK_EX);
}

function jsonResponse(int $statusCode, array $payload): void
{
    writeProxyLog($statusCode, $payload);

    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');

    if ($raw === false || trim($raw) === '') {
        jsonResponse(400, [
            'ok' => false,
            'error' => 'INVALID_JSON',
            'message' => 'Request body must be valid JSON.',
        ]);
    }

    $decoded = json_decode($raw, true);

    if (!is_array($decoded)) {
        jsonResponse(400, [
            'ok' => false,
            'error' => 'INVALID_JSON',
            'message' => 'Request body must be valid JSON.',
        ]);
    }

    return $decoded;
}

function readProxyApiKey(): string
{
    $candidates = [
        $_SERVER['HTTP_X_PROXY_KEY'] ?? null,
        $_SERVER['REDIRECT_HTTP_X_PROXY_KEY'] ?? null,
    ];

    $envKey = getenv('HTTP_X_PROXY_KEY');
    if (is_string($envKey) && $envKey !== '') {
        $candidates[] = $envKey;
    }

    foreach ($candidates as $candidate) {
        if (is_string($candidate) && $candidate !== '') {
            return $candidate;
        }
    }

    return '';
}

function requireApiKey(array $config): void
{
    $providedKey = readProxyApiKey();

    if (!is_string($providedKey) || $providedKey === '') {
        jsonResponse(401, [
            'ok' => false,
            'error' => 'UNAUTHORIZED',
            'message' => 'Missing X-Proxy-Key header.',
        ]);
    }

    $expectedKey = (string) $config['api_key'];

    if (!hash_equals($expectedKey, $providedKey)) {
        jsonResponse(401, [
            'ok' => false,
            'error' => 'UNAUTHORIZED',
            'message' => 'Invalid API key.',
        ]);
    }
}

function normalizeText(mixed $value): string
{
    if ($value === null) {
        return '';
    }

    if (!is_string($value) && !is_numeric($value)) {
        return '';
    }

    return trim((string) $value);
}

function requirePositiveNumber(mixed $value, string $fieldName): float
{
    if (!is_numeric($value)) {
        jsonResponse(400, [
            'ok' => false,
            'error' => 'VALIDATION_ERROR',
            'message' => "{$fieldName} must be a positive number.",
        ]);
    }

    $number = (float) $value;

    if ($number <= 0) {
        jsonResponse(400, [
            'ok' => false,
            'error' => 'VALIDATION_ERROR',
            'message' => "{$fieldName} must be a positive number.",
        ]);
    }

    return $number;
}

function toAmountIrr(float $amountIrt, int $minAmountIrr): int
{
    return max($minAmountIrr, (int) round($amountIrt * 10));
}

function buildZarinpalMetadata(array $metadata): array
{
    return [
        'email' => normalizeText($metadata['email'] ?? null),
        'mobile' => normalizeText($metadata['mobile'] ?? null),
        'courseId' => normalizeText($metadata['courseId'] ?? null),
        'userId' => normalizeText($metadata['userId'] ?? null),
        'username' => normalizeText($metadata['username'] ?? null),
    ];
}

function buildZarinpalOutboundHeaders(array $config): array
{
    $siteUrl = rtrim(normalizeText($config['site_url'] ?? null), '/');

    if ($siteUrl === '') {
        jsonResponse(500, [
            'ok' => false,
            'error' => 'CONFIG_INVALID',
            'message' => 'Missing config value: site_url',
        ]);
    }

    return [
        'Accept: application/json',
        'Content-Type: application/json',
        'Referer: ' . $siteUrl . '/',
        'Origin: ' . $siteUrl,
    ];
}

function zarinpalPost(array $config, string $url, array $payload): array
{
    if (!function_exists('curl_init')) {
        jsonResponse(500, [
            'ok' => false,
            'error' => 'CURL_UNAVAILABLE',
            'message' => 'PHP cURL extension is required.',
        ]);
    }

    $ch = curl_init($url);

    if ($ch === false) {
        jsonResponse(502, [
            'ok' => false,
            'error' => 'ZARINPAL_CONNECTION_FAILED',
            'message' => 'Could not initialize HTTP client.',
        ]);
    }

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => buildZarinpalOutboundHeaders($config),
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
    ]);

    $zarinpalStartedAt = microtime(true);
    $responseBody = curl_exec($ch);
    proxyLogZarinpalDuration((microtime(true) - $zarinpalStartedAt) * 1000);
    $curlError = curl_error($ch);
    $httpStatus = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($responseBody === false) {
        jsonResponse(502, [
            'ok' => false,
            'error' => 'ZARINPAL_CONNECTION_FAILED',
            'message' => $curlError !== '' ? $curlError : 'Failed to reach ZarinPal.',
        ]);
    }

    $decoded = json_decode($responseBody, true);

    if (!is_array($decoded)) {
        jsonResponse(502, [
            'ok' => false,
            'error' => 'ZARINPAL_INVALID_RESPONSE',
            'message' => 'ZarinPal returned a non-JSON response.',
            'httpStatus' => $httpStatus,
        ]);
    }

    return $decoded;
}

function extractZarinpalMessage(array $response): string
{
    if (isset($response['data']['message']) && is_string($response['data']['message'])) {
        return $response['data']['message'];
    }

    if (isset($response['errors']) && is_array($response['errors'])) {
        $firstError = $response['errors'][0] ?? null;

        if (is_array($firstError) && isset($firstError['message']) && is_string($firstError['message'])) {
            return $firstError['message'];
        }
    }

    return 'Unknown ZarinPal error';
}

function handleHealth(): void
{
    jsonResponse(200, [
        'ok' => true,
        'service' => 'zarinpal-proxy',
    ]);
}

function handlePaymentRequest(array $config, array $body): void
{
    $amountIrt = requirePositiveNumber($body['amountIrt'] ?? null, 'amountIrt');
    $callbackUrl = normalizeText($body['callbackUrl'] ?? null);
    $description = normalizeText($body['description'] ?? null);

    if ($callbackUrl === '') {
        jsonResponse(400, [
            'ok' => false,
            'error' => 'VALIDATION_ERROR',
            'message' => 'callbackUrl is required.',
        ]);
    }

    if ($description === '') {
        jsonResponse(400, [
            'ok' => false,
            'error' => 'VALIDATION_ERROR',
            'message' => 'description is required.',
        ]);
    }

    $metadataInput = is_array($body['metadata'] ?? null) ? $body['metadata'] : [];
    $amountIrr = toAmountIrr($amountIrt, (int) $config['min_amount_irr']);

    proxyLogExtra([
        'amount_irt' => $amountIrt,
        'callback_path' => sanitizeCallbackUrlForLog($callbackUrl),
        'metadata' => sanitizeMetadataForLog($metadataInput),
    ]);

    $zarinpalResponse = zarinpalPost($config, (string) $config['request_url'], [
        'merchant_id' => (string) $config['merchant_id'],
        'amount' => $amountIrr,
        'callback_url' => $callbackUrl,
        'description' => $description,
        'metadata' => buildZarinpalMetadata($metadataInput),
    ]);

    $payment = is_array($zarinpalResponse['data'] ?? null) ? $zarinpalResponse['data'] : [];
    $code = isset($payment['code']) ? (int) $payment['code'] : null;
    $authority = normalizeText($payment['authority'] ?? null);
    $message = extractZarinpalMessage($zarinpalResponse);

    if ($code !== 100 || $authority === '') {
        proxyLogExtra(['authority' => redactAuthority($authority !== '' ? $authority : null)]);

        jsonResponse(400, [
            'ok' => false,
            'error' => 'ZARINPAL_PAYMENT_FAILED',
            'message' => $message,
            'zarinpalCode' => $code,
        ]);
    }

    proxyLogExtra(['authority' => redactAuthority($authority)]);

    $startPayUrl = rtrim((string) $config['start_pay_url'], '/');

    jsonResponse(200, [
        'ok' => true,
        'authority' => $authority,
        'paymentUrl' => "{$startPayUrl}/{$authority}",
        'amountIrr' => $amountIrr,
        'zarinpalCode' => $code,
        'message' => $message,
    ]);
}

function handlePaymentVerify(array $config, array $body): void
{
    $authority = normalizeText($body['authority'] ?? null);
    $amountIrt = requirePositiveNumber($body['amountIrt'] ?? null, 'amountIrt');
    $status = normalizeText($body['status'] ?? null);

    if ($authority === '') {
        jsonResponse(400, [
            'ok' => false,
            'error' => 'VALIDATION_ERROR',
            'message' => 'authority is required.',
        ]);
    }

    proxyLogExtra([
        'amount_irt' => $amountIrt,
        'authority' => redactAuthority($authority),
    ]);

    if ($status !== '' && strtoupper($status) !== 'OK') {
        jsonResponse(200, [
            'ok' => true,
            'status' => 'cancelled',
            'message' => 'Payment cancelled by user.',
        ]);
    }

    $amountIrr = toAmountIrr($amountIrt, (int) $config['min_amount_irr']);

    proxyLogExtra(['amount_irr' => $amountIrr]);

    $zarinpalResponse = zarinpalPost($config, (string) $config['verify_url'], [
        'merchant_id' => (string) $config['merchant_id'],
        'amount' => $amountIrr,
        'authority' => $authority,
    ]);

    $verification = is_array($zarinpalResponse['data'] ?? null) ? $zarinpalResponse['data'] : [];
    $code = isset($verification['code']) ? (int) $verification['code'] : null;
    $refId = normalizeText($verification['ref_id'] ?? null);
    $message = extractZarinpalMessage($zarinpalResponse);

    if ($code === 100 || $code === 101) {
        jsonResponse(200, [
            'ok' => true,
            'status' => 'success',
            'refId' => $refId !== '' ? $refId : null,
            'zarinpalCode' => $code,
            'message' => $message,
        ]);
    }

    jsonResponse(200, [
        'ok' => false,
        'status' => 'failed',
        'error' => 'ZARINPAL_VERIFICATION_FAILED',
        'zarinpalCode' => $code,
        'message' => $message,
    ]);
}

function resolveRoutePath(): string
{
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
    $path = parse_url($requestUri, PHP_URL_PATH);

    if (!is_string($path) || $path === '') {
        return '/';
    }

    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $baseDir = rtrim(str_replace('\\', '/', dirname($scriptName)), '/');

    if ($baseDir !== '' && $baseDir !== '/' && strpos($path, $baseDir) === 0) {
        $path = substr($path, strlen($baseDir));
    }

    $path = '/' . trim($path, '/');

    return $path === '/' ? '/' : rtrim($path, '/');
}

function resolveProxyBasePath(): string
{
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '/index.php';
    $baseDir = rtrim(str_replace('\\', '/', dirname($scriptName)), '/');

    return $baseDir === '/' ? '' : $baseDir;
}

function resolveProxyWebRoot(): string
{
    $basePath = resolveProxyBasePath();

    if ($basePath !== '' && str_ends_with($basePath, '/docs')) {
        $parent = rtrim(str_replace('\\', '/', dirname($basePath)), '/');

        return $parent === '/' ? '' : $parent;
    }

    return $basePath;
}

function serveOpenApiSpec(): void
{
    $specPath = __DIR__ . '/openapi.json';

    if (!is_file($specPath)) {
        jsonResponse(500, [
            'ok' => false,
            'error' => 'OPENAPI_MISSING',
            'message' => 'openapi.json was not found.',
        ]);
    }

    $spec = file_get_contents($specPath);

    if ($spec === false) {
        jsonResponse(500, [
            'ok' => false,
            'error' => 'OPENAPI_READ_FAILED',
            'message' => 'Could not read openapi.json.',
        ]);
    }

    header('Content-Type: application/json; charset=utf-8');
    echo $spec;
    exit;
}

function serveSwaggerUi(): void
{
    $webRoot = resolveProxyWebRoot();
    $openApiUrl = htmlspecialchars($webRoot . '/openapi.json', ENT_QUOTES, 'UTF-8');
    $swaggerVersion = '5.11.0';

    header('Content-Type: text/html; charset=utf-8');
    echo <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Negin Heal ZarinPal Proxy API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@{$swaggerVersion}/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@{$swaggerVersion}/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://unpkg.com/swagger-ui-dist@{$swaggerVersion}/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: '{$openApiUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
        persistAuthorization: true
      });
    };
  </script>
</body>
</html>
HTML;
    exit;
}
