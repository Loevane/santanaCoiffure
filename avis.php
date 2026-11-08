<?php
// Lit la page publique Planity du salon, garde le résultat 15 min en cache et renvoie du JSON au site.
const URL_PLANITY = 'https://www.planity.com/styl-blue-39190-cousance';
const CACHE = __DIR__ . '/avis-cache.json';
const TTL = 900;

function pick($a, $keys)
{
    foreach ($keys as $k) if (isset($a[$k]) && !is_array($a[$k])) return $a[$k];
    return null;
}
function walk($n, &$rev, &$meta)
{
    if (!is_array($n)) return;
    if ($n && $n === array_values($n)) {
        foreach ($n as $it) {
            if (!is_array($it)) continue;
            $t = pick($it, ['reviewBody', 'comment', 'text', 'content', 'message']);
            $r = pick($it, ['rating', 'ratingValue', 'score', 'note', 'stars']);
            if ($r === null && isset($it['reviewRating']['ratingValue'])) $r = $it['reviewRating']['ratingValue'];
            if (is_string($t) && mb_strlen(trim($t)) > 2 && is_numeric($r) && $r >= 1 && $r <= 5) {
                $d = pick($it, ['datePublished', 'date', 'createdAt', 'created_at']);
                $rev[] = ['r' => (float)$r, 't' => trim($t), 'd' => is_string($d) ? substr($d, 0, 10) : ''];
            }
        }
    }
    if (isset($n['aggregateRating']['ratingValue'])) {
        $meta['rating'] = (float)$n['aggregateRating']['ratingValue'];
        $meta['count'] = (int)($n['aggregateRating']['reviewCount'] ?? $n['aggregateRating']['ratingCount'] ?? 0);
    }
    foreach ($n as $v) if (is_array($v)) walk($v, $rev, $meta);
}
function parse($html)
{
    $rev = [];
    $meta = [];
    if (preg_match_all('#<script[^>]*type="application/(?:ld\+json|json)"[^>]*>(.*?)</script>#s', $html, $m))
        foreach ($m[1] as $j) {
            $d = json_decode($j, true);
            if ($d) walk($d, $rev, $meta);
        }
    $txt = html_entity_decode(preg_replace('/\s+/', ' ', preg_replace('/<[^>]+>/', ' ', $html)));
    if (preg_match('/(\d[.,]\d)\s*\(\s*(\d+)\s*avis\s*\)/u', $txt, $m)) {
        $meta['rating'] = (float)str_replace(',', '.', $m[1]);
        $meta['count'] = (int)$m[2];
    }
    $seen = [];
    $rev = array_values(array_filter($rev, function ($v) use (&$seen) {
        if (isset($seen[$v['t']])) return false;
        return $seen[$v['t']] = true;
    }));
    usort($rev, fn($a, $b) => strcmp($b['d'], $a['d']));
    $out = [];
    if (isset($meta['rating']) && $meta['rating'] > 0 && $meta['rating'] <= 5) {
        $out['rating'] = $meta['rating'];
        $out['count'] = $meta['count'] ?? 0;
    }
    if ($rev) $out['reviews'] = array_slice($rev, 0, 12);
    return $out ?: null;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');
if (is_file(CACHE) && time() - filemtime(CACHE) < TTL) {
    readfile(CACHE);
    exit;
}
$ch = curl_init(URL_PLANITY);
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 10, CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; SantanaCoiffureSite/1.0)', CURLOPT_HTTPHEADER => ['Accept-Language: fr-FR,fr;q=0.9']]);
$html = curl_exec($ch);
curl_close($ch);
$out = $html ? parse($html) : null;
if ($out) {
    $j = json_encode($out, JSON_UNESCAPED_UNICODE);
    file_put_contents(CACHE, $j, LOCK_EX);
    echo $j;
    exit;
}
if (is_file(CACHE)) {
    readfile(CACHE);
    exit;
}   // Planity injoignable : on garde la dernière version connue
http_response_code(502);
echo '{"error":"indisponible"}';
