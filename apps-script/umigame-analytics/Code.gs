const ANALYTICS_CONFIG = Object.freeze({
  timezone: 'Asia/Tokyo',
  spreadsheetProperty: 'ANALYTICS_SPREADSHEET_ID',
  secretProperty: 'ANALYTICS_SHARED_SECRET',
  spreadsheetName: '海亀兄弟 匿名分析レポート',
  dashboardSheet: 'ダッシュボード',
  dailySheet: '日別分析',
  eventsSheet: 'イベントデータ',
  definitionsSheet: '設定・定義',
  sourceDeviceSheet: '流入元・デバイス分析',
  pageFailureSheet: 'ページ・失敗分析',
  timingSheet: '曜日・時間帯分析',
});

// WEEKDAY(date,2): 1=月...7=日
const WEEKDAY_LABELS = Object.freeze(['月', '火', '水', '木', '金', '土', '日']);

const HOUR_BANDS = Object.freeze([
  [0, 5, '深夜・早朝(0-5時)'],
  [6, 11, '午前(6-11時)'],
  [12, 17, '午後(12-17時)'],
  [18, 23, '夜(18-23時)'],
]);

const ANALYTICS_EVENTS = Object.freeze([
  'page_view',
  'page_engagement',
  'scroll_depth',
  'external_link_click',
  'language_change',
  'web_vital',
  'booking_started',
  'book_cta_click',
  'line_click',
  'line_add_friend_click',
  'phone_click',
  'booking_form_view',
  'line_login_click',
  'booking_submitted',
  'booking_failed',
]);

const EVENT_HEADERS = Object.freeze([
  '日時',
  'イベント',
  'ページ',
  '言語',
  'デバイス',
  '画面幅',
  '画面高',
  '参照元ホスト',
  '初回ページ',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'UTM Content',
  'UTM Term',
  'ブラウザ',
  'OS',
  'スクリーン幅',
  'スクリーン高',
  '接続',
  'ロケーション',
  'プランID',
  'プラン名',
  '人数合計',
  '大人',
  '子ども',
  '3歳未満',
  '金額',
  '通貨',
  'LINEログイン',
  '結果',
  'エラー分類',
  '流入元',
  'リンク先ホスト',
  'リンク種別',
  'Web Vital',
  '値',
  '評価',
  '滞在秒',
  '最大スクロール率',
  // ブログ記事内CTAの計測。設置位置は「ロケーション」列（article_top 等）に入る。
  'CTA種別',
  'CTAボタン文言',
]);

const EVENT_DEFINITIONS = Object.freeze([
  ['page_view', 'ページ表示', 'ページ・言語・端末・匿名の流入情報'],
  ['page_engagement', 'ページ離脱時の利用状況', '滞在秒・最大スクロール率'],
  ['scroll_depth', 'スクロール到達', '最大スクロール率'],
  ['external_link_click', '外部リンククリック', 'リンク先ホスト・リンク種別'],
  ['language_change', '表示言語の変更', 'ページ・言語'],
  ['web_vital', '実ユーザー性能', '指標名・値・評価'],
  ['booking_form_view', '予約フォーム表示', 'ページ・言語'],
  ['booking_started', '予約入力開始', 'ページ・言語'],
  ['book_cta_click', '予約ボタンクリック', 'ロケーション（設置位置）・CTA種別・ボタン文言・プランID・UTM Campaign'],
  ['line_login_click', 'LINEログイン操作', 'ロケーション'],
  ['line_click', 'LINE操作', 'ロケーション'],
  ['line_add_friend_click', 'LINE友だち追加', 'ロケーション'],
  ['phone_click', '電話リンク操作', 'ロケーション'],
  ['booking_submitted', '予約送信成功', 'プラン・人数内訳・金額・通貨・流入元'],
  ['booking_failed', '予約送信失敗', 'プラン・人数内訳・金額・失敗分類'],
]);

/**
 * 初回だけ手動実行します。匿名分析用スプレッドシートと集計画面を作成します。
 * @return {{spreadsheetId: string, spreadsheetUrl: string}}
 */
function setupAnalyticsWorkbook() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheet = openConfiguredSpreadsheet_(properties);

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create(ANALYTICS_CONFIG.spreadsheetName);
    properties.setProperty(
      ANALYTICS_CONFIG.spreadsheetProperty,
      spreadsheet.getId()
    );
  }

  spreadsheet.setSpreadsheetTimeZone(ANALYTICS_CONFIG.timezone);

  const dashboard = ensureSheet_(spreadsheet, ANALYTICS_CONFIG.dashboardSheet);
  const daily = ensureSheet_(spreadsheet, ANALYTICS_CONFIG.dailySheet);
  const events = ensureSheet_(spreadsheet, ANALYTICS_CONFIG.eventsSheet);
  const definitions = ensureSheet_(
    spreadsheet,
    ANALYTICS_CONFIG.definitionsSheet
  );
  const sourceDevice = ensureSheet_(
    spreadsheet,
    ANALYTICS_CONFIG.sourceDeviceSheet
  );
  const pageFailure = ensureSheet_(
    spreadsheet,
    ANALYTICS_CONFIG.pageFailureSheet
  );
  const timing = ensureSheet_(spreadsheet, ANALYTICS_CONFIG.timingSheet);

  configureEventsSheet_(events);
  configureDailySheet_(daily);
  configureDashboardSheet_(dashboard, daily);
  configureDefinitionsSheet_(definitions);
  configureSourceDeviceSheet_(sourceDevice);
  configurePageFailureSheet_(pageFailure);
  configureTimingSheet_(timing);
  removeUnusedDefaultSheets_(spreadsheet);

  spreadsheet.setActiveSheet(dashboard);
  SpreadsheetApp.flush();

  return {
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
  };
}

/**
 * VercelとApps Scriptで共有する秘密文字列を生成します。
 * 戻り値はVercelの ANALYTICS_SHEETS_SHARED_SECRET に登録してください。
 * @return {string}
 */
function generateAnalyticsSharedSecret() {
  const secret = [
    Utilities.getUuid().replace(/-/g, ''),
    Utilities.getUuid().replace(/-/g, ''),
  ].join('');
  PropertiesService.getScriptProperties().setProperty(
    ANALYTICS_CONFIG.secretProperty,
    secret
  );
  return secret;
}

/** @param {GoogleAppsScript.Events.DoPost} request */
function doPost(request) {
  try {
    const body = parseRequestBody_(request);
    const expectedSecret = PropertiesService.getScriptProperties().getProperty(
      ANALYTICS_CONFIG.secretProperty
    );

    if (!expectedSecret || body.secret !== expectedSecret) {
      return jsonResponse_({ ok: false, error: 'unauthorized' });
    }

    const event = normalizeEvent_(body.event);
    const spreadsheet = openRequiredSpreadsheet_();
    const sheet = ensureSheet_(spreadsheet, ANALYTICS_CONFIG.eventsSheet);
    if (sheet.getLastRow() === 0) {
      configureEventsSheet_(sheet);
    }

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      return jsonResponse_({ ok: false, error: 'busy' });
    }

    try {
      sheet.appendRow(eventToRow_(event));
    } finally {
      lock.releaseLock();
    }

    return jsonResponse_({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false, error: 'invalid_request' });
  }
}

function doGet() {
  const configured = Boolean(
    PropertiesService.getScriptProperties().getProperty(
      ANALYTICS_CONFIG.spreadsheetProperty
    )
  );
  return jsonResponse_({ ok: true, configured: configured });
}

function openConfiguredSpreadsheet_(properties) {
  const spreadsheetId = properties.getProperty(
    ANALYTICS_CONFIG.spreadsheetProperty
  );
  if (!spreadsheetId) return null;

  try {
    return SpreadsheetApp.openById(spreadsheetId);
  } catch (error) {
    console.warn('Configured spreadsheet could not be opened.', error);
    return null;
  }
}

function openRequiredSpreadsheet_() {
  const spreadsheet = openConfiguredSpreadsheet_(
    PropertiesService.getScriptProperties()
  );
  if (!spreadsheet) {
    throw new Error('Analytics spreadsheet is not configured.');
  }
  return spreadsheet;
}

function ensureSheet_(spreadsheet, name) {
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function requiredSheetNames_() {
  return [
    ANALYTICS_CONFIG.dashboardSheet,
    ANALYTICS_CONFIG.dailySheet,
    ANALYTICS_CONFIG.eventsSheet,
    ANALYTICS_CONFIG.definitionsSheet,
    ANALYTICS_CONFIG.sourceDeviceSheet,
    ANALYTICS_CONFIG.pageFailureSheet,
    ANALYTICS_CONFIG.timingSheet,
  ];
}

function removeUnusedDefaultSheets_(spreadsheet) {
  const required = requiredSheetNames_();
  spreadsheet.getSheets().forEach(function (sheet) {
    const isRequired = required.indexOf(sheet.getName()) !== -1;

    if (!isRequired && spreadsheet.getSheets().length > required.length) {
      spreadsheet.deleteSheet(sheet);
    }
  });
}

function configureEventsSheet_(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, EVENT_HEADERS.length);
  const currentHeaders = headerRange.getDisplayValues()[0];
  const headersMatch = EVENT_HEADERS.every(function (header, index) {
    return currentHeaders[index] === header;
  });

  if (!headersMatch) {
    headerRange.setValues([EVENT_HEADERS]);
  }

  headerRange
    .setBackground('#0f766e')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 2), EVENT_HEADERS.length)
      .createFilter();
  }

  sheet.getRange('A:A').setNumberFormat('yyyy/mm/dd hh:mm:ss');
  sheet.getRange('F:G').setNumberFormat('0');
  sheet.getRange('Q:R').setNumberFormat('0');
  sheet.getRange('W:AA').setNumberFormat('#,##0');
  sheet.getRange('AJ:AM').setNumberFormat('0.00');
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 165);
  sheet.setColumnWidth(3, 220);
  sheet.setColumnWidths(4, EVENT_HEADERS.length - 3, 115);
}

function configureDailySheet_(sheet) {
  sheet.clear();
  sheet.getRange('A1:G1').setValues([[
    '日付',
    'ページ表示',
    '予約開始',
    '予約完了',
    '予約失敗',
    '参加人数',
    '売上',
  ]]);
  sheet.getRange('A2').setFormula(
    '=QUERY({' +
      'ARRAYFORMULA(IF(\'イベントデータ\'!A2:A="","",TO_DATE(INT(\'イベントデータ\'!A2:A)))),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="page_view")),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="booking_started")),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="booking_submitted")),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="booking_failed")),' +
      'ARRAYFORMULA(IF(\'イベントデータ\'!B2:B="booking_submitted",\'イベントデータ\'!W2:W,0)),' +
      'ARRAYFORMULA(IF(\'イベントデータ\'!B2:B="booking_submitted",\'イベントデータ\'!AA2:AA,0))' +
    '},"select Col1,sum(Col2),sum(Col3),sum(Col4),sum(Col5),sum(Col6),sum(Col7) ' +
      'where Col1 is not null group by Col1 order by Col1 ' +
      'label Col1 \'日付\',sum(Col2) \'ページ表示\',sum(Col3) \'予約開始\',' +
      'sum(Col4) \'予約完了\',sum(Col5) \'予約失敗\',sum(Col6) \'参加人数\',' +
      'sum(Col7) \'売上\'",0)'
  );
  sheet.getRange('H1').setValue('平均予約単価');
  sheet.getRange('H2').setFormula(
    '=ARRAYFORMULA(IF($A2:$A="","",IFERROR($G2:$G/$D2:$D,0)))'
  );

  sheet.getRange('A1:H1')
    .setBackground('#0f766e')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('yyyy/mm/dd');
  sheet.getRange('B:F').setNumberFormat('#,##0');
  sheet.getRange('G:G').setNumberFormat('¥#,##0');
  sheet.getRange('H:H').setNumberFormat('¥#,##0');
  sheet.setColumnWidth(1, 120);
  sheet.setColumnWidths(2, 7, 120);
}

function configureDashboardSheet_(sheet, dailySheet) {
  sheet.clear();
  sheet.getCharts().forEach(function (chart) {
    sheet.removeChart(chart);
  });
  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(2);
  sheet.setColumnWidths(1, 8, 120);
  sheet.getRange('A1:H1').merge()
    .setValue('海亀兄弟 匿名分析ダッシュボード')
    .setBackground('#064e3b')
    .setFontColor('#ffffff')
    .setFontSize(18)
    .setFontWeight('bold')
    .setHorizontalAlignment('left');
  sheet.getRange('A2:H2').merge()
    .setValue('直近30日｜氏名・メール・電話番号・住所・IP・Cookie・恒久IDは保存しません')
    .setBackground('#d1fae5')
    .setFontColor('#065f46');

  const metricLabels = [
    ['A3', 'ページ表示'],
    ['C3', '予約開始'],
    ['E3', '予約完了'],
    ['G3', '予約完了率'],
    ['A6', '売上'],
    ['C6', '参加人数'],
    ['E6', '予約失敗'],
    ['G6', '平均予約単価'],
  ];
  metricLabels.forEach(function (entry) {
    sheet.getRange(entry[0]).setValue(entry[1]);
  });

  sheet.getRange('A4').setFormula(
    '=COUNTIFS(\'イベントデータ\'!$A:$A,">="&TODAY()-29,\'イベントデータ\'!$B:$B,"page_view")'
  );
  sheet.getRange('C4').setFormula(
    '=COUNTIFS(\'イベントデータ\'!$A:$A,">="&TODAY()-29,\'イベントデータ\'!$B:$B,"booking_started")'
  );
  sheet.getRange('E4').setFormula(
    '=COUNTIFS(\'イベントデータ\'!$A:$A,">="&TODAY()-29,\'イベントデータ\'!$B:$B,"booking_submitted")'
  );
  sheet.getRange('G4').setFormula('=IFERROR(E4/C4,0)');
  sheet.getRange('A7').setFormula(
    '=SUMIFS(\'イベントデータ\'!$AA:$AA,\'イベントデータ\'!$A:$A,">="&TODAY()-29,\'イベントデータ\'!$B:$B,"booking_submitted")'
  );
  sheet.getRange('C7').setFormula(
    '=SUMIFS(\'イベントデータ\'!$W:$W,\'イベントデータ\'!$A:$A,">="&TODAY()-29,\'イベントデータ\'!$B:$B,"booking_submitted")'
  );
  sheet.getRange('E7').setFormula(
    '=COUNTIFS(\'イベントデータ\'!$A:$A,">="&TODAY()-29,\'イベントデータ\'!$B:$B,"booking_failed")'
  );
  sheet.getRange('G7').setFormula('=IFERROR(A7/E4,0)');

  ['A3:B4', 'C3:D4', 'E3:F4', 'G3:H4', 'A6:B7', 'C6:D7', 'E6:F7', 'G6:H7']
    .forEach(function (a1) {
      sheet.getRange(a1).setBackground('#f0fdfa').setBorder(
        true, true, true, true, false, false, '#99f6e4', SpreadsheetApp.BorderStyle.SOLID
      );
    });
  sheet.getRangeList(['A3', 'C3', 'E3', 'G3', 'A6', 'C6', 'E6', 'G6'])
    .setFontColor('#0f766e')
    .setFontWeight('bold');
  sheet.getRangeList(['A4', 'C4', 'E4', 'G4', 'A7', 'C7', 'E7', 'G7'])
    .setFontSize(18)
    .setFontWeight('bold');
  sheet.getRange('G4').setNumberFormat('0.0%');
  sheet.getRangeList(['A7', 'G7']).setNumberFormat('¥#,##0');
  sheet.getRangeList(['A4', 'C4', 'E4', 'C7', 'E7']).setNumberFormat('#,##0');

  sheet.getRange('A10:D10').setValues([['プラン', '予約件数', '参加人数', '売上']]);
  sheet.getRange('A11').setFormula(
    '=QUERY(\'イベントデータ\'!A:AM,"select V,count(B),sum(W),sum(AA) ' +
      'where A >= date \'"&TEXT(TODAY()-29,"yyyy-mm-dd")&"\' and B = \'booking_submitted\' ' +
      'and V is not null group by V order by sum(AA) desc ' +
      'label V \'プラン\',count(B) \'予約件数\',sum(W) \'参加人数\',sum(AA) \'売上\'",1)'
  );
  sheet.getRange('F10:H10').setValues([['流入元', '予約件数', '売上']]);
  sheet.getRange('F11').setFormula(
    '=QUERY(\'イベントデータ\'!A:AM,"select AF,count(B),sum(AA) ' +
      'where A >= date \'"&TEXT(TODAY()-29,"yyyy-mm-dd")&"\' and B = \'booking_submitted\' ' +
      'and AF is not null group by AF order by count(B) desc ' +
      'label AF \'流入元\',count(B) \'予約件数\',sum(AA) \'売上\'",1)'
  );
  sheet.getRangeList(['A10:D10', 'F10:H10'])
    .setBackground('#0f766e')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.getRange('D:D').setNumberFormat('¥#,##0');
  sheet.getRange('H:H').setNumberFormat('¥#,##0');

  const trendChart = sheet.newChart()
    .asLineChart()
    .addRange(dailySheet.getRange('A1:E1000'))
    .setPosition(20, 1, 0, 0)
    .setOption('title', '日別 予約ファネル')
    .setOption('legend', { position: 'bottom' })
    .setOption('colors', ['#0f766e', '#2563eb', '#16a34a', '#dc2626'])
    .setOption('height', 320)
    .setOption('width', 720)
    .build();
  sheet.insertChart(trendChart);
}

function configureDefinitionsSheet_(sheet) {
  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet.getRange('A1:C1').merge()
    .setValue('匿名分析の設定・定義')
    .setBackground('#064e3b')
    .setFontColor('#ffffff')
    .setFontSize(16)
    .setFontWeight('bold');
  sheet.getRange('A3:B7').setValues([
    ['保存しない情報', '氏名、メール、電話番号、住所、自由記述、IP、Cookie、ユーザーエージェント全文、恒久ID'],
    ['集計単位', '個人ではなく、ページ・日・プラン・流入元・端末などの匿名集計'],
    ['予約成功', 'booking_submitted（人数内訳、プラン、金額、通貨を含む）'],
    ['予約失敗', 'booking_failed（個人情報を含まない失敗分類を含む）'],
    ['重複防止', '送信中ロック、開始イベントの1回制御、ページ離脱イベントの1回制御'],
  ]);
  sheet.getRange('A3:A7').setBackground('#d1fae5').setFontWeight('bold');
  sheet.getRange('A10:C10').setValues([['イベント名', '意味', '主な匿名項目']]);
  sheet.getRange(11, 1, EVENT_DEFINITIONS.length, 3).setValues(EVENT_DEFINITIONS);
  sheet.getRange('A10:C10')
    .setBackground('#0f766e')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 190);
  sheet.setColumnWidth(2, 240);
  sheet.setColumnWidth(3, 440);
  sheet.getRange('A:C').setWrap(true).setVerticalAlignment('top');
}

/**
 * 流入元(UTM Source)別・デバイス別・ランディングページ別に「表示→予約開始→予約完了」の
 * ファネルとCVRを並べます。ページ表示イベントには予約系プロパティが付かないため、
 * 全イベント共通の列（UTM Source・デバイス・初回ページ）で集計します。
 */
function configureSourceDeviceSheet_(sheet) {
  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, 26, 120);

  sheet.getRange('A1:H1').setValues([[
    '流入元(UTM Source)', '表示', '予約開始', '予約完了', '予約失敗', '売上',
    'CVR 表示→開始', 'CVR 開始→完了',
  ]]);
  sheet.getRange('A2').setFormula(
    '=QUERY({' +
      'ARRAYFORMULA(IF(\'イベントデータ\'!A2:A="","",IF(\'イベントデータ\'!J2:J="","direct",\'イベントデータ\'!J2:J))),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="page_view")),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="booking_started")),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="booking_submitted")),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="booking_failed")),' +
      'ARRAYFORMULA(IF(\'イベントデータ\'!B2:B="booking_submitted",\'イベントデータ\'!AA2:AA,0))' +
    '},"select Col1,sum(Col2),sum(Col3),sum(Col4),sum(Col5),sum(Col6) ' +
      'where Col1 is not null group by Col1 order by sum(Col2) desc ' +
      'label Col1 \'流入元\',sum(Col2) \'表示\',sum(Col3) \'予約開始\',' +
      'sum(Col4) \'予約完了\',sum(Col5) \'予約失敗\',sum(Col6) \'売上\'",0)'
  );
  sheet.getRange('G2').setFormula('=ARRAYFORMULA(IF($A2:$A="","",IFERROR($C2:$C/$B2:$B,0)))');
  sheet.getRange('H2').setFormula('=ARRAYFORMULA(IF($A2:$A="","",IFERROR($D2:$D/$C2:$C,0)))');

  sheet.getRange('J1:Q1').setValues([[
    'デバイス', '表示', '予約開始', '予約完了', '予約失敗', '売上',
    'CVR 表示→開始', 'CVR 開始→完了',
  ]]);
  sheet.getRange('J2').setFormula(
    '=QUERY({' +
      'ARRAYFORMULA(IF(\'イベントデータ\'!A2:A="","",\'イベントデータ\'!E2:E)),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="page_view")),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="booking_started")),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="booking_submitted")),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="booking_failed")),' +
      'ARRAYFORMULA(IF(\'イベントデータ\'!B2:B="booking_submitted",\'イベントデータ\'!AA2:AA,0))' +
    '},"select Col1,sum(Col2),sum(Col3),sum(Col4),sum(Col5),sum(Col6) ' +
      'where Col1 is not null group by Col1 order by sum(Col2) desc ' +
      'label Col1 \'デバイス\',sum(Col2) \'表示\',sum(Col3) \'予約開始\',' +
      'sum(Col4) \'予約完了\',sum(Col5) \'予約失敗\',sum(Col6) \'売上\'",0)'
  );
  sheet.getRange('P2').setFormula('=ARRAYFORMULA(IF($J2:$J="","",IFERROR($L2:$L/$K2:$K,0)))');
  sheet.getRange('Q2').setFormula('=ARRAYFORMULA(IF($J2:$J="","",IFERROR($M2:$M/$L2:$L,0)))');

  sheet.getRange('S1:Z1').setValues([[
    'ランディングページ', '表示', '予約開始', '予約完了', '予約失敗', '売上',
    'CVR 表示→開始', 'CVR 開始→完了',
  ]]);
  sheet.getRange('S2').setFormula(
    '=QUERY({' +
      'ARRAYFORMULA(IF(\'イベントデータ\'!A2:A="","",\'イベントデータ\'!I2:I)),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="page_view")),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="booking_started")),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="booking_submitted")),' +
      'ARRAYFORMULA(N(\'イベントデータ\'!B2:B="booking_failed")),' +
      'ARRAYFORMULA(IF(\'イベントデータ\'!B2:B="booking_submitted",\'イベントデータ\'!AA2:AA,0))' +
    '},"select Col1,sum(Col2),sum(Col3),sum(Col4),sum(Col5),sum(Col6) ' +
      'where Col1 is not null group by Col1 order by sum(Col2) desc ' +
      'label Col1 \'ランディングページ\',sum(Col2) \'表示\',sum(Col3) \'予約開始\',' +
      'sum(Col4) \'予約完了\',sum(Col5) \'予約失敗\',sum(Col6) \'売上\'",0)'
  );
  sheet.getRange('Y2').setFormula('=ARRAYFORMULA(IF($S2:$S="","",IFERROR($U2:$U/$T2:$T,0)))');
  sheet.getRange('Z2').setFormula('=ARRAYFORMULA(IF($S2:$S="","",IFERROR($V2:$V/$U2:$U,0)))');

  sheet.getRangeList(['A1:H1', 'J1:Q1', 'S1:Z1'])
    .setBackground('#0f766e')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.getRange('B:B').setNumberFormat('#,##0');
  sheet.getRange('C:E').setNumberFormat('#,##0');
  sheet.getRange('F:F').setNumberFormat('¥#,##0');
  sheet.getRange('G:H').setNumberFormat('0.0%');
  sheet.getRange('K:N').setNumberFormat('#,##0');
  sheet.getRange('O:O').setNumberFormat('¥#,##0');
  sheet.getRange('P:Q').setNumberFormat('0.0%');
  sheet.getRange('T:W').setNumberFormat('#,##0');
  sheet.getRange('X:X').setNumberFormat('¥#,##0');
  sheet.getRange('Y:Z').setNumberFormat('0.0%');
}

/**
 * ページ別の滞在時間・スクロール到達度と、予約失敗の理由・デバイス内訳を並べます。
 * コンテンツ改善（滞在の短いページ）と技術的なつまずき（失敗理由）の両方を見つけるためのシートです。
 */
function configurePageFailureSheet_(sheet) {
  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, 12, 140);

  sheet.getRange('A1:D1').setValues([['ページ', '訪問件数', '平均滞在秒', '平均スクロール率']]);
  sheet.getRange('A2').setFormula(
    '=QUERY(\'イベントデータ\'!A:AM,"select C,count(B),avg(AL),avg(AM) ' +
      'where B=\'page_engagement\' and C is not null group by C order by count(B) desc ' +
      'label C \'ページ\',count(B) \'訪問件数\',avg(AL) \'平均滞在秒\',avg(AM) \'平均スクロール率\'",1)'
  );

  sheet.getRange('F1:G1').setValues([['予約失敗の理由', '件数']]);
  sheet.getRange('F2').setFormula(
    '=QUERY(\'イベントデータ\'!A:AM,"select AE,count(B) ' +
      'where B=\'booking_failed\' and AE is not null group by AE order by count(B) desc ' +
      'label AE \'エラー分類\',count(B) \'件数\'",1)'
  );

  sheet.getRange('I1:J1').setValues([['予約失敗したデバイス', '件数']]);
  sheet.getRange('I2').setFormula(
    '=QUERY(\'イベントデータ\'!A:AM,"select E,count(B) ' +
      'where B=\'booking_failed\' and E is not null group by E order by count(B) desc ' +
      'label E \'デバイス\',count(B) \'件数\'",1)'
  );

  sheet.getRangeList(['A1:D1', 'F1:G1', 'I1:J1'])
    .setBackground('#0f766e')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.getRange('B:B').setNumberFormat('#,##0');
  sheet.getRange('C:C').setNumberFormat('0.0');
  sheet.getRange('D:D').setNumberFormat('0.0"%"');
  sheet.getRange('G:G').setNumberFormat('#,##0');
  sheet.getRange('J:J').setNumberFormat('#,##0');
}

/**
 * 曜日別・時間帯別に「表示→予約開始→予約完了」の件数と売上を並べます。
 * 集計対象は固定7曜日・4時間帯のみなので、動的グループ化ではなくSUMPRODUCTで直接算出します。
 */
function configureTimingSheet_(sheet) {
  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, 13, 130);

  sheet.getRange('A1:F1').setValues([[
    '曜日', '表示', '予約開始', '予約完了', '予約失敗', '売上',
  ]]);
  WEEKDAY_LABELS.forEach(function (label, index) {
    const row = index + 2;
    const weekdayNumber = index + 1;
    sheet.getRange(row, 1).setValue(label);
    sheet.getRange(row, 2).setFormula(
      '=SUMPRODUCT((WEEKDAY(\'イベントデータ\'!$A$2:$A,2)=' + weekdayNumber + ')*(\'イベントデータ\'!$B$2:$B="page_view"))'
    );
    sheet.getRange(row, 3).setFormula(
      '=SUMPRODUCT((WEEKDAY(\'イベントデータ\'!$A$2:$A,2)=' + weekdayNumber + ')*(\'イベントデータ\'!$B$2:$B="booking_started"))'
    );
    sheet.getRange(row, 4).setFormula(
      '=SUMPRODUCT((WEEKDAY(\'イベントデータ\'!$A$2:$A,2)=' + weekdayNumber + ')*(\'イベントデータ\'!$B$2:$B="booking_submitted"))'
    );
    sheet.getRange(row, 5).setFormula(
      '=SUMPRODUCT((WEEKDAY(\'イベントデータ\'!$A$2:$A,2)=' + weekdayNumber + ')*(\'イベントデータ\'!$B$2:$B="booking_failed"))'
    );
    sheet.getRange(row, 6).setFormula(
      '=SUMPRODUCT((WEEKDAY(\'イベントデータ\'!$A$2:$A,2)=' + weekdayNumber + ')*(\'イベントデータ\'!$B$2:$B="booking_submitted")*N(\'イベントデータ\'!$AA$2:$AA))'
    );
  });

  sheet.getRange('H1:M1').setValues([[
    '時間帯', '表示', '予約開始', '予約完了', '予約失敗', '売上',
  ]]);
  HOUR_BANDS.forEach(function (band, index) {
    const row = index + 2;
    const start = band[0];
    const end = band[1];
    const label = band[2];
    sheet.getRange(row, 8).setValue(label);
    sheet.getRange(row, 9).setFormula(
      '=SUMPRODUCT((HOUR(\'イベントデータ\'!$A$2:$A)>=' + start + ')*(HOUR(\'イベントデータ\'!$A$2:$A)<=' + end + ')*(\'イベントデータ\'!$B$2:$B="page_view"))'
    );
    sheet.getRange(row, 10).setFormula(
      '=SUMPRODUCT((HOUR(\'イベントデータ\'!$A$2:$A)>=' + start + ')*(HOUR(\'イベントデータ\'!$A$2:$A)<=' + end + ')*(\'イベントデータ\'!$B$2:$B="booking_started"))'
    );
    sheet.getRange(row, 11).setFormula(
      '=SUMPRODUCT((HOUR(\'イベントデータ\'!$A$2:$A)>=' + start + ')*(HOUR(\'イベントデータ\'!$A$2:$A)<=' + end + ')*(\'イベントデータ\'!$B$2:$B="booking_submitted"))'
    );
    sheet.getRange(row, 12).setFormula(
      '=SUMPRODUCT((HOUR(\'イベントデータ\'!$A$2:$A)>=' + start + ')*(HOUR(\'イベントデータ\'!$A$2:$A)<=' + end + ')*(\'イベントデータ\'!$B$2:$B="booking_failed"))'
    );
    sheet.getRange(row, 13).setFormula(
      '=SUMPRODUCT((HOUR(\'イベントデータ\'!$A$2:$A)>=' + start + ')*(HOUR(\'イベントデータ\'!$A$2:$A)<=' + end + ')*(\'イベントデータ\'!$B$2:$B="booking_submitted")*N(\'イベントデータ\'!$AA$2:$AA))'
    );
  });

  sheet.getRangeList(['A1:F1', 'H1:M1'])
    .setBackground('#0f766e')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.getRange(2, 2, WEEKDAY_LABELS.length, 4).setNumberFormat('#,##0');
  sheet.getRange(2, 6, WEEKDAY_LABELS.length, 1).setNumberFormat('¥#,##0');
  sheet.getRange(2, 9, HOUR_BANDS.length, 4).setNumberFormat('#,##0');
  sheet.getRange(2, 13, HOUR_BANDS.length, 1).setNumberFormat('¥#,##0');
}

function parseRequestBody_(request) {
  if (!request || !request.postData || !request.postData.contents) {
    throw new Error('Missing request body.');
  }
  const body = JSON.parse(request.postData.contents);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Invalid request body.');
  }
  return body;
}

function normalizeEvent_(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid event.');
  }

  const eventName = safeText_(input.event_name, 64);
  if (ANALYTICS_EVENTS.indexOf(eventName) === -1) {
    throw new Error('Unsupported event.');
  }

  return {
    occurred_at: parseOccurredAt_(input.occurred_at),
    event_name: eventName,
    page_path: safeText_(input.page_path, 300),
    locale: safeText_(input.locale, 20),
    device_type: safeText_(input.device_type, 30),
    viewport_width: safeNumber_(input.viewport_width),
    viewport_height: safeNumber_(input.viewport_height),
    referrer_host: safeText_(input.referrer_host, 180),
    landing_path: safeText_(input.landing_page, 300),
    utm_source: safeText_(input.utm_source, 120),
    utm_medium: safeText_(input.utm_medium, 120),
    utm_campaign: safeText_(input.utm_campaign, 180),
    utm_content: safeText_(input.utm_content, 180),
    utm_term: safeText_(input.utm_term, 180),
    browser: safeText_(input.browser, 50),
    os: safeText_(input.os, 50),
    screen_width: safeNumber_(input.screen_width),
    screen_height: safeNumber_(input.screen_height),
    connection: safeText_(input.connection_type, 30),
    properties: normalizeProperties_(input.properties),
  };
}

function normalizeProperties_(input) {
  const properties = input && typeof input === 'object' && !Array.isArray(input)
    ? input
    : {};
  return {
    location: safeText_(properties.location, 120),
    plan: safeText_(properties.plan, 120),
    planName: safeText_(properties.planName, 180),
    headcount: safeNumber_(properties.headcount),
    adultCount: safeNumber_(properties.adultCount),
    childCount: safeNumber_(properties.childCount),
    under3Count: safeNumber_(properties.under3Count),
    total: safeNumber_(properties.total),
    currency: safeText_(properties.currency, 12),
    line_logged_in: safeBoolean_(properties.line_logged_in),
    outcome: safeText_(properties.outcome, 30),
    errorCategory: safeText_(properties.errorCategory, 60),
    source: safeText_(properties.source, 100),
    linkHost: safeText_(properties.linkHost, 180),
    linkType: safeText_(properties.linkType, 60),
    vitalName: safeText_(properties.vitalName, 40),
    vitalValue: safeNumber_(properties.vitalValue),
    vitalRating: safeText_(properties.vitalRating, 30),
    engagedSeconds: safeNumber_(properties.engagedSeconds),
    maxScrollPercent: safeNumber_(properties.maxScrollPercent),
    ctaType: safeText_(properties.ctaType, 40),
    ctaLabel: safeText_(properties.ctaLabel, 120),
  };
}

function eventToRow_(event) {
  const properties = event.properties;
  return [
    event.occurred_at,
    event.event_name,
    event.page_path,
    event.locale,
    event.device_type,
    event.viewport_width,
    event.viewport_height,
    event.referrer_host,
    event.landing_path,
    event.utm_source,
    event.utm_medium,
    event.utm_campaign,
    event.utm_content,
    event.utm_term,
    event.browser,
    event.os,
    event.screen_width,
    event.screen_height,
    event.connection,
    properties.location,
    properties.plan,
    properties.planName,
    properties.headcount,
    properties.adultCount,
    properties.childCount,
    properties.under3Count,
    properties.total,
    properties.currency,
    properties.line_logged_in,
    properties.outcome,
    properties.errorCategory,
    properties.source,
    properties.linkHost,
    properties.linkType,
    properties.vitalName,
    properties.vitalValue,
    properties.vitalRating,
    properties.engagedSeconds,
    properties.maxScrollPercent,
    properties.ctaType,
    properties.ctaLabel,
  ];
}

function parseOccurredAt_(input) {
  const date = new Date(input);
  if (String(date) === 'Invalid Date') {
    return new Date();
  }
  return date;
}

function safeText_(input, maxLength) {
  if (typeof input !== 'string') return '';
  const value = input.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function safeNumber_(input) {
  if (typeof input !== 'number' || !Number.isFinite(input)) return '';
  return input;
}

function safeBoolean_(input) {
  return typeof input === 'boolean' ? input : '';
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
