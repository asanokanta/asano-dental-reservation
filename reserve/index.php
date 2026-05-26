<?php
require_once __DIR__ . '/config.php';

$error = null;
$errorType = null;

function load_patients(string $csvPath): array
{
    $patients = [];
    if (!is_readable($csvPath)) {
        return $patients;
    }

    $handle = fopen($csvPath, 'r');
    if ($handle === false) {
        return $patients;
    }

    fgetcsv($handle); // skip header

    while (($row = fgetcsv($handle)) !== false) {
        if (count($row) < 3) {
            continue;
        }
        $id = trim($row[0]);
        if ($id === '') {
            continue;
        }
        $patients[$id] = [
            'name' => trim($row[1]),
            'status' => trim($row[2]) === 'blocked' ? 'blocked' : 'normal',
        ];
    }

    fclose($handle);
    return $patients;
}

function validate_membership(string $raw, array $patients): array
{
    $id = preg_replace('/\D/', '', trim($raw));

    if ($id === '') {
        return ['ok' => false, 'error' => 'not_found'];
    }

    if (!isset($patients[$id])) {
        return ['ok' => false, 'error' => 'not_found'];
    }

    if ($patients[$id]['status'] === 'blocked') {
        return ['ok' => false, 'error' => 'blocked'];
    }

    return ['ok' => true];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $membership = $_POST['membership_number'] ?? '';
    $patients = load_patients(PATIENT_CSV_PATH);
    $result = validate_membership($membership, $patients);

    if ($result['ok']) {
        header('Location: ' . RESERVE_REDIRECT_URL, true, 302);
        exit;
    }

    $errorType = $result['error'];
    if ($errorType === 'blocked') {
        $error = 'この番号でのネット予約は現在受け付けておりません。お手数ですが、お電話（'
            . CLINIC_PHONE
            . '）にてお問い合わせください。';
    } else {
        $error = '番号が見つかりません。診察券の番号をお確かめの上、もう一度入力してください。うまくいかない場合はお電話ください。';
    }
}

$submitted = $_POST['membership_number'] ?? '';
?>
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ネット予約 | あさの歯科</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Zen Maru Gothic", "Hiragino Sans", sans-serif;
      background: #FEF9E7;
      color: #5C5748;
      min-height: 100vh;
      line-height: 1.7;
    }
    .wrap {
      max-width: 520px;
      margin: 0 auto;
      padding: 2rem 1.25rem 3rem;
    }
    .back {
      display: inline-block;
      margin-bottom: 1.5rem;
      color: #66BB6A;
      text-decoration: none;
      font-size: 1rem;
    }
    h1 {
      font-size: clamp(1.5rem, 5vw, 1.875rem);
      color: #4A7A4E;
      margin-bottom: 0.5rem;
    }
    .lead {
      font-size: clamp(1rem, 3.5vw, 1.125rem);
      margin-bottom: 2rem;
      color: #8A8575;
    }
    .notice {
      background: #FFF8E1;
      border: 2px solid #FFD54F;
      border-radius: 1rem;
      padding: 1.25rem;
      margin-bottom: 2rem;
      font-size: clamp(1rem, 3.5vw, 1.125rem);
      font-weight: 700;
      color: #5C5748;
    }
    .notice a { color: #4A7A4E; }
    .error {
      background: #FFEBEE;
      border: 2px solid #E57373;
      color: #C62828;
      border-radius: 1rem;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      font-size: clamp(1rem, 3.5vw, 1.125rem);
      font-weight: 700;
    }
    label {
      display: block;
      font-size: clamp(1.125rem, 4vw, 1.375rem);
      font-weight: 700;
      margin-bottom: 0.75rem;
      color: #5C5748;
    }
    input[type="text"] {
      width: 100%;
      font-size: clamp(2rem, 8vw, 2.75rem);
      font-weight: 700;
      letter-spacing: 0.15em;
      text-align: center;
      padding: 1rem;
      border: 3px solid #EDE4C8;
      border-radius: 1rem;
      background: #FFFCF5;
      color: #5C5748;
      font-family: inherit;
    }
    input[type="text"]:focus {
      outline: none;
      border-color: #66BB6A;
      box-shadow: 0 0 0 4px rgba(102, 187, 106, 0.2);
    }
    .hint {
      margin-top: 0.75rem;
      font-size: 1rem;
      color: #8A8575;
    }
    button {
      width: 100%;
      margin-top: 2rem;
      padding: 1.25rem;
      font-size: clamp(1.25rem, 4.5vw, 1.5rem);
      font-weight: 700;
      font-family: inherit;
      background: #66BB6A;
      color: #fff;
      border: none;
      border-radius: 1rem;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(102, 187, 106, 0.35);
    }
    button:hover { background: #4CAF50; }
    button:active { transform: scale(0.98); }
  </style>
</head>
<body>
  <div class="wrap">
    <a class="back" href="/">← トップページへ戻る</a>

    <h1>ネット予約</h1>
    <p class="lead">診察券番号（診察券番号）を入力して、予約ページへお進みください。</p>

    <div class="notice">
      診察券をお持ちでない方（初診）は、ネット予約はできません。<br />
      お電話（<a href="tel:<?= htmlspecialchars(str_replace('-', '', CLINIC_PHONE), ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars(CLINIC_PHONE, ENT_QUOTES, 'UTF-8') ?></a>）にてご予約ください。
    </div>

    <?php if ($error): ?>
      <div class="error" role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
    <?php endif; ?>

    <form method="post" action="">
      <label for="membership_number">診察券番号（半角数字）</label>
      <input
        type="text"
        id="membership_number"
        name="membership_number"
        inputmode="numeric"
        pattern="[0-9]*"
        autocomplete="off"
        placeholder="例：12345"
        value="<?= htmlspecialchars($submitted, ENT_QUOTES, 'UTF-8') ?>"
        autofocus
        required
      />
      <p class="hint">診察券番号（半角数字）を入力してください</p>

      <button type="submit">予約に進む</button>
    </form>
  </div>
</body>
</html>
