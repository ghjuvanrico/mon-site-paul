<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Méthode non autorisée']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) {
  http_response_code(400);
  echo json_encode(['error' => 'Requête invalide']);
  exit;
}

// Anti-bot
$hp = trim($data['hp'] ?? '');
if ($hp !== '') {
  http_response_code(400);
  echo json_encode(['error' => 'Anti-bot déclenché']);
  exit;
}
$a = intval($data['antibot']['a'] ?? 0);
$b = intval($data['antibot']['b'] ?? 0);
$answer = intval($data['antibot']['answer'] ?? -999);
if ($a + $b !== $answer) {
  http_response_code(400);
  echo json_encode(['error' => 'Validation anti-bot incorrecte']);
  exit;
}

// Champs
$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$message = trim($data['message'] ?? '');
if ($name === '' || $email === '' || $message === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Champs manquants']);
  exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['error' => 'Email invalide']);
  exit;
}

// ==== A MODIFIER : adresse destinataire ====
$TO = 'destinataire@exemple.com'; // <-- METS TON MAIL ICI
$SUBJECT = 'Contact site – Paul Roy';

// Sanit
$clean = function($s) { return preg_replace('/[\r\n]+/',' ', strip_tags($s)); };
$fromName = $clean($name);
$fromEmail = $clean($email);
$bodyText = "De: {$fromName} <{$fromEmail}>\n\n" . $message;

// Headers
$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: "Site Paul Roy" <no-reply@' . $_SERVER['HTTP_HOST'] . '>';
$headers[] = 'Reply-To: ' . $fromEmail;

$ok = @mail($TO, '=?UTF-8?B?'.base64_encode($SUBJECT).'?=', $bodyText, implode("\r\n", $headers));

if ($ok) {
  echo json_encode(['ok' => true]);
} else {
  http_response_code(500);
  echo json_encode(['error' => 'Échec envoi mail() (hébergeur)']);
}
