<?php
/**
 * db.php — SQLite initialization & shared helpers
 * Included by all API files.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ─── Database path ────────────────────────────────────────────────────────────
$dataDir = __DIR__ . '/../data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}
$dbFile = $dataDir . '/database.sqlite';

try {
    $pdo = new PDO('sqlite:' . $dbFile, null, null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    // Removed PRAGMA journal_mode=WAL because it causes infinite deadlocks on some shared hostings like Hostinger
    $pdo->exec('PRAGMA foreign_keys=ON');
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'DB connection failed: ' . $e->getMessage()]));
}

// ─── Schema ───────────────────────────────────────────────────────────────────
$pdo->exec("
    CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        arabic_name TEXT NOT NULL,
        image TEXT DEFAULT '',
        description TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        price REAL NOT NULL,
        category_id TEXT NOT NULL,
        image TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        variant_type TEXT,
        variant_value TEXT,
        stock INTEGER DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        position INTEGER DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        notes TEXT DEFAULT '',
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        variant_id INTEGER,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    );
");

// ─── Seed default data (runs only once) ───────────────────────────────────────
// (Categories seeding removed as user requested empty DB)

$adminCount = $pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn();
if ($adminCount == 0) {
    $hash = password_hash('Oukitelegypt57', PASSWORD_BCRYPT);
    $pdo->prepare('INSERT INTO admins (username,password) VALUES (?,?)')->execute(['OukitelEgypt', $hash]);
}

// ─── JWT helpers (simple HMAC-based) ─────────────────────────────────────────
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'oukitel-egypt-secret-2025');
define('JWT_EXPIRY', 86400 * 30); // 30 days

function jwt_encode(array $payload): string {
    $header  = base64_url_encode(json_encode(['alg'=>'HS256','typ'=>'JWT']));
    $payload = base64_url_encode(json_encode($payload));
    $sig     = base64_url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$sig";
}

function jwt_decode(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$header, $payload, $sig] = $parts;
    $expected = base64_url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    if (!hash_equals($expected, $sig)) return null;
    $data = json_decode(base64_url_decode($payload), true);
    if (!$data || (isset($data['exp']) && $data['exp'] < time())) return null;
    return $data;
}

function base64_url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function base64_url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
}

// ─── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(): array {
    $headers = getallheaders();
    $auth    = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (empty($auth) && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    $token   = str_starts_with($auth, 'Bearer ') ? substr($auth, 7) : '';
    $payload = $token ? jwt_decode($token) : null;
    if (!$payload) {
        http_response_code(401);
        die(json_encode(['error' => 'غير مصرح به']));
    }
    return $payload;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function jsonResponse(mixed $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getBody(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}
