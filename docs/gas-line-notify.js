/**
 * GAS（Google Apps Script）用
 * - 予約データ受信 → シートに書き込み（ヘッダー自動作成）
 * - O列「予約ステータス」を「確定」に変更 → LINE通知を自動送信
 *
 * セットアップ:
 * 1. Google スプレッドシートの「拡張機能」→「Apps Script」を開く
 * 2. このコードを貼り付けて保存
 * 3. 「デプロイ」→「新しいデプロイ」→ ウェブアプリ → アクセス: 全員 → デプロイ
 * 4. トリガー設定: onEdit を「スプレッドシートから」→「編集時」に設定
 */

// === 設定 ===
var NOTIFY_API_URL = 'https://www.umigamekyoudaimiyakojima.com/api/line/notify';
var NOTIFY_SECRET = '9f855607c9d6caa86f5160282780e9db';
var SHEET_NAME = '予約一覧'; // シート名（存在しなければ自動作成）
var CALENDAR_ID = 'genkidama2439@gmail.com'; // Googleカレンダー
var NOTIFY_EMAIL = 'genkidama2439@gmail.com'; // 予約通知メール送信先

// カラム定義（A=1, B=2, ...）
var COLUMNS = {
  TIMESTAMP:     1,  // A: 受付日時
  BOOKING_NUM:   2,  // B: 予約番号
  DATE:          3,  // C: 参加日
  TIME:          4,  // D: 時間
  NAME:          5,  // E: 名前
  PLAN:          6,  // F: プラン
  TOTAL_PRICE:   7,  // G: 合計金額
  EMAIL:         8,  // H: メール
  PHONE:         9,  // I: 電話
  STATUS:       10,  // J: ステータス
  SENT_DATE:    11,  // K: 送信完了日
  HEADCOUNT:    12,  // L: 人数内訳
  PARTICIPANTS: 13,  // M: 参加者詳細
  LINE_USER_ID: 14,  // N: lineUserId
  BOOKING_STATUS:15, // O: 予約ステータス
  LOCATION:     16,  // P: 開催場所
  LINE_NAME:    17,  // Q: LINE名
};

var HEADERS = [
  '受付日時', '予約番号', '参加日', '時間', '名前', 'プラン', '合計金額',
  'メール', '電話', 'ステータス', '送信完了日', '人数内訳', '参加者詳細',
  'lineUserId', '予約ステータス', '開催場所', 'LINE名'
];

// ============================================================
// シート取得・ヘッダー自動作成
// ============================================================

/**
 * シートを取得（なければ作成し、ヘッダーを自動設定）
 */
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // ヘッダーが空なら自動作成
  var firstCell = sheet.getRange(1, 1).getValue();
  if (!firstCell) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    // ヘッダー行の書式設定
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#d9ead3');
    sheet.setFrozenRows(1);
    // 列幅調整
    sheet.setColumnWidth(COLUMNS.TIMESTAMP, 150);
    sheet.setColumnWidth(COLUMNS.BOOKING_NUM, 130);
    sheet.setColumnWidth(COLUMNS.NAME, 120);
    sheet.setColumnWidth(COLUMNS.PLAN, 150);
    sheet.setColumnWidth(COLUMNS.PARTICIPANTS, 300);
    sheet.setColumnWidth(COLUMNS.LINE_USER_ID, 180);
  }

  return sheet;
}

// ============================================================
// 予約データ受信（Next.js → GAS）
// ============================================================

/**
 * POSTリクエスト受信（ウェブアプリとしてデプロイ時に使用）
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet();

    // 人数内訳
    var headcount = '大人' + (data.adultCount || 0) +
                    ' 子供' + (data.childCount || 0) +
                    ' 3歳未満' + (data.under3Count || 0);

    // 参加者詳細
    var participantsDetail = '';
    if (data.participants && Array.isArray(data.participants)) {
      participantsDetail = data.participants.map(function(p, i) {
        var parts = [(i + 1) + '.'];
        if (p.name) parts.push(p.name);
        if (p.age) parts.push(p.age + '歳');
        if (p.height) parts.push(p.height + 'cm');
        if (p.weight) parts.push(p.weight + 'kg');
        if (p.footSize) parts.push('足' + p.footSize + 'cm');
        parts.push('(' + (p.category || '') + ')');
        return parts.join(' ');
      }).join('\n');
    }

    // 新しい行にデータを追加
    var newRow = [
      new Date(),                          // A: 受付日時
      data.bookingNumber || '',            // B: 予約番号
      data.selectedDate || '',             // C: 参加日
      data.selectedTime || '',             // D: 時間
      data.customerName || '',             // E: 名前
      data.planName || '',                 // F: プラン
      data.totalPrice || 0,                // G: 合計金額
      data.customerEmail || '',            // H: メール
      data.customerPhone || '',            // I: 電話
      '受信済み',                           // J: ステータス
      '',                                  // K: 送信完了日
      headcount,                           // L: 人数内訳
      participantsDetail,                  // M: 参加者詳細
      data.lineUserId || '',               // N: lineUserId
      '',                                  // O: 予約ステータス（手動で「確定」入力）
      '',                                  // P: 開催場所
      data.lineDisplayName || '',          // Q: LINE名
    ];

    sheet.appendRow(newRow);

    // Googleカレンダーに予約を登録
    try {
      addToCalendar(data, headcount);
    } catch (calError) {
      Logger.log('カレンダー登録エラー: ' + calError.message);
    }

    // 業者にメール通知
    try {
      sendBookingEmail(data, headcount, participantsDetail);
    } catch (mailError) {
      Logger.log('メール送信エラー: ' + mailError.message);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, bookingNumber: data.bookingNumber })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('doPost エラー: ' + error.message);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// メール通知（業者向け）
// ============================================================

function sendBookingEmail(data, headcount, participantsDetail) {
  var subject = '【新規予約】' + (data.customerName || '名前なし') + ' 様 / ' + (data.planName || '');

  var body = '新しい予約が入りました。\n\n' +
    '━━━━━━━━━━━━━━━━━━━━\n' +
    '予約番号: ' + (data.bookingNumber || '') + '\n' +
    '参加日: ' + (data.selectedDate || '') + '\n' +
    '時間: ' + (data.selectedTime || '未定') + '\n' +
    '━━━━━━━━━━━━━━━━━━━━\n\n' +
    '【お客様情報】\n' +
    '名前: ' + (data.customerName || '') + '\n' +
    '電話: ' + (data.customerPhone || '未入力') + '\n' +
    'メール: ' + (data.customerEmail || '未入力') + '\n\n' +
    '【プラン】\n' +
    'プラン: ' + (data.planName || '') + '\n' +
    '人数: ' + headcount + '\n' +
    '合計金額: ¥' + (data.totalPrice || 0).toLocaleString() + '\n\n' +
    '【参加者詳細】\n' +
    (participantsDetail || 'なし') + '\n\n' +
    '【備考】\n' +
    (data.specialRequests || 'なし') + '\n\n' +
    '━━━━━━━━━━━━━━━━━━━━\n' +
    'スプレッドシートのO列「予約ステータス」に「確定」と入力すると\n' +
    'お客様のLINEに自動通知されます。\n';

  GmailApp.sendEmail(NOTIFY_EMAIL, subject, body);
  Logger.log('メール送信完了: ' + subject);
}

// ============================================================
// Googleカレンダー登録
// ============================================================

/**
 * 予約データをGoogleカレンダーに登録
 */
function addToCalendar(data, headcount) {
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    Logger.log('カレンダーが見つかりません: ' + CALENDAR_ID);
    return;
  }

  // 参加日をパース（YYYY-MM-DD形式）
  var dateStr = data.selectedDate || '';
  var dateParts = dateStr.split('-');
  if (dateParts.length !== 3) {
    Logger.log('日付フォーマット不正: ' + dateStr);
    return;
  }

  var year = parseInt(dateParts[0], 10);
  var month = parseInt(dateParts[1], 10) - 1; // 0始まり
  var day = parseInt(dateParts[2], 10);

  // 時間をパース（例: "09:00", "14:30", "サンセット時刻（後日連絡）"）
  var timeStr = data.selectedTime || '';
  var timeParts = timeStr.match(/^(\d{1,2}):(\d{2})/);

  var title = '🐢 ' + (data.planName || '予約') + ' / ' + (data.customerName || '名前なし');

  var description = '予約番号: ' + (data.bookingNumber || '') +
    '\n名前: ' + (data.customerName || '') +
    '\n電話: ' + (data.customerPhone || '') +
    '\nメール: ' + (data.customerEmail || '') +
    '\nプラン: ' + (data.planName || '') +
    '\n人数: ' + (headcount || '') +
    '\n合計: ¥' + (data.totalPrice || 0).toLocaleString() +
    '\n備考: ' + (data.specialRequests || '');

  if (timeParts) {
    // 時間指定あり → 2時間のイベント
    var startHour = parseInt(timeParts[1], 10);
    var startMin = parseInt(timeParts[2], 10);
    var startTime = new Date(year, month, day, startHour, startMin);
    var endTime = new Date(year, month, day, startHour + 2, startMin);

    calendar.createEvent(title, startTime, endTime, {
      description: description,
      location: '宮古島',
    });
  } else {
    // 時間未定 → 終日イベント
    var eventDate = new Date(year, month, day);
    calendar.createAllDayEvent(title, eventDate, {
      description: description,
      location: '宮古島',
    });
  }

  Logger.log('カレンダー登録完了: ' + title + ' ' + dateStr);
}

// ============================================================
// 予約確定時のLINE通知（シート編集トリガー）
// ============================================================

/**
 * シート編集時に自動実行
 * O列（予約ステータス）が「確定」or「キャンセル」に変更されたらLINE通知を送信
 */
function onEdit(e) {
  var range = e.range;
  var sheet = range.getSheet();

  // 対象シートかチェック
  if (sheet.getName() !== SHEET_NAME) return;

  // O列（予約ステータス）の変更のみ処理
  if (range.getColumn() !== COLUMNS.BOOKING_STATUS) return;

  var newValue = range.getValue();
  if (newValue !== '確定' && newValue !== 'キャンセル') return;

  var row = range.getRow();
  if (row <= 1) return; // ヘッダー行はスキップ

  var lineUserId = sheet.getRange(row, COLUMNS.LINE_USER_ID).getValue();
  if (!lineUserId) {
    Logger.log('LINE User ID が空のためスキップ: row ' + row);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'LINE User ID が未登録のため通知をスキップしました', '注意', 3
    );
    return;
  }

  var payload = {
    lineUserId: String(lineUserId),
    bookingNumber: String(sheet.getRange(row, COLUMNS.BOOKING_NUM).getValue()),
    customerName: String(sheet.getRange(row, COLUMNS.NAME).getValue()),
    planName: String(sheet.getRange(row, COLUMNS.PLAN).getValue()),
    selectedDate: String(sheet.getRange(row, COLUMNS.DATE).getValue()),
    selectedTime: String(sheet.getRange(row, COLUMNS.TIME).getValue()),
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

// ============================================================
// メニュー追加（手動セットアップ用）
// ============================================================

/**
 * スプレッドシートを開いた時にカスタムメニューを追加
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🐢 海亀兄弟')
    .addItem('ヘッダーを初期化', 'setupHeaders')
    .addToUi();
}

/**
 * ヘッダーを手動で初期化（メニューから実行可能）
 */
function setupHeaders() {
  getOrCreateSheet();
  SpreadsheetApp.getActiveSpreadsheet().toast('ヘッダーを設定しました', '完了', 3);
}
