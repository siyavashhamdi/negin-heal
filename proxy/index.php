<?php

declare(strict_types=1);

require_once __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Proxy-Key');
    http_response_code(204);
    exit;
}

$route = resolveRoutePath();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

initProxyRequestContext($route, $method);

if ($method === 'GET' && $route === '/docs') {
    serveSwaggerUi();
}

if ($method === 'GET' && $route === '/openapi.json') {
    serveOpenApiSpec();
}

if ($method === 'GET' && $route === '/health') {
    handleHealth();
}

$config = loadConfig();

if ($method === 'POST') {
    requireApiKey($config);
    $body = readJsonBody();

    if ($route === '/payment/request') {
        handlePaymentRequest($config, $body);
    }

    if ($route === '/payment/verify') {
        handlePaymentVerify($config, $body);
    }
}

jsonResponse(404, [
    'ok' => false,
    'error' => 'NOT_FOUND',
    'message' => 'Unknown route.',
]);
