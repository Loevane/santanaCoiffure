<?php
// Reçoit le formulaire de contact et l'envoie par email au salon.
const DESTINATAIRE = 'contact@VOTRE-DOMAINE.fr';   // adresse qui reçoit les messages
const EXPEDITEUR = 'noreply@VOTRE-DOMAINE.fr';      // adresse de votre nom de domaine (meilleure délivrabilité)
header('Content-Type: application/json; charset=utf-8');
function fin($ok, $m, $c = 200)
{
    http_response_code($c);
    echo json_encode(['ok' => $ok, 'message' => $m], JSON_UNESCAPED_UNICODE);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fin(false, 'Méthode non autorisée.', 405);
if (!empty($_POST['site'])) fin(true, 'Merci, votre message a bien été envoyé.');   // champ piège anti-robots
$clean = fn($s, $max) => mb_substr(trim(preg_replace('/[\r\n]+/', ' ', (string)$s)), 0, $max);
$nom = $clean($_POST['nom'] ?? '', 100);
$email = $clean($_POST['email'] ?? '', 150);
$tel = $clean($_POST['tel'] ?? '', 30);
$msg = mb_substr(trim((string)($_POST['message'] ?? '')), 0, 3000);
if ($nom === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($msg) < 10 || empty($_POST['rgpd']))
    fin(false, 'Merci de remplir les champs obligatoires avec une adresse email valide.', 422);
// 3 messages par heure et par visiteur
$f = sys_get_temp_dir() . '/sc_' . md5($_SERVER['REMOTE_ADDR'] ?? '');
$h = array_values(array_filter(is_file($f) ? array_map('intval', explode(',', file_get_contents($f))) : [], fn($t) => $t > time() - 3600));
if (count($h) >= 3) fin(false, 'Trop de messages envoyés. Réessayez plus tard ou appelez le salon.', 429);
$body = "Nom : $nom\nEmail : $email\nTéléphone : " . ($tel ?: 'non renseigné') . "\n\n$msg\n";
$headers = ['From: Santana coiffure <' . EXPEDITEUR . '>', 'Reply-To: ' . $email, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8'];
if (!mail(DESTINATAIRE, mb_encode_mimeheader('Message du site – ' . $nom, 'UTF-8'), $body, implode("\r\n", $headers)))
    fin(false, 'L’envoi a échoué. Merci d’appeler le salon.', 500);
$h[] = time();
file_put_contents($f, implode(',', $h));
fin(true, 'Merci, votre message a bien été envoyé.');
