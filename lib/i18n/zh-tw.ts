// 繁体字中国語サイト（/zh-tw配下・台湾向け）のコンテンツ定義。構成は en.ts と同一（IntlDict）。
// 価格・時間帯などの数値は lib/data.ts の PLANS が単一の真実。
// 掲載プランは英語版と同じく貸切のみ（INTL_PLAN_IDS）、料金は日本語サイトと同額。

import type { IntlCommonCopy, IntlDict, IntlFaq, IntlFormCopy, IntlPlanContent, IntlSectionsContent, IntlUiCopy } from "./types"
import { INTL_PLAN_IDS } from "./locales"

// ---------------------------------------------------------------------------
// ツアープラン
// ---------------------------------------------------------------------------

// 繁体字中国語サイトに掲載するプランの訳文。貸切4プランのみ。
const ZH_PLANS_ALL: IntlPlanContent[] = [
  {
    id: "S2",
    name: "【包場】海龜浮潛之旅",
    tagline: "一次只接待一組客人——專屬嚮導、自己的步調，海龜只屬於你們。",
    description: [
      "招牌海龜浮潛的完全包場版本，一次只接待一組客人。專屬嚮導只為你們服務，不必等待其他客人、也沒有時間壓力——擔心小小孩、游泳較不擅長的家人，或想悠閒享受特別時光的您，都非常適合這個方案。",
      "您可以在與一般行程相同的平靜淺水海灘，享受同樣高的海龜相遇率，還有更貼心的攝影服務：想要什麼樣的照片和影片，儘管告訴嚮導。包場方案免費租借防寒衣與度數面鏡，所有照片影片也全部免費。",
    ],
    highlights: [
      "完全包場——一次只接待一組",
      "專屬嚮導，步調完全自由",
      "海龜相遇率高",
      "免費租借防寒衣與度數面鏡",
      "照片影片免費，歡迎指定想拍的畫面",
    ],
    included: ["專屬嚮導", "浮潛裝備組與救生衣", "防寒衣與度數面鏡（本方案免費）", "所有照片影片檔案（免費、不限張數）", "保險"],
    whatToBring: ["泳衣（請穿在衣服裡）", "換洗衣物與毛巾", "防曬乳", "飲料", "涼鞋（建議）"],
    precautions: [
      "孕婦無法參加",
      "有重大既往病症者無法參加——請先與我們聯繫",
      "飲酒後無法參加",
      "同行有60歲以上者，推薦選擇本方案",
    ],
    ageNote: "5歲～65歲",
    locationNote: "新城海灘或シギラ（Shigira）海灘（依當天風向決定，開始前15分鐘集合）",
    priceNote: "每人¥9,000，最多10位。11位以上請透過LINE洽詢。",
    priceNoteShort: "每人¥9,000",
  },
  {
    id: "S4",
    name: "包場夕陽SUP",
    tagline: "在魔幻時刻的金色海面上悠然划槳，並以空拍機從上空記錄。",
    description: [
      "在島上最好的位置——開闊的海面上，欣賞宮古島著名的夕陽。當天空從橘色轉為粉紅再到紫色,您可以輕輕划槳、坐下休息，或乾脆躺在板子上聽海浪聲。本行程為包場行程，魔幻時刻完全屬於你們。",
      "沒玩過SUP？沒問題。我們使用穩定性極高的板子，嚮導會挑選平靜的地點，先在岸上教學——先坐著划，準備好了再站起來。以夕陽為背景的剪影照片是客人的最愛，所有照片影片全部免費。",
    ],
    highlights: [
      "包場行程——完全獨享的夕陽",
      "高穩定性板子，適合初學者的教學",
      "空拍照片與魔幻時刻剪影美照免費贈送",
      "海上悠閒時光約2小時",
    ],
    included: ["SUP板、划槳與救生衣", "防寒衣與度數面鏡（僅限成人尺寸）", "空拍攝影", "岸上教學", "所有照片影片檔案（免費、不限張數）", "保險"],
    whatToBring: ["泳衣（請穿在衣服裡）", "換洗衣物與毛巾", "防曬乳", "飲料", "涼鞋"],
    precautions: [
      "孕婦無法參加",
      "有重大既往病症者無法參加——請先與我們聯繫",
      "飲酒後無法參加",
    ],
    ageNote: "5歲～65歲",
    timeNote: "集合時間為日落前約90分鐘——夏季（6～8月）約17:45～18:00，冬季（11～2月）約16:30～17:00。行程約2小時，於日落後約30分鐘解散。確切集合時間將於行程前一天透過LINE確認。",
    locationNote: "於以下5個地點之一舉行：Turiba海濱公園、Pasha海灘、與那霸海灘北側、インギャーマリンガーデン（Ingya Marine Garden）、西濱海灘——依當天風向與海況選定。確定的集合地點將於行程前一天透過LINE附地圖通知。",
  },
  {
    id: "S7",
    name: "【包場】宮古島空拍SUP體驗",
    tagline: "只屬於你們的私人空拍SUP——在宮古藍海面上與專屬嚮導同行。",
    description: [
      "白天在宮古島清澈湛藍的海面上，以完全包場方式享受SUP。專屬嚮導只服務你們一組，可以照自己的步調划行，想拍什麼畫面儘管開口——水面近距離拍攝之外，條件允許時還有空拍機空中攝影。",
      "第一次玩SUP？沒問題。我們使用穩定性高的板子，出發前專屬嚮導會在岸上說明基本要領。可以先坐著划，習慣後再站起來。",
      "預約時可從7:00～16:00之間以整點為單位選擇開始時間。確切集合地點於行程前一天透過LINE通知；若因海況、潮位或風向需要微調時間，也會透過LINE與您確認。",
    ],
    highlights: [
      "只接待你們一組的私人行程，專屬嚮導同行",
      "條件允許時包含空拍機照片影片拍攝",
      "白天的宮古藍與遼闊空中視野",
      "高穩定性板子，適合初學者的教學",
      "行程照片影片免費贈送",
    ],
    included: ["SUP板、划槳與救生衣", "岸上教學", "條件允許時的空拍攝影", "照片影片檔案", "保險", "專屬私人嚮導"],
    whatToBring: ["泳衣（請穿在衣服裡）", "換洗衣物與毛巾", "防曬乳", "飲料", "涼鞋"],
    precautions: [
      "孕婦無法參加",
      "有重大既往病症者無法參加——請先與我們聯繫",
      "飲酒後無法參加",
      "可能因風雨、飛航管制或安全考量而無法進行空拍",
      "開始時間與地點可能依海況、潮位與風向調整",
      "11位以上請透過LINE洽詢",
    ],
    ageNote: "5歲～65歲",
    timeNote: "預約時請從7:00～16:00之間以整點為單位選擇開始時間。開始前15分鐘集合——時間可能因海況與潮位略有調整，將透過LINE確認。",
    locationNote: "地點依當天海況、潮位與風向決定（行程前一天由嚮導透過LINE通知）",
  },
  {
    id: "S5",
    name: "【包場】叢林夜間探險",
    tagline: "夜間探險完全保留給你們一家——用完全屬於自己的步調探索。",
    description: [
      "叢林夜間探險的所有樂趣，以完全包場方式獨享。專屬嚮導只帶你們一組，可以在有趣的生物前盡情停留、隨時停下來拍照，讓小小孩或祖父母決定步調——不必配合其他客人。",
      "嚮導的注意力完全放在你們身上，能聽到比一般行程更深入的宮古島野生動物與自然故事，孩子們沒完沒了的「為什麼？」也會得到耐心解答。從0歲嬰兒到長輩都歡迎，3歲以下免費，探險照片全部包含。",
    ],
    highlights: [
      "完全包場——只帶一組客人",
      "專屬嚮導深入解說",
      "尋找瀕危物種椰子蟹",
      "全年齡皆可參加（0～75歲），3歲以下免費",
      "探險照片免費贈送",
    ],
    included: ["專屬自然生態嚮導", "手電筒租借", "所有照片檔案（免費）", "保險"],
    whatToBring: ["好走的鞋子（涼鞋亦可）", "防蚊液", "飲料", "手電筒（有的話，也可租借）"],
    precautions: ["行動或健康上有疑慮者，請事先與我們洽詢"],
    ageNote: "0歲～75歲",
    timeNote: "每晚兩個出發時段：19:20 / 21:10（於開始時間集合）",
    locationNote: "インギャーマリンガーデン（Ingya Marine Garden）附近（確切集合地點於行程當天透過LINE通知）",
    priceNote: "每人均一價¥8,000（3歲以下免費）",
    priceNoteShort: "每人¥8,000",
  },
]

// 繁体字中国語サイトに掲載するプラン。貸切のみ（INTL_PLAN_IDS）に絞る。
const ZH_PLANS: IntlPlanContent[] = ZH_PLANS_ALL.filter((p) => INTL_PLAN_IDS.includes(p.id))

const ZH_PLAN_BY_ID = Object.fromEntries(ZH_PLANS.map((p) => [p.id, p] as const))

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const ZH_FAQS: IntlFaq[] = [
  { question: "需要穿防寒衣嗎？", answer: "大約11月到4月期間水溫較低，建議穿著防寒衣。租借費用依方案而異：有些方案已包含在費用內，有些則需另外付費。詳情請參閱各方案頁面。" },
  { question: "我不太會游泳，可以參加嗎？", answer: "當然可以！全程穿著救生衣，經驗豐富的嚮導也會隨時在身邊照應，完全不會游泳的朋友也能安心參加。" },
  { question: "集合地點在哪裡？", answer: "集合地點依您預約的方案而定。預約確認後，我們會透過LINE（我們所有聯繫都使用的通訊軟體）傳送詳細的集合地點與停車場指引。有任何問題，隨時透過LINE傳訊息給我們。" },
  { question: "有問題想諮詢時要找誰？", answer: "我們透過LINE全天候24小時受理提問與諮詢。隨時歡迎傳訊息，工作人員會在營業時間（7:00～18:00）內細心回覆。" },
  { question: "小小孩也能下水嗎？", answer: "可以。5歲以上的孩子即可參加大多數浮潛行程。有救生衣和浮具輔助，不太會游泳的孩子也能安全玩水。不過請視當天浪況與孩子的身體狀況，不要勉強。" },
  { question: "孩子怕浪怎麼辦？", answer: "建議從新城海灘或シギラ海灘這類風平浪靜的海灘開始，先在踩得到底的淺水區讓孩子慢慢適應。穿上救生衣、爸媽在旁邊扶著，孩子就會漸漸習慣海水。" },
  { question: "下雨天有什麼備案？", answer: "宮古島有許多室內景點，例如宮古島海中公園、雪鹽博物館、島の駅みやこ市集等。在飯店泳池悠閒度過也是不錯的選擇。" },
  { question: "可以租借兒童尺寸的浮潛裝備嗎？", answer: "可以。許多海灘和旅遊業者都提供兒童尺寸的浮潛組、救生衣與浮具租借。參加Sea Turtle Brothers的行程，兒童裝備一律免費提供。" },
  { question: "取消需要手續費嗎？", answer: "行程前一天之前取消完全免費——只要在前一天之前聯繫我們，不會產生任何費用。當天取消則收取行程費用的100%。付款方式為當天現場現金支付，若因天候不佳由我們取消行程，您完全不需支付任何費用，請放心。" },
  { question: "懷孕中可以參加嗎？", answer: "非常抱歉，基於安全考量，懷孕中或可能懷孕的貴賓無法參加。這是為了保護您免於海水低溫與突發風險的措施。等寶寶出生、生活穩定後，歡迎全家一起再來玩！" },
  { question: "戴隱形眼鏡或眼鏡可以參加嗎？", answer: "配戴日拋隱形眼鏡可直接參加行程，建議攜帶備用鏡片以防脫落。戴眼鏡的朋友可租借度數面鏡（¥1,000），預約時告訴我們即可。" },
  { question: "我容易暈船，沒問題嗎？", answer: "請放心！Sea Turtle Brothers的行程都是從海灘直接走進大海的岸潛方式，完全不搭船。不用擔心暈船就能享受大海，正是我們行程的一大優點。若擔心在浪中感到不適，出發前30分鐘服用市售暈車藥會更安心。" },
  { question: "可以拿到行程中的照片和影片嗎？", answer: "可以！嚮導會用高畫質相機拍攝大量照片與影片，所有檔案不限張數免費贈送。與海龜並肩悠游的照片等滿滿的回憶，通通帶回家。您也可以自備相機，但有進水風險，建議使用防水殼。" },
  { question: "有停車場嗎？", answer: "有的，集合的海灘設有停車場。依海灘不同，有收費（¥1,000～¥2,000）也有免費的。宮古島大眾運輸不多，建議租車前往。詳細停車指引會在行程前一天透過LINE傳送。" },
  { question: "生理期可以參加嗎？", answer: "可以，只要身體狀況跟平常差不多就沒問題。使用棉條或選擇深色泳衣會更自在。若身體不舒服請不要勉強——可以改期，歡迎透過LINE與我們商量。" },
  { question: "擔心曬傷，有什麼建議？", answer: "宮古島的紫外線約是日本本島的1.5～2倍，非常強烈，防曬絕對必要！請勤補防水型防曬乳（建議選擇對珊瑚友善的海洋友善配方），穿水母衣也很有效。脖子後面、耳後、腳背這些容易忽略的部位也別忘了。" },
  { question: "行程當天該怎麼穿？", answer: "最方便的方式是把泳衣穿在衣服裡面直接前來。外面穿T恤加短褲等容易穿脫的衣物，鞋子穿夾腳拖即可。行程結束後的更衣空間有限，請準備可在車上使用的毛巾與換洗衣物。" },
  { question: "需要提前多久預約？當天可以預約嗎？", answer: "由於採包場制，旺季（7～9月、4月底～5月初黃金週、新年假期）常常提前1～2週額滿。決定好日期時間後請盡早送出預約申請。如有空位，最晚可預約到前一天。透過LINE傳訊息，我們會立即告知最新空位狀況。請注意，預約需待工作人員透過LINE回覆後才算確認。" },
  { question: "冬天也能浮潛嗎？", answer: "可以！宮古島周邊海域即使冬天水溫也在20°C以上，穿上防寒衣一年四季都能浮潛。夏季（6～9月）水溫溫暖舒適，冬季（12～3月）遊客較少、透明度特別高，是隱藏版的好季節。無論哪個季節，宮古島的大海都令人感動！" },
  { question: "行程需要多長時間？", answer: "浮潛行程從集合到解散約2小時，夜間行程約1.5小時，SUP行程約2小時。水中時間大約60～90分鐘。集合後會進行安全說明與裝備試穿，體驗結束後即可自由解散。" },
  { question: "我有既往病症，可以參加嗎？", answer: "基於安全考量，患有心臟疾病、癲癇、氣喘等症狀的貴賓可能無法參加。預約前歡迎透過LINE與我們洽詢，我們會依您的狀況個別回覆。另外請注意，飲酒後無法參加行程。" },
]

// ---------------------------------------------------------------------------
// 海龜指南頁
// ---------------------------------------------------------------------------

const ZH_GUIDE: IntlSectionsContent = {
  metaTitle: "宮古島海龜浮潛：地點、季節與注意事項",
  metaDescription: "宮古島哪裡看得到海龜、最佳季節與海灘、安全須知。Sea Turtle Brothers的親子友善包場浮潛行程。",
  heroTitle: "在宮古島與海龜同游：完整浮潛指南",
  heroSubtitle: "宮古島是日本數一數二、一年四季都能遇見海龜的地方。本指南整理了何時何地最容易遇到海龜、初學者和小孩能否參加、自行前往的注意事項，以及為什麼參加導覽行程是最輕鬆的方式。",
  sections: [
    { heading: "開始之前", paragraphs: ["海龜是野生動物。即使本頁提到某區域「相遇率高」，也絕不保證一定能看到。為了您的安全與海龜保育，請絕對不要觸摸或追逐牠們——保持距離、安靜觀察。"] },
    { heading: "宮古島最容易遇見海龜的地方", paragraphs: ["宮古島四周環繞珊瑚礁，海龜的食物——海草與海藻生長茂盛，因此全島周邊都有海龜棲息。以下區域以特別高的相遇率聞名。", "從海灘下水有時也能遇到海龜，但機率很大程度取決於潮汐、天氣與當天海況。想提高機率，建議跟著熟悉當地點位的嚮導一起下水。"], bullets: ["シギラ海灘周邊：海面平靜，浮潛時遇見海龜的機會很高。", "新城海灘：水淺且珊瑚礁離岸近，初學者也容易觀察海龜。", "搭船前往的外海珊瑚礁點位：人少、海龜較放鬆，相遇率通常更高。"] },
    { heading: "遇見海龜的最佳季節與時段", paragraphs: ["在宮古島一年四季都能遇見海龜，但觀察的難易度會隨海況變化。", "注意：海龜是野生動物，無論季節或時段都無法保證相遇。"], bullets: ["季節：4月至10月是黃金期，海面平穩、透明度最佳。冬天也看得到海龜，但北風強、風浪大的日子較多。", "時段：早上最理想，風弱、海面平靜。", "潮汐：滿潮前後較容易游過珊瑚礁上方，觀察更輕鬆。"] },
    { heading: "初學者和小孩也能和海龜浮潛嗎？", paragraphs: ["可以。海龜浮潛是一項不論會不會游泳都能享受的活動。"], bullets: ["穿著救生衣，可以舒適地漂浮在水面觀察海龜。", "包場行程中嚮導就在身旁，第一次浮潛或怕水的朋友也能安心。", "Sea Turtle Brothers歡迎5歲以上兒童參加，許多家庭都來同樂。"] },
    { heading: "自行前往時的安全須知", paragraphs: ["若您自行從海灘下水浮潛，請務必重視安全與生態保育。", "只要有一絲不安，或想要更安全可靠的體驗，建議參加導覽行程。"], bullets: ["注意離岸流與潮流：宮古島部分海灘水流湍急。請確認指定游泳區域與當天海況，避免被帶離岸邊。", "絕不單獨下水：至少兩人同行並穿著救生衣。", "不觸摸、不追逐海龜：海龜是受保護的野生動物。請勿觸碰或擋住牠們的路線——保持距離、安靜觀察。嚴禁餵食。", "防曬防暑：穿水母衣、擦防曬乳、補充水分。"] },
    { heading: "參加導覽行程的好處", paragraphs: ["參加導覽行程，就不必煩惱去哪找海龜，專心享受大海就好。"], bullets: ["更高的相遇機率：嚮導會依當天海況，挑選海龜常出沒的點位。", "安全交給專業：裝備準備、海流與天氣判斷都由專業人員負責，您只需放鬆享受。", "帶得走的照片影片：嚮導會拍下您與海龜同游的模樣——這是手機拍不到的水中回憶。", "貼心的新手支援：從呼吸管的使用方法到呼吸技巧，包場制讓教學更細緻、更個人化。"] },
    { heading: "Sea Turtle Brothers（海龜兄弟）的特色", paragraphs: ["Sea Turtle Brothers（海龜兄弟）在宮古島提供親子友善的包場海洋體驗。", "行程種類與費用請參閱方案頁面。查詢空位與預約請使用預約表單——請注意，預約申請需待工作人員透過LINE回覆後才算確認。"], bullets: ["一次只接待一組，嚮導照顧到每一位客人", "照片影片檔案免費贈送", "5歲以上即可參加——適合初學者與家庭", "行程前一天之前取消免費", "保險完備，安全至上"] },
    { heading: "來宮古島與海龜同游吧", paragraphs: ["初學者與家庭都能安心參加的包場行程。照片影片免費，行程前一天之前取消免費。請透過預約表單查詢空位並送出申請，或透過LINE傳訊息給我們——工作人員透過LINE回覆後，預約即告確認。"] },
  ],
}

// ---------------------------------------------------------------------------
// 首頁
// ---------------------------------------------------------------------------

const ZH_HOME = {
  metaTitle: "宮古島海龜浮潛 | 海龜兄弟 Sea Turtle Brothers",
  metaDescription: "宮古島的包場行程與包場夕陽SUP。照片影片免費，前一天之前取消免費。海龜兄弟 Sea Turtle Brothers。",
  hero: {
    badge: "宮古島親子友善海洋行程",
    title: "在宮古島與海龜同游",
    subtitle: "為初學者與家庭設計的包場行程，以及包場夕陽SUP——照片影片免費，行程前一天之前取消免費。",
  },
  trustItems: [
    "包場制行程，保險完備",
    "水中照片影片免費",
    "前一天之前取消免費",
    "5歲以上兒童歡迎，備有兒童裝備",
  ],
  aboutHeading: "宮古島的大海，照著全家人的步調",
  aboutParagraphs: [
    "Sea Turtle Brothers（海龜兄弟）是沖繩宮古島的包場海洋行程業者。招牌體驗是在島上清澈平靜的海域與野生海龜一起浮潛，還能遇見小丑魚和色彩繽紛的熱帶魚。海龜是野生動物，無法100%保證相遇——但我們的相遇率很高，而且全程包場，不必人擠人，可以與海龜共度緩慢悠閒的時光。",
    "安全永遠第一。每個行程都從安全說明開始，全行程投保，嚮導對初次浮潛的客人非常有經驗。5歲以上兒童即可參加，並備有兒童尺寸裝備，是全家累積旅行回憶的安心選擇。",
    "嚮導會用水中相機記錄整段體驗，所有高畫質照片影片免費贈送。除了海龜浮潛，我們還提供夜間探險、夕陽SUP、空拍SUP等行程，從早到晚暢遊宮古島的海洋與自然。",
  ],
  howToBookHeading: "預約流程",
  howToBook: [
    { title: "選擇方案", text: "瀏覽行程，挑選適合您旅程的方案與日期。各行程的費用請參閱該方案頁面。" },
    { title: "送出預約申請", text: "透過網站送出預約申請。送出時需要以免費通訊軟體LINE登入。請注意：預約申請並不等於預約成立。" },
    { title: "透過LINE收到確認", text: "工作人員確認空位後會透過LINE回覆您。收到我們的回覆後，預約才正式確認。" },
    { title: "當天現金付款", text: "不需預付——行程當天在現場以現金支付即可。行程前一天之前取消免費。" },
  ],
  lineExplainer: {
    title: "為什麼需要LINE？",
    text: "LINE是免費通訊軟體，在台灣和日本都是最普及的聯絡方式，我們的預約確認與行前聯繫全都透過LINE進行。送出預約申請需要LINE帳號，若還沒有請先從App Store或Google Play下載（只需一分鐘）。請記得：預約需待工作人員透過LINE回覆後才算確認。如有問題或無法使用LINE，歡迎寄信至 info@umigamekyoudaimiyakojima.com 或致電 +81-80-5344-2439。",
  },
  toursHeading: "行程介紹",
  toursIntro: "包場海龜浮潛、包場叢林夜間探險、包場空拍SUP，以及包場夕陽SUP——暢遊宮古島海洋與自然的4種體驗。",
  faqHeading: "常見問題",
  faqIntro: "正在計畫第一次的宮古島浮潛？這裡整理了旅客最常問的問題——游泳能力、兒童參加、取消、付款等。",
  contactHeading: "有任何問題嗎？我們很樂意協助",
  contactText: "隨時透過LINE傳訊息，或於營業時間（7:00～18:00，全年無休）來信、來電洽詢。",
} as const

// ---------------------------------------------------------------------------
// 法律頁面
// ---------------------------------------------------------------------------

const ZH_TERMS: IntlSectionsContent = {
  metaTitle: "服務條款・取消政策",
  metaDescription: "宮古島Sea Turtle Brothers（海龜兄弟）的服務條款與取消政策：預約成立、付款、取消費用、天候取消之處理。",
  heroTitle: "服務條款・取消政策",
  heroSubtitle: "送出行程預約申請前，請先確認以下條款。",
  sections: [
    { heading: "第1條（適用範圍）", paragraphs: ["本條款規定Sea Turtle Brothers（以下稱「本公司」）所提供海洋行程（以下稱「行程」）之預約與參加條件。送出預約表單即視為同意本條款。"] },
    { heading: "第2條（預約成立）", paragraphs: ["送出預約表單僅為預約申請，預約尚未成立。本公司透過LINE或電話與您確認後，預約方為成立。視預約狀況與海況，可能無法受理您的申請。"] },
    { heading: "第3條（費用與付款）", paragraphs: ["行程費用為各方案頁面所示金額（含稅）。付款於行程當天在現場以現金支付。"] },
    { heading: "第4條（取消政策）", paragraphs: ["所有行程適用以下取消條款。"], bullets: ["行程前一天之前取消免費", "當天取消：行程費用的100%", "未到場（No-show）：行程費用的100%", "取消或變更請透過LINE或電話聯繫"] },
    { heading: "第5條（天候因素之取消）", paragraphs: ["本公司以安全為最優先，可能因天候不佳、海況惡劣等因素自行判斷取消行程。此時不收取任何取消費用。由於付款採當天現場現金支付、無預先收費，因此不會產生任何費用。"] },
    { heading: "第6條（安全與參加條件）", paragraphs: ["為確保每個行程的安全，請所有參加者遵守以下事項。"], bullets: ["行程中請遵從嚮導指示。若不遵從指示，基於安全考量可能請您中止參加", "飲酒者及身體不適者不得參加", "有既往病症、懷孕或其他健康疑慮者，請事先洽詢", "各方案之年齡限制與參加條件，依各方案頁面之記載"] },
    { heading: "第7條（照片與影片）", paragraphs: ["行程中工作人員拍攝的照片與影片將免費提供給您。若本公司希望將含有您身影的照片影片用於網站、社群媒體等宣傳用途，將事先取得您的同意。"] },
    { heading: "第8條（責任限制）", paragraphs: ["本公司雖盡力確保安全，但因參加者故意或過失、違反本條款、或不可抗力所生之損害，除因本公司故意或重大過失所致者外，本公司不負賠償責任。"] },
    { heading: "第9條（條款之變更）", paragraphs: ["本公司得視需要修訂本條款。修訂後之條款自刊登於本頁面時起生效。"] },
    { heading: "第10條（準據法與管轄）", paragraphs: ["本條款以日本法為準據法。因行程所生之爭議，以管轄本公司營業所在地之法院為第一審專屬管轄法院。"] },
    { heading: "相關政策與生效日", paragraphs: ["關於個人資料之處理，請參閱隱私權政策。業者資訊請參閱特定商業交易法標示（日文）。", "本條款制定於2026年6月13日。"] },
  ],
}

const ZH_PRIVACY: IntlSectionsContent = {
  metaTitle: "隱私權政策",
  metaDescription: "Sea Turtle Brothers（宮古島海龜浮潛行程）於預約或聯繫時所收集個人資料之利用目的與處理方式。",
  heroTitle: "隱私權政策",
  heroSubtitle: "Sea Turtle Brothers（以下稱「本公司」）依據以下政策，負責任地處理您的個人資料。",
  sections: [
    { heading: "1. 收集的資料", paragraphs: ["我們收集預約資料，並於您同意時收集連結的瀏覽資料。"], bullets: ["代表人姓名、電話、電子郵件", "LINE用戶ID與顯示名稱", "各參加者姓名、年齡、身高體重（選填）、鞋碼", "表單中的需求或問題", "瀏覽頁面、來源、點擊、捲動、表單操作與預約結果", "Visitor ID、Visit ID、預約漏斗ID、裝置、瀏覽器與作業系統類型"] },
    { heading: "2. 利用目的", paragraphs: ["收集之資料用於以下目的。"], bullets: ["預約管理與聯絡", "安全管理與裝備準備", "交付照片與影片", "回覆洽詢", "將經同意的預約前瀏覽記錄與預約資料連結，用於改善服務、行銷與預約流程分析"] },
    { heading: "3. 提供予第三方", paragraphs: ["除法令要求外，未經您的同意，本公司不會將您的個人資料提供予第三方。"] },
    { heading: "4. 使用之外部服務", paragraphs: ["本公司使用以下外部服務。"], bullets: ["預約與連結的顧客分析：Google Sheets（Google LLC）", "顧客聯繫：LINE（LY Corporation）", "網站分析：Vercel Analytics", "同意後使用Cookie或類似識別碼的Google Analytics（Google LLC）"] },
    { heading: "5. 連結的瀏覽記錄、同意與保留期間", paragraphs: ["行為追蹤為選擇性，拒絕也仍可預約。同意後，我們將Visitor ID附於預約，以便將瀏覽記錄與姓名、聯絡方式及參加者資料連結。", "Visitor ID與行為事件最長保留395日。您可在資料設定停止未來收集，並可聯絡我們要求刪除已儲存資料。"] },
    { heading: "6. 資料安全", paragraphs: ["本公司採取適當之安全措施，保護所保管之個人資料免於未經授權之存取、遺失及外洩。"] },
    { heading: "7. 查詢、更正或刪除資料之請求", paragraphs: ["若您希望查詢、更正或刪除您的個人資料，我們將於確認身分後儘速處理。請透過以下聯絡方式與我們聯繫。"] },
    { heading: "8. 聯絡方式", paragraphs: ["Sea Turtle Brothers（〒906-0014 日本沖繩縣宮古島市平良松原107-1）", "電話：+81-80-5344-2439（7:00～18:00，全年無休）", "電子郵件：info@umigamekyoudaimiyakojima.com"] },
    { heading: "9. 政策之變更", paragraphs: ["本政策可能因法令或服務內容變更而不定期更新。重大變更將於本頁面公告。", "生效日：2026年6月13日；最後修訂日：2026年8月13日"] },
  ],
}

// ---------------------------------------------------------------------------
// 共通UI（頁尾 / 行動CTA / 導覽列）
// ---------------------------------------------------------------------------

const ZH_UI: IntlUiCopy = {
  footer: {
    tagline: "以安全、真誠與溫柔的感動，提供親子友善的包場海洋體驗。在透明度絕佳的大海中，與海龜近距離相遇。",
    quickLinksHeading: "快速連結",
    businessHoursHeading: "營業時間",
    hours: "7:00 - 18:00",
    openYearRound: "全年無休",
    hoursNote: "營業時間可能因天候變更。",
    lineLabel: "LINE官方帳號",
    logoAlt: "海龜兄弟 Sea Turtle Brothers - EST. 2024",
    quickLinks: [
      { href: "/zh-tw", label: "首頁" },
      { href: "/zh-tw/plans", label: "所有行程" },
      { href: "/zh-tw/book", label: "預約行程" },
      { href: "/zh-tw/miyakojima-sea-turtle", label: "海龜指南" },
      { href: "/zh-tw/faq", label: "常見問題" },
    ],
    legalLinks: [
      { href: "/zh-tw/terms", label: "服務條款・取消政策" },
      { href: "/zh-tw/privacy", label: "隱私權政策" },
      { href: "/tokushoho", label: "特定商業交易法標示（日文）" },
    ],
    copyright: "海龜兄弟 Sea Turtle Brothers. All rights reserved.",
  },
  mobileCta: {
    line: "LINE諮詢",
    book: "立即預約",
    bookHref: "/zh-tw/book",
  },
  nav: {
    items: [
      { href: "/zh-tw", label: "首頁" },
      { href: "/zh-tw/plans", label: "行程" },
      { href: "/zh-tw/miyakojima-sea-turtle", label: "海龜指南" },
      { href: "/zh-tw/faq", label: "常見問題" },
    ],
    line: "LINE諮詢",
    book: "立即預約",
    menuAria: "選單",
    homeHref: "/zh-tw",
    bookHref: "/zh-tw/book",
  },
  bookingFormLoading: "正在載入預約表單",
}

// ---------------------------------------------------------------------------
// 頁面模板共通文字
// ---------------------------------------------------------------------------

const ZH_COMMON: IntlCommonCopy = {
  breadcrumbHome: "首頁",
  breadcrumbTours: "行程",
  breadcrumbFaq: "常見問題",
  breadcrumbGuide: "海龜指南",
  breadcrumbTerms: "服務條款",
  breadcrumbPrivacy: "隱私權政策",
  checkAvailability: "查詢空位・預約",
  seeAllTours: "查看所有行程",
  readGuideLink: "閱讀海龜浮潛指南",
  seeAllQuestions: "查看所有問題",
  messageOnLine: "透過LINE聯繫我們",
  emailUs: "寄送電子郵件",
  comingSoon: "即將登場",
  comingSoonDetail: "即將登場——尚未開放預約",
  perAdult: "/ 大人",
  perChild: "/ 兒童",
  heroImageAlt: "兩隻海龜在宮古島清澈的海水中並肩悠游",
  guideHeroImageAlt: "一隻海龜在宮古島湛藍清澈的海水中游泳",
  legalEyebrow: "Legal",
  faqEyebrow: "FAQ",
  tourPlansEyebrow: "Tour Plans",
  guideEyebrow: "Sea Turtle Guide",
  plansMetaTitle: "行程・價格 | 海龜兄弟 Sea Turtle Brothers 宮古島",
  plansMetaDescription: "比較宮古島Sea Turtle Brothers的行程：浮潛、包場行程、夜間探險與SUP。照片影片免費，前一天之前取消免費。",
  plansTitle: "宮古島行程・價格",
  plansIntro: "包場海龜浮潛、包場叢林夜間探險、包場空拍SUP，以及包場夕陽SUP。所有行程均含免費照片影片，行程前一天之前取消免費。",
  faqMetaTitle: "常見問題 | 海龜兄弟 Sea Turtle Brothers 宮古島",
  faqMetaDescription: "宮古島Sea Turtle Brothers行程的常見問題：游泳能力、兒童參加、攜帶物品、取消、天候、付款等。",
  faqTitle: "常見問題",
  faqIntro: "參加行程前想知道的一切——游泳能力、兒童參加、取消、攜帶物品等。找不到答案嗎？隨時透過LINE傳訊息給我們。",
  faqStillQuestions: "還有其他問題嗎？我們會在營業時間（7:00～18:00）內細心回覆。",
  askOnLine: "透過LINE發問",
  orEmail: "或寄信至",
  readyToBook: "準備好預約了嗎？點此查詢空位",
  durationAbout: (hours) => `約${hours}小時`,
  durationShort: (hours) => `約${hours}小時`,
  priceAdultLabel: "費用（大人）",
  childPricePrefix: "兒童 ",
  durationLabel: "所需時間",
  agesLabel: "參加年齡",
  startTimesLabel: "開始時間",
  dependsOnSunset: "依日落時間而定",
  highlightsHeading: "行程亮點",
  includedHeading: "費用包含",
  optionalRentalsHeading: "加購租借",
  bringHeading: "攜帶物品",
  notesHeading: "注意事項",
  paymentNote: {
    before: "付款於行程當天在現場以現金支付。行程前一天之前取消免費——詳情請參閱",
    linkText: "取消政策",
    after: "。",
  },
  comingSoonCta: {
    before: "本方案即將開放。加入我們的",
    linkText: "LINE",
    after: "好友，第一時間收到開放預約的消息。",
  },
  bookThisTour: "預約這個行程",
  detailsLabel: "查看詳情",
  guideCtaHeading: "準備好與海龜相遇了嗎？",
  guideCtaText: "包場行程，照片影片免費。行程前一天之前取消免費。",
  bookMetaTitle: "預約行程 | 海龜兄弟 Sea Turtle Brothers 宮古島",
  bookMetaDescription: "送出宮古島行程預約申請。費用自動計算，前一天之前取消免費，透過LINE接收空位確認。",
  bookTitle: "預約申請",
  bookIntro: "請填寫以下資料——費用會自動計算。我們確認空位後將透過LINE回覆。",
  bookIntroStrong: "收到我們的回覆之前，預約尚未成立。",
  planMetaTitles: {
    S2: "【包場】海龜浮潛 | 海龜兄弟 Sea Turtle Brothers",
    S4: "夕陽SUP之旅 | 海龜兄弟 Sea Turtle Brothers",
    S5: "【包場】叢林夜間探險 | 海龜兄弟 Sea Turtle Brothers",
    S7: "【包場】宮古島空拍SUP | 海龜兄弟 Sea Turtle Brothers",
  },
}

// ---------------------------------------------------------------------------
// 預約表單文字
// ---------------------------------------------------------------------------

const ZH_FORM: IntlFormCopy = {
  staffNoPreference: "不指定",
  staffNames: { staff1: "山醬", staff2: "Hikaru", staff5: "Sotaro", staff3: "Soichiro", staff4: "Nagi" },
  limitToast: (max) => `線上預約最多${max}位。11位以上請透過LINE洽詢。`,
  groupLimitInfo: (max, current) => `線上預約最多${max}位。目前人數：${current}位。11位以上請透過LINE洽詢。`,
  sectionChooseTour: "選擇行程",
  sectionDateTime: "日期・開始時間",
  sectionParticipants: "參加者資料",
  sectionStaff: "指定嚮導（選填）",
  sectionContact: "聯絡資料",
  dateLabel: "日期（日本時間）*",
  startTimeLabel: "開始時間",
  startTimeSunset: "（依日落時間而定）",
  sunsetNote: "開始時間依日落而定，隨季節變動——集合為日落前約90分鐘（8月約17:45）。確切時間與集合地點將於行程前一天透過LINE確認。",
  sunsetDateGuide: (month, meet, end) => `${month}月參考：集合約${meet}、解散約${end}。`,
  daySupNote: "開始時間可能因海況與潮位略有調整——最終時間將透過LINE確認。",
  chooseTourFirst: "請先選擇行程",
  participantsIntroBase: "基於安全考量，年齡為必填。",
  participantsIntroShoe: "為準備蛙鞋，需要鞋子尺寸（cm）——身高體重為選填，但有助於挑選合適裝備。",
  addAdult: "大人（13歲以上）",
  addChild: (minAge) => `兒童（${minAge}～12歲）`,
  addUnder3: "0～3歲（免費）",
  guestCategoryLabel: { adult: "大人", child: "兒童", under3: "0～3歲" },
  guestHeading: (index, categoryLabel) => `參加者${index}（${categoryLabel}）`,
  removeGuestAria: (index) => `刪除參加者${index}`,
  defaultGuestName: (index) => `參加者${index}`,
  nameLabel: "姓名（選填）",
  ageLabel: "年齡 *",
  heightLabel: "身高cm（選填）",
  weightLabel: "體重kg（選填）",
  shoeLabel: "鞋子尺寸cm *",
  shoePlaceholder: "例：26.5",
  shoeConversionNote: "鞋子尺寸以公分（cm）為單位，與台灣常用的公分尺寸相同。",
  rentalHeading: "租借選項",
  wetsuitRentalLabel: "防寒衣租借",
  prescriptionMaskRentalLabel: "度數面鏡租借",
  rentalIncludedLabel: "已含於行程費用",
  rentalPriceLabel: (price) => `+¥${price}`,
  prescriptionMaskAdultsOnly: "度數面鏡僅提供大人尺寸，沒有兒童尺寸。",
  rentalSummary: (wetsuitCount, maskCount) =>
    `租借：防寒衣${wetsuitCount}位、度數面鏡${maskCount}位`,
  needAdultError: "至少需要1位大人（13歲以上）參加。",
  seniorNotice: { before: "為了安全，同行有60歲以上者請改為預約", after: "。" },
  seniorFallbackPlanName: "包場方案",
  staffIntro: "不指定也完全沒問題——每位嚮導都會帶給您精彩的行程。",
  fullNameLabel: "姓名 *",
  phoneLabel: "電話（含國碼）*",
  phonePlaceholder: "+886 912 345 678",
  emailLabel: "電子郵件 *",
  requestsLabel: "問題或需求（選填）",
  couponLabel: "優惠碼（選填）",
  couponApply: "套用",
  couponChecking: "確認中...",
  couponAppliedToast: "優惠碼已套用！",
  couponAppliedLine: (amount) => `已套用優惠：−¥${amount}`,
  couponInvalid: "此優惠碼無效。",
  couponNetworkError: "無法驗證優惠碼，請確認網路連線。",
  couponChangedInvalid: "變更預約內容後，此優惠碼無法使用。",
  couponRecalcError: "無法重新計算優惠，請再套用一次。",
  partySummary: (counts) => {
    const parts = [`大人${counts.adult}位`]
    if (counts.child > 0) parts.push(`兒童${counts.child}位`)
    if (counts.under3 > 0) parts.push(`3歲以下${counts.under3}位（免費）`)
    return parts.join("、")
  },
  guideFeeLine: (fee) => `指定嚮導：+¥${fee}`,
  estimatedTotalLabel: "預估總額：",
  cashOnDay: "當天現金支付",
  agreeText: {
    before: "我同意",
    termsLabel: "服務條款・取消政策",
    between: "及",
    privacyLabel: "隱私權政策",
    after: "。",
  },
  cancellationSmallPrint: "行程前一天之前取消免費。當天取消或未到場收取行程費用的100%。若因天候由我們取消，全額免費（不收任何費用）。",
  lineLoginHeading: "最後一步：以LINE登入",
  lineLoginBody: {
    before: "所有預約均透過免費通訊軟體LINE確認。送出預約申請前請先以LINE登入——若尚未安裝，請先從App Store或Google Play下載（只需一分鐘）。您填寫的內容會自動儲存，登入後仍會保留。無法使用LINE時，請寄信至",
    after: "。",
  },
  lineLoginButton: "以LINE登入",
  lineConnecting: "正在連接LINE...",
  lineErrorPrefix: "LINE連線錯誤：",
  missingHeading: (count) => `就快完成了——還剩${count}個項目：`,
  missingChooseTour: "選擇行程",
  missingDate: "選擇日期",
  missingTime: "選擇開始時間",
  missingAddGuest: "新增至少1位參加者",
  missingAdult: "包含至少1位大人（13歲以上）",
  missingReduceGroup: (max) => `將人數調整為${max}位以內（11位以上請LINE洽詢）`,
  missingAgeFor: (index) => `參加者${index}的年齡/類別`,
  missingShoeFor: (index) => `參加者${index}的鞋子尺寸`,
  missingFullName: "您的姓名",
  missingPhone: "電話號碼（含國碼至少10碼）",
  missingAgree: "同意取消政策",
  missingLineLogin: "以LINE登入",
  lineExpiredError: "您的LINE登入已過期。請重新以LINE登入後再送出——您填寫的內容已儲存。",
  submitFailedError: "預約申請送出失敗。請稍後再試，或透過LINE與我們聯繫。",
  genericError: "發生錯誤，請再試一次。",
  submitSending: "傳送中...",
  submitLabel: "送出預約申請",
  requestNote: "這是預約申請——工作人員透過LINE回覆後，預約才正式成立。",
  addFriendWarning: {
    before: "⚠️ 我們會透過LINE回覆，請務必",
    linkText: "將LINE官方帳號加為好友",
    after: "——否則我們無法與您聯繫。",
  },
  successTitle: "預約申請已送出！",
  successBody: {
    text: "感謝您！工作人員將確認空位後透過LINE回覆您。",
    strong: "收到我們的回覆之前，預約尚未成立。",
  },
  successTourLabel: "行程：",
  successDateLabel: "日期・時間：",
  successSunsetNote: "（開始時間與集合地點將於行程前一天透過LINE確認）",
  successGuestsLabel: "人數：",
  successCouponLabel: "優惠折扣：",
  successTotalPrefix: "預估總額：",
  successTotalSuffix: "（當天現金支付）",
  addFriendBox: {
    title: "⚠️ 請務必閱讀",
    bodyPre: "預約確認通知將透過我們的",
    bodyStrong1: "LINE官方帳號",
    bodyMid: "傳送。",
    bodyStrong2: "若您尚未將我們加為LINE好友，我們將無法與您聯繫。",
    bodyPost: "請點擊下方按鈕加入好友。",
    note: "僅以LINE登入並不能收到訊息。",
    button: "加入LINE好友",
  },
  backHome: "回到首頁",
  // スタッフ向けメモ（英語のまま — 何語サイト経由か把握するため）
  bookedViaSite: "Booked via Taiwan (zh-TW) site",
}

// ---------------------------------------------------------------------------
// 辞書の組み立て
// ---------------------------------------------------------------------------

export const ZH_TW_DICT: IntlDict = {
  plans: ZH_PLANS,
  planById: ZH_PLAN_BY_ID,
  faqs: ZH_FAQS,
  guide: ZH_GUIDE,
  home: ZH_HOME,
  terms: ZH_TERMS,
  privacy: ZH_PRIVACY,
  ui: ZH_UI,
  common: ZH_COMMON,
  form: ZH_FORM,
  priceSupportNote:
    "為確保安全與順暢的行程運作，我們僅接受海外旅客預約包場（私人）行程。行程基本說明以日語進行，並會使用簡單英語及翻譯工具提供協助。",
}
