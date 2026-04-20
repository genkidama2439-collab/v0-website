/**
 * GAS（Google Apps Script）完璧版 v2
 *
 * カラム構成
 * A: 受付日時　B: 予約番号　C: 参加日　D: 時間　E: 名前
 * F: プラン　G: 合計金額　H: 電話　I: ステータス
 * J: 人数内訳　K: 参加者詳細　L: lineUserId
 * M: 予約ステータス（プルダウン：確定／満席）
 * N: 開催場所（プルダウン）
 * O: LINE名
 * P: スタッフ指名
 * Q: クーポンコード
 * R: クーポン割引額
 * S: LINE送信（ここにメッセージを入力すると送信される）
 *
 * セットアップ:
 * 1. 「プロジェクトの設定」→「スクリプトプロパティ」に NOTIFY_SECRET を登録
 * 2. メニュー「🐢 海亀兄弟」→「シートを初期化する」を実行
 * 3. トリガー: onSheetEdit を スプレッドシートから／編集時 に設定
 */

// === 設定 ===
var NOTIFY_API_URL = 'https://www.umigamekyoudaimiyakojima.com/api/line/notify';
var SHEET_NAME     = '予約一覧';
var CALENDAR_ID    = 'genkidama2439@gmail.com';
var ADMIN_EMAIL    = 'genkidama2439@gmail.com';

function getNotifySecret() {
  var secret = PropertiesService.getScriptProperties().getProperty('NOTIFY_SECRET');
  if (!secret) {
    throw new Error('NOTIFY_SECRET がスクリプトプロパティに未設定です');
  }
  return secret;
}

var COLUMNS = {
  TIMESTAMP:       1,  // A
  BOOKING_NUM:     2,  // B
  DATE:            3,  // C
  TIME:            4,  // D
  NAME:            5,  // E
  PLAN:            6,  // F
  TOTAL_PRICE:     7,  // G
  PHONE:           8,  // H
  STATUS:          9,  // I
  HEADCOUNT:      10,  // J
  PARTICIPANTS:   11,  // K
  LINE_USER_ID:   12,  // L
  BOOKING_STATUS: 13,  // M
  LOCATION:       14,  // N
  LINE_NAME:      15,  // O
  STAFF:          16,  // P
  COUPON_CODE:    17,  // Q
  COUPON_DISCOUNT:18,  // R
  LINE_SEND:      19,  // S
};

var HEADERS = [
  '受付日時', '予約番号', '参加日', '時間', '名前', 'プラン', '合計金額',
  '電話', 'ステータス', '人数内訳', '参加者詳細',
  'lineUserId', '予約ステータス', '開催場所', 'LINE名',
  'スタッフ指名', 'クーポンコード', 'クーポン割引額', 'LINE送信'
];

var LOCATION_OPTIONS = [
  '新城海岸',
  'ボラビーチ',
  'ワイワイビーチ',
  'シギラビーチ',
  'ナイトツアー（遺跡）',
  'ナイトツアー（インディアンマリンガーデン）',
];

// ============================================================
// ユーティリティ
// ============================================================
function formatDate(value) {
  if (value instanceof Date) {
    var y  = value.getFullYear();
    var mo = value.getMonth() + 1;
    var d  = value.getDate();
    return y + '-' + ('0' + mo).slice(-2) + '-' + ('0' + d).slice(-2);
  }
  return String(value);
}

function formatTime(value) {
  if (value instanceof Date) {
    var h = value.getHours();
    var m = value.getMinutes();
    return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
  }
  return String(value);
}

// ============================================================
// プランごとの確定メッセージ
// ============================================================
function getConfirmMessage(planName, customerName, bookingNumber, selectedDate, selectedTime) {

  var snorkelMessage =
    '🐢 ご予約が確定しました！\n\n' +
    customerName + ' 様\n\n' +
    '予約番号：' + bookingNumber + '\n' +
    'プラン：' + planName + '\n' +
    '日時：' + selectedDate + ' ' + selectedTime + '\n\n' +
    '【当日の持ち物】\n' +
    '・水着（着替えは現地でできます）\n' +
    '・タオル\n' +
    '・酔い止め（必要な方）\n\n' +
    '【集合場所について】\n' +
    '開催場所は新城海岸・シギラビーチ・\n' +
    'ボラビーチ・ワイワイビーチの\n' +
    'いずれかになります。\n' +
    '海況や風向きを考慮した上で、\n' +
    '前日にLINEにてご連絡いたします。\n\n' +
    '【キャンセルポリシー】\n' +
    '前日まで：無料\n' +
    '当日：100%\n\n' +
    'ご不明な点はお気軽にご連絡ください。\n' +
    '海亀兄弟';

  var nightMessage =
    '🦀 ご予約が確定しました！\n\n' +
    customerName + ' 様\n\n' +
    '予約番号：' + bookingNumber + '\n' +
    'プラン：' + planName + '\n' +
    '日時：' + selectedDate + ' ' + selectedTime + '\n\n' +
    '【当日持ってくると便利なもの】\n' +
    '・虫よけスプレー\n' +
    '・靴（サンダル不可・推奨）\n' +
    '・長ズボン（虫刺されが気になる方）\n\n' +
    '【集合場所について】\n' +
    '前日にLINEにてご連絡いたします。\n\n' +
    '【ご注意】\n' +
    '足腰が悪い方・体が不自由な方は\n' +
    '事前に一度ご相談ください。\n\n' +
    '【キャンセルポリシー】\n' +
    '前日まで：無料\n' +
    '当日：100%\n\n' +
    'ご不明な点はお気軽にご連絡ください。\n' +
    '海亀兄弟';

  var supMessage =
    '🌅 ご予約が確定しました！\n\n' +
    customerName + ' 様\n\n' +
    '予約番号：' + bookingNumber + '\n' +
    'プラン：' + planName + '\n' +
    '日時：' + selectedDate + ' ' + selectedTime + '\n\n' +
    '【当日の持ち物】\n' +
    '・水着（水着を着て集合していただけると助かります）\n' +
    '・タオル\n' +
    '・酔い止め（必要な方）\n\n' +
    '【集合場所について】\n' +
    '前日にLINEにてご連絡いたします。\n\n' +
    '【キャンセルポリシー】\n' +
    '前日まで：無料\n' +
    '当日：100%\n\n' +
    'ご不明な点はお気軽にご連絡ください。\n' +
    '海亀兄弟';

  if (planName.indexOf('ナイトツアー') !== -1) {
    return nightMessage;
  } else if (planName.indexOf('SUP') !== -1) {
    return supMessage;
  } else {
    return snorkelMessage;
  }
}

function getFullMessage(customerName, bookingNumber, planName, selectedDate, selectedTime) {
  return (
    'この度はご予約いただき、\n' +
    '誠にありがとうございます。\n\n' +
    customerName + ' 様\n\n' +
    '予約番号：' + bookingNumber + '\n' +
    'プラン：' + planName + '\n' +
    '日時：' + selectedDate + ' ' + selectedTime + '\n\n' +
    '大変申し訳ございませんが、\n' +
    'ご希望の日程はすでに満席となっており、\n' +
    'ご予約をお受けすることができない状況です。\n\n' +
    'またの機会にぜひご利用いただけますと\n' +
    '幸いです。\n\n' +
    '海亀兄弟'
  );
}

// ============================================================
// 開催場所ごとの前日案内メッセージ
// ============================================================
function getLocationMessage(location, selectedTime) {

  var snorkelFooter =
    '\n\n【到着推奨時間・駐車場について】\n' +
    '5〜10月：開始30〜40分前\n' +
    '11〜4月：開始15分前\n' +
    '宮古島のシュノーケルポイントは大変人気のため、駐車場が混雑する場合がございます。お早めにお越しいただき、駐車場の確保をお願いいたします。\n\n' +
    '開始15分前〜開始時間の間に現地スタッフよりお電話いたします。現地にてお待ちください。\n\n' +
    '恐れ入りますが、本メッセージをご確認いただけましたら、ご返信いただけますと幸いです。\n' +
    '事務担当　中村 凪';

  var nightFooter =
    '\n\n恐れ入りますが、本メッセージをご確認いただけましたら、ご返信いただけますと幸いです。\n' +
    '事務担当　中村 凪';

  var nightCommon =
    '【持ち物・服装】\n' +
    '特に持ち物はありませんが、2時間ほど歩きますので水分の持参をおすすめします。\n' +
    '動きやすい格好・長袖長ズボン・靴（完全舗装ではないためサンダル不可）でお越しください。\n' +
    '🚻 トイレがありませんので、事前に済ませてからお越しください。\n\n';

  var messages = {
    '新城海岸':
      '明日のツアー開催場所のご案内です。\n' +
      '明日は新城海岸にて開催いたします。\n\n' +
      'ウミガメ遭遇率：95%\n' +
      'サンゴ・熱帯魚：観察できます\n' +
      '🅿️ 駐車場：2,000円\n' +
      '🚻 トイレ：あり／🚿 シャワー：あり\n' +
      '📍 https://maps.google.com/?cid=4444603144121769337' +
      snorkelFooter,

    'ボラビーチ':
      '明日のツアー開催場所のご案内です。\n' +
      '明日はボラビーチにて開催いたします。\n\n' +
      'ウミガメ遭遇率：80%\n' +
      'サンゴ・熱帯魚：観察できます\n' +
      '🅿️ 駐車場：無料\n' +
      '🚻 トイレ：なし／🚿 シャワー：なし\n' +
      '※トイレ・シャワーがありませんので事前にお済ませください。\n' +
      '📍 https://maps.google.com/?cid=13840352828513930953' +
      snorkelFooter,

    'ワイワイビーチ':
      '明日のツアー開催場所のご案内です。\n' +
      '明日はワイワイビーチにて開催いたします。\n\n' +
      'ウミガメ遭遇率：80%\n' +
      'サンゴ・熱帯魚：観察できます\n' +
      '🅿️ 駐車場：無料\n' +
      '🚻 トイレ：なし／🚿 シャワー：なし\n' +
      '※トイレ・シャワーがありませんので事前にお済ませください。\n' +
      '📍 https://maps.app.goo.gl/omdcJdCtih5aS9Vc9' +
      snorkelFooter,

    'シギラビーチ':
      '明日のツアー開催場所のご案内です。\n' +
      '明日はシギラビーチにて開催いたします。\n\n' +
      'ウミガメ遭遇率：80%\n' +
      'サンゴ・熱帯魚：観察できます\n' +
      '🅿️ 駐車場：1,000円\n' +
      '🚻 トイレ：あり／🚿 シャワー：なし\n' +
      'なお、シギラビーチは複数の業者が集中するビーチのため、大変残念ではございますがウミガメとの写真撮影はお約束できない状況となっております。あらかじめご了承いただけますと幸いです。\n' +
      '📍 https://maps.app.goo.gl/RTwT8jv1U9GJrwLJ7?g_st=ic' +
      snorkelFooter,

    'ナイトツアー（遺跡）':
      '明日のツアー開催場所のご案内です。\n' +
      '明日の集合場所はこちらになります。\n\n' +
      nightCommon +
      '📍 集合場所：https://maps.app.goo.gl/ugnwv2zcUReYTsuR6\n' +
      '上比屋山遺跡と記された石碑がありますので、その道路沿いにお車をお停めください。\n\n' +
      '19:20にお待ちしております。' +
      nightFooter,

    'ナイトツアー（インディアンマリンガーデン）':
      '明日のツアー開催場所のご案内です。\n' +
      '明日の集合場所はこちらになります。\n\n' +
      nightCommon +
      '📍 集合場所（第一駐車場）：https://maps.app.goo.gl/jyKBqL2WtUkP8MSJA?g_st=ic\n' +
      '第一駐車場にてお待ちください。\n\n' +
      '集合時間になりましたら現地スタッフよりお電話いたします。\n' +
      'そのままお待ちいただけますと幸いです。' +
      nightFooter,
  };

  return messages[location] || null;
}

// ============================================================
// シート取得・自動作成
// ============================================================
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

// ============================================================
// シート初期化（メニューから1回だけ実行）
// ============================================================
function setupSheet() {
  var sheet = getOrCreateSheet();
  var maxRows = sheet.getMaxRows();
  var maxCols = sheet.getMaxColumns();

  var allRange = sheet.getRange(1, 1, maxRows, maxCols);
  allRange.clearContent();
  allRange.clearFormat();
  allRange.clearDataValidations();

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#d9ead3');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(COLUMNS.TIMESTAMP,       150);
  sheet.setColumnWidth(COLUMNS.BOOKING_NUM,     130);
  sheet.setColumnWidth(COLUMNS.DATE,            110);
  sheet.setColumnWidth(COLUMNS.TIME,             80);
  sheet.setColumnWidth(COLUMNS.NAME,            120);
  sheet.setColumnWidth(COLUMNS.PLAN,            200);
  sheet.setColumnWidth(COLUMNS.TOTAL_PRICE,     100);
  sheet.setColumnWidth(COLUMNS.PHONE,           120);
  sheet.setColumnWidth(COLUMNS.STATUS,           90);
  sheet.setColumnWidth(COLUMNS.HEADCOUNT,       130);
  sheet.setColumnWidth(COLUMNS.PARTICIPANTS,    300);
  sheet.setColumnWidth(COLUMNS.LINE_USER_ID,    220);
  sheet.setColumnWidth(COLUMNS.BOOKING_STATUS,  140);
  sheet.setColumnWidth(COLUMNS.LOCATION,        260);
  sheet.setColumnWidth(COLUMNS.LINE_NAME,       150);
  sheet.setColumnWidth(COLUMNS.STAFF,           120);
  sheet.setColumnWidth(COLUMNS.COUPON_CODE,     140);
  sheet.setColumnWidth(COLUMNS.COUPON_DISCOUNT, 120);
  sheet.setColumnWidth(COLUMNS.LINE_SEND,       300);

  sheet.getRange(1, COLUMNS.LINE_SEND).setBackground('#fff2cc');

  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['確定', '満席'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, COLUMNS.BOOKING_STATUS, 1000, 1).setDataValidation(statusRule);

  var locationRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(LOCATION_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, COLUMNS.LOCATION, 1000, 1).setDataValidation(locationRule);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'シートの準備が完了しました！', '完了', 3
  );
}

// ============================================================
// 仮予約メール送信（管理者宛）
// ============================================================
function sendBookingEmail(data, headcount, participantsDetail) {
  try {
    var subject =
      '【仮予約通知】' + (data.customerName || '') +
      ' 様 / ' + (data.selectedDate || '') +
      ' ' + (data.selectedTime || '');

    var couponInfo = 'なし';
    if (data.couponCode) {
      couponInfo = data.couponCode + '（-¥' + (data.couponDiscount || 0).toLocaleString() + '）';
    }

    var staffInfo = data.staffName || '指名なし';

    var body =
      '新しい仮予約が入りました。\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '予約番号：' + (data.bookingNumber   || '') + '\n' +
      '受付日時：' + new Date().toLocaleString('ja-JP') + '\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '【お客様情報】\n' +
      '名前　　：' + (data.customerName    || '') + '\n' +
      '電話　　：' + (data.customerPhone   || '') + '\n' +
      'LINE名　：' + (data.lineDisplayName || '') + '\n\n' +
      '【予約内容】\n' +
      'プラン　　：' + (data.planName      || '') + '\n' +
      '参加日　　：' + (data.selectedDate  || '') + '\n' +
      '時間　　　：' + (data.selectedTime  || '') + '\n' +
      '人数　　　：' + headcount           + '\n' +
      '合計金額　：¥' + (data.totalPrice   || 0).toLocaleString() + '\n' +
      'クーポン　：' + couponInfo + '\n' +
      'スタッフ指名：' + staffInfo + '\n\n' +
      '【参加者詳細】\n' +
      participantsDetail + '\n\n' +
      '【特別なご要望・アレルギー等】\n' +
      (data.specialRequests || 'なし') + '\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      'スプレッドシートのM列を「確定」または「満席」にするとお客様にLINE通知が送信されます。\n' +
      '━━━━━━━━━━━━━━━━━━━━';

    GmailApp.sendEmail(ADMIN_EMAIL, subject, body);
    Logger.log('仮予約メール送信完了: ' + subject);
  } catch (mailError) {
    Logger.log('仮予約メール送信エラー: ' + mailError.message);
  }
}

// ============================================================
// 予約データ受信（Next.js → GAS）
// ============================================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet();

    var headcount =
      '大人' + (data.adultCount    || 0) + '名 / ' +
      '子供' + (data.childCount    || 0) + '名 / ' +
      '3歳未満' + (data.under3Count || 0) + '名';

    var participantsDetail = '';
    if (data.participants && Array.isArray(data.participants)) {
      participantsDetail = data.participants.map(function(p, i) {
        var parts = [(i + 1) + '.'];
        if (p.name)     parts.push(p.name);
        if (p.age)      parts.push(p.age + '歳');
        if (p.height)   parts.push(p.height + 'cm');
        if (p.weight)   parts.push(p.weight + 'kg');
        if (p.footSize) parts.push('足' + p.footSize + 'cm');
        parts.push('(' + (p.category || '') + ')');
        return parts.join(' ');
      }).join('\n');
    }

    var newRow = [
      new Date(),                     // A
      data.bookingNumber   || '',     // B
      data.selectedDate    || '',     // C
      data.selectedTime    || '',     // D
      data.customerName    || '',     // E
      data.planName        || '',     // F
      data.totalPrice      || 0,      // G
      data.customerPhone   || '',     // H
      '受信済み',                     // I
      headcount,                      // J
      participantsDetail,             // K
      data.lineUserId      || '',     // L
      '',                             // M
      '',                             // N
      data.lineDisplayName || '',     // O
      data.staffName       || '指名なし', // P
      data.couponCode      || '',     // Q
      data.couponDiscount  || '',     // R
      '',                             // S
    ];

    sheet.appendRow(newRow);

    try {
      addToCalendar(data, headcount);
    } catch (calError) {
      Logger.log('カレンダー登録エラー: ' + calError.message);
    }

    sendBookingEmail(data, headcount, participantsDetail);

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
// Googleカレンダー登録
// ============================================================
function addToCalendar(data, headcount) {
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    Logger.log('カレンダーが見つかりません: ' + CALENDAR_ID);
    return;
  }

  var dateStr   = data.selectedDate || '';
  var dateParts = dateStr.split('-');
  if (dateParts.length !== 3) return;

  var year  = parseInt(dateParts[0], 10);
  var month = parseInt(dateParts[1], 10) - 1;
  var day   = parseInt(dateParts[2], 10);

  var timeStr   = data.selectedTime || '';
  var timeParts = timeStr.match(/^(\d{1,2}):(\d{2})/);

  var planName = data.planName || '';

  var participantsDetail = '';
  if (data.participants && Array.isArray(data.participants)) {
    participantsDetail = data.participants.map(function(p, i) {
      var parts = [(i + 1) + '.'];
      if (p.name)     parts.push(p.name);
      if (p.age)      parts.push(p.age + '歳');
      if (p.height)   parts.push(p.height + 'cm');
      if (p.weight)   parts.push(p.weight + 'kg');
      if (p.footSize) parts.push('足' + p.footSize + 'cm');
      parts.push('(' + (p.category || '') + ')');
      return parts.join(' ');
    }).join('\n');
  }

  var couponInfo = 'なし';
  if (data.couponCode) {
    couponInfo = data.couponCode + '（-¥' + (data.couponDiscount || 0).toLocaleString() + '）';
  }

  var staffInfo = data.staffName || '指名なし';

  var emoji  = '🐢';
  var prefix = 'WEB';
  var color  = '2';

  if (planName.indexOf('ナイトツアー') !== -1) {
    emoji  = '🦇';
    prefix = 'WEB';
    color  = '8';
  } else if (planName.indexOf('SUP') !== -1) {
    emoji  = '🏄';
    prefix = 'WEB';
    color  = '6';
  } else if (planName.indexOf('VIP') !== -1 || planName.indexOf('貸切') !== -1) {
    emoji  = '🐢';
    prefix = 'WEB VIP';
    color  = '2';
  }

  var title =
    prefix + ' ' + emoji + ' ' +
    planName + ' / ' +
    (data.customerName || '名前なし') + ' / ' +
    headcount;

  var description =
    '予約番号: '      + (data.bookingNumber   || '') +
    '\n受付日時: '    + new Date().toLocaleString('ja-JP') +
    '\n\n【お客様情報】' +
    '\n名前: '        + (data.customerName    || '') +
    '\nLINE名: '      + (data.lineDisplayName || '') +
    '\n電話: '        + (data.customerPhone   || '') +
    '\n\n【予約内容】' +
    '\nプラン: '      + planName +
    '\n参加日: '      + (data.selectedDate    || '') +
    '\n時間: '        + (data.selectedTime    || '') +
    '\n人数: '        + (headcount            || '') +
    '\n合計: ¥'       + (data.totalPrice      || 0).toLocaleString() +
    '\nクーポン: '    + couponInfo +
    '\nスタッフ指名: ' + staffInfo +
    '\n\n【参加者詳細】\n' +
    (participantsDetail || 'なし') +
    '\n\n【特別なご要望・アレルギー等】\n' +
    (data.specialRequests || 'なし');

  if (timeParts) {
    var startHour = parseInt(timeParts[1], 10);
    var startMin  = parseInt(timeParts[2], 10);
    var startTime = new Date(year, month, day, startHour, startMin);
    var endTime   = new Date(year, month, day, startHour + 2, startMin);
    var event = calendar.createEvent(title, startTime, endTime, {
      description: description,
      location: '宮古島',
    });
    event.setColor(color);
  } else {
    var allDayEvent = calendar.createAllDayEvent(title, new Date(year, month, day), {
      description: description,
      location: '宮古島',
    });
    allDayEvent.setColor(color);
  }

  Logger.log('カレンダー登録完了: ' + title);
}

// ============================================================
// 編集トリガー（二重実行防止ロック付き）
// ============================================================
function onSheetEdit(e) {

  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(3000)) {
      Logger.log('二重実行をスキップしました');
      return;
    }
  } catch (lockError) {
    Logger.log('ロック取得失敗: ' + lockError.message);
    return;
  }

  try {
    var range = e.range;
    var sheet = range.getSheet();

    if (sheet.getName() !== SHEET_NAME) return;

    var col = range.getColumn();
    var row = range.getRow();
    if (row <= 1) return;

    // --- M列: 予約ステータス → 確定/満席 通知 ---
    if (col === COLUMNS.BOOKING_STATUS) {
      var status = range.getValue();
      if (status !== '確定' && status !== '満席') return;

      var lineUserId = sheet.getRange(row, COLUMNS.LINE_USER_ID).getValue();
      if (!lineUserId) {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          'LINE User ID が未登録のため通知をスキップしました', '注意', 3
        );
        return;
      }

      var customerName  = String(sheet.getRange(row, COLUMNS.NAME).getValue());
      var bookingNumber = String(sheet.getRange(row, COLUMNS.BOOKING_NUM).getValue());
      var planName      = String(sheet.getRange(row, COLUMNS.PLAN).getValue());
      var selectedDate  = formatDate(sheet.getRange(row, COLUMNS.DATE).getValue());
      var selectedTime  = formatTime(sheet.getRange(row, COLUMNS.TIME).getValue());

      var message = '';
      if (status === '確定') {
        message = getConfirmMessage(planName, customerName, bookingNumber, selectedDate, selectedTime);
      } else if (status === '満席') {
        message = getFullMessage(customerName, bookingNumber, planName, selectedDate, selectedTime);
      }

      sendLineNotify({
        lineUserId: String(lineUserId),
        customMessage: message,
      }, row);
    }

    // --- N列: 開催場所 → 前日案内 ---
    if (col === COLUMNS.LOCATION) {
      var location = range.getValue();
      if (!location) return;

      var lineUserId2 = sheet.getRange(row, COLUMNS.LINE_USER_ID).getValue();
      if (!lineUserId2) {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          'LINE User ID が未登録のため通知をスキップしました', '注意', 3
        );
        return;
      }

      var selectedTime2   = formatTime(sheet.getRange(row, COLUMNS.TIME).getValue());
      var locationMessage = getLocationMessage(location, selectedTime2);

      if (!locationMessage) {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          '場所のメッセージが見つかりません: ' + location, 'エラー', 5
        );
        return;
      }

      sendLineNotify({
        lineUserId: String(lineUserId2),
        customMessage: locationMessage,
      }, row);
    }

    // --- S列: 自由メッセージ送信 ---
    if (col === COLUMNS.LINE_SEND) {
      var messageText = range.getValue();
      if (!messageText) return;
      // 送信済みプレフィックスが付いている場合は再送信しない
      if (String(messageText).indexOf('✅ 送信済') === 0) return;

      var lineUserId3 = sheet.getRange(row, COLUMNS.LINE_USER_ID).getValue();
      if (!lineUserId3) {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          'LINE User ID が未登録のため送信できません', '注意', 3
        );
        return;
      }

      var customerName3 = String(sheet.getRange(row, COLUMNS.NAME).getValue());

      sendLineNotify({
        lineUserId: String(lineUserId3),
        customMessage: String(messageText),
      }, row);

      var now = new Date().toLocaleString('ja-JP');
      range.setValue('✅ 送信済 ' + now + '\n' + messageText);
      range.setBackground('#d9ead3');

      SpreadsheetApp.getActiveSpreadsheet().toast(
        customerName3 + ' 様にLINEを送信しました', '完了', 3
      );
    }

  } finally {
    lock.releaseLock();
  }
}

// ============================================================
// LINE通知送信（共通）
// ============================================================
function sendLineNotify(payload, row) {
  try {
    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + getNotifySecret() },
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
        'LINE通知を送信しました', '完了', 3
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
// メニュー追加
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🐢 海亀兄弟')
    .addItem('シートを初期化する', 'setupSheet')
    .addToUi();
}
