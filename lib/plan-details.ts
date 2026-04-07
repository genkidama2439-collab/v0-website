export interface PlanDetail {
  id: string
  name: string
  tagline: string
  heroDescription: string
  image: string
  color: string // theme color class
  gradientFrom: string
  gradientTo: string
  price: string
  priceNote: string
  childPrice?: string
  duration: string
  age: string
  rating: number
  reviews: number
  highlights: { title: string; description: string; icon: string }[]
  flow: { step: number; title: string; description: string; time?: string }[]
  included: string[]
  notIncluded?: string[]
  whatToBring: string[]
  precautions: string[]
  options?: { name: string; price: string; note?: string }[]
  location: string
  locationNote?: string
  meetingTime: string
  paymentMethod: string
  faqs: { q: string; a: string }[]
  reviews_data: { name: string; date: string; rating: number; text: string }[]
  locations?: {
    name: string
    encounterRate: number
    parking: string
    toilet: boolean
    shower: boolean
    note?: string
  }[]
}

export const PLAN_DETAILS: Record<string, PlanDetail> = {
  S1: {
    id: "S1",
    name: "ウミガメと泳ぐシュノーケルツアー",
    tagline: "遭遇率100%継続中！宮古島一番人気のツアー",
    heroDescription: "透き通る宮古島の海で、ウミガメと一緒に泳ぐ感動体験。少人数制だから初心者もお子様も安心。高画質の写真・動画は全て無料プレゼント！",
    image: "/images/s1-sea-turtle-snorkeling.jpg",
    color: "emerald",
    gradientFrom: "from-emerald-600",
    gradientTo: "to-cyan-500",
    price: "¥6,500",
    priceNote: "大人1名あたり",
    childPrice: "¥6,000（子供）",
    duration: "約2時間",
    age: "5〜65歳",
    rating: 4.9,
    reviews: 3842,
    highlights: [
      { title: "ウミガメ遭遇率100%", description: "海を知り尽くしたガイドが、ベストなポイント・時間帯をご案内。一度に何匹も会えることも。人慣れしたウミガメが多く、至近距離で泳げます。", icon: "turtle" },
      { title: "写真・動画すべて無料", description: "Ace Pro 2の高画質カメラでプロ級の写真・動画を撮影。枚数制限なしで全データ無料プレゼント。SNS映え間違いなし！", icon: "camera" },
      { title: "少人数制で安心", description: "基本的に少人数制で実施。スタッフの目が全員に行き届くから、初心者やお子様連れでも安心して楽しめます。", icon: "users" },
      { title: "浅瀬だから怖くない", description: "実施海岸はかなり浅く、潮の満ち引きによっては足がつく深さに。ライフジャケット着用で沈む心配もなし。浮き輪も常備しています。", icon: "shield" },
    ],
    flow: [
      { step: 1, title: "集合・受付", description: "催行海岸にて現地集合。ガイドがお出迎えし、注意事項やツアーの流れを説明します。", time: "開始15分前" },
      { step: 2, title: "器材準備・レクチャー", description: "おしゃれな器材をお貸出し。お客様のほとんどが初めてなので、丁寧にレクチャーいたします。" },
      { step: 3, title: "シュノーケリング体験", description: "いよいよ海へ！ウミガメやクマノミ、熱帯魚たちと一緒に泳ぎます。写真撮影のリクエストもお気軽に。", time: "約1時間" },
      { step: 4, title: "お会計・解散", description: "ツアー終了後、現地でお会計。撮影データは当日中にお渡しします。" },
    ],
    included: ["シュノーケル器材一式", "ライフジャケット", "浮き輪", "写真・動画データ（枚数無制限）", "保険", "安全講習"],
    notIncluded: ["ウェットスーツ（¥1,000）", "度付きメガネ（¥1,000）"],
    whatToBring: ["着替え", "タオル", "日焼け止め", "飲み物", "サンダル（推奨）"],
    precautions: ["妊娠中の方は参加不可", "持病をお持ちの方は参加不可", "飲酒されている方は参加不可", "お体に不自由がある場合は必ず事前にご相談ください"],
    options: [
      { name: "ウェットスーツ", price: "¥1,000", note: "貸切プランなら無料" },
      { name: "度付きメガネ", price: "¥1,000", note: "貸切プランなら無料" },
    ],
    location: "新城海岸（南風時）/ シギラビーチ（北風時）",
    locationNote: "風向きによって当日変更の場合あり。前日にLINEでご案内します。",
    meetingTime: "開始時刻の15分前",
    paymentMethod: "現地現金決済（できるだけお釣りが出ないようご協力ください）",
    faqs: [
      { q: "本当にウミガメに会えますか？", a: "はい！遭遇率100%を継続中です。宮古島の海を知り尽くしたガイドが、ウミガメに高確率で会えるポイント・時間帯を熟知しています。一度に複数匹に会えることも珍しくありません。" },
      { q: "泳げなくても大丈夫？", a: "全く問題ありません。ライフジャケットを着用するので沈む心配はなく、浮き輪も常備しています。浅瀬での実施なので足がつく場所もあり、泳ぎに自信がない方でも安心です。" },
      { q: "子供は何歳から参加できますか？", a: "5歳から参加可能です。少人数制でスタッフの目が行き届くため、お子様連れのご家族にも大人気です。お子様用の器材もご用意しています。" },
      { q: "写真データはいつもらえますか？", a: "基本的に当日中にお渡しします。繁忙期はお時間をいただく場合がございます。LINEで高画質データをお送りします。" },
      { q: "雨でも開催しますか？", a: "小雨程度なら開催します。海の中に入れば雨は気になりません。台風や強風など安全が確保できない場合は中止とし、全額返金いたします。" },
    ],
    reviews_data: [
      { name: "T.K さん", date: "2025年3月", rating: 5, text: "5歳の娘と一緒に参加しました。スタッフさんがとても丁寧で、娘も怖がることなく海を楽しめました。ウミガメと一緒に泳ぐ写真は一生の宝物です！" },
      { name: "K.N さん", date: "2024年12月", rating: 5, text: "泳ぎに自信がなかったのですが、ライフジャケットと浮き具のおかげで安心でした。目の前でウミガメが泳ぐ姿は圧巻！器材も写真も無料なのが嬉しいです。" },
      { name: "S.M さん", date: "2025年2月", rating: 5, text: "少人数制なので、スタッフさんが一人一人しっかり見てくれて安心。子連れでも心配なく参加できました。また宮古島に行ったら絶対リピートします！" },
    ],
    locations: [
      { name: "新城海岸", encounterRate: 95, parking: "¥2,000", toilet: true, shower: true },
      { name: "ボラビーチ", encounterRate: 80, parking: "無料", toilet: false, shower: false, note: "事前にトイレを済ませてください" },
      { name: "ワイワイビーチ", encounterRate: 80, parking: "無料", toilet: false, shower: false, note: "事前にトイレを済ませてください" },
      { name: "シギラビーチ", encounterRate: 80, parking: "¥1,000", toilet: true, shower: false, note: "業者が多くウミガメ写真撮影は保証できない場合あり" },
    ],
  },
  S2: {
    id: "S2",
    name: "VIP貸切シュノーケルツアー",
    tagline: "1組限定・完全プライベート。あなただけの特別な海を。",
    heroDescription: "他のお客様を気にせず、自分たちだけのプライベートな時間を満喫。専属ガイドが付きっきりだから、お子様や泳ぎが苦手な方も絶対安心。",
    image: "/images/s2-sea-turtle-closeup.jpg",
    color: "purple",
    gradientFrom: "from-purple-600",
    gradientTo: "to-indigo-500",
    price: "¥9,000",
    priceNote: "1名あたり（最大6名）",
    duration: "約2時間",
    age: "5〜65歳",
    rating: 5.0,
    reviews: 1247,
    highlights: [
      { title: "完全貸切・専属ガイド", description: "他のお客様のペースを気にすることなく、宮古島の海を独り占め。「子供がぐずらないか心配」「泳ぐのが遅くて迷惑をかけないか不安」という方に大好評！", icon: "crown" },
      { title: "ウェットスーツ&度付きメガネ無料", description: "通常プランでは有料のウェットスーツ（¥1,000）と度付きメガネ（¥1,000）が貸切プランなら無料。お得にフル装備で楽しめます。", icon: "gift" },
      { title: "こだわりの撮影", description: "貸切だからこそ実現する、こだわりのアングルでの写真撮影。「こういう写真が撮りたい！」というリクエストにもお応えします。", icon: "camera" },
      { title: "自由自在なペース", description: "海に入るタイミングも休憩も、すべてお客様のペース。初めての方にこそおすすめのプランです。", icon: "clock" },
    ],
    flow: [
      { step: 1, title: "集合・受付", description: "催行海岸にて現地集合。お客様専属のガイドがお出迎えし、ツアーの流れをご説明。", time: "開始15分前" },
      { step: 2, title: "マンツーマンレクチャー", description: "他のお客様を待つ必要なし。お客様のペースに合わせて丁寧にレクチャーいたします。" },
      { step: 3, title: "貸切シュノーケリング", description: "完全プライベートの海でウミガメと泳ぐ！こだわりのアングルで特別な写真・動画を撮影。", time: "約1時間" },
      { step: 4, title: "お会計・解散", description: "お会計後、解散。撮影データは当日中にお渡しします。" },
    ],
    included: ["シュノーケル器材一式", "ライフジャケット", "浮き輪", "ウェットスーツ", "度付きメガネ", "写真・動画データ（枚数無制限）", "保険", "専属ガイド"],
    whatToBring: ["着替え", "タオル", "日焼け止め", "飲み物", "サンダル（推奨）"],
    precautions: ["妊娠中の方は参加不可", "持病をお持ちの方は参加不可", "飲酒されている方は参加不可", "お体に不自由がある場合は必ず事前にご相談ください", "7名以上はLINEよりご相談ください"],
    location: "新城海岸（南風時）/ シギラビーチ（北風時）",
    locationNote: "風向きによって当日変更の場合あり。前日にLINEでご案内します。",
    meetingTime: "開始時刻の15分前",
    paymentMethod: "現地現金決済（できるだけお釣りが出ないようご協力ください）",
    faqs: [
      { q: "何名まで参加できますか？", a: "最大6名まで参加可能です。7名以上の場合はLINEでご相談ください。別途対応いたします。" },
      { q: "通常プランとの違いは？", a: "完全貸切なのでご自身のペースで楽しめます。さらにウェットスーツ・度付きメガネが無料、こだわりの撮影リクエストにもお応えできます。" },
      { q: "カップルでも利用できますか？", a: "もちろんです！カップルでのご利用も大人気。プライベートな空間で特別な思い出をお作りいただけます。" },
    ],
    reviews_data: [
      { name: "M.S さん", date: "2025年2月", rating: 5, text: "家族4人で貸切ツアーを利用。自分たちのペースでゆっくり楽しめて最高でした。ウミガメに3匹も会えて、子どもたちは大興奮。写真もたくさんいただけて感謝です。" },
      { name: "Y.T さん", date: "2025年3月", rating: 5, text: "カップルで利用しました。他のお客さんがいないので気兼ねなく楽しめて最高！ガイドさんが素敵な写真をたくさん撮ってくれて、一生の思い出になりました。" },
      { name: "H.K さん", date: "2025年1月", rating: 5, text: "3歳と5歳の子連れで参加。貸切だから子供のペースに合わせてもらえて本当に助かりました。ウミガメと一緒の家族写真は宝物です！" },
    ],
    locations: [
      { name: "新城海岸", encounterRate: 95, parking: "¥2,000", toilet: true, shower: true },
      { name: "ボラビーチ", encounterRate: 80, parking: "無料", toilet: false, shower: false, note: "事前にトイレを済ませてください" },
      { name: "ワイワイビーチ", encounterRate: 80, parking: "無料", toilet: false, shower: false, note: "事前にトイレを済ませてください" },
      { name: "シギラビーチ", encounterRate: 80, parking: "¥1,000", toilet: true, shower: false, note: "業者が多くウミガメ写真撮影は保証できない場合あり" },
    ],
  },
  S3: {
    id: "S3",
    name: "本格ナイトツアー",
    tagline: "アマゾン帰りの男と行く、夜の大冒険",
    heroDescription: "懐中電灯を持って夜のジャングルへ！巨大ヤシガニや夜行性の生き物を探す冒険ツアー。0歳から参加OK、三世代でも楽しめます。",
    image: "/images/night-hunter-crab.jpg",
    color: "indigo",
    gradientFrom: "from-indigo-700",
    gradientTo: "to-purple-900",
    price: "¥4,000",
    priceNote: "一律料金（3歳以下無料）",
    duration: "約1.5時間",
    age: "0〜75歳",
    rating: 5.0,
    reviews: 2156,
    highlights: [
      { title: "0歳から参加OK", description: "赤ちゃんからおじいちゃんおばあちゃんまで、三世代でのご参加も大歓迎。3歳以下は無料！お子様の夏の自由研究にもぴったりです。", icon: "baby" },
      { title: "巨大ヤシガニに遭遇", description: "絶滅危惧種に指定されている巨大なヤシガニに遭遇できるかも！他にも夜にしか見られない珍しい植物や生き物たちがたくさん。", icon: "bug" },
      { title: "満天の星空", description: "晴れた日は宮古島ならではの満天の星空も楽しめます。都会では見られない圧巻の星空に感動間違いなし。", icon: "stars" },
      { title: "本格派ガイド", description: "アマゾン帰りの経験豊富なガイドが、その日一番生き物に出会えそうなポイントへご案内。ワクワクの解説付き！", icon: "compass" },
    ],
    flow: [
      { step: 1, title: "集合・受付", description: "開催場所にて現地集合。ガイドがお出迎えし、注意事項や生き物を探すコツを説明します。", time: "19:20 or 21:10" },
      { step: 2, title: "探検準備", description: "専用の懐中電灯などをお貸出し。ワクワクの夜のジャングルへ出発準備！" },
      { step: 3, title: "ナイトサファリ", description: "絶滅危惧種の巨大ヤシガニなどの生き物を探しながら夜の亜熱帯を探検！", time: "約1.5時間" },
      { step: 4, title: "お会計・解散", description: "お会計後、解散。探検中の写真データも無料でお渡しします。" },
    ],
    included: ["懐中電灯", "ガイド同行", "写真データ", "保険"],
    whatToBring: ["歩きやすい靴（ビーチサンダルも一応可能）", "虫よけスプレー", "飲み物", "懐中電灯（貸出あり）"],
    precautions: ["お体に不自由がある場合は必ず事前にご相談ください"],
    location: "ご予約確定時にLINEにてご案内",
    meetingTime: "開始時間と同じ（19:20 / 21:10）",
    paymentMethod: "現地現金決済（できるだけお釣りが出ないようご協力ください）",
    faqs: [
      { q: "赤ちゃん連れでも大丈夫ですか？", a: "はい！0歳から参加OK、3歳以下は無料です。抱っこ紐やベビーカーでのご参加も問題ありません。" },
      { q: "虫が苦手でも楽しめますか？", a: "虫を触る必要はありませんのでご安心ください。観察を楽しむスタイルです。虫よけスプレーを持参いただくと快適です。" },
      { q: "どんな生き物に会えますか？", a: "巨大ヤシガニ、オカヤドカリ、ナイトバタフライ、夜行性のトカゲなど、宮古島ならではの生き物に出会えます。季節によって会える生き物が変わるのも魅力です。" },
      { q: "開催場所はどこですか？", a: "ご予約確定時にLINEにて詳細をご案内します。当日の状況に応じて、一番生き物に会えそうなポイントをガイドが選定します。" },
    ],
    reviews_data: [
      { name: "A.Y さん", date: "2025年1月", rating: 5, text: "ナイトツアーは期待以上！ヤシガニやオカヤドカリなど、普段見られない生き物に出会えました。ガイドのそういちろうさんの解説がとても面白くて、子どもたちも大満足でした。" },
      { name: "N.F さん", date: "2025年3月", rating: 5, text: "2歳の息子と参加。歩けるところは自分で歩いて、抱っこの時もあり。懐中電灯で生き物を探すのが楽しかったみたいで、翌日も「また行きたい」と言っていました！" },
      { name: "W.O さん", date: "2025年2月", rating: 5, text: "おじいちゃんおばあちゃんも一緒に三世代で参加。海のツアーは難しいけど、ナイトツアーなら全員で楽しめました。ヤシガニの大きさに全員びっくり！" },
    ],
  },
  S4: {
    id: "S4",
    name: "サンセットSUP",
    tagline: "黄金に染まる海で、極上のひとときを",
    heroDescription: "海の上から眺める夕日のグラデーションは圧巻。初心者でも安定のボードで安心。エモーショナルなシルエット写真が大人気！",
    image: "/images/sunset-sup-silhouettes.jpg",
    color: "orange",
    gradientFrom: "from-orange-500",
    gradientTo: "to-pink-500",
    price: "¥8,000",
    priceNote: "大人1名あたり",
    childPrice: "¥6,000（子供）",
    duration: "約2時間",
    age: "5〜65歳",
    rating: 5.0,
    reviews: 2891,
    highlights: [
      { title: "マジックアワーの絶景", description: "空と海がオレンジ、ピンク、紫へと移り変わる「マジックアワー」。遮るもののない海の上から眺める夕日は息を呑む美しさ。", icon: "sunset" },
      { title: "初心者でも安心", description: "安定感抜群の大きめのボードを使用。ガイドが波の穏やかなポイントを選んで丁寧にレクチャーします。座ったままでもOK！", icon: "lifebuoy" },
      { title: "シルエット写真が映える", description: "夕日をバックにしたシルエット写真は、このツアーでしか撮れない特別な一枚。写真にこだわりのあるガイドが撮影します。", icon: "camera" },
      { title: "究極の癒し体験", description: "波の音を聞きながら、SUPボードの上で寝転んだり座ったり。日常を忘れる究極のリラックスタイムをお約束。", icon: "heart" },
    ],
    flow: [
      { step: 1, title: "集合・受付", description: "催行海岸にて現地集合。その日の日の入り時間に合わせてご案内します。", time: "日没に合わせて変動" },
      { step: 2, title: "陸上レクチャー", description: "SUPの漕ぎ方や乗り方を陸上でしっかり丁寧にレクチャー。初めての方も安心です。" },
      { step: 3, title: "海上SUP＆夕日鑑賞", description: "海へ出発！夕日を浴びながらのんびり海上散歩。絶景をバックにたくさん写真撮影。", time: "約2時間" },
      { step: 4, title: "お会計・解散", description: "マジックアワーの余韻に浸りながらお会計。撮影データは当日中にお渡し。" },
    ],
    included: ["SUPボード", "パドル", "ライフジャケット", "写真・動画データ（枚数無制限）", "保険", "陸上レクチャー"],
    whatToBring: ["着替え", "タオル", "日焼け止め", "飲み物", "サンダル"],
    precautions: ["妊娠中の方は参加不可", "持病をお持ちの方は参加不可", "飲酒されている方は参加不可", "お体に不自由がある場合は必ず事前にご相談ください"],
    location: "当日の海況・天候により変動",
    locationNote: "ガイドより前日にLINEで集合場所をご案内します。",
    meetingTime: "開始15分前（日没に合わせて変動）",
    paymentMethod: "現地現金決済（できるだけお釣りが出ないようご協力ください）",
    faqs: [
      { q: "SUP初めてでも立てますか？", a: "はい！安定感抜群の大きめボードを使用し、波の穏やかなポイントで実施します。最初は座ったまま漕ぎ始め、慣れたら自分のペースで立ち上がりましょう。座ったままでも十分楽しめます。" },
      { q: "集合時間は何時ですか？", a: "日没時間に合わせて変動します。季節によって異なりますが、前日にLINEで正確な集合時間をご案内いたします。" },
      { q: "雨の日はどうなりますか？", a: "小雨程度なら開催します。むしろ雨上がりの夕日は格別に美しいことも。台風や強風時は中止、全額返金いたします。" },
    ],
    reviews_data: [
      { name: "R.H さん", date: "2025年3月", rating: 5, text: "初めてのSUPでしたが、丁寧に教えていただき安心して楽しめました。夕日が海に沈む瞬間は本当に感動的。宮古島に来たら絶対また参加したいです！" },
      { name: "E.S さん", date: "2025年2月", rating: 5, text: "カップルで参加。シルエット写真がめちゃくちゃ綺麗で感動しました。インスタに載せたら友達から大反響！ガイドさんの写真センスが最高です。" },
      { name: "M.I さん", date: "2025年1月", rating: 5, text: "海の上で寝転んで夕日を眺める時間は、人生で一番贅沢な時間でした。SUP初心者でしたが、座ったままでも全然楽しめます。また絶対来ます！" },
    ],
  },
}
