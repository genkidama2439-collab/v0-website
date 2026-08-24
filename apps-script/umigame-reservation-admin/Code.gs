/**
 * GAS（Google Apps Script）完全版
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
 * S: LINEメッセージ入力
 * T: LINE送信確認（チェック後に送信）
 * U: 送信予定・結果
 * V以降: 顧客連絡先・参加者数値・要望・同意済みの閲覧履歴連携ID
 */

// ============================================================
// 設定
// ============================================================

var NOTIFY_API_URL = 'https://www.umigamekyoudaimiyakojima.com/api/line/notify';
var NOTIFY_SECRET = ''; // Script Properties の NOTIFY_SECRET を優先して使います。

var SHEET_NAME = '予約一覧';
var CALENDAR_ID = 'genkidama2439@gmail.com';
var ADMIN_EMAIL = 'genkidama2439@gmail.com';
var BOOKING_SCHEMA_VERSION = '2026.08.20-1';
var BOOKING_SCHEMA_VERSION_PROPERTY = 'BOOKING_SCHEMA_VERSION';

var COMBO_PLAN_NAME = 'ウミガメシュノーケル＆ヤシガニ探検 昼夜セット';
var LEGACY_COMBO_PLAN_NAME = 'ウミガメ＆ジャングルナイト まるごと1日プラン';

// C3：ウミガメシュノーケル＋ドローンSUP 海空セット
// 昼夜セットと同様に、シート・カレンダーとも「海亀」「ドローンSUP」の2件へ分けて管理する。
// 海亀90分の終了直後から、ドローンSUP90分を連続して登録する。
var SEA_SKY_PLAN_NAME = '海空セット';
var SEA_SKY_TURTLE_PLAN_NAME = '海空セット（ウミガメシュノーケル）';
var SEA_SKY_SUP_PLAN_NAME = '海空セット（ドローンSUP）';
var SEA_SKY_TURTLE_DURATION_MINUTES = 90;
var SEA_SKY_SUP_DURATION_MINUTES = 90;
var NIGHT_TOUR_DURATION_MINUTES = 90;

// 昼夜セット用のシート表示名
var COMBO_TURTLE_PLAN_NAME = '昼夜セット海亀';
var COMBO_NIGHT_PLAN_NAME = '昼夜セットヤシガニ';

// セット割1,000円を海亀・ヤシガニで500円ずつ負担
var COMBO_PRICE_RULES = {
  normal: {
    adult: { turtle: 6000, night: 3500 },
    child: { turtle: 5500, night: 3500 },
    under3: { turtle: 0, night: 0 }
  },
  private: {
    adult: { turtle: 8500, night: 7500 },
    child: { turtle: 8500, night: 7500 },
    under3: { turtle: 0, night: 0 }
  }
};

var COLUMNS = {
  TIMESTAMP: 1,
  BOOKING_NUM: 2,
  DATE: 3,
  TIME: 4,
  NAME: 5,
  PLAN: 6,
  TOTAL_PRICE: 7,
  PHONE: 8,
  STATUS: 9,
  HEADCOUNT: 10,
  PARTICIPANTS: 11,
  LINE_USER_ID: 12,
  BOOKING_STATUS: 13,
  LOCATION: 14,
  LINE_NAME: 15,
  STAFF: 16,
  COUPON_CODE: 17,
  COUPON_DISCOUNT: 18,
  LINE_SEND: 19,
  LINE_CONFIRM: 20,
  LINE_RESULT: 21,
  EMAIL: 22,
  VISITOR_ID: 23,
  VISIT_ID: 24,
  BOOKING_FUNNEL_ID: 25,
  TRACKING_CONSENT_VERSION: 26,
  TRACKING_CONSENT_AT: 27,
  VISITOR_CREATED_AT: 28,
  VISIT_STARTED_AT: 29,
  LOCALE: 30,
  LANDING_PAGE: 31,
  REFERRER_HOST: 32,
  UTM_SOURCE: 33,
  UTM_MEDIUM: 34,
  UTM_CAMPAIGN: 35,
  CURRENT_PAGE: 36,
  DEVICE_TYPE: 37,
  BROWSER: 38,
  OS: 39,
  PARTICIPANT_AGES: 40,
  PARTICIPANT_HEIGHTS: 41,
  PARTICIPANT_WEIGHTS: 42,
  PARTICIPANT_FOOT_SIZES: 43,
  SPECIAL_REQUESTS: 44,
  PLAN_ID: 45
};

var HEADERS = [
  '受付日時',
  '予約番号',
  '参加日',
  '時間',
  '名前',
  'プラン',
  '合計金額',
  '電話',
  'ステータス',
  '人数内訳',
  '参加者詳細',
  'lineUserId',
  '予約ステータス',
  '開催場所',
  'LINE名',
  'スタッフ指名',
  'クーポンコード',
  'クーポン割引額',
  'LINE送信',
  'LINE送信確認',
  '送信予定・結果',
  'メールアドレス',
  'Visitor ID',
  'Visit ID',
  '予約ファネルID',
  '行動履歴連携同意バージョン',
  '行動履歴連携同意日時',
  'Visitor作成日時',
  'Visit開始日時',
  '言語',
  '初回着地ページ',
  '参照元ホスト',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  '予約送信ページ',
  'デバイス',
  'ブラウザ',
  'OS',
  '参加者年齢',
  '参加者身長',
  '参加者体重',
  '参加者足サイズ',
  '特別なご要望・アレルギー等',
  '管理プランID'
];

var LOCATION_OPTIONS = [
  '新城海岸',
  '東平安名ビーチ',
  'ワイワイビーチ',
  'シギラビーチ',
  'ナイトツアー（遺跡）',
  'ナイトツアー（インディアンマリンガーデン）'
];

// ============================================================
// プラン判定の基準
// ------------------------------------------------------------
// サイト（app/api/booking/route.ts の buildGASPayload）は常に管理プランID
// （S1〜S8 / C1〜C6）を planId で送る。プラン振り分けはこのIDを最優先で使う。
//
// 備考欄（specialRequests）にはお客様の自由記述がそのまま入るため、
// 「ドローンSUP」「ヤシガニ」「貸切」などの語をテキスト判定に使うと、
// お客様が要望欄にその言葉を書いただけでプランの振り分けが変わってしまう。
// （例: 昼夜セットの要望欄に「ドローンSUP」と書かれると海空セット扱いになり、
//   ヤシガニ探検の行とカレンダー予定が作られない）
//
// planId が取れない古い送信・手動再送のときだけ、従来のテキスト判定へ戻す。
// ============================================================

var SEA_SKY_PLAN_IDS = ['C3', 'C4'];
var NIGHT_COMBO_PLAN_IDS = ['C1', 'C2'];
var PRIVATE_COMBO_PLAN_IDS = ['C2', 'C4', 'C6'];

// 予約データに含まれる管理プランID。取得できない場合は空文字。
function bookingPlanId_(data) {
  data = data || {};

  return String(
    data.planId ||
    data.planID ||
    data.selectedPlanId ||
    data.planCode ||
    data.code ||
    (data.plan && data.plan.id) ||
    ''
  ).trim().toUpperCase();
}

function planIdIsOneOf_(planId, list) {
  return list.indexOf(planId) !== -1;
}

// ============================================================
// ユーティリティ
// ============================================================

function formatDate(value) {
  if (value === null || typeof value === 'undefined' || value === '') return '';

  if (value instanceof Date) {
    var y = value.getFullYear();
    var mo = value.getMonth() + 1;
    var d = value.getDate();

    return y + '-' + ('0' + mo).slice(-2) + '-' + ('0' + d).slice(-2);
  }

  return String(value);
}

function formatTime(value) {
  if (value === null || typeof value === 'undefined' || value === '') return '';

  if (value instanceof Date) {
    var h = value.getHours();
    var m = value.getMinutes();

    return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
  }

  return String(value);
}

function isBlank(value) {
  return value === null || typeof value === 'undefined' || String(value).trim() === '';
}

function valueOrNone(value) {
  return isBlank(value) ? 'なし' : String(value).trim();
}

function toNumber_(value) {
  if (value === null || typeof value === 'undefined' || value === '') return 0;

  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }

  var normalized = String(value).replace(/[¥,円,\s]/g, '');
  var n = Number(normalized);

  return isNaN(n) ? 0 : n;
}

function formatYen(value) {
  if (isBlank(value)) return '¥0';

  if (typeof value === 'string' && value.indexOf('¥') !== -1) {
    return value;
  }

  return '¥' + toNumber_(value).toLocaleString('ja-JP');
}

function formatCouponInfo(couponCode, couponDiscount) {
  var code = String(couponCode || '').trim();
  var discount = toNumber_(couponDiscount);

  if (code && discount) return code + '（-' + formatYen(discount) + '）';
  if (code) return code;
  if (discount) return '割引のみ（-' + formatYen(discount) + '）';

  return 'なし';
}

// 当日その場で受け取る現金の額。
// data.totalPrice はNext.js側でクーポンを引いたあとの金額なので、そのまま受取額になる。
function formatReceiveTotalLines_(data) {
  data = data || {};

  var receiveTotal = toNumber_(data.totalPrice);
  var discount = toNumber_(data.couponDiscount);
  var lines = '合計受取金額：' + formatYen(receiveTotal) + '\n';

  if (discount > 0) {
    lines +=
      '　　　　　　（通常料金 ' +
      formatYen(receiveTotal + discount) +
      ' − クーポン ' +
      formatYen(discount) +
      '）\n';
  }

  return lines;
}

// 売上内訳の締めに置く合計行。
// data.totalPrice を貼り直さず、内訳に実際に表示した金額を足すことで
// ガイド別の按分と受取額が一致していることをメール上で確認できるようにする。
function formatBreakdownTotalLine_(amounts) {
  var sum = 0;

  for (var i = 0; i < (amounts || []).length; i++) {
    sum += toNumber_(amounts[i]);
  }

  return '──────────────────\n' +
    '合計受取金額：' + formatYen(sum) + '\n';
}

function normalizeTime_(value) {
  var m = String(value || '').match(/(\d{1,2})\s*(?::|：|時)\s*(\d{1,2})/);

  if (!m) return '';

  var hour = Number(m[1]);
  var minute = Number(m[2]);

  if (hour > 23 || minute > 59) return '';

  return ('0' + hour).slice(-2) + ':' + ('0' + minute).slice(-2);
}

function addMinutesToTime_(value, minutes) {
  var normalized = normalizeTime_(value);

  if (!normalized) return '';

  var parts = normalized.split(':');
  var date = new Date(2000, 0, 1, Number(parts[0]), Number(parts[1]));

  date.setMinutes(date.getMinutes() + Number(minutes || 0));

  return (
    ('0' + date.getHours()).slice(-2) +
    ':' +
    ('0' + date.getMinutes()).slice(-2)
  );
}

function isComboPlanName(planName) {
  var plan = String(planName || '');

  return plan.indexOf(COMBO_PLAN_NAME) !== -1 ||
    plan.indexOf(LEGACY_COMBO_PLAN_NAME) !== -1 ||
    plan.indexOf('ウミガメ＆ジャングルナイト') !== -1 ||
    plan.indexOf('まるごと1日') !== -1 ||
    (
      plan.indexOf('ウミガメ') !== -1 &&
      plan.indexOf('ヤシガニ') !== -1 &&
      plan.indexOf('昼夜') !== -1
    );
}

function isSeaSkyPlanName_(planName) {
  var plan = String(planName || '');

  return plan.indexOf(SEA_SKY_PLAN_NAME) !== -1 ||
    (
      plan.indexOf('ウミガメ') !== -1 &&
      plan.indexOf('ドローンSUP') !== -1
    );
}

// C3/C4（海空セット）判定。C3も [COMBO booking] を持つため、昼夜セット判定から除外する。
function isSeaSkyComboBooking(data) {
  var planId = bookingPlanId_(data);
  if (planId) return planIdIsOneOf_(planId, SEA_SKY_PLAN_IDS);

  var plan = String(data && data.planName || '');
  var specialRequests = String(data && data.specialRequests || '');

  return isSeaSkyPlanName_(plan) ||
    (
      specialRequests.indexOf('[COMBO booking]') !== -1 &&
      specialRequests.indexOf('ドローンSUP') !== -1
    );
}

// C1/C2の昼夜セット判定
function isComboBooking(data) {
  if (isSeaSkyComboBooking(data)) return false;

  var planId = bookingPlanId_(data);
  if (planId) return planIdIsOneOf_(planId, NIGHT_COMBO_PLAN_IDS);

  return String(data && data.specialRequests || '').indexOf('[COMBO booking]') !== -1 ||
    isComboPlanName(data && data.planName);
}

function isSplitComboPlanName(planName) {
  var plan = String(planName || '').trim();

  return plan === COMBO_TURTLE_PLAN_NAME ||
    plan === COMBO_NIGHT_PLAN_NAME;
}

function isSplitSeaSkyPlanName_(planName) {
  var plan = String(planName || '').trim();

  return plan === SEA_SKY_TURTLE_PLAN_NAME ||
    plan === SEA_SKY_SUP_PLAN_NAME;
}

function extractComboNightTime(data) {
  data = data || {};

  var directCandidates = [
    data.comboNightTime,
    data.nightTime,
    data.nightSelectedTime,
    data.yashiganiTime,
    data.nightTourTime
  ];

  for (var i = 0; i < directCandidates.length; i++) {
    var directTime = normalizeTime_(directCandidates[i]);
    if (directTime) return directTime;
  }

  var text = String(data.specialRequests || '');

  var m = text.match(
    /(?:ヤシガニ(?:探検|探索|ツアー)?|ナイト(?:ツアー)?|夜(?:の部)?)\s*(?:希望)?\s*(?:開始)?\s*(?:時間)?\s*[：:]?\s*(\d{1,2}\s*(?::|：|時)\s*\d{1,2})/
  );

  return m ? normalizeTime_(m[1]) : '';
}

function getBookingDisplayTime(data) {
  var turtleTime =
    normalizeTime_(data && data.selectedTime) ||
    String(data && data.selectedTime || '');

  if (isSeaSkyComboBooking(data)) {
    var seaSkySupTime = addMinutesToTime_(
      turtleTime,
      SEA_SKY_TURTLE_DURATION_MINUTES
    );

    return seaSkySupTime
      ? turtleTime + ' / ' + seaSkySupTime
      : turtleTime;
  }

  if (!isComboBooking(data)) return turtleTime;

  var nightTime = extractComboNightTime(data);

  return nightTime ? turtleTime + ' / ' + nightTime : turtleTime;
}

function nightTimeFromCell(timeCellValue) {
  var s = String(timeCellValue || '');

  if (s.indexOf('/') !== -1) {
    return s.split('/')[1].trim();
  }

  return normalizeTime_(s) || s.trim();
}

function splitAmountEvenly_(amount) {
  var normalized = Math.round(toNumber_(amount));
  var turtle = Math.floor(normalized / 2);

  return {
    turtle: turtle,
    night: normalized - turtle
  };
}

function isPrivateComboBooking_(data) {
  data = data || {};

  var planId = bookingPlanId_(data);
  if (planId) return planIdIsOneOf_(planId, PRIVATE_COMBO_PLAN_IDS);

  var hint = [
    data.planName,
    data.specialRequests,
    data.planType,
    data.packageType,
    data.selectedPlanType,
    data.courseType
  ].join(' ');

  if (/(貸切|プライベート|private)/i.test(hint)) return true;

  var adult = Number(data.adultCount || 0);
  var child = Number(data.childCount || 0);
  var under3 = Number(data.under3Count || 0);
  var totalPeople = adult + child + under3;

  var submittedTotal = toNumber_(data.totalPrice);
  var couponDiscount = toNumber_(data.couponDiscount);

  if (!totalPeople || !submittedTotal) return false;

  var privateBase = totalPeople * 16000;
  var beforeCoupon = submittedTotal + couponDiscount;

  return Math.abs(submittedTotal - privateBase) <= 1 ||
    Math.abs(beforeCoupon - privateBase) <= 1;
}

function getComboBasePrices_(data) {
  var isPrivate = isPrivateComboBooking_(data);
  var rules = isPrivate ? COMBO_PRICE_RULES.private : COMBO_PRICE_RULES.normal;

  var counts = {
    adult: Number(data && data.adultCount || 0),
    child: Number(data && data.childCount || 0),
    under3: Number(data && data.under3Count || 0)
  };

  var turtle = 0;
  var night = 0;

  Object.keys(counts).forEach(function(category) {
    var count = isNaN(counts[category]) ? 0 : counts[category];

    turtle += count * rules[category].turtle;
    night += count * rules[category].night;
  });

  return {
    turtle: turtle,
    night: night,
    total: turtle + night,
    packageType: isPrivate ? '貸切セット' : '通常セット'
  };
}

function getComboRowAmounts_(data) {
  var base = getComboBasePrices_(data);
  var submittedTotal = toNumber_(data && data.totalPrice);

  if (!submittedTotal) {
    return {
      turtle: base.turtle,
      night: base.night,
      total: base.total,
      packageType: base.packageType
    };
  }

  var difference = base.total - submittedTotal;
  var adjustment = splitAmountEvenly_(difference);

  return {
    turtle: base.turtle - adjustment.turtle,
    night: base.night - adjustment.night,
    total: submittedTotal,
    packageType: base.packageType
  };
}

function getComboCouponDiscounts_(data) {
  return splitAmountEvenly_(toNumber_(data && data.couponDiscount));
}

// C3は合計とクーポンを均等に2分割
function getSeaSkyRowAmounts_(data) {
  var total = Math.round(toNumber_(data && data.totalPrice));
  var turtle = Math.floor(total / 2);

  return {
    turtle: turtle,
    sup: total - turtle,
    total: total
  };
}

function getSeaSkyCouponDiscounts_(data) {
  var total = Math.round(toNumber_(data && data.couponDiscount));
  var turtle = Math.floor(total / 2);

  return {
    turtle: turtle,
    sup: total - turtle,
    total: total
  };
}

function categoryLabel(category) {
  var map = {
    adult: '大人',
    child: '子供',
    under3: '3歳未満'
  };

  return map[String(category || '')] || String(category || '');
}

function buildParticipantsDetail(participants) {
  if (!participants || !Array.isArray(participants)) return '';

  return participants.map(function(p, i) {
    var parts = [(i + 1) + '.'];

    if (p.name) parts.push(p.name);
    if (p.age || p.age === 0) parts.push(p.age + '歳');
    if (p.height) parts.push(p.height + 'cm');
    if (p.weight) parts.push(p.weight + 'kg');
    if (p.footSize) parts.push('足' + p.footSize + 'cm');
    if (p.wetsuitRental === true) parts.push('【ウェットスーツ希望】');
    if (p.prescriptionMaskRental === true) parts.push('【度付きマスク希望】');

    parts.push('(' + categoryLabel(p.category) + ')');

    return parts.join(' ');
  }).join('\n');
}

// ============================================================
// 確定メッセージ
// ============================================================

function getConfirmMessage(planName, customerName, bookingNumber, selectedDate, selectedTime, details) {
  details = details || {};

  var plan = String(planName || '');
  var isSeaSky = isSeaSkyPlanName_(plan);
  var isCombo =
    isComboPlanName(plan) ||
    (
      !isSeaSky &&
      String(selectedTime || '').indexOf('/') !== -1
    );

  var opening =
    '以下の内容でご予約を確定いたしました。\n' +
    '内容にお間違いがないかご確認ください。\n\n';

  var detailBlock =
    '【ご予約内容】\n' +
    '予約番号：' + bookingNumber + '\n' +
    'プラン：' + planName + '\n' +
    '日時：' + selectedDate + ' ' + selectedTime + '\n' +
    '人数：' + valueOrNone(details.headcount) + '\n' +
    '合計金額：' + formatYen(details.totalPrice) + '\n\n' +
    '【お客様情報】\n' +
    '電話番号：' + valueOrNone(details.phone) + '\n' +
    'LINE名：' + valueOrNone(details.lineName) + '\n' +
    'スタッフ指名：' + valueOrNone(details.staffName || '指名なし') + '\n' +
    'クーポン：' + formatCouponInfo(details.couponCode, details.couponDiscount) + '\n\n' +
    '【参加者詳細】\n' +
    valueOrNone(details.participantsDetail);

  var snorkelMessage =
    '🐢 ご予約が確定しました！\n\n' +
    customerName + ' 様\n\n' +
    opening +
    detailBlock + '\n\n' +
    '【当日の持ち物】\n' +
    '・水着（着替えは現地でできます）\n' +
    '・タオル\n' +
    '・酔い止め（必要な方）\n\n' +
    '【集合場所について】\n' +
    '開催場所は新城海岸・シギラビーチ・\n' +
    '東平安名ビーチ・ワイワイビーチの\n' +
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
    opening +
    detailBlock + '\n\n' +
    '【当日持ってくると便利なもの】\n' +
    '・虫よけスプレー\n' +
    '・靴（サンダル不可・推奨）\n' +
    '・長ズボン（虫刺されが気になる方）\n\n' +
    '【集合場所について】\n' +
    '当日にLINEにてご連絡いたします。\n\n' +
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
    opening +
    detailBlock + '\n\n' +
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

  var comboMessage = (function() {
    var turtleTime = String(selectedTime || '').split('/')[0].trim();
    var nightTime = nightTimeFromCell(selectedTime);

    return '🐢🦀 ご予約が確定しました！\n\n' +
      customerName + ' 様\n\n' +
      opening +
      detailBlock + '\n\n' +
      '【プラン内容】\n' +
      'ウミガメシュノーケル＋ヤシガニ探検の昼夜セットです。\n\n' +
      '🐢 ウミガメシュノーケル：' + valueOrNone(turtleTime) + '\n' +
      '🦀 ヤシガニ探検：' + valueOrNone(nightTime) + '\n\n' +
      '【集合場所のご案内】\n' +
      '・ウミガメシュノーケル：前日にLINEでご連絡します\n' +
      '・ヤシガニ探検：当日にLINEでご連絡します\n\n' +
      '【当日の持ち物】\n' +
      '〔昼・ウミガメ〕水着・タオル・酔い止め（必要な方）\n' +
      '〔夜・ヤシガニ探検〕虫よけスプレー・歩きやすい靴（サンダル不可）・飲み物\n\n' +
      '【キャンセルポリシー】\n' +
      '前日まで：無料\n' +
      '当日：100%\n\n' +
      'ご不明な点はお気軽にご連絡ください。\n' +
      '海亀兄弟';
  })();

  var seaSkyMessage = (function() {
    var turtleTime = normalizeTime_(selectedTime) || String(selectedTime || '');
    var supTime = addMinutesToTime_(
      turtleTime,
      SEA_SKY_TURTLE_DURATION_MINUTES
    );

    return '🐢🛸 ご予約が確定しました！\n\n' +
      customerName + ' 様\n\n' +
      opening +
      detailBlock + '\n\n' +
      '【プラン内容】\n' +
      'ウミガメシュノーケル＋ドローンSUPの海空セットです。\n' +
      '所要時間の目安は約3.5〜4時間です。\n\n' +
      '🐢 ウミガメシュノーケル：' + valueOrNone(turtleTime) + '〜 約1.5時間\n' +
      '🛸 ドローンSUP：' + valueOrNone(supTime) + '〜 約1.5時間\n' +
      '※ ウミガメシュノーケル終了後、そのまま続けてドローンSUPを行います。\n\n' +
      '【開催場所について】\n' +
      '基本的に同じビーチで、続けて開催します。\n' +
      '海況・水位によっては、ドローンSUPを別のビーチで開催する場合があります。\n' +
      '集合場所は前日にLINEでご連絡いたします。\n\n' +
      '【当日の持ち物】\n' +
      '・水着（着替えは現地でできます）\n' +
      '・タオル\n' +
      '・酔い止め（必要な方）\n\n' +
      '【キャンセルポリシー】\n' +
      '前日まで：無料\n' +
      '当日：100%\n\n' +
      'ご不明な点はお気軽にご連絡ください。\n' +
      '海亀兄弟';
  })();

  if (isSeaSky) return seaSkyMessage;
  if (isCombo) return comboMessage;
  if (plan.indexOf('ナイトツアー') !== -1 || plan.indexOf('ヤシガニ探検') !== -1) return nightMessage;
  if (plan.indexOf('SUP') !== -1) return supMessage;

  return snorkelMessage;
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
// 開催場所ごとの案内メッセージ
// ============================================================

function getLocationMessage(location, selectedTime) {
  var nightTimeStr = nightTimeFromCell(selectedTime);

  var snorkelFooter =
    '\n\n【到着推奨時間・駐車場について】\n' +
    '5〜10月：開始30〜40分前\n' +
    '11〜4月：開始15分前\n\n' +
    '宮古島のシュノーケルポイントは大変人気のため、駐車場が混雑する場合がございます。\n' +
    'お早めにお越しいただき、駐車場の確保をお願いいたします。\n\n' +
    '開始15分前〜開始時間の間に現地スタッフよりお電話いたします。\n' +
    '現地にてお待ちください。\n\n' +
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

  var higashihennaMessage =
    '明日のツアー開催場所のご案内です。\n' +
    '明日は東平安名ビーチにて開催いたします。\n\n' +
    'ウミガメ遭遇率：80%\n' +
    'サンゴ・熱帯魚：観察できます\n' +
    '🅿️ 駐車場：無料\n' +
    '🚻 トイレ：なし／🚿 シャワー：なし\n' +
    '※トイレ・シャワーがありませんので事前にお済ませください。\n\n' +
    '📍 https://maps.app.goo.gl/7HQCCFH2WWGUQUfK7\n\n' +
    'Googleマップ上では韓国語表示される駐車場が表示される場合があります。\n' +
    '当日はナンバー「7127」のシルバーの車を目印にお越しください。\n' +
    '現地は電波が不安定な場合がございますので、事前に地図をご確認ください。' +
    snorkelFooter;

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

    '東平安名ビーチ':
      higashihennaMessage,

    'ボラビーチ':
      higashihennaMessage,

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
      '本日のナイトツアー集合場所のご案内です。\n' +
      '本日の集合場所はこちらになります。\n\n' +
      nightCommon +
      '📍 集合場所：https://maps.app.goo.gl/ugnwv2zcUReYTsuR6\n' +
      '上比屋山遺跡と記された石碑がありますので、その道路沿いにお車をお停めください。\n\n' +
      '本日 ' + (nightTimeStr || '集合時間') + ' にお待ちしております。' +
      nightFooter,

    'ナイトツアー（インディアンマリンガーデン）':
      '本日のナイトツアー集合場所のご案内です。\n' +
      '本日の集合場所はこちらになります。\n\n' +
      nightCommon +
      '📍 集合場所（第一駐車場）：https://maps.app.goo.gl/jyKBqL2WtUkP8MSJA?g_st=ic\n' +
      '第一駐車場にてお待ちください。\n\n' +
      '集合時間になりましたら現地スタッフよりお電話いたします。\n' +
      'そのままお待ちいただけますと幸いです。' +
      nightFooter
  };

  return messages[location] || null;
}

// ============================================================
// シート取得・作成
// ============================================================

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  ensureBookingSchema_(sheet);

  return sheet;
}

// 既存の予約行を消さずに、新しい顧客・行動分析列だけを末尾へ追加する。
// A〜Uの21列は予約管理・LINE安全送信が参照するため変更しない。
function ensureBookingSchema_(sheet) {
  var schemaChanged = migrateCollidingCustomerColumns_(sheet);

  var missingColumns = HEADERS.length - sheet.getMaxColumns();
  if (missingColumns > 0) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), missingColumns);
    schemaChanged = true;
  }

  var existing = sheet
    .getRange(1, 1, 1, HEADERS.length)
    .getDisplayValues()[0];
  var headersMatch = HEADERS.every(function(header, index) {
    return String(existing[index] || '') === header;
  });
  var properties = PropertiesService.getScriptProperties();
  var needsRepair =
    !!schemaChanged ||
    !headersMatch ||
    properties.getProperty(BOOKING_SCHEMA_VERSION_PROPERTY) !==
      BOOKING_SCHEMA_VERSION;

  if (!needsRepair) return;

  // ヘッダー書き込み前にT/Uの古い規則を外す。
  // 修復済みの通常予約受信ではシートへ一切書き込まない。
  clearLineColumnValidations_(sheet);
  clearCustomerTrackingValidations_(sheet);

  if (!headersMatch) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }

  sheet.setFrozenRows(1);
  clearInvalidLineResults_(sheet);
  clearBlankRowLineValues_(sheet);

  var checkboxRule = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .setAllowInvalid(false)
    .build();

  sheet
    .getRange(2, COLUMNS.LINE_CONFIRM, Math.max(sheet.getMaxRows() - 1, 1), 1)
    .setDataValidation(checkboxRule);
  sheet.setColumnWidth(COLUMNS.LINE_CONFIRM, 130);
  sheet.setColumnWidth(COLUMNS.LINE_RESULT, 360);

  properties.setProperty(
    BOOKING_SCHEMA_VERSION_PROPERTY,
    BOOKING_SCHEMA_VERSION
  );
}

// 2026-08-20に、旧LINE送信確認列のチェックボックス規則がV列
// （現在のメールアドレス列）へ残っているシートが見つかった。
// メール文字列が「チェックボックス以外は拒否」の規則に弾かれると、予約行を
// 45列すべて保存できない。V列以降には入力規則を使わないため、スキーマ更新時に
// 顧客・行動連携列の古い規則をまとめて除去する。
function clearCustomerTrackingValidations_(sheet) {
  if (
    sheet.getMaxRows() < 2 ||
    sheet.getMaxColumns() < COLUMNS.EMAIL
  ) {
    return;
  }

  sheet
    .getRange(
      2,
      COLUMNS.EMAIL,
      sheet.getMaxRows() - 1,
      HEADERS.length - COLUMNS.EMAIL + 1
    )
    .clearDataValidations();
}

// 2026-08-13版では、既存のT/U列（LINE確認・結果）と新しいメール／
// Visitor ID列が衝突していた。衝突版のヘッダーを検出した場合だけ2列挿入し、
// 新規予約の顧客データはV列以降へ、従来のLINE値はT/U列へ戻す。
// 既存行の削除・並べ替えは行わない。
function migrateCollidingCustomerColumns_(sheet) {
  if (sheet.getMaxColumns() < 21) return false;

  var headers = sheet.getRange(1, 1, 1, 21).getDisplayValues()[0];
  var hasCollision =
    String(headers[19] || '').trim() === 'メールアドレス' &&
    String(headers[20] || '').trim() === 'Visitor ID';

  if (!hasCollision) return false;

  sheet.insertColumnsBefore(20, 2);
  clearLineColumnValidations_(sheet);

  var lastRow = sheet.getLastRow();

  if (lastRow >= 2) {
    var shiftedValues = sheet.getRange(2, 22, lastRow - 1, 2).getValues();
    var lineValues = [];
    var customerValues = [];

    shiftedValues.forEach(function(row) {
      var first = row[0];
      var second = row[1];
      var firstText = String(first == null ? '' : first).trim();
      var secondText = String(second == null ? '' : second).trim();
      var looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(firstText);
      var looksLikeVisitorId =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          .test(secondText);
      var looksLikeLineConfirm =
        typeof first === 'boolean' || /^(TRUE|FALSE)$/i.test(firstText);
      var looksLikeLineResult =
        !!secondText && !looksLikeVisitorId;
      var isLegacyLineRow =
        looksLikeLineConfirm ||
        (!looksLikeEmail && looksLikeLineResult);

      if (isLegacyLineRow) {
        lineValues.push([first, second]);
        customerValues.push(['', '']);
      } else {
        lineValues.push(['', '']);
        customerValues.push([first, second]);
      }
    });

    sheet.getRange(2, 20, lineValues.length, 2).setValues(lineValues);
    sheet.getRange(2, 22, customerValues.length, 2).setValues(customerValues);
    sheet
      .getRange(2, 22, Math.max(sheet.getMaxRows() - 1, 1), 2)
      .clearDataValidations();
  }

  Logger.log(
    '[SCHEMA_MIGRATION] T/U列衝突を修復し、顧客・行動列をV列以降へ移動しました。'
  );

  return true;
}

// 列挿入時に隣接列から引き継がれた古い入力規則を解除する。
// U列は自由記述の送信結果、T列だけをこの後チェックボックスへ戻す。
function clearLineColumnValidations_(sheet) {
  if (sheet.getMaxColumns() < COLUMNS.LINE_RESULT) return;

  sheet
    .getRange(
      2,
      COLUMNS.LINE_CONFIRM,
      Math.max(sheet.getMaxRows() - 1, 1),
      2
    )
    .clearDataValidations();
}

// 旧入力規則のFALSE/TRUEがU列へ残った場合は送信結果ではないため除去する。
function clearInvalidLineResults_(sheet) {
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  var range = sheet.getRange(2, COLUMNS.LINE_RESULT, lastRow - 1, 1);
  var values = range.getValues();
  var changed = false;

  values.forEach(function(row) {
    var value = row[0];
    var text = String(value == null ? '' : value).trim();

    if (typeof value === 'boolean' || /^(TRUE|FALSE)$/i.test(text)) {
      row[0] = '';
      changed = true;
    }
  });

  if (changed) range.setValues(values);
}

// 旧チェックボックス規則が空行へ入れたFALSEが残ると getLastRow() が1000行目まで
// 膨らみ、新規予約が大きく飛ぶ。予約番号(B列)が空の行だけT/Uを空に戻す。
function clearBlankRowLineValues_(sheet) {
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  var rowCount = lastRow - 1;
  var bookingNumbers = sheet
    .getRange(2, COLUMNS.BOOKING_NUM, rowCount, 1)
    .getDisplayValues();
  var lineRange = sheet.getRange(
    2,
    COLUMNS.LINE_CONFIRM,
    rowCount,
    2
  );
  var lineValues = lineRange.getValues();
  var changed = false;

  lineValues.forEach(function(row, index) {
    if (String(bookingNumbers[index][0] || '').trim()) return;

    if (row[0] !== '' || row[1] !== '') {
      row[0] = '';
      row[1] = '';
      changed = true;
    }
  });

  if (changed) lineRange.setValues(lineValues);
}

// ============================================================
// シート初期化
// 注意：実行すると予約一覧の中身が消えます
// ============================================================

function setupSheet() {
  var ui = SpreadsheetApp.getUi();

  var result = ui.alert(
    '確認',
    '予約一覧シートの内容・書式・プルダウンを初期化します。\n本当に実行しますか？',
    ui.ButtonSet.YES_NO
  );

  if (result !== ui.Button.YES) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '初期化をキャンセルしました',
      'キャンセル',
      3
    );
    return;
  }

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

  sheet.setColumnWidth(COLUMNS.TIMESTAMP, 150);
  sheet.setColumnWidth(COLUMNS.BOOKING_NUM, 130);
  sheet.setColumnWidth(COLUMNS.DATE, 110);
  sheet.setColumnWidth(COLUMNS.TIME, 120);
  sheet.setColumnWidth(COLUMNS.NAME, 120);
  sheet.setColumnWidth(COLUMNS.PLAN, 220);
  sheet.setColumnWidth(COLUMNS.TOTAL_PRICE, 100);
  sheet.setColumnWidth(COLUMNS.PHONE, 120);
  sheet.setColumnWidth(COLUMNS.STATUS, 90);
  sheet.setColumnWidth(COLUMNS.HEADCOUNT, 130);
  sheet.setColumnWidth(COLUMNS.PARTICIPANTS, 300);
  sheet.setColumnWidth(COLUMNS.LINE_USER_ID, 220);
  sheet.setColumnWidth(COLUMNS.BOOKING_STATUS, 140);
  sheet.setColumnWidth(COLUMNS.LOCATION, 260);
  sheet.setColumnWidth(COLUMNS.LINE_NAME, 150);
  sheet.setColumnWidth(COLUMNS.STAFF, 120);
  sheet.setColumnWidth(COLUMNS.COUPON_CODE, 140);
  sheet.setColumnWidth(COLUMNS.COUPON_DISCOUNT, 120);
  sheet.setColumnWidth(COLUMNS.LINE_SEND, 300);
  sheet.setColumnWidth(COLUMNS.LINE_CONFIRM, 130);
  sheet.setColumnWidth(COLUMNS.LINE_RESULT, 360);
  sheet.setColumnWidth(COLUMNS.EMAIL, 220);
  sheet.setColumnWidths(COLUMNS.VISITOR_ID, 3, 250);
  sheet.setColumnWidths(COLUMNS.TRACKING_CONSENT_VERSION, 4, 170);
  sheet.setColumnWidths(COLUMNS.LOCALE, 10, 140);
  sheet.setColumnWidths(COLUMNS.PARTICIPANT_AGES, 4, 180);

  sheet.getRange(1, COLUMNS.LINE_SEND).setBackground('#fff2cc');

  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['確定', '満席'], true)
    .setAllowInvalid(false)
    .build();

  sheet
    .getRange(2, COLUMNS.BOOKING_STATUS, 1000, 1)
    .setDataValidation(statusRule);

  var locationRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(LOCATION_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  sheet
    .getRange(2, COLUMNS.LOCATION, 1000, 1)
    .setDataValidation(locationRule);

  var lineConfirmRule = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .setAllowInvalid(false)
    .build();

  sheet
    .getRange(2, COLUMNS.LINE_CONFIRM, 1000, 1)
    .setDataValidation(lineConfirmRule);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'シートの準備が完了しました',
    '完了',
    3
  );
}

// ============================================================
// 管理者宛メール送信
// ============================================================

function sendBookingEmail(data, headcount, participantsDetail) {
  try {
    var displayTime = getBookingDisplayTime(data);

    var subject =
      '【仮予約通知】' +
      (data.customerName || '') +
      ' 様 / ' +
      (data.selectedDate || '') +
      ' ' +
      displayTime;

    var couponInfo = formatCouponInfo(
      data.couponCode,
      data.couponDiscount
    );

    var staffInfo = data.staffName || '指名なし';
    var planOperationBlock = '';

    if (isSeaSkyComboBooking(data)) {
      var seaSkySupTime = addMinutesToTime_(
        data.selectedTime,
        SEA_SKY_TURTLE_DURATION_MINUTES
      );
      var seaSkyAmounts = getSeaSkyRowAmounts_(data);
      var seaSkyCouponDiscounts = getSeaSkyCouponDiscounts_(data);

      planOperationBlock =
        '\n【海空セット運用・売上内訳】※各金額はクーポン適用後\n' +
        SEA_SKY_TURTLE_PLAN_NAME +
        '：' +
        (normalizeTime_(data.selectedTime) || data.selectedTime || '未入力') +
        '〜 約1.5時間 / ' + formatYen(seaSkyAmounts.turtle) +
        '（クーポン適用済 -' + formatYen(seaSkyCouponDiscounts.turtle) + '）\n' +
        SEA_SKY_SUP_PLAN_NAME +
        '：' +
        (seaSkySupTime || '未入力') +
        '〜 約1.5時間 / ' + formatYen(seaSkyAmounts.sup) +
        '（クーポン適用済 -' + formatYen(seaSkyCouponDiscounts.sup) + '）\n' +
        formatBreakdownTotalLine_([
          seaSkyAmounts.turtle,
          seaSkyAmounts.sup
        ]) +
        '※ 海亀終了後、そのままドローンSUPを続けて開催します。基本は同じビーチですが、海況・水位により別ビーチになる場合があります。\n';

    } else if (isComboBooking(data)) {
      var comboAmounts = getComboRowAmounts_(data);

      planOperationBlock =
        '\n【昼夜セット売上内訳】※各金額はクーポン適用後\n' +
        COMBO_TURTLE_PLAN_NAME +
        '：' +
        formatYen(comboAmounts.turtle) +
        '\n' +
        COMBO_NIGHT_PLAN_NAME +
        '：' +
        formatYen(comboAmounts.night) +
        '\n' +
        formatBreakdownTotalLine_([
          comboAmounts.turtle,
          comboAmounts.night
        ]);
    }

    var body =
      '新しい仮予約が入りました。\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '予約番号：' + (data.bookingNumber || '') + '\n' +
      '受付日時：' + new Date().toLocaleString('ja-JP') + '\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '【お客様情報】\n' +
      '名前　　：' + (data.customerName || '') + '\n' +
      '電話　　：' + (data.customerPhone || '') + '\n' +
      'メール　：' + (data.customerEmail || '') + '\n' +
      'LINE名　：' + (data.lineDisplayName || '') + '\n\n' +
      '【予約内容】\n' +
      'プラン　　：' + (data.planName || '') + '\n' +
      '参加日　　：' + (data.selectedDate || '') + '\n' +
      '時間　　　：' + displayTime + '\n' +
      '人数　　　：' + headcount + '\n' +
      formatReceiveTotalLines_(data) +
      'クーポン　：' + couponInfo + '\n' +
      'スタッフ指名：' + staffInfo + '\n' +
      planOperationBlock + '\n' +
      '【参加者詳細】\n' +
      participantsDetail + '\n\n' +
      '【特別なご要望・アレルギー等】\n' +
      (data.specialRequests || 'なし') + '\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      'M列の予約状態を変更後、U列の内容を確認してT列をチェックするとLINE通知が送信されます。\n' +
      '━━━━━━━━━━━━━━━━━━━━';

    GmailApp.sendEmail(ADMIN_EMAIL, subject, body);
    Logger.log('仮予約メール送信完了: ' + subject);

  } catch (mailError) {
    Logger.log('仮予約メール送信エラー: ' + mailError.message);
  }
}

// ============================================================
// 予約データ受信 Next.js → GAS
// ============================================================

function buildBookingRow_(timestamp, data, headcount, participantsDetail, options) {
  options = options || {};
  var analytics = data.customerAnalytics || {};
  var attribution = data.attribution || {};
  var participants = Array.isArray(data.participants) ? data.participants : [];
  var participantValues = function(field) {
    return participants.map(function(participant) {
      var value = participant && participant[field];
      return value === null || typeof value === 'undefined' || value === '' ? '' : String(value);
    }).join(' / ');
  };

  return [
    timestamp,
    data.bookingNumber || '',
    data.selectedDate || '',
    options.time || '',
    data.customerName || '',
    options.planName || data.planName || '',
    typeof options.totalPrice !== 'undefined'
      ? options.totalPrice
      : (data.totalPrice || 0),
    data.customerPhone || '',
    '受信済み',
    headcount,
    participantsDetail,
    data.lineUserId || '',
    '',
    '',
    data.lineDisplayName || '',
    typeof options.staffName !== 'undefined'
      ? options.staffName
      : (data.staffName || ''),
    data.couponCode || '',
    typeof options.couponDiscount !== 'undefined'
      ? options.couponDiscount
      : (data.couponDiscount || 0),
    '',
    '',
    '',
    data.customerEmail || '',
    analytics.visitorId || '',
    analytics.visitId || '',
    analytics.bookingFunnelId || '',
    analytics.consentVersion || '',
    analytics.consentedAt || '',
    analytics.visitorCreatedAt || '',
    analytics.visitStartedAt || '',
    data.locale || '',
    attribution.landingPage || '',
    attribution.referrer || '',
    attribution.source || '',
    attribution.medium || '',
    attribution.campaign || '',
    analytics.currentPage || '',
    analytics.deviceType || '',
    analytics.browser || '',
    analytics.os || '',
    participantValues('age'),
    participantValues('height'),
    participantValues('weight'),
    participantValues('footSize'),
    data.specialRequests || '',
    data.planId || ''
  ];
}

function findExistingBookingRows_(sheet, bookingNumber) {
  var normalized = String(bookingNumber || '').trim();

  if (!normalized || sheet.getMaxRows() < 2) return [];

  var values = sheet
    .getRange(2, COLUMNS.BOOKING_NUM, sheet.getMaxRows() - 1, 1)
    .getDisplayValues();
  var rows = [];

  for (var index = 0; index < values.length; index += 1) {
    if (String(values[index][0] || '').trim() === normalized) {
      rows.push(index + 2);
    }
  }

  return rows;
}

function bookingRowsMatch_(sheet, existingRows, expectedRows) {
  if (existingRows.length !== expectedRows.length) return false;

  var actualSignatures = existingRows.map(function(rowNumber) {
    var values = sheet
      .getRange(rowNumber, 1, 1, HEADERS.length)
      .getValues()[0];

    return [
      String(values[COLUMNS.BOOKING_NUM - 1] || ''),
      formatTime(values[COLUMNS.TIME - 1]),
      String(values[COLUMNS.PLAN - 1] || ''),
      toNumber_(values[COLUMNS.TOTAL_PRICE - 1])
    ].join('\u0001');
  }).sort();

  var expectedSignatures = expectedRows.map(function(values) {
    return [
      String(values[COLUMNS.BOOKING_NUM - 1] || ''),
      formatTime(values[COLUMNS.TIME - 1]),
      String(values[COLUMNS.PLAN - 1] || ''),
      toNumber_(values[COLUMNS.TOTAL_PRICE - 1])
    ].join('\u0001');
  }).sort();

  return actualSignatures.join('\u0002') ===
    expectedSignatures.join('\u0002');
}

// T列などの空行チェックボックス値に影響されず、予約番号(B列)の最後へ追記する。
function getNextBookingRow_(sheet) {
  if (sheet.getMaxRows() < 2) return 2;

  var values = sheet
    .getRange(2, COLUMNS.BOOKING_NUM, sheet.getMaxRows() - 1, 1)
    .getDisplayValues();

  for (var index = values.length - 1; index >= 0; index -= 1) {
    if (String(values[index][0] || '').trim()) return index + 3;
  }

  return 2;
}

// true=新規保存、false=同じ予約番号が既に存在。確認から書き込みまで同じロック内で
// 行うため、同時に同じリクエストが届いてもメール・カレンダーは1回だけになる。
function writeBookingRows_(sheet, rows) {
  if (!rows || !rows.length) return false;

  var bookingNumber = String(
    rows[0][COLUMNS.BOOKING_NUM - 1] || ''
  ).trim();

  if (!bookingNumber) {
    throw new Error('予約番号がないため保存できません。');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var existingRows = findExistingBookingRows_(sheet, bookingNumber);

    if (existingRows.length) {
      if (!bookingRowsMatch_(sheet, existingRows, rows)) {
        Logger.log(
          '[INCOMPLETE_BOOKING_DETECTED] booking=' +
          bookingNumber +
          ' / existingRows=' +
          existingRows.join(',') +
          ' / expectedCount=' +
          rows.length
        );
        throw new Error(
          '同じ予約番号の保存データが不完全です。' +
          '既存' + existingRows.length + '行 / 必要' + rows.length + '行。' +
          '重複成功扱いにはせず、管理者の確認が必要です。'
        );
      }

      Logger.log(
        '[DUPLICATE_BOOKING_SKIPPED] booking=' +
        bookingNumber +
        ' / rows=' +
        existingRows.join(',')
      );
      return false;
    }

    var startRow = getNextBookingRow_(sheet);
    var requiredLastRow = startRow + rows.length - 1;

    if (requiredLastRow > sheet.getMaxRows()) {
      sheet.insertRowsAfter(
        sheet.getMaxRows(),
        requiredLastRow - sheet.getMaxRows()
      );
    }

    // 挿入行は直前行の入力規則を引き継ぐことがある。顧客・行動連携列には
    // 入力規則を設けないため、書き込み対象行だけ毎回解除してから45列を保存する。
    sheet
      .getRange(
        startRow,
        COLUMNS.EMAIL,
        rows.length,
        HEADERS.length - COLUMNS.EMAIL + 1
      )
      .clearDataValidations();

    sheet
      .getRange(startRow, 1, rows.length, HEADERS.length)
      .setValues(rows);

    SpreadsheetApp.flush();

    var writtenRows = sheet
      .getRange(startRow, 1, rows.length, HEADERS.length)
      .getValues();

    if (!bookingRowsMatch_(sheet, writtenRows.map(function(_, index) {
      return startRow + index;
    }), rows)) {
      sheet
        .getRange(startRow, 1, rows.length, HEADERS.length)
        .clearContent();
      SpreadsheetApp.flush();
      throw new Error(
        '予約行の保存後検証に失敗したため、不完全な行を取り消しました。'
      );
    }

    return true;

  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet();

    Logger.log(
      '[GAS_VERSION] COMBO_2_ROWS_PLUS_SEA_SKY_2_ROWS_CONTINUOUS_V2 / booking=' +
      (data.bookingNumber || '') +
      ' / plan=' +
      (data.planName || '')
    );

    var headcount =
      '大人' + (data.adultCount || 0) + '名 / ' +
      '子供' + (data.childCount || 0) + '名 / ' +
      '3歳未満' + (data.under3Count || 0) + '名';

    var participantsDetail = buildParticipantsDetail(data.participants);
    var timestamp = new Date();
    var rows = [];

    // C3：海空セットを海亀・ドローンSUPの2行に分ける。
    // 09:00 海亀（90分）→ 10:30 ドローンSUP（90分）
    if (isSeaSkyComboBooking(data)) {
      var seaSkyTurtleTime = normalizeTime_(data.selectedTime);
      var seaSkySupTime = addMinutesToTime_(
        seaSkyTurtleTime,
        SEA_SKY_TURTLE_DURATION_MINUTES
      );

      if (!seaSkyTurtleTime || !seaSkySupTime) {
        throw new Error(
          '海空セットの開始時間を取得できませんでした。' +
          ' 海亀=' + (data.selectedTime || '未入力')
        );
      }

      var seaSkyAmounts = getSeaSkyRowAmounts_(data);
      var seaSkyCouponDiscounts = getSeaSkyCouponDiscounts_(data);
      var seaSkyStaffName = data.staffName || '';

      rows = [
        buildBookingRow_(
          timestamp,
          data,
          headcount,
          participantsDetail,
          {
            time: seaSkyTurtleTime,
            planName: SEA_SKY_TURTLE_PLAN_NAME,
            totalPrice: seaSkyAmounts.turtle,
            staffName: seaSkyStaffName,
            couponDiscount: seaSkyCouponDiscounts.turtle
          }
        ),
        buildBookingRow_(
          timestamp,
          data,
          headcount,
          participantsDetail,
          {
            time: seaSkySupTime,
            planName: SEA_SKY_SUP_PLAN_NAME,
            totalPrice: seaSkyAmounts.sup,
            staffName: seaSkyStaffName,
            couponDiscount: seaSkyCouponDiscounts.sup
          }
        )
      ];

      Logger.log(
        '[SEA_SKY_2_ROWS] turtle=' +
        seaSkyTurtleTime +
        ' ' +
        seaSkyAmounts.turtle +
        ' / sup=' +
        seaSkySupTime +
        ' ' +
        seaSkyAmounts.sup
      );

    } else if (isComboBooking(data)) {
      var turtleTime = normalizeTime_(data.selectedTime);
      var nightTime = extractComboNightTime(data);

      if (!turtleTime || !nightTime) {
        throw new Error(
          '昼夜セットの開始時間を取得できませんでした。' +
          ' 海亀=' + (data.selectedTime || '未入力') +
          ' / ヤシガニ=' + (nightTime || '未取得')
        );
      }

      var amounts = getComboRowAmounts_(data);
      var couponDiscounts = getComboCouponDiscounts_(data);
      var originalStaffName = data.staffName || '';

      rows = [
        buildBookingRow_(
          timestamp,
          data,
          headcount,
          participantsDetail,
          {
            time: turtleTime,
            planName: COMBO_TURTLE_PLAN_NAME,
            totalPrice: amounts.turtle,
            staffName: originalStaffName,
            couponDiscount: couponDiscounts.turtle
          }
        ),
        buildBookingRow_(
          timestamp,
          data,
          headcount,
          participantsDetail,
          {
            time: nightTime,
            planName: COMBO_NIGHT_PLAN_NAME,
            totalPrice: amounts.night,
            staffName: originalStaffName,
            couponDiscount: couponDiscounts.night
          }
        )
      ];

      Logger.log(
        '[COMBO_2_ROWS] turtle=' +
        turtleTime +
        ' ' +
        amounts.turtle +
        ' / night=' +
        nightTime +
        ' ' +
        amounts.night
      );

    } else {
      rows = [
        buildBookingRow_(
          timestamp,
          data,
          headcount,
          participantsDetail,
          {
            time:
              normalizeTime_(data.selectedTime) ||
              String(data.selectedTime || ''),
            planName: data.planName || '',
            totalPrice: data.totalPrice || 0,
            staffName: data.staffName || '',
            couponDiscount: data.couponDiscount || 0
          }
        )
      ];
    }

    var created = writeBookingRows_(sheet, rows);

    if (!created) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          duplicate: true,
          bookingNumber: data.bookingNumber
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    try {
      addToCalendar(data, headcount);
    } catch (calError) {
      Logger.log('カレンダー登録エラー: ' + calError.message);
    }

    sendBookingEmail(data, headcount, participantsDetail);

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        bookingNumber: data.bookingNumber
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('doPost エラー: ' + error.message);

    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.message
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// Googleカレンダー登録
// ============================================================

function getCalendarDateParts_(dateStr) {
  var parts = String(dateStr || '').split('-');

  if (parts.length !== 3) return null;

  var year = parseInt(parts[0], 10);
  var month = parseInt(parts[1], 10) - 1;
  var day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  return {
    year: year,
    month: month,
    day: day
  };
}

function createCalendarTimedEvent_(
  calendar,
  dateParts,
  time,
  durationMinutes,
  title,
  description,
  color
) {
  var normalizedTime = normalizeTime_(time);

  if (!normalizedTime) {
    throw new Error('カレンダー登録用の時間が不正です: ' + time);
  }

  var timeParts = normalizedTime.split(':');

  var start = new Date(
    dateParts.year,
    dateParts.month,
    dateParts.day,
    Number(timeParts[0]),
    Number(timeParts[1])
  );

  var end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  var event = calendar.createEvent(title, start, end, {
    description: description,
    location: '宮古島'
  });

  event.setColor(color);
  Logger.log('カレンダー登録完了: ' + title);

  return event;
}

function buildCalendarDescription_(data, headcount, options) {
  options = options || {};

  var participantsDetail = buildParticipantsDetail(data.participants);

  var couponInfo = formatCouponInfo(
    data.couponCode,
    options.couponDiscount
  );

  var staffName = typeof options.staffName !== 'undefined'
    ? options.staffName
    : (data.staffName || '');

  // セットは1予約が複数イベントへ分かれる。このイベントの「売上」は担当分の計上額でしかないため、
  // お客様から実際に受け取る合計額を各イベントへ載せる。
  // 現金はセット全体で1回だけ、最初のツアー開始時に全額受け取る運用。
  var setBreakdown = options.setBreakdown || [];
  var isSetComponent = setBreakdown.length > 0;
  var receiptBlock = '';

  if (isSetComponent) {
    // 受取担当は配列順ではなく開始時刻で決める（並び順が変わっても最初のツアーを指す）
    var collectorIndex = 0;

    for (var c = 1; c < setBreakdown.length; c++) {
      var candidateTime = normalizeTime_(setBreakdown[c] && setBreakdown[c].time);
      var currentTime = normalizeTime_(
        setBreakdown[collectorIndex] && setBreakdown[collectorIndex].time
      );

      if (candidateTime && (!currentTime || candidateTime < currentTime)) {
        collectorIndex = c;
      }
    }

    var collector = setBreakdown[collectorIndex] || {};
    var collectorName = (collector.label || '') +
      (collector.time ? '（' + collector.time + '〜）' : '');

    // setIndex が渡されていないときは受取担当を断定しない（取りこぼしを防ぐ）
    var hasSetIndex = typeof options.setIndex === 'number';
    var isCollector = hasSetIndex && options.setIndex === collectorIndex;

    var breakdownLines = [];
    var receiveTotal = 0;

    for (var i = 0; i < setBreakdown.length; i++) {
      var item = setBreakdown[i] || {};

      receiveTotal += toNumber_(item.amount);
      breakdownLines.push(
        '　' + (item.label || '') +
        (item.time ? '（' + item.time + '〜）' : '') +
        ' … ' + formatYen(item.amount) +
        (i === collectorIndex ? '　← 受取担当' : '')
      );
    }

    receiptBlock =
      '\n\n【セット全体の受取金額】' +
      '\n合計受取金額: ' + formatYen(receiveTotal) +
      (
        !hasSetIndex
          ? ''
          : isCollector
            ? '　← このツアー開始時に全額受け取る'
            : '（受取済み・このツアーでは受け取らない）'
      ) +
      '\n受取担当: ' + collectorName + ' の開始時に全額' +
      '\n内訳（担当ごとの売上計上）\n' +
      breakdownLines.join('\n') +
      '\n※ 上の「売上」はこのツアー分の計上額です。' +
      (
        !hasSetIndex
          ? '\n※ セット合計は最初のツアー開始時に1回だけ受け取ります。'
          : isCollector
            ? '\n※ セット合計をこのツアー開始時に1回だけ受け取ってください。'
            : '\n※ このツアーでは現金を受け取りません。'
      );
  }

  return (
    '予約番号: ' + (data.bookingNumber || '') +
    '\n受付日時: ' + new Date().toLocaleString('ja-JP') +
    '\n\n【お客様情報】' +
    '\n名前: ' + (data.customerName || '') +
    '\nLINE名: ' + (data.lineDisplayName || '') +
    '\n電話: ' + (data.customerPhone || '') +
    '\n\n【予約内容】' +
    '\nプラン: ' + (options.planName || data.planName || '') +
    '\n参加日: ' + (data.selectedDate || '') +
    '\n時間: ' + (options.time || getBookingDisplayTime(data)) +
    '\n人数: ' + (headcount || '') +
    '\n売上: ' + formatYen(options.totalPrice) +
    (
      isSetComponent
        ? '（このツアー分の計上額）'
        : '（クーポン適用後・当日この金額を受け取る）'
    ) +
    '\nクーポン: ' + couponInfo +
    '\nスタッフ指名: ' + valueOrNone(staffName) +
    (
      options.originalPlanName
        ? '\n元プラン: ' + options.originalPlanName
        : ''
    ) +
    receiptBlock +
    (
      options.additionalNotes
        ? '\n\n' + options.additionalNotes
        : ''
    ) +
    '\n\n【参加者詳細】\n' +
    (participantsDetail || 'なし') +
    '\n\n【特別なご要望・アレルギー等】\n' +
    (data.specialRequests || 'なし')
  );
}

function addToCalendar(data, headcount) {
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);

  if (!calendar) {
    Logger.log('カレンダーが見つかりません: ' + CALENDAR_ID);
    return;
  }

  var dateParts = getCalendarDateParts_(data.selectedDate);

  if (!dateParts) {
    Logger.log('日付が不正のためカレンダー登録をスキップ');
    return;
  }

  // C3：海空セットを海亀・ドローンSUPの2予定として連続登録
  if (isSeaSkyComboBooking(data)) {
    var seaSkyTurtleTime = normalizeTime_(data.selectedTime);

    if (!seaSkyTurtleTime) {
      throw new Error(
        '海空セットのウミガメシュノーケル開始時間を取得できませんでした。'
      );
    }

    var seaSkySupTime = addMinutesToTime_(
      seaSkyTurtleTime,
      SEA_SKY_TURTLE_DURATION_MINUTES
    );

    if (!seaSkySupTime) {
      throw new Error(
        '海空セットのドローンSUP開始時間を作成できませんでした。'
      );
    }

    var seaSkyAmounts = getSeaSkyRowAmounts_(data);
    var seaSkyCouponDiscounts = getSeaSkyCouponDiscounts_(data);
    var seaSkyCustomerName = data.customerName || '名前なし';
    var seaSkyStaffName = data.staffName || '';
    var seaSkyTurtleEvent = null;

    var seaSkySetBreakdown = [
      {
        label: '🐢 ' + SEA_SKY_TURTLE_PLAN_NAME,
        time: seaSkyTurtleTime,
        amount: seaSkyAmounts.turtle
      },
      {
        label: '🛸 ' + SEA_SKY_SUP_PLAN_NAME,
        time: seaSkySupTime,
        amount: seaSkyAmounts.sup
      }
    ];

    var seaSkyFlowNote =
      '【海空セットの進行】\n' +
      '🐢 ウミガメシュノーケル：' +
      seaSkyTurtleTime +
      '〜' +
      addMinutesToTime_(seaSkyTurtleTime, SEA_SKY_TURTLE_DURATION_MINUTES) +
      '（90分）\n' +
      '🛸 ドローンSUP：' +
      seaSkySupTime +
      '〜' +
      addMinutesToTime_(seaSkySupTime, SEA_SKY_SUP_DURATION_MINUTES) +
      '（90分）\n' +
      '※ 海亀終了後、そのまま続けてドローンSUPを実施します。\n' +
      '※ 基本的に同じビーチで開催しますが、海況・水位により別ビーチになる場合があります。\n' +
      '※ 予約一覧は海亀・ドローンSUPの2行に分けて売上管理します。';

    try {
      seaSkyTurtleEvent = createCalendarTimedEvent_(
        calendar,
        dateParts,
        seaSkyTurtleTime,
        SEA_SKY_TURTLE_DURATION_MINUTES,
        'WEB 🐢 ' +
          SEA_SKY_TURTLE_PLAN_NAME +
          ' / ' +
          seaSkyCustomerName +
          ' / ' +
          headcount,
        buildCalendarDescription_(data, headcount, {
          planName: SEA_SKY_TURTLE_PLAN_NAME,
          time: seaSkyTurtleTime,
          totalPrice: seaSkyAmounts.turtle,
          couponDiscount: seaSkyCouponDiscounts.turtle,
          staffName: seaSkyStaffName,
          originalPlanName: data.planName || '',
          setBreakdown: seaSkySetBreakdown,
          setIndex: 0,
          additionalNotes: seaSkyFlowNote
        }),
        '2'
      );

      createCalendarTimedEvent_(
        calendar,
        dateParts,
        seaSkySupTime,
        SEA_SKY_SUP_DURATION_MINUTES,
        'WEB 🛸 ' +
          SEA_SKY_SUP_PLAN_NAME +
          ' / ' +
          seaSkyCustomerName +
          ' / ' +
          headcount,
        buildCalendarDescription_(data, headcount, {
          planName: SEA_SKY_SUP_PLAN_NAME,
          time: seaSkySupTime,
          totalPrice: seaSkyAmounts.sup,
          couponDiscount: seaSkyCouponDiscounts.sup,
          staffName: seaSkyStaffName,
          originalPlanName: data.planName || '',
          setBreakdown: seaSkySetBreakdown,
          setIndex: 1,
          additionalNotes: seaSkyFlowNote
        }),
        '6'
      );

    } catch (error) {
      if (seaSkyTurtleEvent) {
        try {
          seaSkyTurtleEvent.deleteEvent();
        } catch (deleteError) {
          Logger.log(
            '海空セット海亀カレンダーのロールバック失敗: ' +
            deleteError.message
          );
        }
      }

      throw error;
    }

    return;
  }

  // 昼夜セットは海亀・ヤシガニで別イベント
  if (isComboBooking(data)) {
    var turtleTime = normalizeTime_(data.selectedTime);
    var nightTime = extractComboNightTime(data);

    if (!turtleTime || !nightTime) {
      throw new Error(
        '昼夜セットの海亀またはヤシガニの時間を取得できませんでした。'
      );
    }

    var amounts = getComboRowAmounts_(data);
    var couponDiscounts = getComboCouponDiscounts_(data);
    var customerName = data.customerName || '名前なし';
    var originalStaffName = data.staffName || '';
    var turtleEvent = null;

    var comboSetBreakdown = [
      {
        label: '🐢 ' + COMBO_TURTLE_PLAN_NAME,
        time: turtleTime,
        amount: amounts.turtle
      },
      {
        label: '🦀 ' + COMBO_NIGHT_PLAN_NAME,
        time: nightTime,
        amount: amounts.night
      }
    ];

    try {
      turtleEvent = createCalendarTimedEvent_(
        calendar,
        dateParts,
        turtleTime,
        120,
        'WEB 🐢 ' +
          COMBO_TURTLE_PLAN_NAME +
          ' / ' +
          customerName +
          ' / ' +
          headcount,
        buildCalendarDescription_(data, headcount, {
          planName: COMBO_TURTLE_PLAN_NAME,
          time: turtleTime,
          totalPrice: amounts.turtle,
          couponDiscount: couponDiscounts.turtle,
          staffName: originalStaffName,
          originalPlanName: data.planName || '',
          setBreakdown: comboSetBreakdown,
          setIndex: 0
        }),
        '2'
      );

      createCalendarTimedEvent_(
        calendar,
        dateParts,
        nightTime,
        90,
        'WEB 🦀 ' +
          COMBO_NIGHT_PLAN_NAME +
          ' / ' +
          customerName +
          ' / ' +
          headcount,
        buildCalendarDescription_(data, headcount, {
          planName: COMBO_NIGHT_PLAN_NAME,
          time: nightTime,
          totalPrice: amounts.night,
          couponDiscount: couponDiscounts.night,
          staffName: originalStaffName,
          originalPlanName: data.planName || '',
          setBreakdown: comboSetBreakdown,
          setIndex: 1
        }),
        '8'
      );

    } catch (error) {
      if (turtleEvent) {
        try {
          turtleEvent.deleteEvent();
        } catch (deleteError) {
          Logger.log(
            '海亀カレンダーのロールバック失敗: ' +
            deleteError.message
          );
        }
      }

      throw error;
    }

    return;
  }

  // 通常予約
  var planName = data.planName || '';
  var time = normalizeTime_(data.selectedTime);

  var emoji = '🐢';
  var prefix = 'WEB';
  var color = '2';
  var isNightTour =
    planName.indexOf('ナイトツアー') !== -1 ||
    planName.indexOf('ヤシガニ探検') !== -1;

  // 絵文字・色は「何のツアーか」、prefixは「貸切かどうか」で決める。
  // 以前は else-if で繋がっていたため、貸切のSUPプラン（【貸切】ドローンSUP・
  // 【貸切】サンセットSUP）がSUPの枝で止まり WEB VIP が付かなかった。
  if (isNightTour) {
    emoji = '🦀';
    color = '8';

  } else if (planName.indexOf('SUP') !== -1) {
    emoji = '🏄';
    color = '6';
  }

  if (
    planName.indexOf('VIP') !== -1 ||
    planName.indexOf('貸切') !== -1
  ) {
    prefix = 'WEB VIP';
  }

  var title =
    prefix +
    ' ' +
    emoji +
    ' ' +
    planName +
    ' / ' +
    (data.customerName || '名前なし') +
    ' / ' +
    headcount;

  var description = buildCalendarDescription_(data, headcount, {
    planName: planName,
    time: time || getBookingDisplayTime(data),
    totalPrice: data.totalPrice || 0,
    couponDiscount: data.couponDiscount || 0,
    staffName: data.staffName || ''
  });

  if (!time) {
    var allDayEvent = calendar.createAllDayEvent(
      title,
      new Date(dateParts.year, dateParts.month, dateParts.day),
      {
        description: description,
        location: '宮古島'
      }
    );

    allDayEvent.setColor(color);
    Logger.log('カレンダー登録完了: ' + title);

    return;
  }

  createCalendarTimedEvent_(
    calendar,
    dateParts,
    time,
    isNightTour ? NIGHT_TOUR_DURATION_MINUTES : 120,
    title,
    description,
    color
  );
}

// ============================================================
// 編集トリガー
// ============================================================

function onSheetEdit(e) {
  if (!e || !e.range) {
    Logger.log('onSheetEdit はシート編集トリガーから実行してください');
    return;
  }

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

    if (col === COLUMNS.BOOKING_STATUS) {
      handleBookingStatusEdit_(sheet, range, row);
      return;
    }

    if (col === COLUMNS.LOCATION) {
      handleLocationEdit_(sheet, range, row);
      return;
    }

    if (col === COLUMNS.LINE_SEND) {
      handleFreeLineMessageEdit_(sheet, range, row);
      return;
    }

  } finally {
    lock.releaseLock();
  }
}

function getSplitComboRows_(sheet, bookingNumber) {
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return {
      turtle: null,
      night: null
    };
  }

  var values = sheet
    .getRange(2, 1, lastRow - 1, COLUMNS.LINE_SEND)
    .getValues();

  var result = {
    turtle: null,
    night: null
  };

  for (var i = 0; i < values.length; i++) {
    var rowValues = values[i];

    if (
      String(rowValues[COLUMNS.BOOKING_NUM - 1]) !==
      String(bookingNumber)
    ) {
      continue;
    }

    var planName = String(
      rowValues[COLUMNS.PLAN - 1] || ''
    ).trim();

    var rowInfo = {
      row: i + 2,
      values: rowValues,
      time: formatTime(rowValues[COLUMNS.TIME - 1]),
      price: toNumber_(rowValues[COLUMNS.TOTAL_PRICE - 1]),
      couponDiscount: toNumber_(
        rowValues[COLUMNS.COUPON_DISCOUNT - 1]
      )
    };

    if (planName === COMBO_TURTLE_PLAN_NAME) {
      result.turtle = rowInfo;
    }

    if (planName === COMBO_NIGHT_PLAN_NAME) {
      result.night = rowInfo;
    }
  }

  return result;
}

function syncSplitComboStatus_(sheet, comboRows, status) {
  if (comboRows.turtle) {
    sheet
      .getRange(comboRows.turtle.row, COLUMNS.BOOKING_STATUS)
      .setValue(status);
  }

  if (comboRows.night) {
    sheet
      .getRange(comboRows.night.row, COLUMNS.BOOKING_STATUS)
      .setValue(status);
  }
}

function getSplitComboConfirmMessage_(comboRows) {
  if (!comboRows.turtle || !comboRows.night) return null;

  var values = comboRows.turtle.values;

  var customerName = String(values[COLUMNS.NAME - 1] || '');
  var bookingNumber = String(values[COLUMNS.BOOKING_NUM - 1] || '');
  var selectedDate = formatDate(values[COLUMNS.DATE - 1]);
  var headcount = String(values[COLUMNS.HEADCOUNT - 1] || '');
  var phone = String(values[COLUMNS.PHONE - 1] || '');
  var lineName = String(values[COLUMNS.LINE_NAME - 1] || '');
  var participantsDetail = String(
    values[COLUMNS.PARTICIPANTS - 1] || 'なし'
  );
  var couponCode = String(values[COLUMNS.COUPON_CODE - 1] || '');

  var totalPrice =
    comboRows.turtle.price +
    comboRows.night.price;

  var couponDiscount =
    comboRows.turtle.couponDiscount +
    comboRows.night.couponDiscount;

  return (
    '🐢🦀 ご予約が確定しました！\n\n' +
    customerName + ' 様\n\n' +
    '以下の内容でご予約を確定いたしました。\n' +
    '内容にお間違いがないかご確認ください。\n\n' +
    '【ご予約内容】\n' +
    '予約番号：' + bookingNumber + '\n' +
    'プラン：ウミガメシュノーケル＆ヤシガニ探検 昼夜セット\n' +
    '🐢 ウミガメシュノーケル：' +
    valueOrNone(comboRows.turtle.time) +
    '\n' +
    '🦀 ヤシガニ探検：' +
    valueOrNone(comboRows.night.time) +
    '\n' +
    '参加日：' + selectedDate + '\n' +
    '人数：' + valueOrNone(headcount) + '\n' +
    '合計金額：' + formatYen(totalPrice) + '\n' +
    'クーポン：' +
    formatCouponInfo(couponCode, couponDiscount) +
    '\n\n' +
    '【お客様情報】\n' +
    '電話番号：' + valueOrNone(phone) + '\n' +
    'LINE名：' + valueOrNone(lineName) + '\n\n' +
    '【参加者詳細】\n' +
    valueOrNone(participantsDetail) + '\n\n' +
    '【集合場所のご案内】\n' +
    '・ウミガメシュノーケル：前日にLINEでご連絡します\n' +
    '・ヤシガニ探検：当日にLINEでご連絡します\n\n' +
    '【当日の持ち物】\n' +
    '〔昼・ウミガメ〕水着・タオル・酔い止め（必要な方）\n' +
    '〔夜・ヤシガニ探検〕虫よけスプレー・歩きやすい靴（サンダル不可）・飲み物\n\n' +
    '【キャンセルポリシー】\n' +
    '前日まで：無料\n' +
    '当日：100%\n\n' +
    'ご不明な点はお気軽にご連絡ください。\n' +
    '海亀兄弟'
  );
}

function getComboLineSentKey_(bookingNumber, status) {
  return (
    'COMBO_LINE_SENT_' +
    String(bookingNumber || '') +
    '_' +
    String(status || '')
  );
}

function getSplitSeaSkyRows_(sheet, bookingNumber) {
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return {
      turtle: null,
      sup: null
    };
  }

  var values = sheet
    .getRange(2, 1, lastRow - 1, COLUMNS.LINE_SEND)
    .getValues();

  var result = {
    turtle: null,
    sup: null
  };

  for (var i = 0; i < values.length; i++) {
    var rowValues = values[i];

    if (
      String(rowValues[COLUMNS.BOOKING_NUM - 1]) !==
      String(bookingNumber)
    ) {
      continue;
    }

    var planName = String(
      rowValues[COLUMNS.PLAN - 1] || ''
    ).trim();

    var rowInfo = {
      row: i + 2,
      values: rowValues,
      time: formatTime(rowValues[COLUMNS.TIME - 1]),
      price: toNumber_(rowValues[COLUMNS.TOTAL_PRICE - 1]),
      couponDiscount: toNumber_(
        rowValues[COLUMNS.COUPON_DISCOUNT - 1]
      )
    };

    if (planName === SEA_SKY_TURTLE_PLAN_NAME) {
      result.turtle = rowInfo;
    }

    if (planName === SEA_SKY_SUP_PLAN_NAME) {
      result.sup = rowInfo;
    }
  }

  return result;
}

function syncSplitSeaSkyStatus_(sheet, seaSkyRows, status) {
  if (seaSkyRows.turtle) {
    sheet
      .getRange(seaSkyRows.turtle.row, COLUMNS.BOOKING_STATUS)
      .setValue(status);
  }

  if (seaSkyRows.sup) {
    sheet
      .getRange(seaSkyRows.sup.row, COLUMNS.BOOKING_STATUS)
      .setValue(status);
  }
}

function getSplitSeaSkyConfirmMessage_(seaSkyRows) {
  if (!seaSkyRows.turtle || !seaSkyRows.sup) return null;

  var values = seaSkyRows.turtle.values;
  var customerName = String(values[COLUMNS.NAME - 1] || '');
  var bookingNumber = String(values[COLUMNS.BOOKING_NUM - 1] || '');
  var selectedDate = formatDate(values[COLUMNS.DATE - 1]);
  var headcount = String(values[COLUMNS.HEADCOUNT - 1] || '');
  var phone = String(values[COLUMNS.PHONE - 1] || '');
  var lineName = String(values[COLUMNS.LINE_NAME - 1] || '');
  var participantsDetail = String(
    values[COLUMNS.PARTICIPANTS - 1] || 'なし'
  );
  var couponCode = String(values[COLUMNS.COUPON_CODE - 1] || '');

  var totalPrice = seaSkyRows.turtle.price + seaSkyRows.sup.price;
  var couponDiscount =
    seaSkyRows.turtle.couponDiscount +
    seaSkyRows.sup.couponDiscount;

  return (
    '🐢🛸 ご予約が確定しました！\n\n' +
    customerName + ' 様\n\n' +
    '以下の内容でご予約を確定いたしました。\n' +
    '内容にお間違いがないかご確認ください。\n\n' +
    '【ご予約内容】\n' +
    '予約番号：' + bookingNumber + '\n' +
    'プラン：ウミガメシュノーケル＆ドローンSUP 海空セット\n' +
    '🐢 ウミガメシュノーケル：' +
    valueOrNone(seaSkyRows.turtle.time) +
    '〜 約1.5時間\n' +
    '🛸 ドローンSUP：' +
    valueOrNone(seaSkyRows.sup.time) +
    '〜 約1.5時間\n' +
    '参加日：' + selectedDate + '\n' +
    '人数：' + valueOrNone(headcount) + '\n' +
    '合計金額：' + formatYen(totalPrice) + '\n' +
    'クーポン：' +
    formatCouponInfo(couponCode, couponDiscount) +
    '\n\n' +
    '【お客様情報】\n' +
    '電話番号：' + valueOrNone(phone) + '\n' +
    'LINE名：' + valueOrNone(lineName) + '\n\n' +
    '【参加者詳細】\n' +
    valueOrNone(participantsDetail) + '\n\n' +
    '【開催場所について】\n' +
    '基本的に同じビーチで、ウミガメシュノーケル終了後そのまま続けてドローンSUPを開催します。\n' +
    '海況・水位によっては、ドローンSUPを別のビーチで開催する場合があります。\n' +
    '集合場所は前日にLINEでご連絡いたします。\n\n' +
    '【当日の持ち物】\n' +
    '・水着（着替えは現地でできます）\n' +
    '・タオル\n' +
    '・酔い止め（必要な方）\n\n' +
    '【キャンセルポリシー】\n' +
    '前日まで：無料\n' +
    '当日：100%\n\n' +
    'ご不明な点はお気軽にご連絡ください。\n' +
    '海亀兄弟'
  );
}

function getSeaSkyLineSentKey_(bookingNumber, status) {
  return (
    'SEA_SKY_LINE_SENT_' +
    String(bookingNumber || '') +
    '_' +
    String(status || '')
  );
}

function handleBookingStatusEdit_(sheet, range, row) {
  var status = range.getValue();

  if (status !== '確定' && status !== '満席') return;

  var lineUserId = sheet
    .getRange(row, COLUMNS.LINE_USER_ID)
    .getValue();

  if (!lineUserId) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'LINE User ID が未登録のため通知をスキップしました',
      '注意',
      3
    );
    return;
  }

  var customerName = String(
    sheet.getRange(row, COLUMNS.NAME).getValue()
  );

  var bookingNumber = String(
    sheet.getRange(row, COLUMNS.BOOKING_NUM).getValue()
  );

  var planName = String(
    sheet.getRange(row, COLUMNS.PLAN).getValue()
  );

  var selectedDate = formatDate(
    sheet.getRange(row, COLUMNS.DATE).getValue()
  );

  var selectedTime = formatTime(
    sheet.getRange(row, COLUMNS.TIME).getValue()
  );

  var message = '';
  var lineSentKey = '';

  // 海空セット
  if (isSplitSeaSkyPlanName_(planName)) {
    var seaSkyRows = getSplitSeaSkyRows_(sheet, bookingNumber);

    if (!seaSkyRows.turtle || !seaSkyRows.sup) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        '海空セットの片方の行が見つかりません。予約番号を確認してください。',
        'エラー',
        5
      );
      return;
    }

    syncSplitSeaSkyStatus_(sheet, seaSkyRows, status);

    lineSentKey = getSeaSkyLineSentKey_(bookingNumber, status);

    if (
      PropertiesService
        .getScriptProperties()
        .getProperty(lineSentKey)
    ) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'この海空セットの' +
        status +
        'LINEは送信済みです。再送はS列から行ってください。',
        '送信済み',
        4
      );
      return;
    }

    if (status === '確定') {
      message = getSplitSeaSkyConfirmMessage_(seaSkyRows);

    } else {
      message = getFullMessage(
        customerName,
        bookingNumber,
        'ウミガメシュノーケル＆ドローンSUP 海空セット',
        selectedDate,
        seaSkyRows.turtle.time +
        ' / ' +
        seaSkyRows.sup.time
      );
    }

  // 昼夜セット
  } else if (isSplitComboPlanName(planName)) {
    var comboRows = getSplitComboRows_(sheet, bookingNumber);

    if (!comboRows.turtle || !comboRows.night) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        '昼夜セットの片方の行が見つかりません。予約番号を確認してください。',
        'エラー',
        5
      );
      return;
    }

    syncSplitComboStatus_(sheet, comboRows, status);

    lineSentKey = getComboLineSentKey_(bookingNumber, status);

    if (
      PropertiesService
        .getScriptProperties()
        .getProperty(lineSentKey)
    ) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'この昼夜セットの' +
        status +
        'LINEは送信済みです。再送はS列から行ってください。',
        '送信済み',
        4
      );
      return;
    }

    if (status === '確定') {
      message = getSplitComboConfirmMessage_(comboRows);

    } else {
      message = getFullMessage(
        customerName,
        bookingNumber,
        'ウミガメシュノーケル＆ヤシガニ探検 昼夜セット',
        selectedDate,
        comboRows.turtle.time +
        ' / ' +
        comboRows.night.time
      );
    }

  } else {
    var confirmDetails = {
      totalPrice:
        sheet.getRange(row, COLUMNS.TOTAL_PRICE).getValue() || 0,
      phone: String(
        sheet.getRange(row, COLUMNS.PHONE).getValue()
      ),
      headcount: String(
        sheet.getRange(row, COLUMNS.HEADCOUNT).getValue()
      ),
      participantsDetail: String(
        sheet.getRange(row, COLUMNS.PARTICIPANTS).getValue() ||
        'なし'
      ),
      lineName: String(
        sheet.getRange(row, COLUMNS.LINE_NAME).getValue()
      ),
      staffName: String(
        sheet.getRange(row, COLUMNS.STAFF).getValue() ||
        '指名なし'
      ),
      couponCode: String(
        sheet.getRange(row, COLUMNS.COUPON_CODE).getValue()
      ),
      couponDiscount:
        sheet.getRange(row, COLUMNS.COUPON_DISCOUNT).getValue() ||
        0
    };

    if (status === '確定') {
      message = getConfirmMessage(
        planName,
        customerName,
        bookingNumber,
        selectedDate,
        selectedTime,
        confirmDetails
      );

    } else {
      message = getFullMessage(
        customerName,
        bookingNumber,
        planName,
        selectedDate,
        selectedTime
      );
    }
  }

  if (!message) return;

  var sent = sendLineNotify(
    {
      lineUserId: String(lineUserId),
      customMessage: message
    },
    row
  );

  if (sent && lineSentKey) {
    PropertiesService.getScriptProperties().setProperty(
      lineSentKey,
      new Date().toISOString()
    );
  }
}

function handleLocationEdit_(sheet, range, row) {
  var location = range.getValue();

  if (!location) return;

  var lineUserId = sheet
    .getRange(row, COLUMNS.LINE_USER_ID)
    .getValue();

  if (!lineUserId) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'LINE User ID が未登録のため通知をスキップしました',
      '注意',
      3
    );
    return;
  }

  var selectedTime = formatTime(
    sheet.getRange(row, COLUMNS.TIME).getValue()
  );

  var locationMessage = getLocationMessage(
    location,
    selectedTime
  );

  if (!locationMessage) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '場所のメッセージが見つかりません: ' + location,
      'エラー',
      5
    );
    return;
  }

  sendLineNotify(
    {
      lineUserId: String(lineUserId),
      customMessage: locationMessage
    },
    row
  );
}

function handleFreeLineMessageEdit_(sheet, range, row) {
  var messageText = range.getValue();

  if (!messageText) return;
  if (String(messageText).indexOf('✅ 送信済') === 0) return;

  var lineUserId = sheet
    .getRange(row, COLUMNS.LINE_USER_ID)
    .getValue();

  if (!lineUserId) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'LINE User ID が未登録のため送信できません',
      '注意',
      3
    );
    return;
  }

  var customerName = String(
    sheet.getRange(row, COLUMNS.NAME).getValue()
  );

  var ok = sendLineNotify(
    {
      lineUserId: String(lineUserId),
      customMessage: String(messageText)
    },
    row
  );

  if (!ok) return;

  var now = new Date().toLocaleString('ja-JP');

  range.setValue(
    '✅ 送信済 ' +
    now +
    '\n' +
    messageText
  );

  range.setBackground('#d9ead3');

  SpreadsheetApp.getActiveSpreadsheet().toast(
    customerName + ' 様にLINEを送信しました',
    '完了',
    3
  );
}

// ============================================================
// LINE通知送信
// ============================================================

function getNotifySecret_() {
  try {
    var storedSecret = PropertiesService
      .getScriptProperties()
      .getProperty('NOTIFY_SECRET');

    return storedSecret || NOTIFY_SECRET || '';

  } catch (error) {
    return NOTIFY_SECRET || '';
  }
}

function sendLineNotify(payload, row) {
  try {
    var notifySecret = getNotifySecret_();

    if (!notifySecret) {
      throw new Error(
        'NOTIFY_SECRET が未設定です。スクリプトプロパティに NOTIFY_SECRET を登録してください。'
      );
    }

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + notifySecret
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(
      NOTIFY_API_URL,
      options
    );

    var code = response.getResponseCode();
    var body = response.getContentText();

    Logger.log(
      'LINE通知 row ' +
      row +
      ': status=' +
      code +
      ' body=' +
      body
    );

    if (code !== 200) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'LINE通知送信失敗: ' + body,
        'エラー',
        5
      );

      return false;
    }

    SpreadsheetApp.getActiveSpreadsheet().toast(
      'LINE通知を送信しました',
      '完了',
      3
    );

    return true;

  } catch (error) {
    Logger.log('LINE通知エラー: ' + error.message);

    SpreadsheetApp.getActiveSpreadsheet().toast(
      'LINE通知エラー: ' + error.message,
      'エラー',
      5
    );

    return false;
  }
}

// ============================================================
// メニュー
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🐢 海亀兄弟')
    .addItem('シートを初期化する', 'setupSheet')
    .addToUi();
}// ============================================================
// C5 / C6 追加拡張
// ウミガメシュノーケル＋ドローンSUP＋ナイトツアー まるごと1日セット
// ============================================================

var C5C6_NORMAL_PLAN_ID = 'C5';
var C5C6_PRIVATE_PLAN_ID = 'C6';

var C5C6_NORMAL_PLAN_NAME =
  'ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット';

var C5C6_PRIVATE_PLAN_NAME =
  '【貸切】ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット';

var C5C6_TURTLE_PLAN_NAME = 'まるごと1日セット海亀';
var C5C6_SUP_PLAN_NAME = 'まるごと1日セットドローンSUP';
var C5C6_NIGHT_PLAN_NAME = 'まるごと1日セットヤシガニ';

var C5C6_PRIVATE_TURTLE_PLAN_NAME = '貸切まるごと1日セット海亀';
var C5C6_PRIVATE_SUP_PLAN_NAME = '貸切まるごと1日セットドローンSUP';
var C5C6_PRIVATE_NIGHT_PLAN_NAME = '貸切まるごと1日セットヤシガニ';

var C5C6_TURTLE_DURATION_MINUTES = 90;
var C5C6_SUP_DURATION_MINUTES = 90;
var C5C6_NIGHT_DURATION_MINUTES = 90;

function c5c6GetPlanId_(data) {
  return bookingPlanId_(data);
}

function c5c6IsTriplePlanName_(planName) {
  var plan = String(planName || '');

  return plan.indexOf('まるごと1日セット') !== -1 &&
    plan.indexOf('ドローンSUP') !== -1 &&
    (
      plan.indexOf('ナイトツアー') !== -1 ||
      plan.indexOf('ヤシガニ') !== -1
    );
}

function c5c6IsTripleBooking_(data) {
  var planId = c5c6GetPlanId_(data);

  if (planId) {
    return planId === C5C6_NORMAL_PLAN_ID || planId === C5C6_PRIVATE_PLAN_ID;
  }

  var plan = String(data && data.planName || '');
  var requests = String(data && data.specialRequests || '');

  return c5c6IsTriplePlanName_(plan) ||
    (
      requests.indexOf('[COMBO booking]') !== -1 &&
      requests.indexOf('ドローンSUP') !== -1 &&
      (
        requests.indexOf('ナイト') !== -1 ||
        requests.indexOf('ヤシガニ') !== -1
      )
    );
}

function c5c6IsPrivateTriple_(data) {
  data = data || {};

  var planId = c5c6GetPlanId_(data);
  if (planId === C5C6_PRIVATE_PLAN_ID) return true;
  if (planId === C5C6_NORMAL_PLAN_ID) return false;

  var hints = [
    data.planName,
    data.specialRequests,
    data.planType,
    data.packageType,
    data.selectedPlanType,
    data.courseType
  ].join(' ');

  return /(貸切|プライベート|private)/i.test(hints);
}

function c5c6GetLabels_(data) {
  if (c5c6IsPrivateTriple_(data)) {
    return {
      turtle: C5C6_PRIVATE_TURTLE_PLAN_NAME,
      sup: C5C6_PRIVATE_SUP_PLAN_NAME,
      night: C5C6_PRIVATE_NIGHT_PLAN_NAME,
      display: C5C6_PRIVATE_PLAN_NAME,
      isPrivate: true
    };
  }

  return {
    turtle: C5C6_TURTLE_PLAN_NAME,
    sup: C5C6_SUP_PLAN_NAME,
    night: C5C6_NIGHT_PLAN_NAME,
    display: C5C6_NORMAL_PLAN_NAME,
    isPrivate: false
  };
}

function c5c6SplitThreeWays_(amount) {
  var total = Math.round(toNumber_(amount));
  var turtle = Math.floor(total / 3);
  var sup = Math.floor((total - turtle) / 2);
  var night = total - turtle - sup;

  return {
    turtle: turtle,
    sup: sup,
    night: night,
    total: total
  };
}

function c5c6NormalizeBreakdown_(breakdown, totalValue) {
  if (!breakdown || typeof breakdown !== 'object') return null;

  var turtle = toNumber_(breakdown.turtle);
  var sup = toNumber_(breakdown.sup);
  var night = toNumber_(breakdown.night);
  var sum = turtle + sup + night;
  var target = Math.round(toNumber_(totalValue));

  if (sum <= 0) return null;
  if (target && Math.abs(sum - target) > 1) return null;

  return {
    turtle: turtle,
    sup: sup,
    night: night,
    total: sum
  };
}

function c5c6GetAmounts_(data) {
  data = data || {};

  var breakdown = c5c6NormalizeBreakdown_(
    data.triplePriceBreakdown ||
      data.componentPriceBreakdown ||
      data.priceBreakdown,
    data.totalPrice
  );

  return breakdown || c5c6SplitThreeWays_(data.totalPrice);
}

function c5c6GetCouponDiscounts_(data) {
  data = data || {};

  var breakdown = c5c6NormalizeBreakdown_(
    data.tripleCouponBreakdown ||
      data.componentCouponBreakdown ||
      data.couponBreakdown,
    data.couponDiscount
  );

  return breakdown || c5c6SplitThreeWays_(data.couponDiscount);
}

function c5c6IsSplitPlanName_(planName) {
  var plan = String(planName || '').trim();

  return plan === C5C6_TURTLE_PLAN_NAME ||
    plan === C5C6_SUP_PLAN_NAME ||
    plan === C5C6_NIGHT_PLAN_NAME ||
    plan === C5C6_PRIVATE_TURTLE_PLAN_NAME ||
    plan === C5C6_PRIVATE_SUP_PLAN_NAME ||
    plan === C5C6_PRIVATE_NIGHT_PLAN_NAME;
}

function c5c6GetNightTime_(data) {
  return extractComboNightTime(data);
}

// ============================================================
// 既存C3処理を保持して、C5/C6だけを追加
// ============================================================

var C5C6_ORIGINAL_IS_SEA_SKY_BOOKING = isSeaSkyComboBooking;
var C5C6_ORIGINAL_IS_COMBO_BOOKING = isComboBooking;
var C5C6_ORIGINAL_GET_BOOKING_DISPLAY_TIME = getBookingDisplayTime;
var C5C6_ORIGINAL_SEND_BOOKING_EMAIL = sendBookingEmail;
var C5C6_ORIGINAL_DO_POST = doPost;
var C5C6_ORIGINAL_ADD_TO_CALENDAR = addToCalendar;
var C5C6_ORIGINAL_HANDLE_BOOKING_STATUS = handleBookingStatusEdit_;

isSeaSkyComboBooking = function(data) {
  if (c5c6IsTripleBooking_(data)) return false;

  return C5C6_ORIGINAL_IS_SEA_SKY_BOOKING(data);
};

isComboBooking = function(data) {
  if (c5c6IsTripleBooking_(data)) return false;

  return C5C6_ORIGINAL_IS_COMBO_BOOKING(data);
};

getBookingDisplayTime = function(data) {
  if (!c5c6IsTripleBooking_(data)) {
    return C5C6_ORIGINAL_GET_BOOKING_DISPLAY_TIME(data);
  }

  var turtleTime =
    normalizeTime_(data && data.selectedTime) ||
    String(data && data.selectedTime || '');

  var supTime = addMinutesToTime_(
    turtleTime,
    C5C6_TURTLE_DURATION_MINUTES
  );

  var nightTime = c5c6GetNightTime_(data);
  var times = [turtleTime];

  if (supTime) times.push(supTime);
  if (nightTime) times.push(nightTime);

  return times.join(' / ');
};

sendBookingEmail = function(data, headcount, participantsDetail) {
  if (!c5c6IsTripleBooking_(data)) {
    return C5C6_ORIGINAL_SEND_BOOKING_EMAIL(
      data,
      headcount,
      participantsDetail
    );
  }

  try {
    var turtleTime = normalizeTime_(data.selectedTime);
    var supTime = addMinutesToTime_(
      turtleTime,
      C5C6_TURTLE_DURATION_MINUTES
    );
    var nightTime = c5c6GetNightTime_(data);
    var labels = c5c6GetLabels_(data);
    var amounts = c5c6GetAmounts_(data);
    var coupons = c5c6GetCouponDiscounts_(data);
    var displayTime = getBookingDisplayTime(data);

    var subject =
      '【仮予約通知】' +
      (data.customerName || '') +
      ' 様 / ' +
      (data.selectedDate || '') +
      ' ' +
      displayTime;

    var body =
      '新しい仮予約が入りました。\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '予約番号：' + (data.bookingNumber || '') + '\n' +
      '受付日時：' + new Date().toLocaleString('ja-JP') + '\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '【お客様情報】\n' +
      '名前　　：' + (data.customerName || '') + '\n' +
      '電話　　：' + (data.customerPhone || '') + '\n' +
      'メール　：' + (data.customerEmail || '') + '\n' +
      'LINE名　：' + (data.lineDisplayName || '') + '\n\n' +
      '【予約内容】\n' +
      'プラン　　：' + labels.display + '\n' +
      '参加日　　：' + (data.selectedDate || '') + '\n' +
      '時間　　　：' + displayTime + '\n' +
      '人数　　　：' + headcount + '\n' +
      formatReceiveTotalLines_(data) +
      'クーポン　：' + formatCouponInfo(data.couponCode, data.couponDiscount) + '\n' +
      'スタッフ指名：' + (data.staffName || '指名なし') + '\n\n' +
      '【まるごと1日セット売上内訳】※各金額はクーポン適用後\n' +
      labels.turtle + '：' + turtleTime + '〜 約1.5時間 / ' +
      formatYen(amounts.turtle) +
      '（クーポン適用済 -' + formatYen(coupons.turtle) + '）\n' +
      labels.sup + '：' + supTime + '〜 約1.5時間 / ' +
      formatYen(amounts.sup) +
      '（クーポン適用済 -' + formatYen(coupons.sup) + '）\n' +
      labels.night + '：' + (nightTime || '未入力') + '〜 約1.5時間 / ' +
      formatYen(amounts.night) +
      '（クーポン適用済 -' + formatYen(coupons.night) + '）\n' +
      formatBreakdownTotalLine_([
        amounts.turtle,
        amounts.sup,
        amounts.night
      ]) + '\n' +
      '【参加者詳細】\n' +
      participantsDetail + '\n\n' +
      '【特別なご要望・アレルギー等】\n' +
      (data.specialRequests || 'なし') + '\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      'M列の予約状態を変更後、U列の内容を確認してT列をチェックするとLINE通知が送信されます。\n' +
      '━━━━━━━━━━━━━━━━━━━━';

    GmailApp.sendEmail(ADMIN_EMAIL, subject, body);
    Logger.log('まるごと1日セット仮予約メール送信完了: ' + subject);

  } catch (error) {
    Logger.log('まるごと1日セット仮予約メール送信エラー: ' + error.message);
  }
};

// ============================================================
// C5/C6予約保存：3行作成
// ============================================================

doPost = function(e) {
  var data;

  try {
    data = JSON.parse(e.postData.contents);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: '予約データの読み込みに失敗しました。'
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  if (!c5c6IsTripleBooking_(data)) {
    return C5C6_ORIGINAL_DO_POST(e);
  }

  try {
    var sheet = getOrCreateSheet();

    var turtleTime = normalizeTime_(data.selectedTime);
    var supTime = addMinutesToTime_(
      turtleTime,
      C5C6_TURTLE_DURATION_MINUTES
    );
    var nightTime = c5c6GetNightTime_(data);

    if (!turtleTime || !supTime || !nightTime) {
      throw new Error(
        'まるごと1日セットの開始時間を取得できませんでした。' +
        ' 海亀=' + (data.selectedTime || '未入力') +
        ' / SUP=' + (supTime || '未取得') +
        ' / ナイト=' + (nightTime || '未取得')
      );
    }

    var headcount =
      '大人' + (data.adultCount || 0) + '名 / ' +
      '子供' + (data.childCount || 0) + '名 / ' +
      '3歳未満' + (data.under3Count || 0) + '名';

    var participantsDetail = buildParticipantsDetail(data.participants);
    var timestamp = new Date();
    var labels = c5c6GetLabels_(data);
    var amounts = c5c6GetAmounts_(data);
    var coupons = c5c6GetCouponDiscounts_(data);
    var staffName = data.staffName || '';

    var rows = [
      buildBookingRow_(timestamp, data, headcount, participantsDetail, {
        time: turtleTime,
        planName: labels.turtle,
        totalPrice: amounts.turtle,
        staffName: staffName,
        couponDiscount: coupons.turtle
      }),
      buildBookingRow_(timestamp, data, headcount, participantsDetail, {
        time: supTime,
        planName: labels.sup,
        totalPrice: amounts.sup,
        staffName: staffName,
        couponDiscount: coupons.sup
      }),
      buildBookingRow_(timestamp, data, headcount, participantsDetail, {
        time: nightTime,
        planName: labels.night,
        totalPrice: amounts.night,
        staffName: staffName,
        couponDiscount: coupons.night
      })
    ];

    var created = writeBookingRows_(sheet, rows);

    if (!created) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          duplicate: true,
          bookingNumber: data.bookingNumber
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    try {
      addToCalendar(data, headcount);
    } catch (calendarError) {
      Logger.log(
        'まるごと1日セットのカレンダー登録エラー: ' +
        calendarError.message
      );
    }

    sendBookingEmail(data, headcount, participantsDetail);

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        bookingNumber: data.bookingNumber
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('C5/C6 doPost エラー: ' + error.message);

    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.message
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
};

// ============================================================
// C5/C6カレンダー：海亀90分 → SUP90分 → ナイト90分
// ============================================================

addToCalendar = function(data, headcount) {
  if (!c5c6IsTripleBooking_(data)) {
    return C5C6_ORIGINAL_ADD_TO_CALENDAR(data, headcount);
  }

  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);

  if (!calendar) {
    Logger.log('カレンダーが見つかりません: ' + CALENDAR_ID);
    return;
  }

  var dateParts = getCalendarDateParts_(data.selectedDate);

  if (!dateParts) {
    Logger.log('日付が不正のためカレンダー登録をスキップ');
    return;
  }

  var turtleTime = normalizeTime_(data.selectedTime);
  var supTime = addMinutesToTime_(
    turtleTime,
    C5C6_TURTLE_DURATION_MINUTES
  );
  var nightTime = c5c6GetNightTime_(data);

  if (!turtleTime || !supTime || !nightTime) {
    throw new Error(
      'まるごと1日セットの時間を取得できませんでした。'
    );
  }

  var labels = c5c6GetLabels_(data);
  var amounts = c5c6GetAmounts_(data);
  var coupons = c5c6GetCouponDiscounts_(data);
  var customerName = data.customerName || '名前なし';
  var staffName = data.staffName || '';
  var prefix = labels.isPrivate ? 'WEB VIP' : 'WEB';
  var createdEvents = [];

  var tripleSetBreakdown = [
    { label: '🐢 ' + labels.turtle, time: turtleTime, amount: amounts.turtle },
    { label: '🛸 ' + labels.sup, time: supTime, amount: amounts.sup },
    { label: '🦀 ' + labels.night, time: nightTime, amount: amounts.night }
  ];

  var flowNote =
    '【まるごと1日セットの進行】\n' +
    '🐢 ウミガメシュノーケル：' + turtleTime + '〜' +
    addMinutesToTime_(
      turtleTime,
      C5C6_TURTLE_DURATION_MINUTES
    ) + '（90分）\n' +
    '🛸 ドローンSUP：' + supTime + '〜' +
    addMinutesToTime_(
      supTime,
      C5C6_SUP_DURATION_MINUTES
    ) + '（90分）\n' +
    '🦀 ナイトツアー：' + nightTime + '〜' +
    addMinutesToTime_(
      nightTime,
      C5C6_NIGHT_DURATION_MINUTES
    ) + '（90分）\n' +
    '※ 海亀終了後、そのままドローンSUPを続けて開催します。\n' +
    '※ ドローンSUPは海況・水位により別のビーチで開催する場合があります。\n' +
    '※ ナイトツアーの集合場所は当日にLINEでご連絡します。';

  try {
    createdEvents.push(
      createCalendarTimedEvent_(
        calendar,
        dateParts,
        turtleTime,
        C5C6_TURTLE_DURATION_MINUTES,
        prefix + ' 🐢 ' + labels.turtle +
          ' / ' + customerName +
          ' / ' + headcount,
        buildCalendarDescription_(data, headcount, {
          planName: labels.turtle,
          time: turtleTime,
          totalPrice: amounts.turtle,
          couponDiscount: coupons.turtle,
          staffName: staffName,
          originalPlanName: labels.display,
          setBreakdown: tripleSetBreakdown,
          setIndex: 0,
          additionalNotes: flowNote
        }),
        '2'
      )
    );

    createdEvents.push(
      createCalendarTimedEvent_(
        calendar,
        dateParts,
        supTime,
        C5C6_SUP_DURATION_MINUTES,
        prefix + ' 🛸 ' + labels.sup +
          ' / ' + customerName +
          ' / ' + headcount,
        buildCalendarDescription_(data, headcount, {
          planName: labels.sup,
          time: supTime,
          totalPrice: amounts.sup,
          couponDiscount: coupons.sup,
          staffName: staffName,
          originalPlanName: labels.display,
          setBreakdown: tripleSetBreakdown,
          setIndex: 1,
          additionalNotes: flowNote
        }),
        '6'
      )
    );

    createdEvents.push(
      createCalendarTimedEvent_(
        calendar,
        dateParts,
        nightTime,
        C5C6_NIGHT_DURATION_MINUTES,
        prefix + ' 🦀 ' + labels.night +
          ' / ' + customerName +
          ' / ' + headcount,
        buildCalendarDescription_(data, headcount, {
          planName: labels.night,
          time: nightTime,
          totalPrice: amounts.night,
          couponDiscount: coupons.night,
          staffName: staffName,
          originalPlanName: labels.display,
          setBreakdown: tripleSetBreakdown,
          setIndex: 2,
          additionalNotes: flowNote
        }),
        '8'
      )
    );

  } catch (error) {
    for (var i = createdEvents.length - 1; i >= 0; i--) {
      try {
        createdEvents[i].deleteEvent();
      } catch (deleteError) {
        Logger.log(
          'まるごと1日セットのカレンダーロールバック失敗: ' +
          deleteError.message
        );
      }
    }

    throw error;
  }
};

// ============================================================
// C5/C6 M列同期・LINE確定通知
// ============================================================

function c5c6GetSplitRows_(sheet, bookingNumber) {
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return {
      turtle: null,
      sup: null,
      night: null
    };
  }

  var values = sheet
    .getRange(2, 1, lastRow - 1, COLUMNS.LINE_SEND)
    .getValues();

  var result = {
    turtle: null,
    sup: null,
    night: null
  };

  for (var i = 0; i < values.length; i++) {
    var rowValues = values[i];

    if (
      String(rowValues[COLUMNS.BOOKING_NUM - 1]) !==
      String(bookingNumber)
    ) {
      continue;
    }

    var planName = String(
      rowValues[COLUMNS.PLAN - 1] || ''
    ).trim();

    var rowInfo = {
      row: i + 2,
      values: rowValues,
      planName: planName,
      time: formatTime(rowValues[COLUMNS.TIME - 1]),
      price: toNumber_(rowValues[COLUMNS.TOTAL_PRICE - 1]),
      couponDiscount: toNumber_(
        rowValues[COLUMNS.COUPON_DISCOUNT - 1]
      )
    };

    if (
      planName === C5C6_TURTLE_PLAN_NAME ||
      planName === C5C6_PRIVATE_TURTLE_PLAN_NAME
    ) {
      result.turtle = rowInfo;
    }

    if (
      planName === C5C6_SUP_PLAN_NAME ||
      planName === C5C6_PRIVATE_SUP_PLAN_NAME
    ) {
      result.sup = rowInfo;
    }

    if (
      planName === C5C6_NIGHT_PLAN_NAME ||
      planName === C5C6_PRIVATE_NIGHT_PLAN_NAME
    ) {
      result.night = rowInfo;
    }
  }

  return result;
}

function c5c6SyncStatuses_(sheet, rows, status) {
  var allRows = [rows.turtle, rows.sup, rows.night];

  for (var i = 0; i < allRows.length; i++) {
    if (allRows[i]) {
      sheet
        .getRange(
          allRows[i].row,
          COLUMNS.BOOKING_STATUS
        )
        .setValue(status);
    }
  }
}

function c5c6IsPrivateRows_(rows) {
  return !!(
    rows &&
    rows.turtle &&
    rows.turtle.planName === C5C6_PRIVATE_TURTLE_PLAN_NAME
  );
}

function c5c6GetConfirmMessage_(rows) {
  if (!rows.turtle || !rows.sup || !rows.night) return null;

  var values = rows.turtle.values;
  var customerName = String(values[COLUMNS.NAME - 1] || '');
  var bookingNumber = String(values[COLUMNS.BOOKING_NUM - 1] || '');
  var selectedDate = formatDate(values[COLUMNS.DATE - 1]);
  var headcount = String(values[COLUMNS.HEADCOUNT - 1] || '');
  var phone = String(values[COLUMNS.PHONE - 1] || '');
  var lineName = String(values[COLUMNS.LINE_NAME - 1] || '');
  var participantsDetail = String(
    values[COLUMNS.PARTICIPANTS - 1] || 'なし'
  );
  var couponCode = String(values[COLUMNS.COUPON_CODE - 1] || '');

  var totalPrice =
    rows.turtle.price +
    rows.sup.price +
    rows.night.price;

  var couponDiscount =
    rows.turtle.couponDiscount +
    rows.sup.couponDiscount +
    rows.night.couponDiscount;

  var planName = c5c6IsPrivateRows_(rows)
    ? C5C6_PRIVATE_PLAN_NAME
    : C5C6_NORMAL_PLAN_NAME;

  return (
    '🐢🛸🦀 ご予約が確定しました！\n\n' +
    customerName + ' 様\n\n' +
    '以下の内容でご予約を確定いたしました。\n' +
    '内容にお間違いがないかご確認ください。\n\n' +
    '【ご予約内容】\n' +
    '予約番号：' + bookingNumber + '\n' +
    'プラン：' + planName + '\n' +
    '🐢 ウミガメシュノーケル：' +
    valueOrNone(rows.turtle.time) +
    '〜 約1.5時間\n' +
    '🛸 ドローンSUP：' +
    valueOrNone(rows.sup.time) +
    '〜 約1.5時間\n' +
    '🦀 ナイトツアー：' +
    valueOrNone(rows.night.time) +
    '〜 約1.5時間\n' +
    '参加日：' + selectedDate + '\n' +
    '人数：' + valueOrNone(headcount) + '\n' +
    '合計金額：' + formatYen(totalPrice) + '\n' +
    'クーポン：' +
    formatCouponInfo(couponCode, couponDiscount) +
    '\n\n' +
    '【お客様情報】\n' +
    '電話番号：' + valueOrNone(phone) + '\n' +
    'LINE名：' + valueOrNone(lineName) + '\n\n' +
    '【参加者詳細】\n' +
    valueOrNone(participantsDetail) + '\n\n' +
    '【開催場所について】\n' +
    '・ウミガメシュノーケル：前日にLINEでご連絡します\n' +
    '・ドローンSUP：ウミガメ終了後、そのまま続けて開催します。基本は同じビーチですが、海況・水位により別ビーチになる場合があります\n' +
    '・ナイトツアー：当日にLINEでご連絡します\n\n' +
    '【当日の持ち物】\n' +
    '〔昼・海亀／SUP〕水着・タオル・酔い止め（必要な方）\n' +
    '〔夜・ナイトツアー〕虫よけスプレー・歩きやすい靴（サンダル不可）・飲み物\n\n' +
    '【キャンセルポリシー】\n' +
    '前日まで：無料\n' +
    '当日：100%\n\n' +
    'ご不明な点はお気軽にご連絡ください。\n' +
    '海亀兄弟'
  );
}

function c5c6GetLineSentKey_(bookingNumber, status) {
  return (
    'TRIPLE_LINE_SENT_' +
    String(bookingNumber || '') +
    '_' +
    String(status || '')
  );
}

handleBookingStatusEdit_ = function(sheet, range, row) {
  var planName = String(
    sheet.getRange(row, COLUMNS.PLAN).getValue()
  ).trim();

  if (!c5c6IsSplitPlanName_(planName)) {
    return C5C6_ORIGINAL_HANDLE_BOOKING_STATUS(
      sheet,
      range,
      row
    );
  }

  var status = range.getValue();

  if (status !== '確定' && status !== '満席') return;

  var lineUserId = sheet
    .getRange(row, COLUMNS.LINE_USER_ID)
    .getValue();

  if (!lineUserId) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'LINE User ID が未登録のため通知をスキップしました',
      '注意',
      3
    );
    return;
  }

  var bookingNumber = String(
    sheet.getRange(row, COLUMNS.BOOKING_NUM).getValue()
  );

  var customerName = String(
    sheet.getRange(row, COLUMNS.NAME).getValue()
  );

  var selectedDate = formatDate(
    sheet.getRange(row, COLUMNS.DATE).getValue()
  );

  var rows = c5c6GetSplitRows_(sheet, bookingNumber);

  if (!rows.turtle || !rows.sup || !rows.night) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'まるごと1日セットの行が揃っていません。予約番号を確認してください。',
      'エラー',
      5
    );
    return;
  }

  c5c6SyncStatuses_(sheet, rows, status);

  var sentKey = c5c6GetLineSentKey_(bookingNumber, status);

  if (
    PropertiesService
      .getScriptProperties()
      .getProperty(sentKey)
  ) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'このまるごと1日セットの' +
      status +
      'LINEは送信済みです。再送はS列から行ってください。',
      '送信済み',
      4
    );
    return;
  }

  var message = '';

  if (status === '確定') {
    message = c5c6GetConfirmMessage_(rows);

  } else {
    message = getFullMessage(
      customerName,
      bookingNumber,
      c5c6IsPrivateRows_(rows)
        ? C5C6_PRIVATE_PLAN_NAME
        : C5C6_NORMAL_PLAN_NAME,
      selectedDate,
      rows.turtle.time +
        ' / ' +
        rows.sup.time +
        ' / ' +
        rows.night.time
    );
  }

  if (!message) return;

  var sent = sendLineNotify(
    {
      lineUserId: String(lineUserId),
      customMessage: message
    },
    row
  );

  if (sent) {
    PropertiesService
      .getScriptProperties()
      .setProperty(
        sentKey,
        new Date().toISOString()
      );
  }
};
// ============================================================
// ドローンSUP単品（S6/S7）対応＋単品の二重送信ガード 拡張
// ------------------------------------------------------------
// サイト側の変更（2026-07-06）に合わせる:
//  ・開始時間が 7:00〜16:00 の1時間おき選択制になった
//  ・集合場所は前日にLINEで連絡する運用になった
// 既存コードは書き換えず、このブロックをファイルの一番下
// （C5/C6拡張よりさらに下）に貼り付けて保存するだけで有効。
// doPost は変更していないため、Webアプリの再デプロイは不要。
// ============================================================

// 単品のドローンSUP判定（「宮古島ドローンSUP体験」「【貸切】宮古島ドローンSUP体験」）。
// セット系（海空セット・まるごと1日セット）は既存処理に任せるため除外する。
function dsupIsPlanName_(planName) {
  var plan = String(planName || '');

  return plan.indexOf('ドローンSUP') !== -1 &&
    plan.indexOf('セット') === -1 &&
    plan.indexOf('ウミガメ') === -1;
}

// ---------- 1) 確定メッセージ：ドローンSUP専用文面 ----------

var DSUP_ORIGINAL_GET_CONFIRM_MESSAGE = getConfirmMessage;

getConfirmMessage = function(planName, customerName, bookingNumber, selectedDate, selectedTime, details) {
  if (!dsupIsPlanName_(planName)) {
    return DSUP_ORIGINAL_GET_CONFIRM_MESSAGE(
      planName, customerName, bookingNumber, selectedDate, selectedTime, details
    );
  }

  details = details || {};

  return (
    '🛸 ご予約が確定しました！\n\n' +
    customerName + ' 様\n\n' +
    '以下の内容でご予約を確定いたしました。\n' +
    '内容にお間違いがないかご確認ください。\n\n' +
    '【ご予約内容】\n' +
    '予約番号：' + bookingNumber + '\n' +
    'プラン：' + planName + '\n' +
    '日時：' + selectedDate + ' ' + valueOrNone(selectedTime) + '〜 約2時間\n' +
    '人数：' + valueOrNone(details.headcount) + '\n' +
    '合計金額：' + formatYen(details.totalPrice) + '\n' +
    'クーポン：' + formatCouponInfo(details.couponCode, details.couponDiscount) + '\n\n' +
    '【お客様情報】\n' +
    '電話番号：' + valueOrNone(details.phone) + '\n' +
    'LINE名：' + valueOrNone(details.lineName) + '\n\n' +
    '【参加者詳細】\n' +
    valueOrNone(details.participantsDetail) + '\n\n' +
    '【開始時間について】\n' +
    'ご予約時に選択いただいた開始時間での開催です。\n' +
    '当日の海況・水位により前後する場合は、事前にLINEでご連絡いたします。\n\n' +
    '【集合場所について】\n' +
    '海況・水位を見て、安全に綺麗な写真が残せるビーチを選び、\n' +
    '前日にLINEにてご連絡いたします。\n\n' +
    '【当日の持ち物】\n' +
    '・水着（着用してお越しいただけると助かります）\n' +
    '・着替え・タオル\n' +
    '・日焼け止め・飲み物\n' +
    '・サンダル\n\n' +
    '【ドローン撮影について】\n' +
    '強風・雨・飛行制限・安全判断により、ドローン撮影ができない場合があります。\n' +
    'その場合も通常の写真・動画撮影で思い出をお残しします。\n\n' +
    '【キャンセルポリシー】\n' +
    '前日まで：無料\n' +
    '当日：100%\n\n' +
    'ご不明な点はお気軽にご連絡ください。\n' +
    '海亀兄弟'
  );
};

// ---------- 2) N列（開催場所）：ドローンSUPの行は文面を自動調整 ----------

var DSUP_BEACH_LOCATIONS = [
  '新城海岸',
  '東平安名ビーチ',
  'ボラビーチ',
  'ワイワイビーチ',
  'シギラビーチ'
];

var DSUP_ORIGINAL_HANDLE_LOCATION_EDIT = handleLocationEdit_;

handleLocationEdit_ = function(sheet, range, row) {
  var planName = String(sheet.getRange(row, COLUMNS.PLAN).getValue());
  var location = String(range.getValue() || '');

  if (
    !dsupIsPlanName_(planName) ||
    DSUP_BEACH_LOCATIONS.indexOf(location) === -1
  ) {
    return DSUP_ORIGINAL_HANDLE_LOCATION_EDIT(sheet, range, row);
  }

  var lineUserId = sheet.getRange(row, COLUMNS.LINE_USER_ID).getValue();

  if (!lineUserId) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'LINE User ID が未登録のため通知をスキップしました',
      '注意',
      3
    );
    return;
  }

  var selectedTime = formatTime(sheet.getRange(row, COLUMNS.TIME).getValue());
  var base = getLocationMessage(location, selectedTime);

  if (!base) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '場所のメッセージが見つかりません: ' + location,
      'エラー',
      5
    );
    return;
  }

  // シュノーケル前提の行だけ取り除き、駐車場・トイレ・地図はそのまま使う
  var message = base
    .replace('明日のツアー開催場所のご案内です。', '明日のドローンSUP開催場所のご案内です。')
    .replace(/ウミガメ遭遇率：[^\n]*\n?/, '')
    .replace(/サンゴ・熱帯魚：[^\n]*\n?/, '')
    .replace(/なお、シギラビーチは[^\n]*\n?/, '')
    .replace(/シュノーケルポイント/g, 'ビーチ');

  sendLineNotify(
    {
      lineUserId: String(lineUserId),
      customMessage: message
    },
    row
  );
};

// ---------- 3) 単品プランのM列 二重送信ガード ----------
// セット系には既にガードがあるが、単品はM列を触り直すたびに
// 同じ確定/満席LINEが再送されてしまうため、同じ仕組みを追加する。

var DSUP_LAST_SEND_OK = false;
var DSUP_ORIGINAL_SEND_LINE_NOTIFY = sendLineNotify;

sendLineNotify = function(payload, row) {
  var ok = DSUP_ORIGINAL_SEND_LINE_NOTIFY(payload, row);

  DSUP_LAST_SEND_OK = !!ok;

  return ok;
};

var DSUP_ORIGINAL_HANDLE_BOOKING_STATUS = handleBookingStatusEdit_;

handleBookingStatusEdit_ = function(sheet, range, row) {
  var status = range.getValue();

  var planName = String(
    sheet.getRange(row, COLUMNS.PLAN).getValue()
  ).trim();

  // セット系（2行/3行に分割されたプラン）は既存のガードに任せる
  var isSplitPlan =
    isSplitComboPlanName(planName) ||
    isSplitSeaSkyPlanName_(planName) ||
    c5c6IsSplitPlanName_(planName);

  if ((status !== '確定' && status !== '満席') || isSplitPlan) {
    return DSUP_ORIGINAL_HANDLE_BOOKING_STATUS(sheet, range, row);
  }

  var bookingNumber = String(
    sheet.getRange(row, COLUMNS.BOOKING_NUM).getValue()
  );

  // 予約番号が無い手入力行はガード対象外（キー衝突を防ぐ）
  if (!bookingNumber) {
    return DSUP_ORIGINAL_HANDLE_BOOKING_STATUS(sheet, range, row);
  }

  var sentKey = 'SINGLE_LINE_SENT_' + bookingNumber + '_' + status;
  var props = PropertiesService.getScriptProperties();

  if (props.getProperty(sentKey)) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'この予約の' + status + 'LINEは送信済みです。再送はS列から行ってください。',
      '送信済み',
      4
    );
    return;
  }

  DSUP_LAST_SEND_OK = false;

  DSUP_ORIGINAL_HANDLE_BOOKING_STATUS(sheet, range, row);

  if (DSUP_LAST_SEND_OK) {
    props.setProperty(sentKey, new Date().toISOString());
  }
};

// ============================================================
// LINE安全送信・送信履歴 拡張（管理版）
// ------------------------------------------------------------
// このブロックはこのCode.gsの一部です（別ファイルへ切り出さないでください）。
// 別ファイルへコピーして同じGASプロジェクトへ置くと、下部のラップ処理が
// 二重に適用され、LINE送信履歴が1回の送信で2行記録されます。
// 既存の予約受信・カレンダー・セット予約処理は変更しません。
//
// 変更後の操作:
// 1. M列（確定/満席）、N列（開催場所）、S列（自由文）を編集
// 2. まだLINEは送信されず、U列に「送信待ち」が表示される
// 3. 内容を確認し、同じ行のT列チェックボックスをオンにすると送信
// 4. 成否と本文は「LINE送信履歴」シートへ記録される
// ============================================================

var LINE_SAFE_CONFIRM_COLUMN = 20; // T: LINE送信確認
var LINE_SAFE_RESULT_COLUMN = 21;  // U: 送信予定・結果
var LINE_SAFE_LOG_SHEET_NAME = 'LINE送信履歴';
var LINE_SAFE_PENDING_PREFIX = 'LINE_SAFE_PENDING_';

var LINE_SAFE_LAST_SEND_OK = false;
var LINE_SAFE_SEND_CONTEXT = '';

function lineSafeGetProperties_() {
  try {
    var documentProperties = PropertiesService.getDocumentProperties();

    return documentProperties || PropertiesService.getScriptProperties();
  } catch (error) {
    return PropertiesService.getScriptProperties();
  }
}

function lineSafePendingKey_(sheet, row) {
  return (
    LINE_SAFE_PENDING_PREFIX +
    String(sheet.getSheetId()) +
    '_' +
    String(row)
  );
}

function lineSafeGetLogSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName(LINE_SAFE_LOG_SHEET_NAME);

  if (!logSheet) {
    logSheet = ss.insertSheet(LINE_SAFE_LOG_SHEET_NAME);
  }

  var headers = [
    '送信日時',
    '予約番号',
    '名前',
    '参加日',
    '時間',
    'プラン',
    '送信種別',
    'LINE User ID',
    'メッセージ',
    '結果',
    '予約一覧行'
  ];

  if (String(logSheet.getRange(1, 1).getValue()) !== headers[0]) {
    logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return logSheet;
}

function lineSafeSetup() {
  var sheet = getOrCreateSheet();

  sheet.getRange(1, LINE_SAFE_CONFIRM_COLUMN).setValue('LINE送信確認');
  sheet.getRange(1, LINE_SAFE_RESULT_COLUMN).setValue('送信予定・結果');

  sheet
    .getRange(1, LINE_SAFE_CONFIRM_COLUMN, 1, 2)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setBackground('#fff2cc');

  var checkboxRule = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .setAllowInvalid(false)
    .build();

  sheet
    .getRange(
      2,
      LINE_SAFE_CONFIRM_COLUMN,
      Math.max(sheet.getMaxRows() - 1, 1),
      1
    )
    .setDataValidation(checkboxRule)
    // チェックボックス設定時に空行へFALSEが入る環境でも、
    // getLastRow()による予約追加位置を変えないよう値だけ空に戻す。
    .clearContent();

  sheet.setColumnWidth(LINE_SAFE_CONFIRM_COLUMN, 130);
  sheet.setColumnWidth(LINE_SAFE_RESULT_COLUMN, 360);

  var logSheet = lineSafeGetLogSheet_();

  logSheet.setFrozenRows(1);
  logSheet
    .getRange(1, 1, 1, 11)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setBackground('#d9ead3');

  logSheet.getRange('A:A').setNumberFormat('yyyy/mm/dd hh:mm:ss');
  logSheet.setColumnWidth(1, 150);
  logSheet.setColumnWidth(2, 150);
  logSheet.setColumnWidth(3, 120);
  logSheet.setColumnWidth(4, 100);
  logSheet.setColumnWidth(5, 80);
  logSheet.setColumnWidth(6, 260);
  logSheet.setColumnWidth(7, 150);
  logSheet.setColumnWidth(8, 240);
  logSheet.setColumnWidth(9, 500);
  logSheet.setColumnWidth(10, 80);
  logSheet.setColumnWidth(11, 90);
  logSheet.getRange('I:I').setWrap(true);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'LINE安全送信の準備が完了しました',
    '完了',
    4
  );
}

function lineSafeClearPending_(sheet, row) {
  lineSafeGetProperties_().deleteProperty(
    lineSafePendingKey_(sheet, row)
  );

  sheet
    .getRange(row, LINE_SAFE_CONFIRM_COLUMN)
    .setValue(false)
    .setBackground(null);

  sheet
    .getRange(row, LINE_SAFE_RESULT_COLUMN)
    .clearContent()
    .setBackground(null);
}

function lineSafeStage_(sheet, row, type, expectedValue, summary) {
  var lineUserId = sheet
    .getRange(row, COLUMNS.LINE_USER_ID)
    .getValue();

  if (!lineUserId) {
    lineSafeClearPending_(sheet, row);

    SpreadsheetApp.getActiveSpreadsheet().toast(
      'LINE User ID が未登録のため送信予約できません',
      '注意',
      4
    );
    return;
  }

  var pending = {
    type: String(type),
    expectedValue: String(expectedValue || ''),
    summary: String(summary || ''),
    createdAt: new Date().toISOString()
  };

  lineSafeGetProperties_().setProperty(
    lineSafePendingKey_(sheet, row),
    JSON.stringify(pending)
  );

  sheet
    .getRange(row, LINE_SAFE_CONFIRM_COLUMN)
    .setValue(false)
    .setBackground('#fff2cc');

  sheet
    .getRange(row, LINE_SAFE_RESULT_COLUMN)
    .setValue('送信待ち：' + pending.summary)
    .setBackground('#fff2cc');

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'まだLINEは送信していません。内容を確認してT列をチェックしてください。',
    '送信待ち',
    5
  );
}

function lineSafeReadPending_(sheet, row) {
  var json = lineSafeGetProperties_().getProperty(
    lineSafePendingKey_(sheet, row)
  );

  if (!json) return null;

  try {
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

function lineSafeAppendLog_(payload, row, ok) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName(SHEET_NAME);
  var values = [];

  if (sourceSheet && row && row > 1) {
    values = sourceSheet
      .getRange(row, 1, 1, COLUMNS.LINE_SEND)
      .getDisplayValues()[0];
  }

  var logLock = LockService.getDocumentLock();
  var locked = false;

  try {
    locked = logLock.tryLock(5000);

    if (!locked) {
      throw new Error('送信履歴用のロックを取得できませんでした');
    }

    lineSafeGetLogSheet_().appendRow([
      new Date(),
      values[COLUMNS.BOOKING_NUM - 1] || '',
      values[COLUMNS.NAME - 1] || '',
      values[COLUMNS.DATE - 1] || '',
      values[COLUMNS.TIME - 1] || '',
      values[COLUMNS.PLAN - 1] || '',
      LINE_SAFE_SEND_CONTEXT || '自由メッセージ',
      String(payload && payload.lineUserId || ''),
      String(payload && payload.customMessage || ''),
      ok ? '成功' : '失敗',
      row || ''
    ]);

  } finally {
    if (locked) logLock.releaseLock();
  }
}

function lineSafeHandleConfirmEdit_(sheet, range, row) {
  var checked = range.getValue();

  if (checked !== true && String(checked).toUpperCase() !== 'TRUE') {
    return;
  }

  var pending = lineSafeReadPending_(sheet, row);

  if (!pending) {
    range.setValue(false);

    SpreadsheetApp.getActiveSpreadsheet().toast(
      'この行には送信待ちのLINEがありません',
      '確認',
      4
    );
    return;
  }

  var sourceColumn = 0;

  if (pending.type === 'STATUS') {
    sourceColumn = COLUMNS.BOOKING_STATUS;
  } else if (pending.type === 'LOCATION') {
    sourceColumn = COLUMNS.LOCATION;
  } else if (pending.type === 'FREE') {
    sourceColumn = COLUMNS.LINE_SEND;
  }

  if (!sourceColumn) {
    lineSafeClearPending_(sheet, row);
    return;
  }

  var currentValue = String(
    sheet.getRange(row, sourceColumn).getValue() || ''
  );

  if (currentValue !== String(pending.expectedValue || '')) {
    lineSafeClearPending_(sheet, row);

    SpreadsheetApp.getActiveSpreadsheet().toast(
      '送信待ちにした後で内容が変更されたため、送信を中止しました',
      '中止',
      5
    );
    return;
  }

  LINE_SAFE_LAST_SEND_OK = false;
  LINE_SAFE_SEND_CONTEXT = pending.summary;

  try {
    if (pending.type === 'STATUS') {
      LINE_SAFE_ORIGINAL_HANDLE_BOOKING_STATUS(
        sheet,
        sheet.getRange(row, COLUMNS.BOOKING_STATUS),
        row
      );

    } else if (pending.type === 'LOCATION') {
      LINE_SAFE_ORIGINAL_HANDLE_LOCATION_EDIT(
        sheet,
        sheet.getRange(row, COLUMNS.LOCATION),
        row
      );

    } else {
      LINE_SAFE_ORIGINAL_HANDLE_FREE_MESSAGE(
        sheet,
        sheet.getRange(row, COLUMNS.LINE_SEND),
        row
      );
    }

  } finally {
    LINE_SAFE_SEND_CONTEXT = '';
    range.setValue(false);
  }

  if (LINE_SAFE_LAST_SEND_OK) {
    lineSafeGetProperties_().deleteProperty(
      lineSafePendingKey_(sheet, row)
    );

    sheet
      .getRange(row, LINE_SAFE_CONFIRM_COLUMN)
      .setBackground('#d9ead3');

    sheet
      .getRange(row, LINE_SAFE_RESULT_COLUMN)
      .setValue(
        '✅ ' +
        new Date().toLocaleString('ja-JP') +
        ' 送信済：' +
        pending.summary
      )
      .setBackground('#d9ead3');

  } else {
    sheet
      .getRange(row, LINE_SAFE_CONFIRM_COLUMN)
      .setBackground('#f4cccc');

    sheet
      .getRange(row, LINE_SAFE_RESULT_COLUMN)
      .setValue(
        '⚠️ 送信されませんでした。送信済み判定またはエラー内容を確認してください：' +
        pending.summary
      )
      .setBackground('#f4cccc');
  }
}

// 現在有効な既存処理を保存してから、安全確認処理で包む。
// ファイル末尾に置くことで、C5/C6・ドローンSUP・二重送信ガードも保持する。
var LINE_SAFE_ORIGINAL_HANDLE_BOOKING_STATUS = handleBookingStatusEdit_;
var LINE_SAFE_ORIGINAL_HANDLE_LOCATION_EDIT = handleLocationEdit_;
var LINE_SAFE_ORIGINAL_HANDLE_FREE_MESSAGE = handleFreeLineMessageEdit_;
var LINE_SAFE_ORIGINAL_SEND_LINE_NOTIFY = sendLineNotify;
var LINE_SAFE_ORIGINAL_ON_SHEET_EDIT = onSheetEdit;
var LINE_SAFE_ORIGINAL_ON_OPEN = onOpen;

handleBookingStatusEdit_ = function(sheet, range, row) {
  var status = String(range.getValue() || '');

  if (status !== '確定' && status !== '満席') {
    lineSafeClearPending_(sheet, row);
    return;
  }

  lineSafeStage_(
    sheet,
    row,
    'STATUS',
    status,
    '予約ステータス「' + status + '」'
  );
};

handleLocationEdit_ = function(sheet, range, row) {
  var location = String(range.getValue() || '');

  if (!location) {
    lineSafeClearPending_(sheet, row);
    return;
  }

  lineSafeStage_(
    sheet,
    row,
    'LOCATION',
    location,
    '開催場所「' + location + '」'
  );
};

handleFreeLineMessageEdit_ = function(sheet, range, row) {
  var message = String(range.getValue() || '');

  if (!message || message.indexOf('✅ 送信済') === 0) return;

  lineSafeStage_(
    sheet,
    row,
    'FREE',
    message,
    '自由メッセージ「' +
      (message.length > 40 ? message.slice(0, 40) + '…' : message) +
      '」'
  );
};

sendLineNotify = function(payload, row) {
  var ok = LINE_SAFE_ORIGINAL_SEND_LINE_NOTIFY(payload, row);

  LINE_SAFE_LAST_SEND_OK = !!ok;

  try {
    lineSafeAppendLog_(payload, row, ok);
  } catch (logError) {
    Logger.log('LINE送信履歴の記録エラー: ' + logError.message);

    SpreadsheetApp.getActiveSpreadsheet().toast(
      (ok ? 'LINEは送信されましたが、' : 'LINE送信失敗に加えて、') +
        '履歴の記録にも失敗しました: ' + logError.message,
      '履歴エラー',
      5
    );
  }

  return ok;
};

onSheetEdit = function(e) {
  if (!e || !e.range) {
    Logger.log('onSheetEdit はシート編集トリガーから実行してください');
    return;
  }

  var range = e.range;
  var sheet = range.getSheet();

  if (
    sheet.getName() !== SHEET_NAME ||
    range.getColumn() !== LINE_SAFE_CONFIRM_COLUMN
  ) {
    return LINE_SAFE_ORIGINAL_ON_SHEET_EDIT(e);
  }

  if (range.getRow() <= 1) return;

  if (range.getNumRows() !== 1 || range.getNumColumns() !== 1) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'LINE送信確認は1行ずつ操作してください',
      '注意',
      4
    );
    return;
  }

  var lock = LockService.getScriptLock();

  try {
    if (!lock.tryLock(3000)) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        '別の送信処理中です。少し待ってからもう一度お試しください。',
        '処理中',
        4
      );
      return;
    }

    lineSafeHandleConfirmEdit_(
      sheet,
      range,
      range.getRow()
    );

  } finally {
    lock.releaseLock();
  }
};

onOpen = function() {
  // 元のonOpenは「予約一覧を全消去する setupSheet」をメニューへ
  // 表示するため、通常運用では呼び出さない。
  // setupSheet関数そのものは復旧用として既存コード内に残す。
  SpreadsheetApp.getUi()
    .createMenu('🐢 海亀兄弟')
    .addItem('安全送信列と履歴を再設定', 'lineSafeSetup')
    .addToUi();
};
