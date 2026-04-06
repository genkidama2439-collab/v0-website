/**
 * GAS（Google Apps Script）用 - 予約確定時にLINE通知を送信
 *
 * 使い方:
 * 1. Google スプレッドシートの「拡張機能」→「Apps Script」を開く
 * 2. このコードを貼り付ける
 * 3. NOTIFY_API_URL と NOTIFY_SECRET を設定する
 * 4. トリガー設定: onEdit をスプレッドシートの「編集時」に設定
 *
 * シートの想定カラム構成:
 *   A: 予約番号, B: 顧客名, C: メール, D: 電話, E: プラン名,
 *   F: 日付, G: 時間, ..., (ステータス列), (LINE ID列)
 *
 * ★ 下のカラム番号を実際のシートに合わせて変更してください ★
 */

// === 設定 ===
var NOTIFY_API_URL = 'https://www.umigamekyoudaimiyakojima.com/api/line/notify';
var NOTIFY_SECRET = '9f855607c9d6caa86f5160282780e9db';

// カラム番号（1始まり）
// A:受付日時 B:予約番号 C:参加日 D:時間 E:名前 F:プラン G:合計金額
// H:メール I:電話 J:ステータス K:送信完了日 L:人数内訳 M:参加者詳細
// N:lineUserId O:予約ステータス
var COL_BOOKING_NUMBER = 2;   // B: 予約番号
var COL_CUSTOMER_NAME = 5;    // E: 名前
var COL_PLAN_NAME = 6;        // F: プラン
var COL_DATE = 3;             // C: 参加日
var COL_TIME = 4;             // D: 時間
var COL_LINE_USER_ID = 14;    // N: lineUserId
var COL_STATUS = 15;          // O: 予約ステータス（「確定」or「キャンセル」を入力する列）

/**
 * シート編集時に自動実行
 * ステータス列が「確定」または「キャンセル」に変更されたらLINE通知を送信
 */
function onEdit(e) {
  var range = e.range;
  var sheet = range.getSheet();

  // ステータス列の変更のみ処理
  if (range.getColumn() !== COL_STATUS) return;

  var newValue = range.getValue();
  if (newValue !== '確定' && newValue !== 'キャンセル') return;

  var row = range.getRow();
  if (row <= 1) return; // ヘッダー行はスキップ

  var lineUserId = sheet.getRange(row, COL_LINE_USER_ID).getValue();
  if (!lineUserId) {
    Logger.log('LINE User ID が空のためスキップ: row ' + row);
    return;
  }

  var payload = {
    lineUserId: String(lineUserId),
    bookingNumber: String(sheet.getRange(row, COL_BOOKING_NUMBER).getValue()),
    customerName: String(sheet.getRange(row, COL_CUSTOMER_NAME).getValue()),
    planName: String(sheet.getRange(row, COL_PLAN_NAME).getValue()),
    selectedDate: String(sheet.getRange(row, COL_DATE).getValue()),
    selectedTime: String(sheet.getRange(row, COL_TIME).getValue()),
    status: newValue,
  };

  try {
    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + NOTIFY_SECRET,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    var response = UrlFetchApp.fetch(NOTIFY_API_URL, options);
    var code = response.getResponseCode();
    var body = response.getContentText();

    Logger.log('LINE通知 row ' + row + ': status=' + code + ' body=' + body);

    if (code !== 200) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'LINE通知送信失敗: ' + body, 'エラー', 5
      );
    } else {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        payload.customerName + ' 様にLINE通知を送信しました', '完了', 3
      );
    }
  } catch (error) {
    Logger.log('LINE通知エラー: ' + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'LINE通知エラー: ' + error.message, 'エラー', 5
    );
  }
}
