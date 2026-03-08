<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($_POST['_method']) && strtoupper($_POST['_method']) === 'PUT') {
    $method = 'PUT';
}
$id     = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $cat = $pdo->prepare('SELECT * FROM categories WHERE id = ?');
            $cat->execute([$id]);
            $row = $cat->fetch();
            if (!$row) jsonResponse(['error' => 'الفئة غير موجودة'], 404);
            jsonResponse($row);
        }
        $cats = $pdo->query('SELECT * FROM categories ORDER BY sort_order')->fetchAll();
        jsonResponse($cats);

    case 'POST':
        requireAuth();
        // Accept both JSON body and FormData
        $isJson = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false;
        if ($isJson) {
            $body = getBody();
        } else {
            $body = $_POST;
        }

        $cid    = trim($body['id'] ?? '');
        $name   = trim($body['name'] ?? '');
        $arabic = trim($body['arabic_name'] ?? '');
        if (!$cid || !$name || !$arabic) jsonResponse(['error' => 'البيانات الأساسية مطلوبة (id, name, arabic_name)'], 400);

        $desc  = $body['description'] ?? '';
        $order = (int)($body['sort_order'] ?? 0);
        $image = $body['image'] ?? '';

        // Handle image upload if file sent
        if (!empty($_FILES['image'])) {
            $image = handleCategoryUpload($_FILES['image']);
        }

        // Check if category already exists
        $existing = $pdo->prepare('SELECT id FROM categories WHERE id = ?');
        $existing->execute([$cid]);
        if ($existing->fetch()) {
            jsonResponse(['error' => 'معرف الفئة موجود مسبقاً، اختر معرفاً آخر'], 409);
        }

        $stmt = $pdo->prepare('INSERT INTO categories (id,name,arabic_name,description,sort_order,image) VALUES (?,?,?,?,?,?)');
        $stmt->execute([$cid, $name, $arabic, $desc, $order, $image]);
        jsonResponse(['message' => 'تم إنشاء الفئة بنجاح', 'id' => $cid], 201);

    case 'PUT':
        requireAuth();
        if (!$id) jsonResponse(['error' => 'id مطلوب'], 400);

        $isJson = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false;
        if ($isJson) {
            $body = getBody();
        } else {
            $body = $_POST;
        }

        $fields = [];
        $vals   = [];
        foreach (['name','arabic_name','description','sort_order'] as $f) {
            if (isset($body[$f]) && $body[$f] !== '') {
                $fields[] = "$f = ?";
                $vals[]   = $body[$f];
            }
        }

        // Handle image upload
        if (!empty($_FILES['image'])) {
            $imgPath  = handleCategoryUpload($_FILES['image']);
            $fields[] = "image = ?";
            $vals[]   = $imgPath;
        } elseif (isset($body['image'])) {
            $fields[] = "image = ?";
            $vals[]   = $body['image'];
        }

        if (!$fields) jsonResponse(['error' => 'لا توجد بيانات للتحديث'], 400);
        $vals[] = $id;
        $pdo->prepare('UPDATE categories SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($vals);
        jsonResponse(['message' => 'تم التحديث بنجاح']);

    case 'DELETE':
        requireAuth();
        if (!$id) jsonResponse(['error' => 'id مطلوب'], 400);
        $pdo->prepare('DELETE FROM categories WHERE id = ?')->execute([$id]);
        jsonResponse(['message' => 'تم الحذف']);

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

// ─── Category image upload helper ───
function handleCategoryUpload(array $file): string {
    $allowed = ['image/jpeg','image/png','image/webp','image/gif'];
    if (!in_array($file['type'], $allowed)) {
        jsonResponse(['error' => 'نوع الصورة غير مدعوم'], 400);
    }
    $dir = __DIR__ . '/uploads/categories';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $ext  = match($file['type']) {
        'image/jpeg' => '.jpg', 'image/png' => '.png',
        'image/webp' => '.webp', 'image/gif' => '.gif', default => '.jpg'
    };
    $name = uniqid('cat_', true) . $ext;
    move_uploaded_file($file['tmp_name'], "$dir/$name");
    return "/api/uploads/categories/$name";
}
