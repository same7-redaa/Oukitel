<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id']    ?? null;
$stats  = isset($_GET['stats']);

switch ($method) {
    /* ════ GET ════ */
    case 'GET':
        requireAuth();
        if ($stats) {
            $total   = $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn();
            $pending = $pdo->query("SELECT COUNT(*) FROM orders WHERE status='pending'")->fetchColumn();
            $done    = $pdo->query("SELECT COUNT(*) FROM orders WHERE status='delivered'")->fetchColumn();
            $rev     = $pdo->query("SELECT COALESCE(SUM(total_price),0) FROM orders WHERE status!='cancelled'")->fetchColumn();
            jsonResponse(['total_orders'=>$total,'pending'=>$pending,'delivered'=>$done,'revenue'=>$rev]);
        }
        if ($id) {
            $stmt = $pdo->prepare('SELECT * FROM orders WHERE id=?');
            $stmt->execute([$id]);
            $order = $stmt->fetch();
            if (!$order) jsonResponse(['error' => 'الطلب غير موجود'], 404);
            $items = $pdo->prepare('SELECT oi.*, p.name as product_name, p.category_id, p.image, pv.variant_type, pv.variant_value FROM order_items oi JOIN products p ON oi.product_id=p.id LEFT JOIN product_variants pv ON oi.variant_id=pv.id WHERE oi.order_id=?');
            $items->execute([$id]);
            $order['items'] = $items->fetchAll();
            jsonResponse($order);
        }
        $status = $_GET['status'] ?? null;
        $sql    = 'SELECT * FROM orders';
        $params = [];
        if ($status) { $sql .= ' WHERE status=?'; $params[] = $status; }
        $sql .= ' ORDER BY created_at DESC';
        $stmt  = $pdo->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();
        $getItems = $pdo->prepare('SELECT oi.*, p.name as product_name, pv.variant_type, pv.variant_value FROM order_items oi JOIN products p ON oi.product_id=p.id LEFT JOIN product_variants pv ON oi.variant_id=pv.id WHERE oi.order_id=?');
        foreach ($orders as &$order) {
            $getItems->execute([$order['id']]);
            $order['items'] = $getItems->fetchAll();
        }
        jsonResponse($orders);

    /* ════ POST ════ */
    case 'POST':
        $body = getBody();
        $name    = $body['customer_name'] ?? '';
        $phone   = $body['phone']         ?? '';
        $address = $body['address']       ?? '';
        $notes   = $body['notes']         ?? '';
        $items   = $body['items']         ?? [];
        if (!$name || !$phone || !$address || empty($items)) {
            jsonResponse(['error' => 'يرجى ملء جميع البيانات المطلوبة'], 400);
        }
        $total = 0;
        $getPrice = $pdo->prepare('SELECT price FROM products WHERE id=?');
        foreach ($items as $item) {
            $getPrice->execute([$item['product_id']]);
            $price = $getPrice->fetchColumn();
            if ($price === false) jsonResponse(['error' => 'منتج غير موجود'], 400);
            $total += $price * (int)$item['quantity'];
        }
        $ins = $pdo->prepare('INSERT INTO orders (customer_name,phone,address,notes,total_price) VALUES (?,?,?,?,?)');
        $ins->execute([$name,$phone,$address,$notes,$total]);
        $orderId = (int)$pdo->lastInsertId();
        $insItem = $pdo->prepare('INSERT INTO order_items (order_id,product_id,variant_id,quantity,unit_price) VALUES (?,?,?,?,?)');
        $updStock = $pdo->prepare('UPDATE product_variants SET stock=MAX(0,stock-?) WHERE id=?');
        foreach ($items as $item) {
            $getPrice->execute([$item['product_id']]);
            $price = $getPrice->fetchColumn();
            $insItem->execute([$orderId, $item['product_id'], $item['variant_id'] ?? null, (int)$item['quantity'], $price]);
            if (!empty($item['variant_id'])) $updStock->execute([$item['quantity'], $item['variant_id']]);
        }
        jsonResponse(['message' => 'تم إرسال طلبك بنجاح!', 'order_id' => $orderId], 201);

    /* ════ PUT ════ */
    case 'PUT':
        requireAuth();
        if (!$id) jsonResponse(['error' => 'id مطلوب'], 400);
        $body   = getBody();
        $status = $body['status'] ?? '';
        $valid  = ['pending','confirmed','shipped','delivered','cancelled'];
        if (!in_array($status, $valid)) jsonResponse(['error' => 'حالة غير صحيحة'], 400);
        $pdo->prepare('UPDATE orders SET status=? WHERE id=?')->execute([$status, $id]);
        jsonResponse(['message' => 'تم تحديث الحالة']);

    /* ════ DELETE ════ */
    case 'DELETE':
        requireAuth();
        if (!$id) jsonResponse(['error' => 'id مطلوب'], 400);
        $pdo->prepare('DELETE FROM order_items WHERE order_id=?')->execute([$id]);
        $pdo->prepare('DELETE FROM orders WHERE id=?')->execute([$id]);
        jsonResponse(['message' => 'تم حذف الطلب نهائياً']);

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
