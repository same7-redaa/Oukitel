<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'POST only'], 405);
}

requireAuth();

$folder  = $_POST['folder'] ?? 'products';
$allowed = ['products','categories','gallery'];
if (!in_array($folder, $allowed)) jsonResponse(['error' => 'مجلد غير مسموح'], 400);
if (empty($_FILES['image'])) jsonResponse(['error' => 'الصورة مطلوبة'], 400);

$file    = $_FILES['image'];
$allowed_types = ['image/jpeg','image/png','image/webp','image/gif'];
if (!in_array($file['type'], $allowed_types)) {
    jsonResponse(['error' => 'نوع الملف غير مسموح (jpg, png, webp, gif فقط)'], 400);
}

$dir = __DIR__ . '/uploads/' . $folder;
if (!is_dir($dir)) mkdir($dir, 0755, true);

$ext  = match($file['type']) {
    'image/jpeg' => '.jpg',
    'image/png'  => '.png',
    'image/webp' => '.webp',
    'image/gif'  => '.gif',
    default      => '.jpg'
};
$name = uniqid('img_', true) . $ext;
$dest = "$dir/$name";

if (!move_uploaded_file($file['tmp_name'], $dest)) {
    jsonResponse(['error' => 'فشل رفع الصورة'], 500);
}

jsonResponse(['url' => "/api/uploads/$folder/$name", 'message' => 'تم رفع الصورة']);
