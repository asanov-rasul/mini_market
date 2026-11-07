
<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once('phpmailer/PHPMailerAutoload.php');

header('Content-Type: application/json; charset=utf-8');

$mail = new PHPMailer;
$mail->CharSet = 'UTF-8';

// Получение JSON
$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Некорректные данные'
    ]);
    exit;
}

// Получение данных клиента
$products = $data['products'] ?? [];

// Валидация


if (!is_array($products) || empty($products) || count($products) > 100) {
    echo json_encode([
        'success' => false,
        'message' => 'Корзина пуста или содержит слишком много товаров'
    ]);
    exit;
}

// Экранирование HTML
function escape($value) {
    return htmlspecialchars(
        (string)$value,
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8'
    );
}

// Формирование таблицы товаров
$productsHTML = '';
$total = 0;
$validProducts = 0;

foreach ($products as $product) {

    if (!is_array($product)) {
        continue;
    }

    $id = (int)($product['id'] ?? 0);
    $productName = trim($product['name'] ?? '');
    $category = trim($product['category'] ?? '');
    $price = $product['price'] ?? null;
    $qty = filter_var(
        $product['qty'] ?? null,
        FILTER_VALIDATE_INT
    );

    if (
        $id < 1 ||
        $productName === '' ||
        !is_numeric($price) ||
        !is_finite((float)$price) ||
        (float)$price < 0 ||
        $qty === false ||
        $qty < 1
    ) {
        continue;
    }

    $price = (float)$price;

    $subtotal = $price * $qty;
    $total += $subtotal;
    $validProducts++;

    $productsHTML .= "
        <tr>
            <td style='padding:10px;border:1px solid #ddd;'>
                " . escape($id) . "
            </td>

            <td style='padding:10px;border:1px solid #ddd;'>
                " . escape($productName) . "
            </td>

            <td style='padding:10px;border:1px solid #ddd;'>
                " . escape($category) . "
            </td>

            <td style='padding:10px;border:1px solid #ddd;'>
                " . escape(number_format($price, 2, '.', '')) . "
            </td>

            <td style='padding:10px;border:1px solid #ddd;'>
                " . escape($qty) . "
            </td>

            <td style='padding:10px;border:1px solid #ddd;'>
                " . escape(number_format($subtotal, 2, '.', '')) . "
            </td>
        </tr>
    ";
}

if ($validProducts === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Нет корректных товаров в корзине'
    ]);
    exit;
}

// SMTP отправка
try {

    $mail->isSMTP();

    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;

    // Переменные окружения сервера
    $mail->Username = getenv('GMAIL_USER');
    $mail->Password = getenv('GMAIL_APP_PASSWORD');

    $mail->SMTPSecure = 'ssl';
    $mail->Port = 465;

    $mail->setFrom(
        getenv('GMAIL_USER'),
        'Новый заказ'
    );

    $mail->addAddress(getenv('GMAIL_USER'));

    $mail->isHTML(true);

    $mail->Subject = 'Новый заказ!';

    $mail->Body = "
        <div style='font-family:Arial,sans-serif;'>

            <h2>Новый заказ!</h2>

            <h3>Список товаров</h3>

            <table style='border-collapse:collapse;width:100%;'>
                <thead>
                    <tr style='background:#f2f2f2;'>
                        <th style='padding:10px;border:1px solid #ddd;'>ID</th>
                        <th style='padding:10px;border:1px solid #ddd;'>Название</th>
                        <th style='padding:10px;border:1px solid #ddd;'>Категория</th>
                        <th style='padding:10px;border:1px solid #ddd;'>Цена</th>
                        <th style='padding:10px;border:1px solid #ddd;'>Количество</th>
                        <th style='padding:10px;border:1px solid #ddd;'>Сумма</th>
                    </tr>
                </thead>

                <tbody>
                    $productsHTML
                </tbody>
            </table>

            <h2 style='margin-top:20px;'>
                Итого: " . escape(number_format($total, 2, '.', '')) . "
            </h2>

        </div>
    ";

    $mail->AltBody =
        "Новый заказ!\n" .
        "Количество позиций: $validProducts\n" .
        "Итого: $total";

    $mail->send();

    echo json_encode([
        'success' => true,
        'message' => 'Заказ успешно отправлен!'
    ]);

} catch (Exception $e) {

    error_log('PHPMailer error: ' . $mail->ErrorInfo);

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Не удалось отправить заказ'
    ]);
}

?>
