<?php
require_once __DIR__ . '/db.php';

$method  = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($_POST['_method']) && strtoupper($_POST['_method']) === 'PUT') {
    $method = 'PUT';
}
$id      = $_GET['id']      ?? null;
$gallery = isset($_GET['gallery']);
$admin   = isset($_GET['admin']);
$gid     = $_GET['gid']     ?? null;

/* ─── Helper: full product with variants & gallery ─── */
function getProductFull(PDO $pdo, int $id): ?array {
    $p = $pdo->prepare('SELECT p.*, c.arabic_name as category_arabic FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.id=?');
    $p->execute([$id]);
    $prod = $p->fetch();
    if (!$prod) return null;
    $v = $pdo->prepare('SELECT * FROM product_variants WHERE product_id=? ORDER BY id');
    $v->execute([$id]);
    $prod['variants'] = $v->fetchAll();
    $g = $pdo->prepare('SELECT * FROM product_gallery WHERE product_id=? ORDER BY position');
    $g->execute([$id]);
    $prod['gallery'] = $g->fetchAll();
    return $prod;
}

switch ($method) {
    /* ════════════════ GET ════════════════ */
    case 'GET':
        if ($gallery && $id) {
            $stmt = $pdo->prepare('SELECT * FROM product_gallery WHERE product_id=? ORDER BY position');
            $stmt->execute([$id]);
            jsonResponse($stmt->fetchAll());
        }
        if ($id) {
            $prod = getProductFull($pdo, (int)$id);
            if (!$prod) jsonResponse(['error' => 'المنتج غير موجود'], 404);
            jsonResponse($prod);
        }
        if ($admin) {
            requireAuth();
            $sql = 'SELECT p.*, c.arabic_name as category_arabic FROM products p LEFT JOIN categories c ON p.category_id=c.id ORDER BY p.created_at DESC';
        } else {
            $cat = $_GET['category'] ?? null;
            $sql = 'SELECT p.*, c.arabic_name as category_arabic FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.is_active=1';
            $params = [];
            if ($cat) { $sql .= ' AND p.category_id=?'; $params[] = $cat; }
            $sql .= ' ORDER BY p.created_at DESC';
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params ?? []);
        $products = $stmt->fetchAll();
        foreach ($products as &$prod) {
            $v = $pdo->prepare('SELECT * FROM product_variants WHERE product_id=? ORDER BY id');
            $v->execute([$prod['id']]);
            $prod['variants'] = $v->fetchAll();
            $g = $pdo->prepare('SELECT * FROM product_gallery WHERE product_id=? ORDER BY position');
            $g->execute([$prod['id']]);
            $prod['gallery'] = $g->fetchAll();
        }
        jsonResponse($products);

    /* ════════════════ POST ════════════════ */
    case 'POST':
        requireAuth();
        if ($gallery && $id) {
            if (empty($_FILES['image'])) jsonResponse(['error' => 'الصورة مطلوبة'], 400);
            $url = handleUpload($_FILES['image'], 'gallery');
            $maxPos = $pdo->prepare('SELECT COALESCE(MAX(position),0) FROM product_gallery WHERE product_id=?');
            $maxPos->execute([$id]);
            $pos = (int)$maxPos->fetchColumn() + 1;
            $ins = $pdo->prepare('INSERT INTO product_gallery (product_id,image_url,position) VALUES (?,?,?)');
            $ins->execute([$id, $url, $pos]);
            jsonResponse(['id' => $pdo->lastInsertId(), 'image_url' => $url], 201);
        }
        // Create product (multipart/form-data)
        $name     = $_POST['name']        ?? '';
        $price    = $_POST['price']       ?? 0;
        $catId    = $_POST['category_id'] ?? '';
        $desc     = $_POST['description'] ?? '';
        $variants = json_decode($_POST['variants'] ?? '[]', true) ?? [];
        if (!$name || !$price || !$catId) jsonResponse(['error' => 'الاسم والسعر والفئة مطلوبون'], 400);
        $imageUrl = '';
        if (!empty($_FILES['image'])) {
            $imageUrl = handleUpload($_FILES['image'], 'products');
        }
        $ins = $pdo->prepare('INSERT INTO products (name,description,price,category_id,image) VALUES (?,?,?,?,?)');
        $ins->execute([$name, $desc, $price, $catId, $imageUrl]);
        $productId = (int)$pdo->lastInsertId();
        if ($variants) {
            $insV = $pdo->prepare('INSERT INTO product_variants (product_id,variant_type,variant_value,stock) VALUES (?,?,?,?)');
            foreach ($variants as $v) {
                $val = trim($v['value'] ?? '');
                if ($val !== '') {
                    $insV->execute([$productId, $v['type'] ?? 'variant', $val, (int)($v['stock'] ?? 0)]);
                }
            }
        }
        jsonResponse(getProductFull($pdo, $productId), 201);

    /* ════════════════ PUT ════════════════ */
    case 'PUT':
        requireAuth();
        if (!$id) jsonResponse(['error' => 'id مطلوب'], 400);

        // Since we spoof POST as PUT, $_POST and $_FILES are natively populated safely!
        $name     = $_POST['name']        ?? null;
        $price    = $_POST['price']       ?? null;
        $catId    = $_POST['category_id'] ?? null;
        $desc     = $_POST['description'] ?? null;
        $keepImg  = $_POST['keep_image']  ?? null;
        $varRaw   = $_POST['variants']    ?? '[]';
        $variants = json_decode($varRaw, true) ?? [];

        $fields = [];
        $vals   = [];
        if ($name  !== null) { $fields[] = 'name=?';        $vals[] = $name; }
        if ($desc  !== null) { $fields[] = 'description=?'; $vals[] = $desc; }
        if ($price !== null) { $fields[] = 'price=?';       $vals[] = $price; }
        if ($catId !== null) { $fields[] = 'category_id=?'; $vals[] = $catId; }

        if (!empty($_FILES['image'])) {
            $imageUrl = handleUpload($_FILES['image'], 'products');
            $fields[] = 'image=?'; $vals[] = $imageUrl;
        } elseif ($keepImg !== null) {
            $fields[] = 'image=?'; $vals[] = $keepImg;
        }

        if ($fields) {
            $vals[] = $id;
            $pdo->prepare('UPDATE products SET ' . implode(',', $fields) . ' WHERE id=?')->execute($vals);
        }

        // Always update variants (delete old, insert new)
        $pdo->prepare('DELETE FROM product_variants WHERE product_id=?')->execute([$id]);
        if ($variants) {
            $insV = $pdo->prepare('INSERT INTO product_variants (product_id,variant_type,variant_value,stock) VALUES (?,?,?,?)');
            foreach ($variants as $v) {
                $val = trim($v['value'] ?? '');
                if ($val !== '') {
                    $insV->execute([$id, $v['type'] ?? 'variant', $val, (int)($v['stock'] ?? 0)]);
                }
            }
        }
        jsonResponse(getProductFull($pdo, (int)$id));

    /* ════════════════ DELETE ════════════════ */
    case 'DELETE':
        requireAuth();
        if (!$id) jsonResponse(['error' => 'id مطلوب'], 400);
        if ($gallery && $gid) {
            $pdo->prepare('DELETE FROM product_gallery WHERE id=? AND product_id=?')->execute([$gid, $id]);
            jsonResponse(['message' => 'تم حذف الصورة']);
        }
        $pdo->prepare('DELETE FROM product_gallery WHERE product_id=?')->execute([$id]);
        $pdo->prepare('DELETE FROM product_variants WHERE product_id=?')->execute([$id]);
        $pdo->prepare('DELETE FROM order_items WHERE product_id=?')->execute([$id]);
        $pdo->prepare('DELETE FROM products WHERE id=?')->execute([$id]);
        jsonResponse(['message' => 'تم الحذف النهائي']);

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

/* ─── Upload helper ─── */
function handleUpload(array $file, string $folder): string {
    $allowed = ['image/jpeg','image/png','image/webp','image/gif'];
    if (!in_array($file['type'], $allowed)) {
        jsonResponse(['error' => 'نوع الملف غير مدعوم'], 400);
    }
    $dir = __DIR__ . '/uploads/' . $folder;
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $ext  = match($file['type']) {
        'image/jpeg' => '.jpg', 'image/png' => '.png',
        'image/webp' => '.webp', 'image/gif' => '.gif', default => '.jpg'
    };
    $name = uniqid('img_', true) . $ext;
    move_uploaded_file($file['tmp_name'], "$dir/$name");
    return "/api/uploads/$folder/$name";
}
