/**
 * 合計受取金額の表示確認用テスト
 *
 * 使い方:
 *   1. Apps Scriptエディタで関数プルダウンから testReceiveTotalEmail を選んで実行
 *   2. ADMIN_EMAIL 宛にテストメールが3通届く
 *   3. 「合計受取金額」が入っていれば、貼り付けたコードは保存できている
 *
 * 注意:
 *   - 送信されるのはテストメールだけです。シート・カレンダー・LINEには一切触れません。
 *   - 確認が終わったらこのファイルは削除して構いません。
 */

function testReceiveTotalEmail() {
  var headcount = '大人2名 / 子供0名 / 3歳未満0名';
  var participantsDetail = '① テスト太郎 / 大人 / 40歳';

  var base = {
    bookingNumber: 'TEST-0001',
    customerName: 'テスト太郎（テスト送信）',
    customerPhone: '090-0000-0000',
    lineDisplayName: 'てすと',
    selectedDate: '2026-08-10',
    selectedTime: '09:00',
    adultCount: 2,
    childCount: 0,
    under3Count: 0,
    couponCode: 'SUMMER',
    couponDiscount: 2000
  };

  // 1. 海空セット
  var seaSky = testMailMerge_(base, {
    planName: '海空セット',
    totalPrice: 26000,
    specialRequests:
      '[COMBO booking]\n' +
      'プラン：海空セット\n' +
      '海亀希望時間：09:00\n' +
      'ドローンSUP希望時間：海亀終了後'
  });

  // 2. 昼夜セット
  var combo = testMailMerge_(base, {
    planName: '昼夜セット',
    nightTime: '19:00',
    totalPrice: 28000,
    specialRequests:
      '[COMBO booking]\n' +
      'プラン：昼夜セット\n' +
      '海亀希望時間：09:00\n' +
      'ヤシガニ探検希望時間：19:00'
  });

  // 3. まるごと1日セット
  var triple = testMailMerge_(base, {
    planId: 'C5',
    planName: 'まるごと1日セット',
    nightTime: '19:00',
    totalPrice: 57000,
    couponDiscount: 3000,
    specialRequests:
      '[COMBO booking]\n' +
      'プラン：まるごと1日セット\n' +
      '海亀希望時間：09:00\n' +
      'ドローンSUP希望時間：海亀終了後\n' +
      'ヤシガニ探検希望時間：19:00'
  });

  sendBookingEmail(seaSky, headcount, participantsDetail);
  sendBookingEmail(combo, headcount, participantsDetail);
  sendBookingEmail(triple, headcount, participantsDetail);

  Logger.log('テストメール3通を ' + ADMIN_EMAIL + ' へ送信しました。');
}

function testMailMerge_(base, extra) {
  var merged = {};
  var key;

  for (key in base) {
    if (Object.prototype.hasOwnProperty.call(base, key)) {
      merged[key] = base[key];
    }
  }

  for (key in extra) {
    if (Object.prototype.hasOwnProperty.call(extra, key)) {
      merged[key] = extra[key];
    }
  }

  return merged;
}
