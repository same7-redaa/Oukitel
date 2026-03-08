<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);

switch ($action) {
    case 'login':
        $body = getBody();
        $user = $body['username'] ?? '';
        $pass = $body['password'] ?? '';
        if (!$user || !$pass) jsonResponse(['error' => 'يرجى إدخال اسم المستخدم وكلمة المرور'], 400);
        $stmt = $pdo->prepare('SELECT * FROM admins WHERE username=?');
        $stmt->execute([$user]);
        $admin = $stmt->fetch();
        if (!$admin || !password_verify($pass, $admin['password'])) {
            jsonResponse(['error' => 'اسم المستخدم أو كلمة المرور غير صحيحة'], 401);
        }
        $token = jwt_encode(['id' => $admin['id'], 'username' => $admin['username'], 'exp' => time() + JWT_EXPIRY]);
        jsonResponse(['token' => $token, 'username' => $admin['username']]);

    case 'change-password':
        $auth = requireAuth();
        $body = getBody();
        $newPass = $body['newPassword'] ?? '';
        if (strlen($newPass) < 6) jsonResponse(['error' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'], 400);
        $hash = password_hash($newPass, PASSWORD_BCRYPT);
        $pdo->prepare('UPDATE admins SET password=? WHERE id=?')->execute([$hash, $auth['id']]);
        jsonResponse(['message' => 'تم تغيير كلمة المرور بنجاح']);

    case 'reset':
        // Emergency reset (remove in production)
        $hash = password_hash('admin123', PASSWORD_BCRYPT);
        $exists = $pdo->query("SELECT COUNT(*) FROM admins WHERE username='admin'")->fetchColumn();
        if ($exists) { $pdo->prepare('UPDATE admins SET password=? WHERE username=?')->execute([$hash, 'admin']); }
        else { $pdo->prepare('INSERT INTO admins (username,password) VALUES (?,?)')->execute(['admin', $hash]); }
        jsonResponse(['message' => 'تم إعادة تعيين الحساب بنجاح — admin / admin123']);

    default:
        jsonResponse(['error' => 'action غير معروف'], 400);
}
