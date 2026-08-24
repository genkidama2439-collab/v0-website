/**
 * 海亀兄弟 予約管理Webアプリ
 *
 * 既存の予約受付GASとは別の、管理画面専用GASプロジェクトへ配置します。
 * 同じ「海亀兄弟予約管理」スプレッドシートを読み書きしますが、
 * 予約受信の doPost や既存の編集トリガーには依存しません。
 */

var ADMIN_APP_VERSION = '2026.08.24-1';
var ADMIN_SCHEMA_VERSION = '2026.08.24-1';
var ADMIN_SCHEMA_VERSION_PROPERTY = 'ADMIN_BOOKING_SCHEMA_VERSION';
var ADMIN_SCHEMA_VERIFIED_AT_PROPERTY = 'ADMIN_BOOKING_SCHEMA_VERIFIED_AT';
var ADMIN_SCHEMA_VERIFY_INTERVAL_MS = 6 * 60 * 60 * 1000;
var ADMIN_LOCATION_OPTIONS_CACHE_PROPERTY = 'ADMIN_LOCATION_OPTIONS_CACHE';
var ADMIN_DEFAULT_SPREADSHEET_ID =
  '1bPYur4Dfg3LxTCIiYzZvyZRT8bgLoYizG1B6LIkETKk';
var ADMIN_DEFAULT_CALENDAR_ID = 'genkidama2439@gmail.com';
var ADMIN_BOOKING_SHEET_NAME = '予約一覧';
var ADMIN_LINE_LOG_SHEET_NAME = 'LINE送信履歴';
var ADMIN_AUDIT_SHEET_NAME = '管理アプリ操作履歴';
var ADMIN_DELETED_SHEET_NAME = '削除済み予約';
var ADMIN_REFERRAL_OUTCOME_SHEET_NAME = '紹介成果';
var ADMIN_NOTIFY_API_URL =
  'https://www.umigamekyoudaimiyakojima.com/api/line/notify';
var ADMIN_PENDING_PREFIX = 'ADMIN_LINE_PENDING_';
var ADMIN_STATUS_SENT_PREFIX = 'ADMIN_STATUS_SENT_';
var ADMIN_PENDING_TTL_MINUTES = 30;

var ADMIN_COLUMNS = {
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
  PLAN_ID: 45,
  REFERRAL_CODE: 46,
  REFERRAL_NAME: 47,
  REFERRAL_ACQUIRED_AT: 48,
  REFERRAL_CAMPAIGN: 49
};

var ADMIN_CANONICAL_HEADERS = [
  '受付日時', '予約番号', '参加日', '時間', '名前', 'プラン', '合計金額',
  '電話', 'ステータス', '人数内訳', '参加者詳細', 'lineUserId',
  '予約ステータス', '開催場所', 'LINE名', 'スタッフ指名',
  'クーポンコード', 'クーポン割引額', 'LINE送信', 'LINE送信確認',
  '送信予定・結果', 'メールアドレス', 'Visitor ID', 'Visit ID',
  '予約ファネルID', '行動履歴連携同意バージョン',
  '行動履歴連携同意日時', 'Visitor作成日時', 'Visit開始日時', '言語',
  '初回着地ページ', '参照元ホスト', 'UTM Source', 'UTM Medium',
  'UTM Campaign', '予約送信ページ', 'デバイス', 'ブラウザ', 'OS',
  '参加者年齢', '参加者身長', '参加者体重', '参加者足サイズ',
  '特別なご要望・アレルギー等', '管理プランID',
  '紹介コード', '紹介者名', '紹介取得日時', '紹介キャンペーン'
];

var ADMIN_REFERRAL_OUTCOME_HEADERS = [
  '受付日時', '予約番号', '参加日', '紹介コード', '紹介者名',
  '管理プランID', '予約売上', '報酬方式', '報酬設定値',
  '紹介者報酬', '会社取り分', '紹介キャンペーン', '紹介取得日時',
  '成果ステータス', '報酬確定日時', '支払ステータス', '支払日時', '備考'
];

var ADMIN_REFERRAL_OUTCOME_COLUMNS = {
  RECEIVED_AT: 1,
  BOOKING_NUM: 2,
  PARTICIPATION_DATE: 3,
  CODE: 4,
  NAME: 5,
  PLAN_ID: 6,
  REVENUE: 7,
  REWARD_TYPE: 8,
  REWARD_VALUE: 9,
  PARTNER_REWARD: 10,
  COMPANY_SHARE: 11,
  CAMPAIGN: 12,
  ACQUIRED_AT: 13,
  OUTCOME_STATUS: 14,
  CONFIRMED_AT: 15,
  PAYMENT_STATUS: 16,
  PAID_AT: 17,
  NOTE: 18
};

var ADMIN_PLAN_CATALOG = [
  {
    id: 'S1', name: 'ウミガメと泳ぐシュノーケルツアー',
    adultPrice: 6500, childPrice: 6000, under3Price: 6000,
    components: [{ plan: 'ウミガメと泳ぐシュノーケルツアー', role: 'turtle', duration: 120 }]
  },
  {
    id: 'S2', name: '【貸切】ウミガメシュノーケルツアー',
    adultPrice: 9000, childPrice: 9000, under3Price: 9000,
    components: [{ plan: '【貸切】ウミガメシュノーケルツアー', role: 'turtle', duration: 120 }]
  },
  {
    id: 'S3', name: '本格ナイトツアー',
    adultPrice: 4000, childPrice: 4000, under3Price: 0,
    components: [{ plan: '本格ナイトツアー', role: 'night', duration: 90 }]
  },
  {
    id: 'S4', name: '【貸切】サンセットSUP',
    adultPrice: 9500, childPrice: 8500, under3Price: 8500,
    components: [{ plan: '【貸切】サンセットSUP', role: 'sup', duration: 120 }]
  },
  {
    id: 'S8', name: 'サンセットSUP',
    adultPrice: 7500, childPrice: 6500, under3Price: 6500,
    components: [{ plan: 'サンセットSUP', role: 'sup', duration: 120 }]
  },
  {
    id: 'S5', name: '【貸切】本格ナイトツアー',
    adultPrice: 8000, childPrice: 8000, under3Price: 0,
    components: [{ plan: '【貸切】本格ナイトツアー', role: 'night', duration: 90 }]
  },
  {
    id: 'S6', name: '宮古島ドローンSUP体験',
    adultPrice: 7500, childPrice: 6500, under3Price: 6500,
    components: [{ plan: '宮古島ドローンSUP体験', role: 'sup', duration: 120 }]
  },
  {
    id: 'S7', name: '【貸切】宮古島ドローンSUP体験',
    adultPrice: 9500, childPrice: 8500, under3Price: 8500,
    components: [{ plan: '【貸切】宮古島ドローンSUP体験', role: 'sup', duration: 120 }]
  },
  {
    id: 'C1', name: 'ウミガメシュノーケル＆ヤシガニ探検 昼夜セット',
    adultPrice: 9500, childPrice: 9000, under3Price: 9000,
    components: [
      { plan: '昼夜セット海亀', role: 'turtle', duration: 90 },
      { plan: '昼夜セットヤシガニ', role: 'night', duration: 90 }
    ]
  },
  {
    id: 'C2', name: '【貸切】ウミガメシュノーケル＆ヤシガニ探検 昼夜セット',
    adultPrice: 16000, childPrice: 16000, under3Price: 16000,
    components: [
      { plan: '昼夜セット海亀', role: 'turtle', duration: 90 },
      { plan: '昼夜セットヤシガニ', role: 'night', duration: 90 }
    ]
  },
  {
    id: 'C3', name: 'ウミガメシュノーケル＆ドローンSUP 海空セット',
    adultPrice: 13000, childPrice: 11500, under3Price: 11500,
    autoSup: true,
    components: [
      { plan: '海空セット（ウミガメシュノーケル）', role: 'turtle', duration: 90 },
      { plan: '海空セット（ドローンSUP）', role: 'sup', duration: 90 }
    ]
  },
  {
    id: 'C4', name: '【貸切】ウミガメシュノーケル＆ドローンSUP 海空セット',
    adultPrice: 17500, childPrice: 16500, under3Price: 16500,
    autoSup: true,
    components: [
      { plan: '海空セット（ウミガメシュノーケル）', role: 'turtle', duration: 90 },
      { plan: '海空セット（ドローンSUP）', role: 'sup', duration: 90 }
    ]
  },
  {
    id: 'C5', name: 'ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット',
    adultPrice: 16000, childPrice: 14500, under3Price: 14500,
    autoSup: true,
    components: [
      { plan: 'まるごと1日セット海亀', role: 'turtle', duration: 90 },
      { plan: 'まるごと1日セットドローンSUP', role: 'sup', duration: 90 },
      { plan: 'まるごと1日セットヤシガニ', role: 'night', duration: 90 }
    ]
  },
  {
    id: 'C6', name: '【貸切】ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット',
    adultPrice: 24500, childPrice: 23500, under3Price: 23500,
    autoSup: true,
    components: [
      { plan: '貸切まるごと1日セット海亀', role: 'turtle', duration: 90 },
      { plan: '貸切まるごと1日セットドローンSUP', role: 'sup', duration: 90 },
      { plan: '貸切まるごと1日セットヤシガニ', role: 'night', duration: 90 }
    ]
  }
];

var ADMIN_LOCATION_OPTIONS = [
  '新城海岸',
  'ボラビーチ',
  'ワイワイビーチ',
  'シギラビーチ',
  'ナイトツアー（遺跡）',
  'ナイトツアー（インディアンマリンガーデン）'
];

var ADMIN_STATUS_OPTIONS = ['', '確定', '満席'];

function doGet() {
  var template = HtmlService.createTemplateFromFile('Index');

  try {
    template.initialDataJson = adminSafeJsonForHtml_(adminGetAppData());
    template.initialDataErrorJson = adminSafeJsonForHtml_('');
  } catch (error) {
    template.initialDataJson = 'null';
    template.initialDataErrorJson = adminSafeJsonForHtml_(
      error && error.message ? error.message : String(error)
    );
  }

  return template
    .evaluate()
    .setTitle('海亀兄弟 予約管理')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

// 顧客入力に</script>相当の文字が含まれてもHTMLを途中終了させない。
function adminSafeJsonForHtml_(value) {
  return JSON.stringify(value)
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * 初回設定時に、GASが認識しているログインアドレスを実行ログで確認します。
 * シートの読み書きやLINE送信は行いません。
 */
function adminWhoAmI() {
  var email = String(Session.getActiveUser().getEmail() || '取得できません');
  Logger.log('現在のGoogleアカウント: ' + email);
  return email;
}

/**
 * 初回設定用：現在ログイン中のGoogleアカウントを管理者として保存します。
 * 予約シートの更新やLINE送信は行いません。
 */
function adminSetMyEmailAsAdmin() {
  var email = String(Session.getActiveUser().getEmail() || '')
    .trim()
    .toLowerCase();

  if (!email) {
    throw new Error('Googleアカウントのメールアドレスを取得できませんでした。');
  }

  PropertiesService
    .getScriptProperties()
    .setProperty('ADMIN_ALLOWED_EMAILS', email);

  Logger.log('管理者メールアドレスを保存しました: ' + email);
  return email;
}

/**
 * 日時変更機能の初回認可用。
 * カレンダー名の読み取りだけを行い、予定は変更しません。
 */
function adminAuthorizeCalendarAccess() {
  adminAssertAuthorized_();

  var calendar = adminGetCalendar_();
  var name = calendar.getName();

  Logger.log('カレンダー認可完了: ' + name);

  return {
    success: true,
    calendarName: name,
    calendarId: calendar.getId()
  };
}

/**
 * 画面起動時に必要な情報をまとめて返します。
 */
function adminGetAppData() {
  var startedAt = Date.now();
  var actor = adminAssertAuthorized_();
  var authorizedAt = Date.now();
  adminCleanupExpiredPending_();
  var cleanedAt = Date.now();
  var sheet = adminGetBookingSheet_();
  var sheetReadyAt = Date.now();
  var bookings = adminReadBookings_(sheet);
  var bookingsReadAt = Date.now();
  var publicBookings = bookings.map(adminToPublicBooking_);
  var dataBuiltAt = Date.now();

  var result = {
    appVersion: ADMIN_APP_VERSION,
    actor: actor,
    generatedAt: new Date().toISOString(),
    dashboard: adminBuildDashboard_(bookings),
    referrals: adminReadReferralData_(),
    reservations: publicBookings,
    options: {
      statuses: ADMIN_STATUS_OPTIONS,
      // 開催場所の入力規則は6時間ごとにキャッシュを更新する。
      // 保存時はadminValidateLocation_がシートの実物を再確認する。
      locations: adminGetCachedLocationOptions_(),
      staff: adminUniqueSorted_(publicBookings.map(function(booking) {
        return booking.staff;
      }).concat(
        publicBookings.reduce(function(all, booking) {
          return all.concat(booking.components.map(function(component) {
            return component.staff;
          }));
        }, [])
      )),
      plans: adminUniqueSorted_(publicBookings.map(function(booking) {
        return booking.displayPlan;
      })),
      planCatalog: ADMIN_PLAN_CATALOG.map(function(plan) {
        return {
          id: plan.id,
          name: plan.name,
          adultPrice: plan.adultPrice,
          childPrice: plan.childPrice,
          under3Price: plan.under3Price,
          autoSup: !!plan.autoSup,
          components: plan.components.map(function(component) {
            return {
              plan: component.plan,
              role: component.role,
              duration: component.duration
            };
          })
        };
      })
    }
  };

  Logger.log(
    '[ADMIN_LOAD] total=' + (Date.now() - startedAt) + 'ms' +
    ' auth=' + (authorizedAt - startedAt) + 'ms' +
    ' cleanup=' + (cleanedAt - authorizedAt) + 'ms' +
    ' sheet=' + (sheetReadyAt - cleanedAt) + 'ms' +
    ' read=' + (bookingsReadAt - sheetReadyAt) + 'ms' +
    ' build=' + (dataBuiltAt - bookingsReadAt) + 'ms' +
    ' bookings=' + bookings.length
  );

  return result;
}

/**
 * google.script.runのオブジェクト変換で応答が止まるケースを避けるため、
 * 初期表示データを明示的なJSON文字列として返します。
 */
function adminGetAppDataJson() {
  return JSON.stringify(adminGetAppData());
}

// ============================================================
// 紹介成果ダッシュボード・手動確定
// ============================================================

function adminEmptyReferralData_(errorMessage) {
  return {
    available: false,
    error: String(errorMessage || ''),
    monthLabel: adminToday_().slice(0, 7),
    summary: {
      monthBookings: 0,
      monthRevenue: 0,
      monthPartnerReward: 0,
      monthCompanyShare: 0,
      unconfirmedReward: 0,
      confirmedReward: 0,
      paidReward: 0
    },
    partners: [],
    outcomes: []
  };
}

function adminReferralHeadersMatch_(sheet) {
  if (!sheet || sheet.getMaxColumns() < ADMIN_REFERRAL_OUTCOME_HEADERS.length) {
    return false;
  }

  var headers = sheet
    .getRange(1, 1, 1, ADMIN_REFERRAL_OUTCOME_HEADERS.length)
    .getDisplayValues()[0];

  return ADMIN_REFERRAL_OUTCOME_HEADERS.every(function(header, index) {
    return String(headers[index] || '').trim() === header;
  });
}

function adminGetReferralOutcomeSheet_(required) {
  var sheet = adminGetSpreadsheet_().getSheetByName(
    ADMIN_REFERRAL_OUTCOME_SHEET_NAME
  );

  if (!sheet) {
    if (required) {
      throw new Error(
        '紹介成果シートがありません。予約受付GASのsetupReferralProgramを先に実行してください。'
      );
    }
    return null;
  }

  if (!adminReferralHeadersMatch_(sheet)) {
    if (required) {
      throw new Error('紹介成果シートのヘッダーが想定と異なります。');
    }
    return null;
  }

  return sheet;
}

function adminReferralDateKey_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, 'Asia/Tokyo', 'yyyy-MM-dd');
  }

  var normalized = adminNormalizeDate_(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;

  var parsed = new Date(String(value || ''));
  return isNaN(parsed.getTime())
    ? ''
    : Utilities.formatDate(parsed, 'Asia/Tokyo', 'yyyy-MM-dd');
}

function adminReferralDateTimeText_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return adminFormatDateTime_(value);
  }

  return String(value || '').trim();
}

function adminMapReferralOutcome_(row, rowNumber) {
  var receivedAt = row[ADMIN_REFERRAL_OUTCOME_COLUMNS.RECEIVED_AT - 1];
  var outcomeStatus = String(
    row[ADMIN_REFERRAL_OUTCOME_COLUMNS.OUTCOME_STATUS - 1] || '未確定'
  ).trim();
  var paymentStatus = String(
    row[ADMIN_REFERRAL_OUTCOME_COLUMNS.PAYMENT_STATUS - 1] || '未払い'
  ).trim();

  return {
    rowNumber: rowNumber,
    receivedAt: adminReferralDateTimeText_(receivedAt),
    receivedDate: adminReferralDateKey_(receivedAt),
    bookingNumber: String(row[ADMIN_REFERRAL_OUTCOME_COLUMNS.BOOKING_NUM - 1] || '').trim(),
    participationDate: adminReferralDateKey_(
      row[ADMIN_REFERRAL_OUTCOME_COLUMNS.PARTICIPATION_DATE - 1]
    ),
    code: String(row[ADMIN_REFERRAL_OUTCOME_COLUMNS.CODE - 1] || '').trim(),
    name: String(row[ADMIN_REFERRAL_OUTCOME_COLUMNS.NAME - 1] || '').trim(),
    planId: String(row[ADMIN_REFERRAL_OUTCOME_COLUMNS.PLAN_ID - 1] || '').trim(),
    revenue: adminToNumber_(row[ADMIN_REFERRAL_OUTCOME_COLUMNS.REVENUE - 1]),
    rewardType: String(row[ADMIN_REFERRAL_OUTCOME_COLUMNS.REWARD_TYPE - 1] || '').trim(),
    rewardValue: adminToNumber_(row[ADMIN_REFERRAL_OUTCOME_COLUMNS.REWARD_VALUE - 1]),
    partnerReward: adminToNumber_(row[ADMIN_REFERRAL_OUTCOME_COLUMNS.PARTNER_REWARD - 1]),
    companyShare: adminToNumber_(row[ADMIN_REFERRAL_OUTCOME_COLUMNS.COMPANY_SHARE - 1]),
    campaign: String(row[ADMIN_REFERRAL_OUTCOME_COLUMNS.CAMPAIGN - 1] || '').trim(),
    acquiredAt: adminReferralDateTimeText_(
      row[ADMIN_REFERRAL_OUTCOME_COLUMNS.ACQUIRED_AT - 1]
    ),
    outcomeStatus: outcomeStatus,
    confirmedAt: adminReferralDateTimeText_(
      row[ADMIN_REFERRAL_OUTCOME_COLUMNS.CONFIRMED_AT - 1]
    ),
    paymentStatus: paymentStatus,
    paidAt: adminReferralDateTimeText_(
      row[ADMIN_REFERRAL_OUTCOME_COLUMNS.PAID_AT - 1]
    ),
    note: String(row[ADMIN_REFERRAL_OUTCOME_COLUMNS.NOTE - 1] || '').trim()
  };
}

function adminReadReferralData_() {
  try {
    var sheet = adminGetReferralOutcomeSheet_(false);
    if (!sheet) {
      return adminEmptyReferralData_(
        '未セットアップです。予約受付GASのsetupReferralProgramを実行してください。'
      );
    }

    var rows = sheet.getLastRow() >= 2
      ? sheet
        .getRange(
          2,
          1,
          sheet.getLastRow() - 1,
          ADMIN_REFERRAL_OUTCOME_HEADERS.length
        )
        .getValues()
      : [];
    var outcomes = rows
      .map(function(row, index) {
        return adminMapReferralOutcome_(row, index + 2);
      })
      .filter(function(outcome) {
        return !!outcome.bookingNumber;
      });
    var currentMonth = adminToday_().slice(0, 7);
    var monthOutcomes = outcomes.filter(function(outcome) {
      return outcome.receivedDate.slice(0, 7) === currentMonth &&
        outcome.outcomeStatus !== '取消';
    });
    var summary = {
      monthBookings: monthOutcomes.length,
      monthRevenue: 0,
      monthPartnerReward: 0,
      monthCompanyShare: 0,
      unconfirmedReward: 0,
      confirmedReward: 0,
      paidReward: 0
    };
    var partnerMap = {};

    monthOutcomes.forEach(function(outcome) {
      summary.monthRevenue += outcome.revenue;
      summary.monthPartnerReward += outcome.partnerReward;
      summary.monthCompanyShare += outcome.companyShare;

      var key = outcome.code || '(コードなし)';
      if (!partnerMap[key]) {
        partnerMap[key] = {
          code: outcome.code,
          name: outcome.name,
          bookingCount: 0,
          revenue: 0,
          partnerReward: 0,
          companyShare: 0
        };
      }

      partnerMap[key].bookingCount += 1;
      partnerMap[key].revenue += outcome.revenue;
      partnerMap[key].partnerReward += outcome.partnerReward;
      partnerMap[key].companyShare += outcome.companyShare;
    });

    outcomes.forEach(function(outcome) {
      if (outcome.outcomeStatus === '未確定') {
        summary.unconfirmedReward += outcome.partnerReward;
      }
      if (outcome.outcomeStatus === '確定') {
        summary.confirmedReward += outcome.partnerReward;
      }
      if (outcome.paymentStatus === '支払済') {
        summary.paidReward += outcome.partnerReward;
      }
    });

    outcomes.sort(function(a, b) {
      if (a.receivedDate !== b.receivedDate) {
        return a.receivedDate < b.receivedDate ? 1 : -1;
      }
      return b.rowNumber - a.rowNumber;
    });

    return {
      available: true,
      error: '',
      monthLabel: currentMonth,
      summary: summary,
      partners: Object.keys(partnerMap)
        .map(function(key) { return partnerMap[key]; })
        .sort(function(a, b) { return b.partnerReward - a.partnerReward; }),
      // 起動データの肥大化を避けつつ、直近の成果は管理画面で操作できるようにする。
      outcomes: outcomes.slice(0, 200)
    };

  } catch (error) {
    Logger.log('紹介成果の読込エラー: ' + error.message);
    return adminEmptyReferralData_(error.message);
  }
}

function adminFindReferralOutcomeRow_(sheet, bookingNumber) {
  var normalized = String(bookingNumber || '').trim();
  if (!normalized || sheet.getLastRow() < 2) return 0;

  var values = sheet
    .getRange(
      2,
      ADMIN_REFERRAL_OUTCOME_COLUMNS.BOOKING_NUM,
      sheet.getLastRow() - 1,
      1
    )
    .getDisplayValues();

  for (var index = 0; index < values.length; index += 1) {
    if (String(values[index][0] || '').trim() === normalized) return index + 2;
  }

  return 0;
}

function adminAppendReferralNote_(sheet, rowNumber, actor, action) {
  var range = sheet.getRange(
    rowNumber,
    ADMIN_REFERRAL_OUTCOME_COLUMNS.NOTE
  );
  var current = String(range.getValue() || '').trim();
  var entry = adminFormatDateTime_(new Date()) + ' ' + action + ' (' + actor + ')';

  range.setValue(current ? current + '\n' + entry : entry);
}

function adminUpdateReferralOutcome(request) {
  var actor = adminAssertAuthorized_();
  request = request || {};
  var bookingNumber = String(request.bookingNumber || '').trim();
  var action = String(request.action || '').trim();
  var allowedActions = ['confirm', 'unconfirm', 'cancel', 'paid'];

  if (!bookingNumber || allowedActions.indexOf(action) === -1) {
    throw new Error('紹介成果の更新内容が不正です。');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sheet = adminGetReferralOutcomeSheet_(true);
    var rowNumber = adminFindReferralOutcomeRow_(sheet, bookingNumber);

    if (!rowNumber) throw new Error('対象の紹介成果が見つかりません。');

    var values = sheet
      .getRange(
        rowNumber,
        ADMIN_REFERRAL_OUTCOME_COLUMNS.OUTCOME_STATUS,
        1,
        4
      )
      .getValues()[0];
    var status = String(values[0] || '未確定').trim();
    var confirmedAt = values[1] || '';
    var paymentStatus = String(values[2] || '未払い').trim();
    var paidAt = values[3] || '';
    var now = new Date();

    if (paymentStatus === '支払済' && action !== 'paid') {
      throw new Error('支払済みの成果は取消・未確定へ戻せません。');
    }

    if (action === 'confirm') {
      status = '確定';
      confirmedAt = confirmedAt || now;
      paymentStatus = '未払い';
      paidAt = '';
    } else if (action === 'unconfirm') {
      status = '未確定';
      confirmedAt = '';
      paymentStatus = '未払い';
      paidAt = '';
    } else if (action === 'cancel') {
      status = '取消';
      confirmedAt = '';
      paymentStatus = '未払い';
      paidAt = '';
    } else if (action === 'paid') {
      if (status !== '確定') {
        throw new Error('成果を確定してから支払済みにしてください。');
      }
      paymentStatus = '支払済';
      paidAt = paidAt || now;
    }

    sheet
      .getRange(
        rowNumber,
        ADMIN_REFERRAL_OUTCOME_COLUMNS.OUTCOME_STATUS,
        1,
        4
      )
      .setValues([[status, confirmedAt, paymentStatus, paidAt]]);
    adminAppendReferralNote_(sheet, rowNumber, actor, '紹介成果を' + action);
    SpreadsheetApp.flush();

    return {
      success: true,
      referrals: adminReadReferralData_()
    };

  } finally {
    lock.releaseLock();
  }
}

function adminCancelReferralOutcome_(bookingNumber, actor, actionNote) {
  var sheet = adminGetReferralOutcomeSheet_(false);
  if (!sheet) return '';

  var rowNumber = adminFindReferralOutcomeRow_(sheet, bookingNumber);
  if (!rowNumber) return '';

  var paymentStatus = String(
    sheet
      .getRange(rowNumber, ADMIN_REFERRAL_OUTCOME_COLUMNS.PAYMENT_STATUS)
      .getValue() || '未払い'
  ).trim();

  if (paymentStatus === '支払済') {
    return '紹介成果は支払済みのため自動取消ししていません。紹介成果シートを確認してください。';
  }

  sheet
    .getRange(
      rowNumber,
      ADMIN_REFERRAL_OUTCOME_COLUMNS.OUTCOME_STATUS,
      1,
      4
    )
    .setValues([['取消', '', '未払い', '']]);
  adminAppendReferralNote_(
    sheet,
    rowNumber,
    actor,
    actionNote || '予約状態に連動して紹介成果を取消'
  );

  return '';
}

function adminCancelReferralOutcomeForDeletedBooking_(bookingNumber, actor) {
  return adminCancelReferralOutcome_(
    bookingNumber,
    actor,
    '予約削除に連動して紹介成果を取消'
  );
}

/**
 * ステータス・開催場所・担当スタッフを安全に更新します。
 * ステータスと開催場所は、更新後にLINE全文プレビューを返します。
 * この関数だけではLINEは送信しません。
 */
function adminUpdateBooking(request) {
  var actor = adminAssertAuthorized_();
  request = request || {};

  if (!request.bookingKey) {
    throw new Error('予約を特定できませんでした。画面を更新してやり直してください。');
  }

  var updates = request.updates || {};
  var updateKeys = Object.keys(updates).filter(function(key) {
    return ['status', 'location', 'staff'].indexOf(key) !== -1;
  });

  if (!updateKeys.length) {
    throw new Error('更新する内容がありません。');
  }

  var lineRelatedCount = updateKeys.filter(function(key) {
    return key === 'status' || key === 'location';
  }).length;

  if (lineRelatedCount > 1) {
    throw new Error('予約ステータスと開催場所は1項目ずつ更新してください。');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sheet = adminGetBookingSheet_();
    var beforeBooking = adminFindBooking_(sheet, request.bookingKey);

    if (!beforeBooking) {
      throw new Error('予約が見つかりません。画面を更新してください。');
    }

    if (
      request.expectedVersion &&
      request.expectedVersion !== beforeBooking.version
    ) {
      throw new Error(
        'この予約は別の画面で更新されています。再読み込みして内容を確認してください。'
      );
    }

    var targetRows = adminResolveTargetRows_(beforeBooking, request);
    var auditChanges = [];
    var lineAction = null;

    updateKeys.forEach(function(key) {
      var value = String(updates[key] == null ? '' : updates[key]).trim();

      if (key === 'status') {
        adminValidateStatus_(value);
        targetRows = beforeBooking.rowNumbers.slice();
        adminWriteColumn_(sheet, targetRows, ADMIN_COLUMNS.BOOKING_STATUS, value);
        auditChanges.push('予約ステータス=' + (value || '空欄'));
        if (value) lineAction = { type: 'STATUS', value: value };

      } else if (key === 'location') {
        adminValidateLocation_(sheet, value);
        adminWriteColumn_(sheet, targetRows, ADMIN_COLUMNS.LOCATION, value);
        auditChanges.push('開催場所=' + (value || '空欄'));
        if (value) lineAction = { type: 'LOCATION', value: value };

      } else if (key === 'staff') {
        if (value.length > 60) {
          throw new Error('スタッフ名は60文字以内で入力してください。');
        }
        adminWriteColumn_(sheet, targetRows, ADMIN_COLUMNS.STAFF, value);
        auditChanges.push('スタッフ=' + (value || '空欄'));
      }
    });

    SpreadsheetApp.flush();

    var updatedBooking = adminFindBooking_(sheet, request.bookingKey);
    var pending = null;
    var warning = '';
    var referralData = null;

    // 既存の「満席」は予約不成立を表すため、未払いの紹介成果を残さない。
    // 紹介側の失敗で予約ステータス更新を巻き戻さないようbest-effortで行う。
    if (updateKeys.indexOf('status') !== -1 && updatedBooking.bookingStatus === '満席') {
      try {
        warning = adminJoinWarnings_(
          warning,
          adminCancelReferralOutcome_(
            updatedBooking.bookingNumber,
            actor,
            '予約ステータス「満席」に連動して紹介成果を取消'
          )
        );
        referralData = adminReadReferralData_();
      } catch (referralCancelError) {
        warning = adminJoinWarnings_(
          warning,
          '予約は満席へ更新しましたが、紹介成果を自動取消しできませんでした: ' +
            referralCancelError.message
        );
      }
    }

    if (lineAction) {
      var lineRow = adminSelectLineRow_(updatedBooking, targetRows[0]);
      var messageRow = adminFindComponentByRow_(updatedBooking, targetRows[0]) || lineRow;

      if (!lineRow || !lineRow.lineUserId) {
        warning = adminJoinWarnings_(
          warning,
          'LINE User IDが未登録のため、シートだけ更新しました。'
        );
      } else {
        pending = adminCreatePendingLine_(
          sheet,
          updatedBooking,
          lineRow,
          messageRow,
          lineAction,
          actor
        );
      }
    }

    adminAppendAudit_(
      actor,
      updatedBooking,
      '更新',
      auditChanges.join(' / '),
      targetRows
    );

    return {
      success: true,
      booking: adminToPublicBooking_(updatedBooking),
      pendingLine: pending,
      warning: warning,
      referrals: referralData
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * 確定前の予約日時を、予約一覧とGoogleカレンダーで同時更新します。
 * この処理でLINEは送信しません。
 */
function adminUpdateSchedule(request) {
  var actor = adminAssertAuthorized_();
  request = request || {};

  if (!request.bookingKey) {
    throw new Error('予約を特定できませんでした。');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sheet = adminGetBookingSheet_();
    var beforeBooking = adminFindBooking_(sheet, request.bookingKey);

    if (!beforeBooking) {
      throw new Error('予約が見つかりません。画面を更新してください。');
    }

    if (
      request.expectedVersion &&
      request.expectedVersion !== beforeBooking.version
    ) {
      throw new Error(
        'この予約は別の画面で更新されています。' +
        '再読み込みして内容を確認してください。'
      );
    }

    if (beforeBooking.bookingStatus !== '未対応') {
      throw new Error(
        '日時変更は「未対応」の予約だけ行えます。' +
        '確定後の変更はお客様へ個別にご案内ください。'
      );
    }

    if (!beforeBooking.bookingNumber) {
      throw new Error(
        '予約番号がない行はカレンダー予定を特定できないため、' +
        '管理画面から日時変更できません。'
      );
    }

    var changes = adminResolveScheduleChanges_(beforeBooking, request);
    var calendar = adminGetCalendar_();
    var assignments = adminFindCalendarAssignments_(
      calendar,
      beforeBooking
    );
    var operations = adminBuildCalendarScheduleOperations_(
      beforeBooking,
      changes,
      assignments
    );
    var originalSheetValues = adminReadOriginalScheduleValues_(
      sheet,
      beforeBooking.rowNumbers
    );
    var appliedCalendarOperations = [];

    try {
      operations.forEach(function(operation) {
        appliedCalendarOperations.push(operation);
        operation.event.setTime(operation.newStart, operation.newEnd);
        operation.event.setDescription(operation.newDescription);
      });

      changes.forEach(function(change) {
        sheet
          .getRange(change.rowNumber, ADMIN_COLUMNS.DATE, 1, 2)
          .setValues([[change.date, change.time]]);
      });

      SpreadsheetApp.flush();

    } catch (updateError) {
      var updateRollbackErrors = adminRollbackCalendarSchedule_(
        appliedCalendarOperations
      ).concat(
        adminRollbackSheetSchedule_(sheet, originalSheetValues)
      );

      if (updateRollbackErrors.length) {
        throw new Error(
          '日時変更中にエラーが発生し、自動復旧にも失敗しました。' +
          '予約一覧とGoogleカレンダーを確認してください。' +
          ' 変更エラー: ' + updateError.message +
          ' / 復旧エラー: ' + updateRollbackErrors.join(' / ')
        );
      }

      throw new Error(
        '日時変更を完了できなかったため、元の日時に戻しました。' +
        updateError.message
      );
    }

    var warning = '';

    try {
      adminClearPendingForBooking_(sheet, beforeBooking);
    } catch (pendingError) {
      warning = '日時は変更されましたが、古いLINE送信待ちを自動取消しできませんでした: ' +
        pendingError.message;
    }

    var updatedBooking = null;

    try {
      updatedBooking = adminFindBooking_(sheet, request.bookingKey);
    } catch (readError) {
      var readRollbackErrors = adminRollbackCalendarSchedule_(
        operations
      ).concat(
        adminRollbackSheetSchedule_(sheet, originalSheetValues)
      );

      if (readRollbackErrors.length) {
        throw new Error(
          '更新後の確認と自動復旧に失敗しました。' +
          '予約一覧とGoogleカレンダーを確認してください。' +
          ' 確認エラー: ' + readError.message +
          ' / 復旧エラー: ' + readRollbackErrors.join(' / ')
        );
      }

      throw new Error(
        '更新後の予約を確認できなかったため元に戻しました。' +
        readError.message
      );
    }

    if (!updatedBooking) {
      var missingRollbackErrors = adminRollbackCalendarSchedule_(
        operations
      ).concat(
        adminRollbackSheetSchedule_(sheet, originalSheetValues)
      );

      if (missingRollbackErrors.length) {
        throw new Error(
          '更新後の予約を確認できず、自動復旧にも失敗しました。' +
          '予約一覧とGoogleカレンダーを確認してください。' +
          ' 復旧エラー: ' + missingRollbackErrors.join(' / ')
        );
      }

      throw new Error('更新後の予約を確認できなかったため元に戻しました。');
    }

    try {
      adminAppendAudit_(
        actor,
        updatedBooking,
        '予約日時変更',
        adminBuildScheduleText_(beforeBooking) +
          ' → ' + adminBuildScheduleText_(updatedBooking),
        updatedBooking.rowNumbers
      );
    } catch (auditError) {
      warning = adminJoinWarnings_(
        warning,
        '日時は変更されましたが、操作履歴を記録できませんでした: ' +
          auditError.message
      );
    }

    return {
      success: true,
      booking: adminToPublicBooking_(updatedBooking),
      warning: warning
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * 予約内容を後から安全に変更します。
 * 単品・2予定セット・3予定セットを相互変換し、予約一覧とGoogleカレンダーを
 * 一括更新します。この処理だけではLINEを送信しません。
 */
function adminChangeReservation(request) {
  var actor = adminAssertAuthorized_();
  request = request || {};

  if (!request.bookingKey) throw new Error('変更する予約を特定できません。');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sheet = adminGetBookingSheet_();
    var beforeBooking = adminFindBooking_(sheet, request.bookingKey);

    if (!beforeBooking) {
      throw new Error('予約が見つかりません。画面を更新してください。');
    }

    if (
      request.expectedVersion &&
      request.expectedVersion !== beforeBooking.version
    ) {
      throw new Error(
        'この予約は別の画面で更新されています。再読み込みして内容を確認してください。'
      );
    }

    if (!beforeBooking.bookingNumber) {
      throw new Error('予約番号がない予約は管理画面から内容変更できません。');
    }

    var reason = String(request.reason || '').trim();
    if (!reason || reason.length > 500) {
      throw new Error('変更理由を1〜500文字で入力してください。');
    }

    var plan = adminGetPlanById_(request.planId);
    if (!plan) throw new Error('変更後のプランを選択してください。');

    var normalized = adminNormalizeReservationChange_(
      beforeBooking,
      plan,
      request
    );
    var oldRows = adminReadFullBookingRows_(sheet, beforeBooking.rowNumbers);
    var targetRowNumbers = beforeBooking.rowNumbers.slice(0, plan.components.length);
    var addedRowNumbers = [];
    var nextAppendRow = Math.max(sheet.getLastRow() + 1, 2);

    while (targetRowNumbers.length < plan.components.length) {
      var nextRow = nextAppendRow + addedRowNumbers.length;
      targetRowNumbers.push(nextRow);
      addedRowNumbers.push(nextRow);
      sheet.getRange(nextRow, 1, 1, ADMIN_COLUMNS.REFERRAL_CAMPAIGN).clearContent();
    }

    var calendar = adminGetCalendar_();
    var oldCalendar = adminFindCalendarEventsForDeletion_(calendar, beforeBooking);
    var deletedOldEvents = [];
    var createdEvents = [];
    var updatedBooking = null;
    var newRows = adminBuildChangedRows_(
      sheet,
      beforeBooking,
      plan,
      normalized,
      targetRowNumbers
    );

    try {
      oldCalendar.events.forEach(function(event) {
        var snapshot = adminSnapshotCalendarEvent_(event);
        event.deleteEvent();
        deletedOldEvents.push(snapshot);
      });

      targetRowNumbers.forEach(function(rowNumber, index) {
        sheet
          .getRange(rowNumber, 1, 1, ADMIN_COLUMNS.REFERRAL_CAMPAIGN)
          .setValues([newRows[index]]);
      });

      beforeBooking.rowNumbers
        .slice(plan.components.length)
        .forEach(function(rowNumber) {
          sheet
            .getRange(rowNumber, 1, 1, ADMIN_COLUMNS.REFERRAL_CAMPAIGN)
            .clearContent();
        });

      SpreadsheetApp.flush();

      normalized.components.forEach(function(component, index) {
        createdEvents.push(
          adminCreateChangedCalendarEvent_(
            calendar,
            beforeBooking,
            plan,
            component,
            normalized,
            newRows[index]
          )
        );
      });

      updatedBooking = adminFindBooking_(
        sheet,
        'BOOKING:' + beforeBooking.bookingNumber
      );

      if (!updatedBooking) {
        throw new Error('変更後の予約を読み取れませんでした。');
      }
      if (
        updatedBooking.componentCount !== plan.components.length ||
        updatedBooking.planId !== plan.id ||
        updatedBooking.totalPrice !== normalized.totalPrice
      ) {
        throw new Error('変更後の予約内容が保存値と一致しませんでした。');
      }

    } catch (updateError) {
      var rollbackErrors = [];

      createdEvents.forEach(function(event) {
        try {
          event.deleteEvent();
        } catch (error) {
          rollbackErrors.push('新カレンダー予定削除: ' + error.message);
        }
      });

      rollbackErrors = rollbackErrors.concat(
        adminRestoreFullBookingRows_(sheet, oldRows)
      );

      addedRowNumbers.forEach(function(rowNumber) {
        try {
          sheet
            .getRange(rowNumber, 1, 1, ADMIN_COLUMNS.REFERRAL_CAMPAIGN)
            .clearContent();
        } catch (error) {
          rollbackErrors.push('追加行' + rowNumber + 'の取消: ' + error.message);
        }
      });

      if (deletedOldEvents.length) {
        rollbackErrors = rollbackErrors.concat(
          adminRestoreCalendarEvents_(calendar, deletedOldEvents)
        );
      }

      throw new Error(
        '予約変更を完了できなかったため元の状態へ戻しました。' +
        updateError.message +
        (rollbackErrors.length
          ? ' / 自動復旧の確認が必要です: ' + rollbackErrors.join(' / ')
          : '')
      );
    }

    var warning = oldCalendar.warning || '';

    try {
      adminClearPendingForBooking_(sheet, updatedBooking);
    } catch (pendingError) {
      warning = adminJoinWarnings_(
        warning,
        '古いLINE送信待ちを取消できませんでした: ' + pendingError.message
      );
    }

    var changeSummary = adminBuildReservationChangeSummary_(
      beforeBooking,
      updatedBooking,
      reason
    );

    try {
      adminAppendReservationChangeHistory_(
        actor,
        beforeBooking,
        updatedBooking,
        reason,
        changeSummary
      );
      adminAppendAudit_(
        actor,
        updatedBooking,
        '予約内容変更',
        changeSummary,
        updatedBooking.rowNumbers
      );
    } catch (historyError) {
      warning = adminJoinWarnings_(
        warning,
        '予約は変更されましたが、変更履歴を記録できませんでした: ' +
          historyError.message
      );
    }

    return {
      success: true,
      booking: adminToPublicBooking_(updatedBooking),
      warning: warning,
      changeSummary: changeSummary,
      suggestedLineMessage: adminBuildChangeNoticeMessage_(
        updatedBooking,
        changeSummary
      )
    };

  } finally {
    lock.releaseLock();
  }
}

function adminNormalizeReservationChange_(beforeBooking, plan, request) {
  var counts = request.counts || {};
  var adult = adminValidateCount_(counts.adult, '大人');
  var child = adminValidateCount_(counts.child, '子供');
  var under3 = adminValidateCount_(counts.under3, '3歳未満');

  if (adult + child + under3 < 1) {
    throw new Error('参加人数は1名以上にしてください。');
  }

  var totalPrice = Number(request.totalPrice);
  var couponDiscount = Number(request.couponDiscount || 0);

  if (!isFinite(totalPrice) || totalPrice < 0 || totalPrice > 10000000) {
    throw new Error('合計金額を0〜10,000,000円で入力してください。');
  }
  if (
    !isFinite(couponDiscount) ||
    couponDiscount < 0 ||
    couponDiscount > 1000000
  ) {
    throw new Error('クーポン割引額を0〜1,000,000円で入力してください。');
  }

  if (plan.id.charAt(0) === 'C') {
    couponDiscount = 0;
    request.couponCode = '';
  }

  var customerName = String(request.customerName || '').trim();
  var phone = String(request.phone || '').trim();
  var email = String(request.email || '').trim();
  var participants = String(request.participants || '').trim();
  var participantAges = String(request.participantAges || '').trim();
  var participantHeights = String(request.participantHeights || '').trim();
  var participantWeights = String(request.participantWeights || '').trim();
  var participantFootSizes = String(request.participantFootSizes || '').trim();
  var specialRequests = String(request.specialRequests || '').trim();

  if (!customerName || customerName.length > 120) {
    throw new Error('お客様名を1〜120文字で入力してください。');
  }
  if (!phone || phone.length > 40) {
    throw new Error('電話番号を1〜40文字で入力してください。');
  }
  if (email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new Error('メールアドレスを確認してください。');
  }
  if (participants.length > 5000 || specialRequests.length > 5000) {
    throw new Error('参加者詳細または要望が長すぎます。');
  }
  if (
    participantAges.length > 2000 ||
    participantHeights.length > 2000 ||
    participantWeights.length > 2000 ||
    participantFootSizes.length > 2000
  ) {
    throw new Error('参加者の年齢・身長・体重・足サイズが長すぎます。');
  }

  var requestedComponents = Array.isArray(request.components)
    ? request.components
    : [];
  var byRole = {};

  requestedComponents.forEach(function(component) {
    var role = String(component && component.role || '');
    if (role) byRole[role] = component;
  });

  var components = plan.components.map(function(definition) {
    var source = byRole[definition.role] || {};
    var date = String(source.date || '').trim();
    var time = adminNormalizeScheduleTime_(source.time);

    adminValidateScheduleDate_(date);
    if (!time) {
      throw new Error('「' + definition.plan + '」の開始時間を入力してください。');
    }

    return {
      plan: definition.plan,
      role: definition.role,
      duration: definition.duration,
      date: date,
      time: time
    };
  });

  if (plan.autoSup) {
    var turtle = components.filter(function(component) {
      return component.role === 'turtle';
    })[0];
    var sup = components.filter(function(component) {
      return component.role === 'sup';
    })[0];

    if (turtle && sup) {
      sup.date = turtle.date;
      sup.time = adminAddMinutesToScheduleTime_(turtle.time, 90);
    }
  }

  return {
    counts: { adult: adult, child: child, under3: under3 },
    headcount: '大人' + adult + '名 / 子供' + child + '名 / 3歳未満' + under3 + '名',
    totalPrice: Math.round(totalPrice),
    couponDiscount: Math.round(couponDiscount),
    couponCode: String(request.couponCode || '').trim().slice(0, 100),
    customerName: customerName,
    phone: phone,
    email: email,
    participants: participants,
    participantAges: participantAges,
    participantHeights: participantHeights,
    participantWeights: participantWeights,
    participantFootSizes: participantFootSizes,
    specialRequests: specialRequests,
    components: components,
    status: ['確定', '満席'].indexOf(
      String(request.bookingStatus || beforeBooking.bookingStatus || '').trim()
    ) !== -1
      ? String(request.bookingStatus || beforeBooking.bookingStatus || '').trim()
      : ''
  };
}

function adminValidateCount_(value, label) {
  var count = Number(value || 0);

  if (!isFinite(count) || count < 0 || count > 99 || Math.floor(count) !== count) {
    throw new Error(label + 'の人数を0〜99の整数で入力してください。');
  }

  return count;
}

function adminSplitAmountByComponents_(amount, componentCount) {
  var total = Math.round(Number(amount || 0));
  var count = Math.max(Number(componentCount || 1), 1);
  var base = Math.floor(total / count);

  return Array.apply(null, Array(count)).map(function(_, index) {
    return base + (index >= count - (total - base * count) ? 1 : 0);
  });
}

function adminFindOldComponentForRole_(booking, role) {
  var components = booking && booking.components || [];

  for (var i = 0; i < components.length; i++) {
    var plan = String(components[i].plan || '');
    if (role === 'night' && adminIsNightPlan_(plan)) return components[i];
    if (role === 'sup' && plan.indexOf('SUP') !== -1) return components[i];
    if (
      role === 'turtle' &&
      (plan.indexOf('海亀') !== -1 || plan.indexOf('ウミガメ') !== -1)
    ) return components[i];
  }

  return components[0] || null;
}

function adminBuildChangedRows_(sheet, beforeBooking, plan, normalized, rowNumbers) {
  var sourceValues = sheet
    .getRange(beforeBooking.rowNumbers[0], 1, 1, ADMIN_COLUMNS.REFERRAL_CAMPAIGN)
    .getValues()[0];
  var prices = adminSplitAmountByComponents_(
    normalized.totalPrice,
    plan.components.length
  );
  var discounts = adminSplitAmountByComponents_(
    normalized.couponDiscount,
    plan.components.length
  );

  return plan.components.map(function(definition, index) {
    var values = sourceValues.slice();
    var schedule = normalized.components[index];
    var oldComponent = adminFindOldComponentForRole_(
      beforeBooking,
      definition.role
    );

    while (values.length < ADMIN_COLUMNS.REFERRAL_CAMPAIGN) values.push('');

    values[ADMIN_COLUMNS.BOOKING_NUM - 1] = beforeBooking.bookingNumber;
    values[ADMIN_COLUMNS.DATE - 1] = schedule.date;
    values[ADMIN_COLUMNS.TIME - 1] = schedule.time;
    values[ADMIN_COLUMNS.NAME - 1] = normalized.customerName;
    values[ADMIN_COLUMNS.PLAN - 1] = definition.plan;
    values[ADMIN_COLUMNS.TOTAL_PRICE - 1] = prices[index];
    values[ADMIN_COLUMNS.PHONE - 1] = normalized.phone;
    values[ADMIN_COLUMNS.HEADCOUNT - 1] = normalized.headcount;
    values[ADMIN_COLUMNS.PARTICIPANTS - 1] = normalized.participants;
    values[ADMIN_COLUMNS.BOOKING_STATUS - 1] = normalized.status === '未対応'
      ? ''
      : normalized.status;
    values[ADMIN_COLUMNS.LOCATION - 1] = oldComponent
      ? oldComponent.location
      : '';
    values[ADMIN_COLUMNS.STAFF - 1] = oldComponent ? oldComponent.staff : '';
    values[ADMIN_COLUMNS.COUPON_CODE - 1] = normalized.couponCode;
    values[ADMIN_COLUMNS.COUPON_DISCOUNT - 1] = discounts[index];
    values[ADMIN_COLUMNS.LINE_CONFIRM - 1] = '';
    values[ADMIN_COLUMNS.LINE_RESULT - 1] = '';
    values[ADMIN_COLUMNS.EMAIL - 1] = normalized.email;
    values[ADMIN_COLUMNS.PARTICIPANT_AGES - 1] = normalized.participantAges;
    values[ADMIN_COLUMNS.PARTICIPANT_HEIGHTS - 1] = normalized.participantHeights;
    values[ADMIN_COLUMNS.PARTICIPANT_WEIGHTS - 1] = normalized.participantWeights;
    values[ADMIN_COLUMNS.PARTICIPANT_FOOT_SIZES - 1] =
      normalized.participantFootSizes;
    values[ADMIN_COLUMNS.SPECIAL_REQUESTS - 1] = normalized.specialRequests;
    values[ADMIN_COLUMNS.PLAN_ID - 1] = plan.id;

    return values;
  });
}

function adminCreateChangedCalendarEvent_(
  calendar,
  beforeBooking,
  plan,
  component,
  normalized,
  rowValues
) {
  var start = adminDateTimeFromTexts_(component.date, component.time);
  var end = new Date(start.getTime() + Number(component.duration || 120) * 60000);
  var isPrivate = String(plan.name || '').indexOf('貸切') !== -1;
  var eventPrefix = isPrivate ? 'WEB VIP' : 'WEB予約';
  var eventEmoji = component.role === 'night'
    ? '🦀'
    : (component.role === 'sup' ? '🏄' : '🐢');
  var eventColor = component.role === 'night'
    ? '8'
    : (component.role === 'sup' ? '6' : '2');
  var title = eventPrefix + ' ' + eventEmoji + ' ' + component.plan + ' / ' +
    normalized.customerName + ' / ' + normalized.headcount;
  var description = [
    '予約番号: ' + beforeBooking.bookingNumber,
    '名前: ' + normalized.customerName,
    '電話: ' + normalized.phone,
    'メール: ' + normalized.email,
    '参加日: ' + component.date,
    '時間: ' + component.time,
    'プラン: ' + component.plan,
    '元プラン: ' + plan.name,
    '人数: ' + normalized.headcount,
    'この予定の売上: ' + adminFormatYen_(
      rowValues[ADMIN_COLUMNS.TOTAL_PRICE - 1]
    ),
    '予約全体の受取金額: ' + adminFormatYen_(normalized.totalPrice),
    '参加者詳細: ' + (normalized.participants || 'なし'),
    '参加者年齢: ' + (normalized.participantAges || 'なし'),
    '参加者身長: ' + (normalized.participantHeights || 'なし'),
    '参加者体重: ' + (normalized.participantWeights || 'なし'),
    '参加者足サイズ: ' + (normalized.participantFootSizes || 'なし'),
    '要望: ' + (normalized.specialRequests || 'なし')
  ].join('\n');
  var oldComponent = adminFindOldComponentForRole_(
    beforeBooking,
    component.role
  );

  if (oldComponent && oldComponent.staff) {
    description += '\n担当スタッフ: ' + oldComponent.staff;
  }

  var event = calendar.createEvent(title, start, end, {
    description: description,
    location: oldComponent && oldComponent.location
      ? oldComponent.location
      : '宮古島'
  });

  try {
    event.setColor(eventColor);
  } catch (colorError) {
    Logger.log('変更後カレンダー予定の色設定失敗: ' + colorError.message);
  }

  return event;
}

function adminBuildReservationChangeSummary_(beforeBooking, afterBooking, reason) {
  var beforeCounts = adminParseHeadcount_(beforeBooking.headcount);
  var afterCounts = adminParseHeadcount_(afterBooking.headcount);

  return [
    '理由=' + reason,
    'プラン=' + beforeBooking.displayPlan + ' → ' + afterBooking.displayPlan,
    '日時=' + adminBuildScheduleText_(beforeBooking) + ' → ' +
      adminBuildScheduleText_(afterBooking),
    '人数=' + beforeCounts.adult + '/' + beforeCounts.child + '/' +
      beforeCounts.under3 + ' → ' + afterCounts.adult + '/' +
      afterCounts.child + '/' + afterCounts.under3,
    '金額=' + adminFormatYen_(beforeBooking.totalPrice) + ' → ' +
      adminFormatYen_(afterBooking.totalPrice),
    '氏名=' + beforeBooking.name + ' → ' + afterBooking.name,
    '電話=' + beforeBooking.phone + ' → ' + afterBooking.phone,
    'メール=' + (beforeBooking.email || 'なし') + ' → ' +
      (afterBooking.email || 'なし')
  ].join(' / ');
}

function adminAppendReservationChangeHistory_(
  actor,
  beforeBooking,
  afterBooking,
  reason,
  summary
) {
  var ss = adminGetSpreadsheet_();
  var sheetName = '予約変更履歴';
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  var headers = [
    '変更日時', '操作者', '予約番号', '名前', '変更理由', '変更概要',
    '変更前JSON', '変更後JSON', 'アプリ版'
  ];

  if (String(sheet.getRange(1, 1).getValue()) !== headers[0]) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#d9ead3');
  }

  sheet.appendRow([
    new Date(),
    actor,
    afterBooking.bookingNumber || beforeBooking.bookingNumber,
    afterBooking.name || beforeBooking.name,
    reason,
    summary,
    JSON.stringify(adminToPublicBooking_(beforeBooking)).slice(0, 45000),
    JSON.stringify(adminToPublicBooking_(afterBooking)).slice(0, 45000),
    ADMIN_APP_VERSION
  ]);
}

function adminBuildChangeNoticeMessage_(booking, summary) {
  return (
    (booking.name || 'お客様') + ' 様\n\n' +
    'ご予約内容を下記の通り変更いたしました。\n\n' +
    '【変更後の内容】\n' +
    'プラン：' + booking.displayPlan + '\n' +
    '日時：' + adminBuildScheduleText_(booking) + '\n' +
    '人数：' + booking.headcount + '\n' +
    '合計金額：' + adminFormatYen_(booking.totalPrice) + '\n\n' +
    '内容をご確認いただき、ご不明点がございましたらご連絡ください。\n\n' +
    '海亀兄弟'
  );
}

/**
 * 重複予約を削除します。
 * 元データは「削除済み予約」シートへ退避し、
 * 対応するGoogleカレンダー予定も削除します。
 * LINEは送信しません。
 */
function adminDeleteBooking(request) {
  var actor = adminAssertAuthorized_();
  request = request || {};

  if (!request.bookingKey) {
    throw new Error('削除する予約を特定できません。');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sheet = adminGetBookingSheet_();
    var booking = adminFindBooking_(sheet, request.bookingKey);

    if (!booking) {
      throw new Error('予約が見つかりません。画面を更新してください。');
    }

    if (
      request.expectedVersion &&
      request.expectedVersion !== booking.version
    ) {
      throw new Error(
        'この予約は別の画面で更新されています。' +
        '再読み込みして内容を確認してください。'
      );
    }

    if (!booking.bookingNumber) {
      throw new Error('予約番号がない行は管理画面から削除できません。');
    }

    if (request.confirmed !== true) {
      throw new Error('削除確認が完了していないため、削除を中止しました。');
    }

    var originalRows = adminReadFullBookingRows_(sheet, booking.rowNumbers);
    var archive = adminArchiveDeletedBooking_(
      sheet,
      booking,
      originalRows,
      actor
    );
    var calendar = adminGetCalendar_();
    var calendarResult = adminFindCalendarEventsForDeletion_(
      calendar,
      booking
    );
    var deletedCalendarSnapshots = [];

    try {
      calendarResult.events.forEach(function(event) {
        var snapshot = adminSnapshotCalendarEvent_(event);
        event.deleteEvent();
        deletedCalendarSnapshots.push(snapshot);
      });

    } catch (calendarError) {
      var calendarRestoreErrors = adminRestoreCalendarEvents_(
        calendar,
        deletedCalendarSnapshots
      );

      throw new Error(
        'Googleカレンダー予定を削除できなかったため、' +
        '予約一覧は削除していません。' +
        calendarError.message +
        (
          calendarRestoreErrors.length
            ? ' / カレンダー復旧エラー: ' + calendarRestoreErrors.join(' / ')
            : ''
        )
      );
    }

    try {
      booking.rowNumbers.forEach(function(rowNumber) {
        sheet
          .getRange(rowNumber, 1, 1, ADMIN_COLUMNS.REFERRAL_CAMPAIGN)
          .clearContent();
      });

      SpreadsheetApp.flush();
      adminDeletePendingPropertiesForBooking_(booking);

    } catch (sheetError) {
      var sheetRestoreErrors = adminRestoreFullBookingRows_(sheet, originalRows);
      var eventRestoreErrors = adminRestoreCalendarEvents_(
        calendar,
        deletedCalendarSnapshots
      );
      var restoreErrors = sheetRestoreErrors.concat(eventRestoreErrors);

      throw new Error(
        '予約一覧から削除できなかったため自動復旧しました。' +
        sheetError.message +
        (
          restoreErrors.length
            ? ' / 復旧エラー: ' + restoreErrors.join(' / ')
            : ''
        )
      );
    }

    var warning = calendarResult.warning || '';

    try {
      adminMarkDeletedArchiveComplete_(archive);
    } catch (archiveStatusError) {
      warning = adminJoinWarnings_(
        warning,
        '予約は削除されましたが、削除済み予約の完了表示を更新できませんでした: ' +
          archiveStatusError.message
      );
    }

    try {
      adminAppendAudit_(
        actor,
        booking,
        '予約削除',
        '削除済み予約へ退避 / カレンダー' +
          calendarResult.events.length + '件削除',
        booking.rowNumbers
      );
    } catch (auditError) {
      warning = adminJoinWarnings_(
        warning,
        '予約は削除されましたが、操作履歴を記録できませんでした: ' +
          auditError.message
      );
    }

    try {
      warning = adminJoinWarnings_(
        warning,
        adminCancelReferralOutcomeForDeletedBooking_(
          booking.bookingNumber,
          actor
        )
      );
    } catch (referralCancelError) {
      warning = adminJoinWarnings_(
        warning,
        '予約は削除されましたが、紹介成果を自動取消しできませんでした: ' +
          referralCancelError.message
      );
    }

    return {
      success: true,
      deletedBookingKey: booking.key,
      bookingNumber: booking.bookingNumber,
      deletedRowCount: booking.rowNumbers.length,
      deletedCalendarCount: calendarResult.events.length,
      warning: warning
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * 自由メッセージの全文確認を準備します。まだ送信しません。
 */
function adminPrepareCustomLine(request) {
  var actor = adminAssertAuthorized_();
  request = request || {};

  var message = String(request.message || '').trim();

  if (!request.bookingKey) {
    throw new Error('予約を特定できませんでした。');
  }
  if (!message) {
    throw new Error('LINEメッセージを入力してください。');
  }
  if (message.length > 4500) {
    throw new Error('LINEメッセージが長すぎます。4500文字以内にしてください。');
  }

  var sheet = adminGetBookingSheet_();
  var booking = adminFindBooking_(sheet, request.bookingKey);

  if (!booking) throw new Error('予約が見つかりません。');

  if (
    request.expectedVersion &&
    request.expectedVersion !== booking.version
  ) {
    throw new Error('予約内容が更新されています。画面を更新してください。');
  }

  var lineRow = adminSelectLineRow_(booking, request.rowNumber);

  if (!lineRow || !lineRow.lineUserId) {
    throw new Error('この予約にはLINE User IDが登録されていません。');
  }

  return adminSavePendingLine_({
    bookingKey: booking.key,
    bookingNumber: booking.bookingNumber,
    rowNumbers: [lineRow.rowNumber],
    sourceRowNumber: lineRow.rowNumber,
    type: 'FREE',
    expectedValue: message,
    summary: '自由メッセージ',
    message: message,
    lineUserId: lineRow.lineUserId,
    actor: actor,
    createdAt: new Date().toISOString()
  });
}

/**
 * プレビュー済みのLINEを送信します。
 * 保存時の値と現在のシート値が違う場合は中止します。
 */
function adminConfirmLine(request) {
  var actor = adminAssertAuthorized_();
  request = request || {};
  var token = String(request.token || '');

  if (!token) throw new Error('送信確認情報がありません。');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var pending = adminReadPendingLine_(token);

    if (!pending) {
      throw new Error('送信確認の有効期限が切れました。もう一度プレビューしてください。');
    }

    var createdAt = new Date(pending.createdAt).getTime();
    var expiresAt = createdAt + ADMIN_PENDING_TTL_MINUTES * 60 * 1000;

    if (!createdAt || Date.now() > expiresAt) {
      adminDeletePendingLine_(token);
      throw new Error('送信確認の有効期限が切れました。もう一度プレビューしてください。');
    }

    var sheet = adminGetBookingSheet_();
    var booking = adminFindBooking_(sheet, pending.bookingKey);

    if (!booking) throw new Error('予約が見つからないため送信を中止しました。');

    var sourceRow = adminSelectLineRow_(booking, pending.sourceRowNumber);

    if (!sourceRow || sourceRow.lineUserId !== pending.lineUserId) {
      throw new Error('LINE送信先が変更されたため送信を中止しました。');
    }

    adminAssertPendingStillValid_(booking, pending);

    if (
      pending.type === 'STATUS' &&
      adminWasSuccessfulStatusSent_(pending.bookingNumber, pending.summary)
    ) {
      throw new Error(
        '同じ予約の同じステータスLINEは送信済みです。再送する場合は自由メッセージを使ってください。'
      );
    }

    var result = adminSendLine_(
      pending.lineUserId,
      pending.message,
      pending,
      sourceRow,
      actor
    );

    // LINE送信成功後は、履歴やU列の記録に失敗しても同じ確認トークンで
    // 再送されないよう、先に送信済み状態を確定する。
    if (result.success) {
      adminDeletePendingLine_(token);

      if (pending.type === 'STATUS') {
        try {
          adminMarkSuccessfulStatusSent_(
            pending.bookingNumber,
            pending.summary
          );
        } catch (sentMarkerError) {
          result.warning = adminJoinWarnings_(
            result.warning,
            'ステータスLINEの送信済み情報を保存できませんでした: ' +
              sentMarkerError.message
          );
        }
      }
    }

    var resultText = result.success
      ? '✅ ' + adminFormatDateTime_(new Date()) + ' WEB管理画面から送信済：' + pending.summary
      : '⚠️ WEB管理画面から送信失敗：' + result.error;

    try {
      sheet
        .getRange(sourceRow.rowNumber, ADMIN_COLUMNS.LINE_CONFIRM)
        .setValue(false);
      sheet
        .getRange(sourceRow.rowNumber, ADMIN_COLUMNS.LINE_RESULT)
        .setValue(resultText)
        .setBackground(result.success ? '#d9ead3' : '#f4cccc');
    } catch (sheetError) {
      result.warning = adminJoinWarnings_(
        result.warning,
        'LINE送信結果を予約一覧へ記録できませんでした: ' + sheetError.message
      );
    }

    return {
      success: result.success,
      error: result.error || '',
      warning: result.warning || '',
      sentAt: new Date().toISOString(),
      resultText: resultText
    };

  } finally {
    lock.releaseLock();
  }
}

function adminCancelLine(request) {
  var actor = adminAssertAuthorized_();
  var token = String(request && request.token || '');

  if (token) {
    var pending = adminReadPendingLine_(token);

    if (pending) {
      var sheet = adminGetBookingSheet_();
      var booking = adminFindBooking_(sheet, pending.bookingKey);

      if (booking) {
        var sourceRow = adminSelectLineRow_(booking, pending.sourceRowNumber);

        if (sourceRow && pending.type !== 'FREE') {
          sheet
            .getRange(sourceRow.rowNumber, ADMIN_COLUMNS.LINE_CONFIRM)
            .setValue(false)
            .setBackground(null);
          sheet
            .getRange(sourceRow.rowNumber, ADMIN_COLUMNS.LINE_RESULT)
            .setValue('WEB送信キャンセル：' + pending.summary)
            .setBackground(null);
        }

        adminAppendAudit_(
          actor,
          booking,
          'LINE送信キャンセル',
          pending.summary,
          pending.rowNumbers || []
        );
      }
    }

    adminDeletePendingLine_(token);
  }

  return { success: true };
}

function adminGetHistory(request) {
  adminAssertAuthorized_();
  var bookingNumber = String(request && request.bookingNumber || '');
  var ss = adminGetSpreadsheet_();
  var sheet = ss.getSheetByName(ADMIN_LINE_LOG_SHEET_NAME);

  if (!sheet || sheet.getLastRow() < 2) return [];

  var startRow = Math.max(2, sheet.getLastRow() - 299);
  var values = sheet
    .getRange(startRow, 1, sheet.getLastRow() - startRow + 1, 11)
    .getDisplayValues();

  return values
    .filter(function(row) {
      return !bookingNumber || String(row[1]) === bookingNumber;
    })
    .slice(-50)
    .reverse()
    .map(function(row) {
      return {
        sentAt: row[0],
        bookingNumber: row[1],
        name: row[2],
        date: row[3],
        time: row[4],
        plan: row[5],
        type: row[6],
        message: row[8],
        result: row[9],
        rowNumber: row[10]
      };
    });
}

// ============================================================
// 認証・設定
// ============================================================

function adminAssertAuthorized_() {
  var email = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  var allowedText = String(
    PropertiesService.getScriptProperties().getProperty('ADMIN_ALLOWED_EMAILS') || ''
  );
  var allowed = allowedText
    .split(',')
    .map(function(value) { return value.trim().toLowerCase(); })
    .filter(String);

  if (!allowed.length) {
    throw new Error(
      'ADMIN_ALLOWED_EMAILSが未設定です。管理者メールアドレスをスクリプトプロパティへ登録してください。'
    );
  }

  if (!email || allowed.indexOf(email) === -1) {
    throw new Error('この管理画面を利用する権限がありません。');
  }

  return email;
}

function adminGetSpreadsheet_() {
  var id = String(
    PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') ||
    ADMIN_DEFAULT_SPREADSHEET_ID
  ).trim();

  if (!id) throw new Error('SPREADSHEET_IDが設定されていません。');

  return SpreadsheetApp.openById(id);
}

function adminGetBookingSheet_() {
  var sheet = adminGetSpreadsheet_().getSheetByName(ADMIN_BOOKING_SHEET_NAME);

  if (!sheet) throw new Error('予約一覧シートが見つかりません。');

  adminEnsureBookingSchema_(sheet);

  return sheet;
}

// 予約受付GASと管理Webアプリで列順を共通化する。
// 2026-08-13の衝突版（T=メール、U=Visitor ID）だけを検出して、
// T/UをLINE管理列へ戻し、顧客・行動データをV列以降へ移す。
function adminEnsureBookingSchema_(sheet) {
  var properties = PropertiesService.getScriptProperties();
  var verifiedAt = Number(
    properties.getProperty(ADMIN_SCHEMA_VERIFIED_AT_PROPERTY) || 0
  );
  var verificationIsFresh =
    properties.getProperty(ADMIN_SCHEMA_VERSION_PROPERTY) ===
      ADMIN_SCHEMA_VERSION &&
    verifiedAt > 0 &&
    Date.now() - verifiedAt < ADMIN_SCHEMA_VERIFY_INTERVAL_MS;

  // ヘッダーは通常変わらないため、起動のたびにシートへ問い合わせない。
  // 6時間ごとには実物を再確認し、手動変更も自動修復する。
  if (verificationIsFresh) return;

  var schemaChanged = false;
  var maxColumns = sheet.getMaxColumns();
  var headerWidth = Math.min(
    maxColumns,
    ADMIN_CANONICAL_HEADERS.length
  );
  var existing = headerWidth > 0
    ? sheet.getRange(1, 1, 1, headerWidth).getDisplayValues()[0]
    : [];

  if (maxColumns >= 21) {
    var hasCollision =
      String(existing[19] || '').trim() === 'メールアドレス' &&
      String(existing[20] || '').trim() === 'Visitor ID';

    if (hasCollision) {
      adminMigrateCollidingCustomerColumns_(sheet);
      schemaChanged = true;
      maxColumns = sheet.getMaxColumns();
      existing = [];
    }
  }

  var missingColumns = ADMIN_CANONICAL_HEADERS.length - maxColumns;
  if (missingColumns > 0) {
    sheet.insertColumnsAfter(maxColumns, missingColumns);
    schemaChanged = true;
    maxColumns += missingColumns;
    existing = [];
  }

  // 通常の現行列構成は上で一度だけ読む。移行・列追加時だけ読み直す。
  if (existing.length !== ADMIN_CANONICAL_HEADERS.length) {
    existing = sheet
      .getRange(1, 1, 1, ADMIN_CANONICAL_HEADERS.length)
      .getDisplayValues()[0];
  }
  var headersMatch = ADMIN_CANONICAL_HEADERS.every(function(header, index) {
    return String(existing[index] || '') === header;
  });

  var needsRepair =
    schemaChanged ||
    !headersMatch ||
    properties.getProperty(ADMIN_SCHEMA_VERSION_PROPERTY) !==
      ADMIN_SCHEMA_VERSION;

  if (!needsRepair) {
    adminRefreshLocationOptionsCache_(sheet, properties);
    properties.setProperty(
      ADMIN_SCHEMA_VERIFIED_AT_PROPERTY,
      String(Date.now())
    );
    return;
  }

  // ヘッダー書き込み前にT/Uの古い規則を外す。
  // 修復済みの通常読込ではシートへ一切書き込まない。
  adminClearLineColumnValidations_(sheet);

  if (!headersMatch) {
    sheet
      .getRange(1, 1, 1, ADMIN_CANONICAL_HEADERS.length)
      .setValues([ADMIN_CANONICAL_HEADERS]);
  }

  adminClearInvalidLineResults_(sheet);

  var checkboxRule = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .setAllowInvalid(false)
    .build();

  sheet
    .getRange(2, ADMIN_COLUMNS.LINE_CONFIRM, Math.max(sheet.getMaxRows() - 1, 1), 1)
    .setDataValidation(checkboxRule);

  adminRefreshLocationOptionsCache_(sheet, properties);
  properties.setProperty(
    ADMIN_SCHEMA_VERSION_PROPERTY,
    ADMIN_SCHEMA_VERSION
  );
  properties.setProperty(
    ADMIN_SCHEMA_VERIFIED_AT_PROPERTY,
    String(Date.now())
  );
}

function adminMigrateCollidingCustomerColumns_(sheet) {
  sheet.insertColumnsBefore(20, 2);
  adminClearLineColumnValidations_(sheet);

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
      var looksLikeLineResult = !!secondText && !looksLikeVisitorId;
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
function adminClearLineColumnValidations_(sheet) {
  if (sheet.getMaxColumns() < ADMIN_COLUMNS.LINE_RESULT) return;

  sheet
    .getRange(
      2,
      ADMIN_COLUMNS.LINE_CONFIRM,
      Math.max(sheet.getMaxRows() - 1, 1),
      2
    )
    .clearDataValidations();
}

// 旧入力規則のFALSE/TRUEがU列へ残った場合は送信結果ではないため除去する。
// 実際のLINE送信結果や自由記述はそのまま保持する。
function adminClearInvalidLineResults_(sheet) {
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  var range = sheet.getRange(
    2,
    ADMIN_COLUMNS.LINE_RESULT,
    lastRow - 1,
    1
  );
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

function adminGetCalendar_() {
  var calendarId = String(
    PropertiesService.getScriptProperties().getProperty('CALENDAR_ID') ||
    ADMIN_DEFAULT_CALENDAR_ID
  ).trim();

  if (!calendarId) {
    throw new Error('CALENDAR_IDが設定されていません。');
  }

  var calendar = CalendarApp.getCalendarById(calendarId);

  if (!calendar) {
    throw new Error(
      'Googleカレンダーが見つかりません。' +
      '管理アカウントにカレンダーの編集権限があるか確認してください。'
    );
  }

  return calendar;
}

// ============================================================
// 予約データ取得・集約
// ============================================================

function adminReadBookings_(sheet) {
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) return [];

  var values = sheet
    .getRange(2, 1, lastRow - 1, ADMIN_COLUMNS.REFERRAL_CAMPAIGN)
    .getDisplayValues();
  var groups = {};

  values.forEach(function(valuesRow, index) {
    if (adminIsEmptyBookingRow_(valuesRow)) return;

    var row = adminMapRow_(valuesRow, index + 2);
    var key = row.bookingNumber
      ? 'BOOKING:' + row.bookingNumber
      : 'ROW:' + row.rowNumber;

    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  });

  return Object.keys(groups)
    .map(function(key) {
      return adminBuildBooking_(key, groups[key]);
    })
    .sort(adminCompareBookings_);
}

function adminFindBooking_(sheet, bookingKey) {
  var bookings = adminReadBookings_(sheet);

  for (var i = 0; i < bookings.length; i++) {
    if (bookings[i].key === bookingKey) return bookings[i];
  }

  return null;
}

function adminIsEmptyBookingRow_(row) {
  return !String(row[ADMIN_COLUMNS.BOOKING_NUM - 1] || '').trim() &&
    !String(row[ADMIN_COLUMNS.DATE - 1] || '').trim() &&
    !String(row[ADMIN_COLUMNS.NAME - 1] || '').trim() &&
    !String(row[ADMIN_COLUMNS.PLAN - 1] || '').trim();
}

function adminMapRow_(values, rowNumber) {
  return {
    rowNumber: rowNumber,
    timestamp: String(values[ADMIN_COLUMNS.TIMESTAMP - 1] || ''),
    bookingNumber: String(values[ADMIN_COLUMNS.BOOKING_NUM - 1] || '').trim(),
    date: adminNormalizeDate_(values[ADMIN_COLUMNS.DATE - 1]),
    time: adminNormalizeTime_(values[ADMIN_COLUMNS.TIME - 1]),
    name: String(values[ADMIN_COLUMNS.NAME - 1] || '').trim(),
    plan: String(values[ADMIN_COLUMNS.PLAN - 1] || '').trim(),
    totalPrice: adminToNumber_(values[ADMIN_COLUMNS.TOTAL_PRICE - 1]),
    phone: String(values[ADMIN_COLUMNS.PHONE - 1] || '').trim(),
    sourceStatus: String(values[ADMIN_COLUMNS.STATUS - 1] || '').trim(),
    headcount: String(values[ADMIN_COLUMNS.HEADCOUNT - 1] || '').trim(),
    participants: String(values[ADMIN_COLUMNS.PARTICIPANTS - 1] || '').trim(),
    lineUserId: String(values[ADMIN_COLUMNS.LINE_USER_ID - 1] || '').trim(),
    bookingStatus: String(values[ADMIN_COLUMNS.BOOKING_STATUS - 1] || '').trim(),
    location: String(values[ADMIN_COLUMNS.LOCATION - 1] || '').trim(),
    lineName: String(values[ADMIN_COLUMNS.LINE_NAME - 1] || '').trim(),
    staff: String(values[ADMIN_COLUMNS.STAFF - 1] || '').trim(),
    couponCode: String(values[ADMIN_COLUMNS.COUPON_CODE - 1] || '').trim(),
    couponDiscount: adminToNumber_(values[ADMIN_COLUMNS.COUPON_DISCOUNT - 1]),
    freeMessage: String(values[ADMIN_COLUMNS.LINE_SEND - 1] || ''),
    lineConfirm: String(values[ADMIN_COLUMNS.LINE_CONFIRM - 1] || ''),
    lineResult: adminNormalizeLineResult_(
      values[ADMIN_COLUMNS.LINE_RESULT - 1]
    ),
    email: String(values[ADMIN_COLUMNS.EMAIL - 1] || '').trim(),
    participantAges: String(values[ADMIN_COLUMNS.PARTICIPANT_AGES - 1] || ''),
    participantHeights: String(values[ADMIN_COLUMNS.PARTICIPANT_HEIGHTS - 1] || ''),
    participantWeights: String(values[ADMIN_COLUMNS.PARTICIPANT_WEIGHTS - 1] || ''),
    participantFootSizes: String(values[ADMIN_COLUMNS.PARTICIPANT_FOOT_SIZES - 1] || ''),
    specialRequests: String(values[ADMIN_COLUMNS.SPECIAL_REQUESTS - 1] || ''),
    planId: String(values[ADMIN_COLUMNS.PLAN_ID - 1] || '').trim().toUpperCase(),
    referralCode: String(values[ADMIN_COLUMNS.REFERRAL_CODE - 1] || '').trim(),
    referralName: String(values[ADMIN_COLUMNS.REFERRAL_NAME - 1] || '').trim(),
    referralAcquiredAt: String(values[ADMIN_COLUMNS.REFERRAL_ACQUIRED_AT - 1] || '').trim(),
    referralCampaign: String(values[ADMIN_COLUMNS.REFERRAL_CAMPAIGN - 1] || '').trim()
  };
}

function adminBuildBooking_(key, rows) {
  rows.sort(function(a, b) { return a.rowNumber - b.rowNumber; });

  var first = rows[0];
  var statuses = adminUnique_(rows.map(function(row) {
    return row.bookingStatus;
  }).filter(String));
  var locations = adminUnique_(rows.map(function(row) {
    return row.location;
  }).filter(String));
  var staff = adminUnique_(rows.map(function(row) {
    return row.staff;
  }).filter(String));
  var times = adminUnique_(rows.map(function(row) {
    return row.time;
  }).filter(String));
  var lineResults = rows.map(function(row) {
    return row.lineResult;
  }).filter(String);
  var inferredPlanId = adminInferPlanIdFromRows_(rows);

  var booking = {
    key: key,
    bookingNumber: first.bookingNumber,
    date: first.date,
    time: times.join(' / '),
    name: first.name,
    planId: inferredPlanId,
    displayPlan: adminGetDisplayPlan_(rows, inferredPlanId),
    totalPrice: rows.reduce(function(sum, row) { return sum + row.totalPrice; }, 0),
    couponDiscount: rows.reduce(function(sum, row) {
      return sum + row.couponDiscount;
    }, 0),
    phone: first.phone,
    email: first.email,
    sourceStatus: first.sourceStatus,
    headcount: first.headcount,
    participants: first.participants,
    participantAges: first.participantAges,
    participantHeights: first.participantHeights,
    participantWeights: first.participantWeights,
    participantFootSizes: first.participantFootSizes,
    specialRequests: first.specialRequests,
    lineName: first.lineName,
    couponCode: first.couponCode,
    referralCode: first.referralCode,
    referralName: first.referralName,
    referralAcquiredAt: first.referralAcquiredAt,
    referralCampaign: first.referralCampaign,
    bookingStatus: statuses.length === 0
      ? '未対応'
      : (statuses.length === 1 ? statuses[0] : '混在'),
    location: locations.length === 0
      ? '未設定'
      : (locations.length === 1 ? locations[0] : '複数'),
    staff: staff.length === 0
      ? '未設定'
      : (staff.length === 1 ? staff[0] : '複数'),
    hasLine: rows.some(function(row) { return !!row.lineUserId; }),
    lastLineResult: lineResults.length ? lineResults[lineResults.length - 1] : '',
    componentCount: rows.length,
    rowNumbers: rows.map(function(row) { return row.rowNumber; }),
    components: rows
  };

  var locationGuidance = adminGetLocationGuidanceState_(booking);

  booking.locationGuidanceDue = locationGuidance.due;
  booking.dayLocationDue = locationGuidance.dayDue;
  booking.nightLocationDue = locationGuidance.nightDue;

  booking.version = adminHash_(rows.map(function(row) {
    return [
      row.rowNumber,
      row.date,
      row.time,
      row.name,
      row.plan,
      row.planId,
      row.totalPrice,
      row.couponCode,
      row.couponDiscount,
      row.headcount,
      row.participants,
      row.participantAges,
      row.participantHeights,
      row.participantWeights,
      row.participantFootSizes,
      row.phone,
      row.email,
      row.specialRequests,
      row.referralCode,
      row.referralName,
      row.referralAcquiredAt,
      row.referralCampaign,
      row.bookingStatus,
      row.location,
      row.staff,
      row.lineUserId,
      row.freeMessage,
      row.lineResult
    ].join('|');
  }).join('||'));

  return booking;
}

/**
 * 開催場所の案内が実際に必要な日だけ要確認にします。
 * 昼ツアー：参加日の前日
 * ナイトツアー：参加日の当日
 * セット予約の昼予定は、いずれか1件に場所が入れば案内済みとみなします。
 */
function adminGetLocationGuidanceState_(booking) {
  var state = {
    due: false,
    dayDue: false,
    nightDue: false
  };

  if (!booking || booking.bookingStatus !== '確定') return state;

  var today = adminToday_();
  var tomorrow = adminAddDays_(today, 1);
  var components = booking.components || [];
  var dayComponents = [];
  var nightComponents = [];

  components.forEach(function(component) {
    if (adminIsNightPlan_(component.plan)) {
      nightComponents.push(component);
    } else {
      dayComponents.push(component);
    }
  });

  var dayIsTomorrow = dayComponents.some(function(component) {
    return component.date === tomorrow;
  });
  var dayHasLocation = dayComponents.some(function(component) {
    return !!String(component.location || '').trim();
  });

  var nightIsToday = nightComponents.some(function(component) {
    return component.date === today;
  });
  var nightHasLocation = nightComponents.some(function(component) {
    return !!String(component.location || '').trim();
  });

  state.dayDue = dayIsTomorrow && !dayHasLocation;
  state.nightDue = nightIsToday && !nightHasLocation;
  state.due = state.dayDue || state.nightDue;

  return state;
}

/**
 * ブラウザへ不要なLINE User IDやS列の本文を返さない公開用データです。
 */
function adminToPublicBooking_(booking) {
  // 一覧・詳細・編集画面が使う値だけを返す。
  // 顧客情報は予約単位の値なので、各componentへ重複させない。
  var result = {
    key: booking.key,
    bookingNumber: booking.bookingNumber,
    name: booking.name,
    planId: booking.planId,
    displayPlan: booking.displayPlan,
    totalPrice: booking.totalPrice,
    couponDiscount: booking.couponDiscount,
    phone: booking.phone,
    email: booking.email,
    headcount: booking.headcount,
    participants: booking.participants,
    participantAges: booking.participantAges,
    participantHeights: booking.participantHeights,
    participantWeights: booking.participantWeights,
    participantFootSizes: booking.participantFootSizes,
    specialRequests: booking.specialRequests,
    lineName: booking.lineName,
    couponCode: booking.couponCode,
    referralCode: booking.referralCode,
    referralName: booking.referralName,
    referralAcquiredAt: booking.referralAcquiredAt,
    referralCampaign: booking.referralCampaign,
    bookingStatus: booking.bookingStatus,
    location: booking.location,
    staff: booking.staff,
    hasLine: booking.hasLine,
    lastLineResult: booking.lastLineResult,
    componentCount: booking.componentCount,
    locationGuidanceDue: booking.locationGuidanceDue,
    dayLocationDue: booking.dayLocationDue,
    nightLocationDue: booking.nightLocationDue,
    version: booking.version
  };

  result.components = booking.components.map(function(component) {
    return {
      rowNumber: component.rowNumber,
      date: component.date,
      time: component.time,
      plan: component.plan,
      totalPrice: component.totalPrice,
      bookingStatus: component.bookingStatus,
      location: component.location,
      staff: component.staff,
      lineResult: component.lineResult
    };
  });

  return result;
}

function adminGetDisplayPlan_(rows, planId) {
  var catalogPlan = adminGetPlanById_(planId);
  if (catalogPlan) return catalogPlan.name;

  var plans = rows.map(function(row) { return row.plan; });
  var joined = plans.join(' ');

  if (joined.indexOf('まるごと1日セット') !== -1) {
    return joined.indexOf('貸切') !== -1
      ? '【貸切】ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット'
      : 'ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット';
  }
  if (joined.indexOf('海空セット') !== -1) {
    return 'ウミガメシュノーケル＆ドローンSUP 海空セット';
  }
  if (joined.indexOf('昼夜セット') !== -1) {
    return 'ウミガメシュノーケル＆ヤシガニ探検 昼夜セット';
  }

  return adminUnique_(plans.filter(String)).join(' / ');
}

function adminGetPlanById_(planId) {
  var normalized = String(planId || '').trim().toUpperCase();

  for (var i = 0; i < ADMIN_PLAN_CATALOG.length; i++) {
    if (ADMIN_PLAN_CATALOG[i].id === normalized) return ADMIN_PLAN_CATALOG[i];
  }

  return null;
}

function adminParseHeadcount_(headcount) {
  var text = String(headcount || '');
  var read = function(pattern) {
    var match = text.match(pattern);
    return match ? Number(match[1] || 0) : 0;
  };

  return {
    adult: read(/大人\s*(\d+)\s*名?/),
    child: read(/子供\s*(\d+)\s*名?/),
    under3: read(/3歳未満\s*(\d+)\s*名?/)
  };
}

function adminCalculateStandardPrice_(plan, counts) {
  if (!plan) return 0;

  counts = counts || { adult: 0, child: 0, under3: 0 };

  return (
    Number(counts.adult || 0) * Number(plan.adultPrice || 0) +
    Number(counts.child || 0) * Number(plan.childPrice || plan.adultPrice || 0) +
    Number(counts.under3 || 0) * Number(plan.under3Price || 0)
  );
}

function adminInferPlanIdFromRows_(rows) {
  if (!rows || !rows.length) return '';

  var explicit = adminUnique_(rows.map(function(row) {
    return String(row.planId || '').trim().toUpperCase();
  }).filter(String));

  if (explicit.length === 1 && adminGetPlanById_(explicit[0])) {
    return explicit[0];
  }

  var rowPlans = rows.map(function(row) { return String(row.plan || ''); }).sort();
  var candidates = ADMIN_PLAN_CATALOG.filter(function(plan) {
    var componentPlans = plan.components
      .map(function(component) { return component.plan; })
      .sort();

    return componentPlans.length === rowPlans.length &&
      componentPlans.every(function(componentPlan, index) {
        return componentPlan === rowPlans[index];
      });
  });

  if (!candidates.length) return '';
  if (candidates.length === 1) return candidates[0].id;

  var counts = adminParseHeadcount_(rows[0].headcount);
  var currentTotal = rows.reduce(function(sum, row) {
    return sum + Number(row.totalPrice || 0) + Number(row.couponDiscount || 0);
  }, 0);

  candidates.sort(function(a, b) {
    return Math.abs(adminCalculateStandardPrice_(a, counts) - currentTotal) -
      Math.abs(adminCalculateStandardPrice_(b, counts) - currentTotal);
  });

  return candidates[0].id;
}

function adminBuildDashboard_(bookings) {
  var today = adminToday_();
  var tomorrow = adminAddDays_(today, 1);
  var future = bookings.filter(function(booking) {
    return adminBookingHasDateOnOrAfter_(booking, today);
  });
  var confirmed = bookings.filter(function(booking) {
    return booking.bookingStatus === '確定';
  });

  return {
    totalBookings: bookings.length,
    today: bookings.filter(function(booking) {
      return adminBookingHasDate_(booking, today);
    }).length,
    tomorrow: bookings.filter(function(booking) {
      return adminBookingHasDate_(booking, tomorrow);
    }).length,
    futurePending: future.filter(function(booking) {
      return booking.bookingStatus === '未対応' || booking.bookingStatus === '混在';
    }).length,
    futureConfirmed: future.filter(function(booking) {
      return booking.bookingStatus === '確定';
    }).length,
    futureFull: future.filter(function(booking) {
      return booking.bookingStatus === '満席';
    }).length,
    locationMissing: bookings.filter(function(booking) {
      return booking.locationGuidanceDue;
    }).length,
    dayLocationDue: bookings.filter(function(booking) {
      return booking.dayLocationDue;
    }).length,
    nightLocationDue: bookings.filter(function(booking) {
      return booking.nightLocationDue;
    }).length,
    confirmedSales: confirmed.reduce(function(sum, booking) {
      return sum + booking.totalPrice;
    }, 0),
    confirmedCoupons: confirmed.reduce(function(sum, booking) {
      return sum + booking.couponDiscount;
    }, 0)
  };
}

function adminGetBookingDates_(booking) {
  return adminUnique_((booking && booking.components || []).map(function(component) {
    return String(component.date || '');
  }).filter(String));
}

function adminBookingHasDate_(booking, date) {
  return adminGetBookingDates_(booking).indexOf(String(date || '')) !== -1;
}

function adminBookingHasDateOnOrAfter_(booking, date) {
  return adminGetBookingDates_(booking).some(function(componentDate) {
    return componentDate >= date;
  });
}

function adminCompareBookings_(a, b) {
  var today = adminToday_();
  var aFuture = a.date >= today ? 0 : 1;
  var bFuture = b.date >= today ? 0 : 1;

  if (aFuture !== bFuture) return aFuture - bFuture;
  if (a.date !== b.date) {
    return aFuture === 0
      ? String(a.date).localeCompare(String(b.date))
      : String(b.date).localeCompare(String(a.date));
  }

  return String(a.time).localeCompare(String(b.time));
}

// ============================================================
// 更新・LINE送信
// ============================================================

function adminResolveTargetRows_(booking, request) {
  var requestedRow = Number(request.rowNumber || 0);

  if (request.scope === 'all' || !requestedRow) {
    return booking.rowNumbers.slice();
  }

  if (booking.rowNumbers.indexOf(requestedRow) === -1) {
    throw new Error('更新対象の行が予約内容と一致しません。');
  }

  return [requestedRow];
}

function adminWriteColumn_(sheet, rowNumbers, column, value) {
  rowNumbers.forEach(function(rowNumber) {
    sheet.getRange(rowNumber, column).setValue(value);
  });
}

function adminResolveScheduleChanges_(booking, request) {
  var requestedComponents = Array.isArray(request.components)
    ? request.components
    : [];

  if (!requestedComponents.length) {
    throw new Error('変更後の日付・開始時間を入力してください。');
  }

  var bookingRows = {};
  var requestedDates = {};
  var requestedTimes = {};

  booking.components.forEach(function(component) {
    bookingRows[String(component.rowNumber)] = component;
  });

  requestedComponents.forEach(function(componentRequest) {
    var rowNumber = Number(componentRequest && componentRequest.rowNumber || 0);
    var rowKey = String(rowNumber);

    if (!bookingRows[rowKey]) {
      throw new Error('日時変更対象の行が予約内容と一致しません。');
    }

    var componentDate = String(
      componentRequest && componentRequest.date || request.date || ''
    ).trim();

    adminValidateScheduleDate_(componentDate);
    requestedDates[rowKey] = componentDate;
    requestedTimes[rowKey] = adminNormalizeScheduleTime_(
      componentRequest.time
    );
  });

  var autoSup = adminIsAutoSupSchedule_(booking);
  var turtleComponent = null;
  var supComponent = null;

  if (autoSup) {
    turtleComponent = adminFindTurtleScheduleComponent_(booking);
    supComponent = adminFindScheduleComponent_(booking, 'ドローンSUP');

    if (!turtleComponent || !supComponent) {
      throw new Error(
        'セット予約の海亀またはドローンSUP予定を特定できません。'
      );
    }

    var turtleTime = requestedTimes[String(turtleComponent.rowNumber)];
    var turtleDate = requestedDates[String(turtleComponent.rowNumber)];

    if (!turtleDate || !turtleTime) {
      throw new Error('ウミガメシュノーケルの日付・開始時間を入力してください。');
    }

    requestedDates[String(supComponent.rowNumber)] = turtleDate;
    requestedTimes[String(supComponent.rowNumber)] =
      adminAddMinutesToScheduleTime_(turtleTime, 90);
  }

  var changes = booking.components.map(function(component) {
    var date = requestedDates[String(component.rowNumber)];
    var time = requestedTimes[String(component.rowNumber)];

    if (!date || !time) {
      throw new Error(
        '「' + (component.plan || '予定') + '」の日付・開始時間を入力してください。'
      );
    }

    return {
      rowNumber: component.rowNumber,
      plan: component.plan,
      oldDate: component.date,
      oldTime: component.time,
      date: date,
      time: time
    };
  });

  var changed = changes.some(function(change) {
    return change.oldDate !== change.date || change.oldTime !== change.time;
  });

  if (!changed) {
    throw new Error('日付・時間に変更はありません。');
  }

  return changes;
}

function adminValidateScheduleDate_(value) {
  var date = String(value || '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('変更後の参加日を正しく入力してください。');
  }

  var parsed = adminDateFromText_(date);
  var roundTrip = Utilities.formatDate(parsed, 'Asia/Tokyo', 'yyyy-MM-dd');

  if (roundTrip !== date) {
    throw new Error('変更後の参加日が不正です。');
  }

  if (date < adminToday_()) {
    throw new Error('過去の日付へは変更できません。');
  }
}

function adminNormalizeScheduleTime_(value) {
  var match = String(value || '').trim().match(
    /^(\d{1,2})\s*(?::|：|時)\s*(\d{1,2})$/
  );

  if (!match) return '';

  var hour = Number(match[1]);
  var minute = Number(match[2]);

  if (hour > 23 || minute > 59) return '';

  return ('0' + hour).slice(-2) + ':' + ('0' + minute).slice(-2);
}

function adminAddMinutesToScheduleTime_(value, minutes) {
  var time = adminNormalizeScheduleTime_(value);

  if (!time) return '';

  var parts = time.split(':');
  var date = new Date(2000, 0, 1, Number(parts[0]), Number(parts[1]));

  date.setMinutes(date.getMinutes() + Number(minutes || 0));

  return Utilities.formatDate(date, 'Asia/Tokyo', 'HH:mm');
}

function adminIsAutoSupSchedule_(booking) {
  var plan = String(booking && booking.displayPlan || '');

  return plan.indexOf('海空セット') !== -1 ||
    plan.indexOf('まるごと1日セット') !== -1;
}

function adminFindScheduleComponent_(booking, keyword) {
  var components = booking && booking.components || [];

  for (var i = 0; i < components.length; i++) {
    if (String(components[i].plan || '').indexOf(keyword) !== -1) {
      return components[i];
    }
  }

  return null;
}

function adminFindTurtleScheduleComponent_(booking) {
  var components = booking && booking.components || [];

  for (var i = 0; i < components.length; i++) {
    var plan = String(components[i].plan || '');

    if (
      plan.indexOf('海亀') !== -1 ||
      plan.indexOf('ウミガメ') !== -1
    ) {
      return components[i];
    }
  }

  return null;
}

function adminFindCalendarAssignments_(calendar, booking) {
  var bookingNumber = String(booking.bookingNumber || '');
  var candidates = adminFindCalendarEventsByBookingNumber_(calendar, booking);

  if (!candidates.length) {
    throw new Error(
      'Googleカレンダーに予約番号「' + bookingNumber +
      '」の予定が見つかりません。日時はまだ変更していません。'
    );
  }

  var usedEventIds = {};

  return booking.components.map(function(component) {
    var exactMatches = candidates.filter(function(event) {
      var eventId = String(event.getId());
      if (usedEventIds[eventId]) return false;

      var description = String(event.getDescription() || '');
      var title = String(event.getTitle() || '');

      return description.indexOf('プラン: ' + component.plan) !== -1 ||
        description.indexOf('プラン：' + component.plan) !== -1 ||
        title.indexOf(component.plan) !== -1;
    });

    if (!exactMatches.length && booking.components.length === 1 && candidates.length === 1) {
      exactMatches = [candidates[0]];
    }

    if (exactMatches.length !== 1) {
      throw new Error(
        'Googleカレンダーの「' + component.plan +
        '」予定を1件に特定できません。' +
        '重複や手動変更がないか確認してください。'
      );
    }

    var event = exactMatches[0];
    usedEventIds[String(event.getId())] = true;

    return {
      component: component,
      event: event
    };
  });
}

function adminBuildCalendarScheduleOperations_(booking, changes, assignments) {
  var changeByRow = {};

  changes.forEach(function(change) {
    changeByRow[String(change.rowNumber)] = change;
  });

  var operations = assignments.map(function(assignment) {
    var component = assignment.component;
    var event = assignment.event;
    var change = changeByRow[String(component.rowNumber)];
    var oldStart = event.getStartTime();
    var oldEnd = event.getEndTime();
    var durationMs = oldEnd.getTime() - oldStart.getTime();

    if (
      !durationMs ||
      durationMs < 15 * 60 * 1000 ||
      durationMs > 8 * 60 * 60 * 1000 ||
      (event.isAllDayEvent && event.isAllDayEvent())
    ) {
      durationMs = adminGetDefaultDurationMinutes_(component.plan) * 60 * 1000;
    }

    var newStart = adminDateTimeFromTexts_(change.date, change.time);
    var newEnd = new Date(newStart.getTime() + durationMs);

    return {
      component: component,
      change: change,
      event: event,
      oldStart: oldStart,
      oldEnd: oldEnd,
      oldDescription: String(event.getDescription() || ''),
      newStart: newStart,
      newEnd: newEnd,
      newDescription: ''
    };
  });

  var dateReplacements = {};
  var timeReplacements = {};

  operations.forEach(function(operation) {
    adminRegisterTextReplacement_(
      dateReplacements,
      operation.component.date,
      operation.change.date
    );
    adminRegisterTextReplacement_(
      timeReplacements,
      adminFormatCalendarTime_(operation.oldStart),
      adminFormatCalendarTime_(operation.newStart)
    );
    adminRegisterTextReplacement_(
      timeReplacements,
      adminFormatCalendarTime_(operation.oldEnd),
      adminFormatCalendarTime_(operation.newEnd)
    );
  });

  operations.forEach(function(operation) {
    var description = adminApplyTextReplacements_(
      operation.oldDescription,
      dateReplacements,
      'DATE'
    );

    description = adminApplyTextReplacements_(
      description,
      timeReplacements,
      'TIME'
    );

    description = description.replace(
      /(^|\n)参加日\s*[:：]\s*[^\n]*/,
      '$1参加日: ' + operation.change.date
    );
    description = description.replace(
      /(^|\n)時間\s*[:：]\s*[^\n]*/,
      '$1時間: ' + operation.change.time
    );

    operation.newDescription = description;
  });

  return operations;
}

function adminRegisterTextReplacement_(map, oldValue, newValue) {
  var oldText = String(oldValue || '');
  var newText = String(newValue || '');

  if (!oldText || oldText === newText) return;

  if (
    Object.prototype.hasOwnProperty.call(map, oldText) &&
    map[oldText] !== newText
  ) {
    map[oldText] = null;
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(map, oldText)) {
    map[oldText] = newText;
  }
}

function adminApplyTextReplacements_(text, replacements, prefix) {
  var result = String(text || '');
  var tokens = [];

  Object.keys(replacements).forEach(function(oldValue, index) {
    var newValue = replacements[oldValue];

    if (newValue === null || oldValue === newValue) return;

    var token = '__ADMIN_' + prefix + '_' + index + '__';
    result = result.split(oldValue).join(token);
    tokens.push({ token: token, value: newValue });
  });

  tokens.forEach(function(item) {
    result = result.split(item.token).join(item.value);
  });

  return result;
}

// 既存予定の長さを引き継げないとき（全日予定・長さが壊れている等）だけ使う既定値。
// プラン詳細ページの所要時間表示と合わせる。
function adminGetDefaultDurationMinutes_(planName) {
  var plan = String(planName || '');

  if (plan.indexOf('海空セット') !== -1) return 90;
  if (plan.indexOf('まるごと1日セット') !== -1) return 90;
  if (plan.indexOf('昼夜セットヤシガニ') !== -1) return 90;
  // 単品のナイトツアーも表示は「約1.5時間」。予約受付GASの addToCalendar と揃える。
  if (plan.indexOf('ナイトツアー') !== -1 || plan.indexOf('ヤシガニ探検') !== -1) return 90;

  return 120;
}

function adminDateFromText_(dateText) {
  var parts = String(dateText || '').split('-');

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );
}

function adminDateTimeFromTexts_(dateText, timeText) {
  var dateParts = String(dateText || '').split('-');
  var timeParts = String(timeText || '').split(':');

  return new Date(
    Number(dateParts[0]),
    Number(dateParts[1]) - 1,
    Number(dateParts[2]),
    Number(timeParts[0]),
    Number(timeParts[1])
  );
}

function adminFormatCalendarTime_(date) {
  return Utilities.formatDate(date, 'Asia/Tokyo', 'HH:mm');
}

function adminReadOriginalScheduleValues_(sheet, rowNumbers) {
  return rowNumbers.map(function(rowNumber) {
    return {
      rowNumber: rowNumber,
      values: sheet
        .getRange(rowNumber, ADMIN_COLUMNS.DATE, 1, 2)
        .getValues()[0]
    };
  });
}

function adminReadFullBookingRows_(sheet, rowNumbers) {
  return rowNumbers.map(function(rowNumber) {
    return {
      rowNumber: rowNumber,
      values: sheet
        .getRange(rowNumber, 1, 1, ADMIN_COLUMNS.REFERRAL_CAMPAIGN)
        .getValues()[0]
    };
  });
}

function adminArchiveDeletedBooking_(sourceSheet, booking, originalRows, actor) {
  var ss = adminGetSpreadsheet_();
  var sheet = ss.getSheetByName(ADMIN_DELETED_SHEET_NAME);
  var metadataHeaders = [
    '削除日時',
    '操作者',
    '削除状態',
    '予約キー',
    '元予約一覧行',
    'アプリ版'
  ];
  var sourceHeaders = sourceSheet
    .getRange(1, 1, 1, ADMIN_COLUMNS.REFERRAL_CAMPAIGN)
    .getValues()[0];
  var headers = metadataHeaders.concat(sourceHeaders);

  if (!sheet) {
    sheet = ss.insertSheet(ADMIN_DELETED_SHEET_NAME);
  }

  if (String(sheet.getRange(1, 1).getValue()) !== headers[0]) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet
      .getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#f4cccc');
  }

  var deletedAt = new Date();
  var archiveValues = originalRows.map(function(item) {
    return [
      deletedAt,
      actor,
      '削除前退避',
      booking.key,
      item.rowNumber,
      ADMIN_APP_VERSION
    ].concat(item.values);
  });
  var startRow = Math.max(sheet.getLastRow() + 1, 2);

  sheet
    .getRange(startRow, 1, archiveValues.length, headers.length)
    .setValues(archiveValues);

  SpreadsheetApp.flush();

  return {
    sheet: sheet,
    startRow: startRow,
    rowCount: archiveValues.length
  };
}

function adminMarkDeletedArchiveComplete_(archive) {
  if (!archive || !archive.sheet || !archive.rowCount) return;

  archive.sheet
    .getRange(archive.startRow, 3, archive.rowCount, 1)
    .setValues(Array.apply(null, Array(archive.rowCount)).map(function() {
      return ['削除完了'];
    }));

  SpreadsheetApp.flush();
}

function adminFindCalendarEventsForDeletion_(calendar, booking) {
  var matched = adminFindCalendarEventsByBookingNumber_(calendar, booking);

  var warning = '';

  if (!matched.length) {
    warning =
      'Googleカレンダーに同じ予約番号の既存予定が見つかりませんでした。';
  } else if (matched.length !== booking.components.length) {
    warning =
      'Googleカレンダーの既存予定は' + matched.length + '件処理しました。' +
      '予約の予定数（' + booking.components.length + '件）と一致しないため、' +
      'カレンダーを念のため確認してください。';
  }

  return {
    events: matched,
    warning: warning
  };
}

// 元の日付に加え前後31日も予約番号で補助検索する。
// カレンダー上だけで予定が手動移動されても、完全一致した予約だけを扱う。
function adminFindCalendarEventsByBookingNumber_(calendar, booking) {
  var dates = adminUnique_((booking.components || []).map(function(component) {
    return component.date;
  }).filter(String));
  var bookingNumber = String(booking.bookingNumber || '');
  var events = [];

  dates.forEach(function(dateText) {
    events = events.concat(
      calendar.getEventsForDay(adminDateFromText_(dateText))
    );
  });

  if (dates.length && bookingNumber) {
    var sortedDates = dates.map(adminDateFromText_).sort(function(a, b) {
      return a.getTime() - b.getTime();
    });
    var rangeStart = new Date(sortedDates[0].getTime());
    var rangeEnd = new Date(sortedDates[sortedDates.length - 1].getTime());

    rangeStart.setDate(rangeStart.getDate() - 31);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setDate(rangeEnd.getDate() + 32);
    rangeEnd.setHours(0, 0, 0, 0);

    try {
      events = events.concat(
        calendar.getEvents(rangeStart, rangeEnd, { search: bookingNumber })
      );
    } catch (searchError) {
      Logger.log(
        'カレンダー補助検索を省略しました: ' + searchError.message
      );
    }
  }

  var seen = {};

  return events.filter(function(event) {
    var eventId = String(event.getId());

    if (
      seen[eventId] ||
      !adminCalendarEventHasBookingNumber_(event, bookingNumber)
    ) {
      return false;
    }
    seen[eventId] = true;

    return true;
  });
}

function adminCalendarEventHasBookingNumber_(event, bookingNumber) {
  var description = String(event.getDescription() || '');

  return description.split(/\r?\n/).some(function(line) {
    var match = String(line).match(/^\s*予約番号\s*[:：]\s*(.*?)\s*$/);

    return !!match && String(match[1]) === String(bookingNumber);
  });
}

function adminSnapshotCalendarEvent_(event) {
  var snapshot = {
    title: String(event.getTitle() || ''),
    start: event.getStartTime(),
    end: event.getEndTime(),
    description: String(event.getDescription() || ''),
    location: String(event.getLocation() || ''),
    color: '',
    allDay: !!(
      event.isAllDayEvent &&
      event.isAllDayEvent()
    )
  };

  try {
    snapshot.color = String(event.getColor() || '');
  } catch (error) {
    snapshot.color = '';
  }

  if (snapshot.allDay) {
    try {
      snapshot.start = event.getAllDayStartDate();
      snapshot.end = event.getAllDayEndDate();
    } catch (error) {
      // getStartTime/getEndTimeで復旧します。
    }
  }

  return snapshot;
}

function adminRestoreCalendarEvents_(calendar, snapshots) {
  var errors = [];

  snapshots.forEach(function(snapshot) {
    try {
      var options = {
        description: snapshot.description,
        location: snapshot.location
      };
      var restored = snapshot.allDay
        ? calendar.createAllDayEvent(
          snapshot.title,
          snapshot.start,
          snapshot.end,
          options
        )
        : calendar.createEvent(
          snapshot.title,
          snapshot.start,
          snapshot.end,
          options
        );

      if (snapshot.color) restored.setColor(snapshot.color);

    } catch (error) {
      Logger.log('削除したカレンダー予定の復旧失敗: ' + error.message);
      errors.push('カレンダー: ' + error.message);
    }
  });

  return errors;
}

function adminRestoreFullBookingRows_(sheet, originalRows) {
  var errors = [];

  originalRows.forEach(function(item) {
    try {
      sheet
        .getRange(item.rowNumber, 1, 1, ADMIN_COLUMNS.REFERRAL_CAMPAIGN)
        .setValues([item.values]);
    } catch (error) {
      Logger.log('削除した予約一覧行の復旧失敗: ' + error.message);
      errors.push('予約一覧行' + item.rowNumber + ': ' + error.message);
    }
  });

  try {
    SpreadsheetApp.flush();
  } catch (error) {
    Logger.log('削除した予約一覧行の復旧反映失敗: ' + error.message);
    errors.push('予約一覧の反映: ' + error.message);
  }

  return errors;
}

function adminRollbackCalendarSchedule_(operations) {
  var errors = [];

  for (var i = operations.length - 1; i >= 0; i--) {
    try {
      operations[i].event.setTime(
        operations[i].oldStart,
        operations[i].oldEnd
      );
      operations[i].event.setDescription(
        operations[i].oldDescription
      );
    } catch (error) {
      Logger.log('カレンダー日時のロールバック失敗: ' + error.message);
      errors.push('カレンダー: ' + error.message);
    }
  }

  return errors;
}

function adminRollbackSheetSchedule_(sheet, originalValues) {
  var errors = [];

  originalValues.forEach(function(item) {
    try {
      sheet
        .getRange(item.rowNumber, ADMIN_COLUMNS.DATE, 1, 2)
        .setValues([item.values]);
    } catch (error) {
      Logger.log('予約一覧の日時ロールバック失敗: ' + error.message);
      errors.push('予約一覧行' + item.rowNumber + ': ' + error.message);
    }
  });

  try {
    SpreadsheetApp.flush();
  } catch (error) {
    Logger.log('予約一覧のロールバック確定失敗: ' + error.message);
    errors.push('予約一覧の反映: ' + error.message);
  }

  return errors;
}

function adminClearPendingForBooking_(sheet, booking) {
  adminDeletePendingPropertiesForBooking_(booking);

  booking.rowNumbers.forEach(function(rowNumber) {
    var resultRange = sheet.getRange(rowNumber, ADMIN_COLUMNS.LINE_RESULT);
    var currentResult = String(resultRange.getValue() || '');

    sheet
      .getRange(rowNumber, ADMIN_COLUMNS.LINE_CONFIRM)
      .setValue(false)
      .setBackground(null);

    if (currentResult.indexOf('WEB送信待ち：') === 0) {
      resultRange
        .setValue('日時変更のためWEB送信待ちを取り消しました')
        .setBackground(null);
    }
  });
}

function adminDeletePendingPropertiesForBooking_(booking) {
  var properties = PropertiesService.getScriptProperties();
  var values = properties.getProperties();

  Object.keys(values).forEach(function(key) {
    if (key.indexOf(ADMIN_PENDING_PREFIX) !== 0) return;

    try {
      var pending = JSON.parse(values[key]);

      if (pending.bookingKey === booking.key) {
        properties.deleteProperty(key);
      }
    } catch (error) {
      properties.deleteProperty(key);
    }
  });
}

function adminValidateStatus_(value) {
  if (ADMIN_STATUS_OPTIONS.indexOf(value) === -1) {
    throw new Error('予約ステータスが不正です。');
  }
}

function adminValidateLocation_(sheet, value) {
  if (value && adminGetLocationOptions_(sheet).indexOf(value) === -1) {
    throw new Error('開催場所が選択肢にありません。');
  }
}

function adminGetLocationOptions_(sheet) {
  var options = [];
  var lastRow = Math.max(sheet.getLastRow(), 2);
  var validations = sheet
    .getRange(2, ADMIN_COLUMNS.LOCATION, Math.min(lastRow - 1, 50), 1)
    .getDataValidations();

  for (var i = 0; i < validations.length; i++) {
    var validation = validations[i][0];
    if (!validation) continue;

    var criteria = validation.getCriteriaType();
    var values = validation.getCriteriaValues();

    if (
      criteria === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST &&
      values && Array.isArray(values[0])
    ) {
      options = values[0].map(String);
      break;
    }
  }

  return options.length
    ? adminUnique_(options)
    : ADMIN_LOCATION_OPTIONS.slice();
}

function adminRefreshLocationOptionsCache_(sheet, properties) {
  properties = properties || PropertiesService.getScriptProperties();
  properties.setProperty(
    ADMIN_LOCATION_OPTIONS_CACHE_PROPERTY,
    JSON.stringify(adminGetLocationOptions_(sheet))
  );
}

function adminGetCachedLocationOptions_() {
  var json = PropertiesService
    .getScriptProperties()
    .getProperty(ADMIN_LOCATION_OPTIONS_CACHE_PROPERTY);

  if (json) {
    try {
      var cached = JSON.parse(json);
      if (Array.isArray(cached) && cached.length) {
        return adminUnique_(cached.map(String).filter(String));
      }
    } catch (error) {
      Logger.log('[ADMIN_LOCATION_CACHE] 開催場所キャッシュを再作成します。');
    }
  }

  return ADMIN_LOCATION_OPTIONS.slice();
}

function adminSelectLineRow_(booking, preferredRowNumber) {
  var preferred = Number(preferredRowNumber || 0);
  var matching = booking.components.filter(function(component) {
    return component.rowNumber === preferred && component.lineUserId;
  });

  if (matching.length) return matching[0];

  for (var i = 0; i < booking.components.length; i++) {
    if (booking.components[i].lineUserId) return booking.components[i];
  }

  return null;
}

function adminFindComponentByRow_(booking, rowNumber) {
  var target = Number(rowNumber || 0);

  for (var i = 0; i < booking.components.length; i++) {
    if (booking.components[i].rowNumber === target) return booking.components[i];
  }

  return null;
}

function adminCreatePendingLine_(sheet, booking, lineRow, messageRow, action, actor) {
  var message = action.type === 'STATUS'
    ? adminBuildStatusMessage_(booking, action.value)
    : adminBuildLocationMessage_(
      messageRow.location,
      messageRow.time,
      messageRow.plan
    );
  var summary = action.type === 'STATUS'
    ? '予約ステータス「' + action.value + '」'
    : '開催場所「' + action.value + '」';

  if (!message) {
    throw new Error('送信メッセージを作成できませんでした。');
  }

  var pending = adminSavePendingLine_({
    bookingKey: booking.key,
    bookingNumber: booking.bookingNumber,
    rowNumbers: action.type === 'STATUS'
      ? booking.rowNumbers.slice()
      : [messageRow.rowNumber],
    sourceRowNumber: lineRow.rowNumber,
    type: action.type,
    expectedValue: action.value,
    summary: summary,
    message: message,
    lineUserId: lineRow.lineUserId,
    actor: actor,
    createdAt: new Date().toISOString()
  });

  sheet
    .getRange(lineRow.rowNumber, ADMIN_COLUMNS.LINE_CONFIRM)
    .setValue(false)
    .setBackground('#fff2cc');
  sheet
    .getRange(lineRow.rowNumber, ADMIN_COLUMNS.LINE_RESULT)
    .setValue('WEB送信待ち：' + summary)
    .setBackground('#fff2cc');

  return pending;
}

function adminSavePendingLine_(pending) {
  var token = Utilities.getUuid();
  pending.token = token;

  PropertiesService
    .getScriptProperties()
    .setProperty(ADMIN_PENDING_PREFIX + token, JSON.stringify(pending));

  return {
    token: token,
    type: pending.type,
    summary: pending.summary,
    message: pending.message,
    sourceRowNumber: pending.sourceRowNumber,
    expiresInMinutes: ADMIN_PENDING_TTL_MINUTES
  };
}

function adminReadPendingLine_(token) {
  var json = PropertiesService
    .getScriptProperties()
    .getProperty(ADMIN_PENDING_PREFIX + token);

  if (!json) return null;

  try {
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

function adminDeletePendingLine_(token) {
  PropertiesService
    .getScriptProperties()
    .deleteProperty(ADMIN_PENDING_PREFIX + token);
}

function adminCleanupExpiredPending_() {
  var properties = PropertiesService.getScriptProperties();
  var values = properties.getProperties();
  var cutoff = Date.now() - ADMIN_PENDING_TTL_MINUTES * 60 * 1000;

  Object.keys(values).forEach(function(key) {
    if (key.indexOf(ADMIN_PENDING_PREFIX) !== 0) return;

    try {
      var pending = JSON.parse(values[key]);
      if (new Date(pending.createdAt).getTime() < cutoff) {
        properties.deleteProperty(key);
      }
    } catch (error) {
      properties.deleteProperty(key);
    }
  });
}

function adminAssertPendingStillValid_(booking, pending) {
  var targetRows = booking.components.filter(function(component) {
    return pending.rowNumbers.indexOf(component.rowNumber) !== -1;
  });

  if (targetRows.length !== pending.rowNumbers.length) {
    throw new Error('予約行が変更されたため送信を中止しました。');
  }

  if (pending.type === 'STATUS') {
    if (targetRows.some(function(row) {
      return row.bookingStatus !== pending.expectedValue;
    })) {
      throw new Error('予約ステータスが変更されたため送信を中止しました。');
    }
  }

  if (pending.type === 'LOCATION') {
    if (targetRows.some(function(row) {
      return row.location !== pending.expectedValue;
    })) {
      throw new Error('開催場所が変更されたため送信を中止しました。');
    }
  }
}

function adminSendLine_(lineUserId, message, pending, sourceRow, actor) {
  var secret = String(
    PropertiesService.getScriptProperties().getProperty('NOTIFY_SECRET') || ''
  );

  if (!secret) {
    throw new Error('管理Webアプリ側のNOTIFY_SECRETが未設定です。');
  }

  var response;
  var code = 0;
  var body = '';
  var success = false;
  var errorText = '';

  try {
    response = UrlFetchApp.fetch(ADMIN_NOTIFY_API_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + secret
      },
      payload: JSON.stringify({
        lineUserId: lineUserId,
        customMessage: message,
        retryKey: pending.token || ''
      }),
      muteHttpExceptions: true
    });

    code = response.getResponseCode();
    body = response.getContentText();
    success = code === 200;
    if (!success) errorText = 'HTTP ' + code + ': ' + body;

  } catch (error) {
    errorText = error.message;
  }

  var warningText = '';

  try {
    adminAppendLineLog_(pending, sourceRow, success, actor);
  } catch (lineLogError) {
    warningText = adminJoinWarnings_(
      warningText,
      'LINE送信履歴を記録できませんでした: ' + lineLogError.message
    );
  }

  try {
    adminAppendAudit_(
      actor,
      {
        bookingNumber: pending.bookingNumber,
        name: sourceRow.name,
        date: sourceRow.date,
        key: pending.bookingKey
      },
      success ? 'LINE送信成功' : 'LINE送信失敗',
      pending.summary + (errorText ? ' / ' + errorText : ''),
      [sourceRow.rowNumber]
    );
  } catch (auditError) {
    warningText = adminJoinWarnings_(
      warningText,
      '管理操作履歴を記録できませんでした: ' + auditError.message
    );
  }

  return {
    success: success,
    error: errorText,
    warning: warningText
  };
}

function adminJoinWarnings_(current, next) {
  return [String(current || ''), String(next || '')]
    .filter(String)
    .join(' / ');
}

function adminAppendLineLog_(pending, row, success, actor) {
  var sheet = adminGetOrCreateLineLogSheet_();

  sheet.appendRow([
    new Date(),
    pending.bookingNumber || row.bookingNumber || '',
    row.name || '',
    row.date || '',
    row.time || '',
    row.plan || '',
    pending.summary + '（WEB管理画面）',
    pending.lineUserId || '',
    pending.message || '',
    success ? '成功' : '失敗',
    row.rowNumber || ''
  ]);
}

function adminGetOrCreateLineLogSheet_() {
  var ss = adminGetSpreadsheet_();
  var sheet = ss.getSheetByName(ADMIN_LINE_LOG_SHEET_NAME);
  var headers = [
    '送信日時', '予約番号', '名前', '参加日', '時間', 'プラン',
    '送信種別', 'LINE User ID', 'メッセージ', '結果', '予約一覧行'
  ];

  if (!sheet) sheet = ss.insertSheet(ADMIN_LINE_LOG_SHEET_NAME);

  if (String(sheet.getRange(1, 1).getValue()) !== headers[0]) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function adminWasSuccessfulStatusSent_(bookingNumber, summary) {
  if (!bookingNumber) return false;

  if (
    PropertiesService
      .getScriptProperties()
      .getProperty(adminStatusSentKey_(bookingNumber, summary))
  ) {
    return true;
  }

  var ss = adminGetSpreadsheet_();
  var sheet = ss.getSheetByName(ADMIN_LINE_LOG_SHEET_NAME);

  if (!sheet || sheet.getLastRow() < 2) return false;

  var startRow = Math.max(2, sheet.getLastRow() - 499);
  var values = sheet
    .getRange(startRow, 1, sheet.getLastRow() - startRow + 1, 10)
    .getDisplayValues();

  return values.some(function(row) {
    return String(row[1]) === String(bookingNumber) &&
      String(row[6]).indexOf(summary) !== -1 &&
      String(row[9]) === '成功';
  });
}

function adminStatusSentKey_(bookingNumber, summary) {
  return (
    ADMIN_STATUS_SENT_PREFIX +
    adminHash_(String(bookingNumber || '') + '|' + String(summary || ''))
  );
}

function adminMarkSuccessfulStatusSent_(bookingNumber, summary) {
  if (!bookingNumber) return;

  PropertiesService
    .getScriptProperties()
    .setProperty(
      adminStatusSentKey_(bookingNumber, summary),
      new Date().toISOString()
    );
}

// ============================================================
// LINE文面
// ============================================================

function adminBuildStatusMessage_(booking, status) {
  if (status === '満席') {
    return adminBuildFullMessage_(booking);
  }

  if (status !== '確定') return '';

  var plan = booking.displayPlan;

  if (adminIsTriple_(booking)) return adminBuildTripleConfirm_(booking);
  if (adminIsSeaSky_(booking)) return adminBuildSeaSkyConfirm_(booking);
  if (adminIsDayNight_(booking)) return adminBuildDayNightConfirm_(booking);
  if (adminIsDroneSupSingle_(plan)) return adminBuildDroneSupConfirm_(booking);
  if (adminIsNightPlan_(plan)) return adminBuildNightConfirm_(booking);
  if (plan.indexOf('SUP') !== -1) return adminBuildSupConfirm_(booking);

  return adminBuildSnorkelConfirm_(booking);
}

function adminGetComponentScheduleLabel_(component) {
  var plan = String(component && component.plan || '');

  if (plan.indexOf('海亀') !== -1 || plan.indexOf('ウミガメ') !== -1) {
    return '🐢 ウミガメシュノーケル';
  }
  if (plan.indexOf('ドローンSUP') !== -1) {
    return '🛸 ドローンSUP';
  }
  if (adminIsNightPlan_(plan)) {
    return '🦀 ナイトツアー';
  }

  return plan || '予定';
}

function adminFormatComponentSchedule_(component) {
  if (!component) return 'なし';

  return adminValueOrNone_(component.date) + ' ' +
    adminValueOrNone_(component.time);
}

function adminBuildScheduleText_(booking) {
  var components = booking && booking.components || [];

  if (!components.length) {
    return adminValueOrNone_(booking && booking.date) + ' ' +
      adminValueOrNone_(booking && booking.time);
  }

  if (components.length === 1) {
    return adminFormatComponentSchedule_(components[0]);
  }

  return components.map(function(component) {
    return adminGetComponentScheduleLabel_(component) + '：' +
      adminFormatComponentSchedule_(component);
  }).join('\n');
}

function adminBuildDetailBlock_(booking) {
  var scheduleText = adminBuildScheduleText_(booking);
  var schedulePrefix = booking.components && booking.components.length > 1
    ? '開催日時：\n'
    : '日時：';

  return (
    '【ご予約内容】\n' +
    '予約番号：' + booking.bookingNumber + '\n' +
    'プラン：' + booking.displayPlan + '\n' +
    schedulePrefix + scheduleText + '\n' +
    '人数：' + adminValueOrNone_(booking.headcount) + '\n' +
    '合計金額：' + adminFormatYen_(booking.totalPrice) + '\n' +
    'クーポン：' + adminFormatCoupon_(booking.couponCode, booking.couponDiscount) + '\n\n' +
    '【お客様情報】\n' +
    '電話番号：' + adminValueOrNone_(booking.phone) + '\n' +
    'LINE名：' + adminValueOrNone_(booking.lineName) + '\n' +
    'スタッフ指名：' + adminValueOrNone_(booking.staff === '未設定' ? '指名なし' : booking.staff) + '\n\n' +
    '【参加者詳細】\n' +
    adminValueOrNone_(booking.participants)
  );
}

function adminConfirmOpening_(booking, emoji) {
  return (
    emoji + ' ご予約が確定しました！\n\n' +
    booking.name + ' 様\n\n' +
    '以下の内容でご予約を確定いたしました。\n' +
    '内容にお間違いがないかご確認ください。\n\n' +
    adminBuildDetailBlock_(booking)
  );
}

function adminBuildSnorkelConfirm_(booking) {
  return adminConfirmOpening_(booking, '🐢') +
    '\n\n【当日の持ち物】\n' +
    '・水着（着替えは現地でできます）\n' +
    '・タオル\n' +
    '・酔い止め（必要な方）\n\n' +
    '【集合場所について】\n' +
    '海況や風向きを考慮した上で、前日にLINEにてご連絡いたします。\n\n' +
    adminCancelPolicy_();
}

function adminBuildNightConfirm_(booking) {
  return adminConfirmOpening_(booking, '🦀') +
    '\n\n【当日持ってくると便利なもの】\n' +
    '・虫よけスプレー\n' +
    '・靴（サンダル不可・推奨）\n' +
    '・長ズボン（虫刺されが気になる方）\n\n' +
    '【集合場所について】\n' +
    '当日にLINEにてご連絡いたします。\n\n' +
    '【ご注意】\n' +
    '足腰が悪い方・体が不自由な方は事前に一度ご相談ください。\n\n' +
    adminCancelPolicy_();
}

function adminBuildSupConfirm_(booking) {
  return adminConfirmOpening_(booking, '🌅') +
    '\n\n【当日の持ち物】\n' +
    '・水着（水着を着て集合していただけると助かります）\n' +
    '・タオル\n' +
    '・酔い止め（必要な方）\n\n' +
    '【集合場所について】\n' +
    '前日にLINEにてご連絡いたします。\n\n' +
    adminCancelPolicy_();
}

function adminBuildDroneSupConfirm_(booking) {
  return adminConfirmOpening_(booking, '🛸') +
    '\n\n【開始時間について】\n' +
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
    adminCancelPolicy_();
}

function adminBuildDayNightConfirm_(booking) {
  var turtle = adminFindTurtleScheduleComponent_(booking);
  var night = adminFindComponent_(booking, 'ヤシガニ');

  return adminConfirmOpening_(booking, '🐢🦀') +
    '\n\n【プラン内容】\n' +
    'ウミガメシュノーケル＋ヤシガニ探検の昼夜セットです。\n\n' +
    '🐢 ウミガメシュノーケル：' + adminFormatComponentSchedule_(turtle) + '\n' +
    '🦀 ヤシガニ探検：' + adminFormatComponentSchedule_(night) + '\n\n' +
    '【集合場所のご案内】\n' +
    '・ウミガメシュノーケル：前日にLINEでご連絡します\n' +
    '・ヤシガニ探検：当日にLINEでご連絡します\n\n' +
    '【当日の持ち物】\n' +
    '〔昼・ウミガメ〕水着・タオル・酔い止め（必要な方）\n' +
    '〔夜・ヤシガニ探検〕虫よけスプレー・歩きやすい靴（サンダル不可）・飲み物\n\n' +
    adminCancelPolicy_();
}

function adminBuildSeaSkyConfirm_(booking) {
  var turtle = adminFindTurtleScheduleComponent_(booking);
  var sup = adminFindComponent_(booking, 'ドローンSUP');

  return adminConfirmOpening_(booking, '🐢🛸') +
    '\n\n【プラン内容】\n' +
    'ウミガメシュノーケル＋ドローンSUPの海空セットです。\n' +
    '所要時間の目安は約3.5〜4時間です。\n\n' +
    '🐢 ウミガメシュノーケル：' + adminFormatComponentSchedule_(turtle) + '〜 約1.5時間\n' +
    '🛸 ドローンSUP：' + adminFormatComponentSchedule_(sup) + '〜 約1.5時間\n' +
    '※ ウミガメシュノーケル終了後、そのまま続けてドローンSUPを行います。\n\n' +
    '【開催場所について】\n' +
    '基本的に同じビーチで、続けて開催します。\n' +
    '海況・水位によっては、ドローンSUPを別のビーチで開催する場合があります。\n' +
    '集合場所は前日にLINEでご連絡いたします。\n\n' +
    '【当日の持ち物】\n' +
    '・水着（着替えは現地でできます）\n' +
    '・タオル\n' +
    '・酔い止め（必要な方）\n\n' +
    adminCancelPolicy_();
}

function adminBuildTripleConfirm_(booking) {
  var turtle = adminFindTurtleScheduleComponent_(booking);
  var sup = adminFindComponent_(booking, 'ドローンSUP');
  var night = adminFindComponent_(booking, 'ヤシガニ');

  return adminConfirmOpening_(booking, '🐢🛸🦀') +
    '\n\n【開催時間】\n' +
    '🐢 ウミガメシュノーケル：' + adminFormatComponentSchedule_(turtle) + '〜 約1.5時間\n' +
    '🛸 ドローンSUP：' + adminFormatComponentSchedule_(sup) + '〜 約1.5時間\n' +
    '🦀 ナイトツアー：' + adminFormatComponentSchedule_(night) + '〜 約1.5時間\n\n' +
    '【開催場所について】\n' +
    '・ウミガメシュノーケル：前日にLINEでご連絡します\n' +
    '・ドローンSUP：ウミガメ終了後、そのまま続けて開催します\n' +
    '・ナイトツアー：当日にLINEでご連絡します\n\n' +
    '【当日の持ち物】\n' +
    '〔昼・海亀／SUP〕水着・タオル・酔い止め（必要な方）\n' +
    '〔夜・ナイトツアー〕虫よけスプレー・歩きやすい靴（サンダル不可）・飲み物\n\n' +
    adminCancelPolicy_();
}

function adminBuildFullMessage_(booking) {
  return (
    'この度はご予約いただき、\n' +
    '誠にありがとうございます。\n\n' +
    booking.name + ' 様\n\n' +
    '予約番号：' + booking.bookingNumber + '\n' +
    'プラン：' + booking.displayPlan + '\n' +
    '開催日時：\n' + adminBuildScheduleText_(booking) + '\n\n' +
    '大変申し訳ございませんが、\n' +
    'ご希望の日程はすでに満席となっており、\n' +
    'ご予約をお受けすることができない状況です。\n\n' +
    'またの機会にぜひご利用いただけますと\n' +
    '幸いです。\n\n' +
    '海亀兄弟'
  );
}

function adminBuildLocationMessage_(location, selectedTime, planName) {
  var nightFooter =
    '\n\n恐れ入りますが、本メッセージをご確認いただけましたら、ご返信いただけますと幸いです。\n' +
    '事務担当　中村 凪';
  var snorkelFooter =
    '\n\n【到着推奨時間・駐車場について】\n' +
    '5〜10月：開始30〜40分前\n' +
    '11〜4月：開始15分前\n\n' +
    '宮古島のシュノーケルポイントは大変人気のため、駐車場が混雑する場合がございます。\n' +
    'お早めにお越しいただき、駐車場の確保をお願いいたします。\n\n' +
    '開始15分前〜開始時間の間に現地スタッフよりお電話いたします。\n' +
    '現地にてお待ちください。' + nightFooter;
  var nightCommon =
    '【持ち物・服装】\n' +
    '特に持ち物はありませんが、2時間ほど歩きますので水分の持参をおすすめします。\n' +
    '動きやすい格好・長袖長ズボン・靴（完全舗装ではないためサンダル不可）でお越しください。\n' +
    '🚻 トイレがありませんので、事前に済ませてからお越しください。\n\n';
  var higashihenna =
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
      '📍 https://maps.google.com/?cid=4444603144121769337' + snorkelFooter,
    '東平安名ビーチ': higashihenna,
    'ボラビーチ': higashihenna,
    'ワイワイビーチ':
      '明日のツアー開催場所のご案内です。\n' +
      '明日はワイワイビーチにて開催いたします。\n\n' +
      'ウミガメ遭遇率：80%\n' +
      'サンゴ・熱帯魚：観察できます\n' +
      '🅿️ 駐車場：無料\n' +
      '🚻 トイレ：なし／🚿 シャワー：なし\n' +
      '※トイレ・シャワーがありませんので事前にお済ませください。\n' +
      '📍 https://maps.app.goo.gl/omdcJdCtih5aS9Vc9' + snorkelFooter,
    'シギラビーチ':
      '明日のツアー開催場所のご案内です。\n' +
      '明日はシギラビーチにて開催いたします。\n\n' +
      'ウミガメ遭遇率：80%\n' +
      'サンゴ・熱帯魚：観察できます\n' +
      '🅿️ 駐車場：1,000円\n' +
      '🚻 トイレ：あり／🚿 シャワー：なし\n' +
      'なお、シギラビーチは複数の業者が集中するビーチのため、ウミガメとの写真撮影はお約束できません。\n' +
      '📍 https://maps.app.goo.gl/RTwT8jv1U9GJrwLJ7?g_st=ic' + snorkelFooter,
    'ナイトツアー（遺跡）':
      '本日のナイトツアー集合場所のご案内です。\n' +
      '本日の集合場所はこちらになります。\n\n' + nightCommon +
      '📍 集合場所：https://maps.app.goo.gl/ugnwv2zcUReYTsuR6\n' +
      '上比屋山遺跡と記された石碑がありますので、その道路沿いにお車をお停めください。\n\n' +
      '本日 ' + (selectedTime || '集合時間') + ' にお待ちしております。' + nightFooter,
    'ナイトツアー（インディアンマリンガーデン）':
      '本日のナイトツアー集合場所のご案内です。\n' +
      '本日の集合場所はこちらになります。\n\n' + nightCommon +
      '📍 集合場所（第一駐車場）：https://maps.app.goo.gl/jyKBqL2WtUkP8MSJA?g_st=ic\n' +
      '第一駐車場にてお待ちください。\n\n' +
      '集合時間になりましたら現地スタッフよりお電話いたします。\n' +
      'そのままお待ちいただけますと幸いです。' + nightFooter
  };

  var message = messages[location] || '';

  if (message && adminIsDroneSupSingle_(planName)) {
    message = message
      .replace('明日のツアー開催場所のご案内です。', '明日のドローンSUP開催場所のご案内です。')
      .replace(/ウミガメ遭遇率：[^\n]*\n?/, '')
      .replace(/サンゴ・熱帯魚：[^\n]*\n?/, '')
      .replace(/なお、シギラビーチは[^\n]*\n?/, '')
      .replace(/シュノーケルポイント/g, 'ビーチ');
  }

  return message;
}

function adminCancelPolicy_() {
  return (
    '【キャンセルポリシー】\n' +
    '前日まで：無料\n' +
    '当日：100%\n\n' +
    'ご不明な点はお気軽にご連絡ください。\n' +
    '海亀兄弟'
  );
}

function adminIsTriple_(booking) {
  return booking.components.length >= 3 &&
    booking.components.some(function(row) {
      return row.plan.indexOf('まるごと1日セット') !== -1;
    });
}

function adminIsSeaSky_(booking) {
  return booking.components.some(function(row) {
    return row.plan.indexOf('海空セット') !== -1;
  });
}

function adminIsDayNight_(booking) {
  return booking.components.some(function(row) {
    return row.plan.indexOf('昼夜セット') !== -1;
  });
}

function adminIsDroneSupSingle_(planName) {
  var plan = String(planName || '');
  return plan.indexOf('ドローンSUP') !== -1 &&
    plan.indexOf('セット') === -1 &&
    plan.indexOf('ウミガメ') === -1;
}

function adminIsNightPlan_(planName) {
  var plan = String(planName || '');
  return plan.indexOf('ナイトツアー') !== -1 ||
    plan.indexOf('ヤシガニ') !== -1;
}

function adminFindComponent_(booking, keyword) {
  for (var i = 0; i < booking.components.length; i++) {
    if (booking.components[i].plan.indexOf(keyword) !== -1) {
      return booking.components[i];
    }
  }
  return null;
}

// ============================================================
// 操作履歴・共通処理
// ============================================================

function adminAppendAudit_(actor, booking, action, detail, rowNumbers) {
  var ss = adminGetSpreadsheet_();
  var sheet = ss.getSheetByName(ADMIN_AUDIT_SHEET_NAME);
  var headers = [
    '操作日時', '操作者', '予約番号', '名前', '参加日',
    '操作', '内容', '予約一覧行', 'アプリ版'
  ];

  if (!sheet) sheet = ss.insertSheet(ADMIN_AUDIT_SHEET_NAME);

  if (String(sheet.getRange(1, 1).getValue()) !== headers[0]) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#d9ead3');
  }

  sheet.appendRow([
    new Date(),
    actor,
    booking.bookingNumber || '',
    booking.name || '',
    booking.date || '',
    action,
    detail,
    (rowNumbers || []).join(','),
    ADMIN_APP_VERSION
  ]);
}

function adminNormalizeDate_(value) {
  var text = String(value || '').trim();
  var match = text.match(/(\d{4})[\/\-.年](\d{1,2})[\/\-.月](\d{1,2})/);

  if (!match) return text;

  return match[1] + '-' + ('0' + match[2]).slice(-2) + '-' + ('0' + match[3]).slice(-2);
}

function adminNormalizeTime_(value) {
  var text = String(value || '').trim();
  var match = text.match(/(\d{1,2})\s*(?::|：|時)\s*(\d{1,2})/);

  if (!match) return text;

  return ('0' + match[1]).slice(-2) + ':' + ('0' + match[2]).slice(-2);
}

function adminNormalizeLineResult_(value) {
  if (typeof value === 'boolean') return '';

  var text = String(value == null ? '' : value).trim();

  return /^(TRUE|FALSE)$/i.test(text) ? '' : text;
}

function adminToNumber_(value) {
  var normalized = String(value == null ? '' : value)
    .replace(/[¥,円\s]/g, '');
  var number = Number(normalized);

  return isNaN(number) ? 0 : number;
}

function adminFormatYen_(value) {
  return '¥' + adminToNumber_(value).toLocaleString('ja-JP');
}

function adminFormatCoupon_(code, discount) {
  var cleanCode = String(code || '').trim();
  var amount = adminToNumber_(discount);

  if (cleanCode && amount) return cleanCode + '（-' + adminFormatYen_(amount) + '）';
  if (cleanCode) return cleanCode;
  if (amount) return '割引のみ（-' + adminFormatYen_(amount) + '）';
  return 'なし';
}

function adminValueOrNone_(value) {
  var text = String(value == null ? '' : value).trim();
  return text || 'なし';
}

function adminUnique_(values) {
  var seen = {};
  return values.filter(function(value) {
    var key = String(value || '');
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function adminUniqueSorted_(values) {
  return adminUnique_(values.filter(function(value) {
    return value && value !== '未設定' && value !== '複数';
  })).sort(function(a, b) {
    return String(a).localeCompare(String(b), 'ja');
  });
}

function adminHash_(text) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(text || ''),
    Utilities.Charset.UTF_8
  );

  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '').slice(0, 24);
}

function adminToday_() {
  return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
}

function adminAddDays_(dateText, days) {
  var parts = String(dateText).split('-');
  var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  date.setDate(date.getDate() + Number(days || 0));
  return Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy-MM-dd');
}

function adminFormatDateTime_(date) {
  return Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
}
