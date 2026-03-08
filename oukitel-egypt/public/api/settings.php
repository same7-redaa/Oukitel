<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$file   = __DIR__ . '/config/settings.json';

if (!is_dir(__DIR__ . '/config')) {
    mkdir(__DIR__ . '/config', 0755, true);
}

// Ensure default config exists
if (!file_exists($file)) {
    file_put_contents($file, json_encode([
        'phone' => '+20 100 000 0000',
        'email' => 'Oukitelegypt5@gmail.com'
    ]));
}

switch ($method) {
    case 'GET':
        $config = json_decode(file_get_contents($file), true) ?? [];
        jsonResponse($config);
        break;

    case 'POST':
    case 'PUT':
        requireAuth();
        $isJson = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false;
        $body = $isJson ? getBody() : $_POST;

        $config = json_decode(file_get_contents($file), true) ?? [];
        
        if (isset($body['phone'])) $config['phone'] = trim($body['phone']);
        if (isset($body['email'])) $config['email'] = trim($body['email']);

        file_put_contents($file, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        
        jsonResponse(['message' => 'تم حفظ الإعدادات بنجاح', 'settings' => $config]);
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
