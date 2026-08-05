// 英語版サイト（/en配下）のコンテンツ定義。
// 価格・時間帯などの数値は lib/data.ts の PLANS が単一の真実 — ここには文章のみを持つ。

import type { IntlCommonCopy, IntlDict, IntlFormCopy, IntlUiCopy } from "./types"
import { EN_PRICE_SUPPORT_NOTE } from "./en-prices"
import { INTL_PLAN_IDS } from "./locales"

export interface EnSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export interface EnSectionsContent {
  metaTitle: string
  metaDescription: string
  heroTitle?: string
  heroSubtitle?: string
  sections: EnSection[]
}

export interface EnPlanContent {
  id: string
  name: string
  tagline: string
  description: string[]
  highlights: string[]
  included: string[]
  whatToBring: string[]
  precautions: string[]
  ageNote: string
  timeNote?: string
  locationNote?: string
  priceNote?: string
  priceNoteShort?: string
  options?: Array<{ name: string; price: number; note?: string }>
}

// ---------------------------------------------------------------------------
// Tour plans
// ---------------------------------------------------------------------------

// 英語サイトに掲載するプランの訳文。貸切4プランのみ（通常プランは掲載しないため訳文も持たない）。
const EN_PLANS_ALL: EnPlanContent[] = [
  {
    id: "S2",
    name: "Private Sea Turtle Snorkeling Tour",
    tagline: "One group only — your own guide, your own pace, and the turtles all to yourselves.",
    description: [
      "A fully private version of our signature sea turtle snorkeling tour, limited to one group at a time. With a dedicated guide all to yourselves, there's no waiting for other guests and no pressure — perfect if you're worried about small children, slower swimmers, or simply want an unhurried, special experience together.",
      "You'll enjoy the same shallow, calm beach and high turtle encounter rate as our regular tour, with extra-personal photo support: tell your guide exactly which shots and videos you'd like. Wetsuit and prescription-mask rentals are free on the private plan, and every photo and video is included free of charge.",
    ],
    highlights: [
      "Completely private — one group per tour",
      "Dedicated guide and fully flexible pacing",
      "High sea turtle encounter rate",
      "Free wetsuit and prescription-mask rental",
      "Free photos and videos, with custom shot requests welcome",
    ],
    included: ["Private guide", "Snorkel set and life jacket", "Wetsuit & prescription mask (free on this plan)", "All photo & video files (free, unlimited)", "Insurance"],
    whatToBring: ["Swimsuit (worn under your clothes)", "Change of clothes & towel", "Sunscreen", "Drinks", "Sandals (recommended)"],
    precautions: [
      "Guests who are pregnant cannot participate",
      "Guests with serious pre-existing conditions cannot participate — please ask us first",
      "Guests who have been drinking alcohol cannot participate",
      "This is the recommended plan for groups including guests aged 60 or over",
    ],
    ageNote: "Ages 5 to 65",
    locationNote: "Aragusuku Beach or Shigira Beach (chosen by wind direction on the day; meet 15 minutes before your start time)",
    priceNote: "¥9,000 per person, up to 10 guests. For 11 or more, contact us on LINE.",
    priceNoteShort: "¥9,000 / person",
  },
  {
    id: "S4",
    name: "Private Sunset SUP",
    tagline: "Glide across golden water at magic hour, with drone photos from above.",
    description: [
      "Watch Miyakojima's famous sunset from the best seat on the island: the open sea. As the sky shifts from orange to pink to violet, you can paddle gently, sit back, or simply lie on your board and listen to the waves. This is a private tour for your group only, so the magic hour is yours alone.",
      "Never tried SUP? No problem. We use extra-stable boards and your guide picks a calm spot and teaches you on land first — start seated, then stand up whenever you feel ready. The silhouette photos against the sunset are a guest favorite, and every photo and video is included free.",
    ],
    highlights: [
      "Private for your group — a truly private sunset",
      "Extra-stable boards, beginner-friendly coaching",
      "Drone shots from above plus magic-hour silhouettes, free of charge",
      "About 2 relaxing hours on the water",
    ],
    included: ["SUP board, paddle and life jacket", "Wetsuit and prescription mask (adult sizes only)", "Drone photography", "On-land lesson", "All photo & video files (free, unlimited)", "Insurance"],
    whatToBring: ["Swimsuit (worn under your clothes)", "Change of clothes & towel", "Sunscreen", "Drinks", "Sandals"],
    precautions: [
      "Guests who are pregnant cannot participate",
      "Guests with serious pre-existing conditions cannot participate — please ask us first",
      "Guests who have been drinking alcohol cannot participate",
    ],
    ageNote: "Ages 5 to 65",
    timeNote: "Meet about 90 minutes before sunset — around 5:45–6:00 PM in summer (June–August) and 4:30–5:00 PM in winter (November–February). The tour lasts about 2 hours and ends roughly 30 minutes after sunset. We'll confirm the exact meeting time via LINE the day before your tour.",
    locationNote: "Held at one of five spots — Turiba Seaside Park, Pasha Beach, the north end of Yonaha Beach, Ingya Marine Garden, or Nishihama Beach — chosen for the day's wind and sea conditions. Your guide will confirm the exact meeting spot with a map via LINE the day before your tour.",
  },
  {
    id: "S7",
    name: "Private Miyakojima Drone SUP Experience",
    tagline: "A private daytime SUP session on Miyako blue water with drone footage — just for your group.",
    description: [
      "Enjoy a fully private daytime SUP session on Miyakojima's clear blue water. With a dedicated guide for your group only, you can paddle at your own pace and ask freely for the shots you want — close-up photos from the water and aerial drone shots when conditions allow.",
      "First time on a SUP board? No problem. We use stable boards and your dedicated guide explains the basics on land before you go out. You can paddle seated at first and stand up when you feel comfortable.",
      "Choose your preferred start time when you book — hourly slots from 7:00 to 16:00. We will send your exact meeting spot via LINE the day before your tour, and if sea conditions, tide level or wind call for a small adjustment to the time, we will confirm that too.",
    ],
    highlights: [
      "Private tour for your group only, with a dedicated guide",
      "Drone photo and video shooting included when conditions allow",
      "Daytime Miyako blue water and wide aerial views",
      "Stable boards and beginner-friendly coaching",
      "Free photos and videos from the tour",
    ],
    included: ["SUP board, paddle and life jacket", "On-land lesson", "Drone shooting when conditions allow", "Photo & video files", "Insurance", "Dedicated private guide"],
    whatToBring: ["Swimsuit (worn under your clothes)", "Change of clothes & towel", "Sunscreen", "Drinks", "Sandals"],
    precautions: [
      "Guests who are pregnant cannot participate",
      "Guests with serious pre-existing conditions cannot participate — please ask us first",
      "Guests who have been drinking alcohol cannot participate",
      "Drone shooting may not be possible due to wind, rain, flight restrictions or safety decisions",
      "Start time and location may change depending on sea conditions, tide level and wind",
      "For groups of 11 or more, please contact us via LINE",
    ],
    ageNote: "Ages 5 to 65",
    timeNote: "Choose a start time from hourly slots between 7:00 and 16:00 when you book. Meet 15 minutes before the start — the time may shift slightly with sea conditions and tide, and we'll confirm it via LINE.",
    locationNote: "Location depends on the day's sea, tide and wind conditions (your guide will tell you via LINE the day before your tour)",
  },
  {
    id: "S5",
    name: "Private Jungle Night Tour",
    tagline: "The night expedition, fully reserved for your group — explore at exactly your own pace.",
    description: [
      "All the adventure of our jungle night tour, completely private. Your own guide leads only your group, so you can linger over a fascinating creature, stop for photos whenever you like, and let small children or grandparents set the pace — no other guests to keep up with.",
      "With the guide's full attention, you'll get deeper stories about Miyakojima's wildlife and nature than the regular tour has time for, including patient answers to every \"why?\" your kids can come up with. Babies (age 0) to seniors are welcome, kids 3 and under join free, and expedition photos are all included.",
    ],
    highlights: [
      "Completely private — one group only",
      "Dedicated guide with in-depth commentary",
      "Search for endangered giant coconut crabs",
      "Open to all ages (0–75), kids 3 and under free",
      "Free photos of your expedition",
    ],
    included: ["Private expert nature guide", "Flashlight rental", "All photo files (free)", "Insurance"],
    whatToBring: ["Comfortable walking shoes (sandals possible)", "Insect repellent", "Drinks", "Flashlight if you have one (rentals available)"],
    precautions: ["If you have any mobility or health concerns, please consult us in advance"],
    ageNote: "Ages 0 to 75",
    timeNote: "Two departures nightly: 7:20 PM and 9:10 PM (meet at the start time)",
    locationNote: "Near Ingya Marine Garden (exact meeting point shared via LINE on the day of your tour)",
    priceNote: "Flat ¥8,000 per person (free for ages 3 and under)",
    priceNoteShort: "Flat ¥8,000",
  },
]

// 英語サイトに掲載するプラン。貸切のみ（INTL_PLAN_IDS）に絞る。
export const EN_PLANS: EnPlanContent[] = EN_PLANS_ALL.filter((p) => INTL_PLAN_IDS.includes(p.id))

export const EN_PLAN_BY_ID = Object.fromEntries(EN_PLANS.map((p) => [p.id, p] as const))

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

export interface EnFaq {
  question: string
  answer: string
}

export const EN_FAQS: EnFaq[] = [
  { question: "Do I need a wetsuit?", answer: "From around November through April, water temperatures drop, so we recommend wearing a wetsuit. Rental fees vary by plan: some plans include a wetsuit in the price, while others charge a separate fee. Please check the details of each plan for more information." },
  { question: "I'm not a confident swimmer. Can I still join?", answer: "Absolutely! You'll wear a life jacket, and an experienced guide stays close by to support you at all times, so even non-swimmers can join with peace of mind." },
  { question: "Where is the meeting point?", answer: "The meeting point depends on the plan you book. Once your booking is confirmed, we'll send you detailed directions to the meeting point and parking via LINE (the messaging app we use for all communication). If you have any questions, feel free to message us on LINE anytime." },
  { question: "Where can I ask questions or get advice?", answer: "We accept questions and inquiries 24 hours a day via LINE, the messaging app we use for all communication. Feel free to send us a message anytime, and our staff will respond carefully during business hours (7:00 AM to 6:00 PM)." },
  { question: "Can young children go in the water?", answer: "Yes. Children ages 5 and up can join most of our snorkeling tours. With a life jacket and flotation gear, even kids who can't swim well can enjoy the water safely. That said, please keep things comfortable for your child depending on wave conditions and how they're feeling." },
  { question: "What if my child is afraid of the waves?", answer: "Start at a beach with calm waves, such as Aragusuku Beach or Shigira Beach, and let your child get comfortable in shallow water where they can stand. With a life jacket on and a parent close by for support, kids gradually get used to the water." },
  { question: "What are some backup plans for rainy days?", answer: "Miyakojima has plenty of indoor options, including the Miyakojima Underwater Park, the Yukishio (Snow Salt) Museum, and the Shimanoeki Miyako market. Spending time at your hotel pool is another great option." },
  { question: "Can we rent kid-sized snorkeling gear?", answer: "Yes. Many beaches and tour companies rent kid-sized snorkel sets, life jackets, and flotation gear. On Sea Turtle Brothers tours, children's equipment is provided free of charge." },
  { question: "Is there a cancellation fee?", answer: "Free cancellation until the day before your tour — if you contact us by then, there is no charge at all. Same-day cancellations are charged 100% of the tour price. Payment is made in cash on site on the day, so if we cancel the tour ourselves due to bad weather, there is simply nothing to pay — please don't worry." },
  { question: "Can I join if I'm pregnant?", answer: "We're sorry, but for safety reasons we cannot accept guests who are pregnant or may be pregnant. This is to protect you from the chilling effect of seawater and any unexpected risks. After your baby arrives and you're settled, we'd love to welcome your whole family!" },
  { question: "Can I join if I wear contact lenses or glasses?", answer: "If you wear disposable contact lenses, you can keep them in during the tour. We recommend bringing a spare pair in case a lens washes out. For glasses wearers, we offer prescription mask rentals (¥1,000) — just let us know when you book." },
  { question: "I'm worried about getting seasick. Will I be okay?", answer: "Don't worry! Sea Turtle Brothers tours are beach-entry tours — you walk straight into the ocean from the beach, so there's no boat involved. Enjoying the water without any risk of seasickness is one of the big advantages of our tours. If you're concerned about feeling queasy in the waves, taking an over-the-counter motion sickness remedy about 30 minutes before departure is a good precaution." },
  { question: "Will I get photos and videos from the tour?", answer: "Yes! Your guide takes plenty of photos and videos with a high-quality camera, and all the data is yours free of charge — with no limit on the number of shots. Take home lots of memories, like a photo of you swimming alongside a sea turtle. You're welcome to bring your own camera too, but since there's a risk of water damage, we recommend using a waterproof case." },
  { question: "Is parking available?", answer: "Yes, there is parking at the meeting-point beach. Depending on the beach, parking is either paid (¥1,000 to ¥2,000) or free. Public transportation on Miyakojima is limited, so we recommend coming by rental car. We'll send you detailed parking directions via LINE the day before your tour." },
  { question: "Can I join during my period?", answer: "Yes, as long as you're feeling about the same as usual, you're welcome to join. Using a tampon or choosing a dark-colored swimsuit can help you feel more comfortable. If you're not feeling well, please don't push yourself — rescheduling is possible, so feel free to reach out to us on LINE." },
  { question: "I'm worried about sunburn. Any tips?", answer: "UV levels on Miyakojima are extremely strong — about 1.5 to 2 times higher than on mainland Japan — so sun protection is a must! Reapply waterproof sunscreen frequently (ideally a reef-safe formula that's gentle on coral). Wearing a rash guard is also a great idea. And don't forget the spots that are easy to miss, like the back of your neck, behind your ears, and the tops of your feet." },
  { question: "What should I wear on the day of the tour?", answer: "The smoothest option is to arrive with your swimsuit on under your clothes. On top, wear something easy to slip on and off, like a T-shirt and shorts. Flip-flops are fine for footwear. Changing space after the tour is limited, so please bring a towel and a change of clothes you can use in your car." },
  { question: "How far in advance should I book? Can I book on the same day?", answer: "Because we run private tours only, dates often sell out one to two weeks ahead during busy seasons (July through September, Golden Week in late April to early May, and the New Year holidays). Once you've decided on a date and time, please send your booking request early. If space is available, you can book up until the day before. Message us on LINE anytime and we'll let you know the latest availability right away. Please note that a booking is not confirmed until our staff replies via LINE." },
  { question: "Can I snorkel in winter?", answer: "Yes! Water temperatures around Miyakojima stay above 20°C (68°F) even in winter, so with a wetsuit you can enjoy snorkeling year-round. Summer (June to September) brings warm, comfortable water, while winter (December to March) is a hidden-gem season with fewer tourists and exceptionally clear water. Whatever the season, the ocean around Miyakojima is spectacular!" },
  { question: "How long do the tours take?", answer: "Snorkeling tours run about 2 hours from meeting to dismissal, night tours about 1.5 hours, and SUP tours about 2 hours. Time in the water is roughly 60 to 90 minutes. After we meet, we hold a safety briefing and fit your equipment, and after the experience you're free to head off on your own." },
  { question: "I have a pre-existing medical condition. Can I join?", answer: "For safety reasons, we may not be able to accept guests with conditions such as heart disease, epilepsy, or asthma. Please feel free to consult us via LINE before booking, and we'll respond to your situation individually. Please also note that guests who have been drinking alcohol cannot participate." },
]

// ---------------------------------------------------------------------------
// Sea turtle guide page
// ---------------------------------------------------------------------------

export const EN_GUIDE: EnSectionsContent = {
  metaTitle: "Sea Turtle Snorkeling in Miyakojima: Spots, Season & Tips",
  metaDescription: "Where to see sea turtles in Miyakojima, the best season and beaches, plus safety tips. Family-friendly private snorkel tours by Sea Turtle Brothers.",
  heroTitle: "Where to Swim with Sea Turtles in Miyakojima: The Complete Snorkeling Guide",
  heroSubtitle: "Miyakojima is one of the best places in Japan to encounter sea turtles year-round. This guide covers where and when you're most likely to see them, whether beginners and kids can join, what to watch out for if you go on your own, and why a guided tour is the easiest way to make it happen.",
  sections: [
    { heading: "A Note Before You Dive In", paragraphs: ["Sea turtles are wild animals. When this page says an area has a \"high encounter rate,\" that is never a guarantee you will see one. For your safety and to protect the turtles, please never touch or chase them — observe quietly and keep your distance."] },
    { heading: "Where You're Most Likely to See Sea Turtles in Miyakojima", paragraphs: ["Coral reefs surround Miyakojima, and the seagrass and algae that sea turtles feed on grow in abundance, so turtles live all around the island. These areas are known for especially high encounter rates.", "You can sometimes meet turtles entering from the beach, but your chances depend heavily on the tide, weather, and that day's sea conditions. If you want the best odds, go with a guide who knows the local spots inside and out."], bullets: ["Around Shigira Beach: Calm waters and a strong chance of meeting sea turtles while snorkeling.", "Aragusuku Beach: Shallow with the reef close to shore, making it easy for beginners to observe turtles.", "Offshore reef points by boat: With fewer people around, turtles stay relaxed, and encounter rates tend to be higher."] },
    { heading: "Best Season and Time of Day for Sea Turtle Encounters", paragraphs: ["You can meet sea turtles in Miyakojima all year, but how easy they are to observe changes with sea conditions.", "Note: Sea turtles are wild animals, so sightings are never guaranteed, regardless of the season or time of day."], bullets: ["Season: April through October is the prime window, when the sea is calm and visibility is at its best. You can still see turtles in winter, but northerly winds make rough days more common.", "Time of day: Mornings are best, when winds are light and the sea is calm.", "Tide: Around high tide it's easier to swim over the reef, which can make observation easier."] },
    { heading: "Can Beginners and Kids Snorkel with Sea Turtles?", paragraphs: ["Yes. Sea turtle snorkeling is an activity anyone can enjoy, whether or not you're a confident swimmer."], bullets: ["You'll wear a life jacket, so you can float comfortably and watch the turtles from the surface.", "On a private tour, a guide stays right beside you — reassuring for first-timers and nervous swimmers alike.", "Sea Turtle Brothers welcomes kids from age 5, and many families join our tours."] },
    { heading: "Safety Tips If You Go on Your Own", paragraphs: ["If you snorkel from the beach on your own, please take safety and conservation seriously.", "If you're at all unsure, or simply want a safer and more reliable experience, we recommend joining a guided tour."], bullets: ["Watch for rip currents and tidal flow: Some Miyakojima beaches have fast-moving currents. Always check the designated swimming areas and that day's sea conditions so you don't get carried offshore.", "Never swim alone: Always go with at least one other person and wear a life jacket.", "Don't touch or chase the turtles: Sea turtles are protected wildlife. Never touch them or block their path — keep your distance and observe quietly. Feeding them is strictly prohibited.", "Protect yourself from sun and heat: Wear a rash guard, apply sunscreen, and stay hydrated."] },
    { heading: "Why a Guided Tour Is Worth It", paragraphs: ["A guided tour takes the guesswork out of finding turtles and lets you focus on enjoying the water."], bullets: ["Better odds of an encounter: Your guide chooses the spots where turtles are seen, matched to that day's sea conditions.", "Safety handled by pros: Gear preparation and judgment calls on currents and weather are taken care of, so you can relax and focus on the sea.", "Photos and videos to keep: Your guide captures you swimming alongside the turtles — underwater memories you couldn't take with your phone.", "Generous beginner support: From how to use your snorkel to breathing techniques, our small groups mean careful, personal coaching."] },
    { heading: "What Makes Sea Turtle Brothers Different", paragraphs: ["Sea Turtle Brothers offers family-friendly, fully private marine experiences in Miyakojima.", "Check our tour plans page for tour types and prices. To check availability and book, use our booking form — note that a booking request is not confirmed until our staff replies via LINE."], bullets: ["One group at a time, so your guide keeps an eye on every single guest", "Photo and video files included free as a gift", "Kids from age 5 welcome — great for beginners and families", "Free cancellation until the day before your tour", "Fully insured, with safety as our top priority"] },
    { heading: "Swim with Sea Turtles in Miyakojima", paragraphs: ["Private tours where beginners and families feel right at home. Photos and videos are included free, with free cancellation until the day before your tour. Check availability and send a booking request through our booking form, or message us on LINE — your booking is confirmed once our staff replies via LINE."] },
  ],
}

// ---------------------------------------------------------------------------
// Home (landing) page
// ---------------------------------------------------------------------------

export const EN_HOME = {
  metaTitle: "Sea Turtle Snorkeling in Miyakojima | Sea Turtle Brothers",
  metaDescription: "Private tours and a one-group-per-day Sunset SUP experience in Miyakojima. Free photos & videos. Free cancellation until the day before.",
  hero: {
    badge: "Family-Friendly Marine Tours in Miyakojima",
    title: "Swim with Sea Turtles in Miyakojima",
    subtitle: "Private tours built for beginners and families, plus a one-group-per-day Sunset SUP experience — with free photos and videos, and free cancellation until the day before your tour.",
  },
  trustItems: [
    "Private tours, fully insured",
    "Free underwater photos & videos",
    "Free cancellation until the day before",
    "Kids ages 5+ welcome, children's gear provided",
  ],
  aboutHeading: "Miyakojima's Sea, at Your Family's Pace",
  aboutParagraphs: [
    "Sea Turtle Brothers (Umigame Kyodai) is a private-tour marine operator on Miyakojima, Okinawa. Our signature experience is snorkeling with wild sea turtles in the island's clear, calm waters, where you can also meet clownfish and colorful tropical fish. Because these are wild animals, sightings can never be 100% guaranteed — but our encounter rate is high, and every tour is private, so you can spend slow, unhurried time with the turtles instead of jostling with a crowd.",
    "Safety always comes first. Every tour starts with a safety briefing, all tours are covered by insurance, and our guides are used to first-time snorkelers. Children from age 5 can join, and we provide kid-sized equipment, making this an easy choice for families building vacation memories together.",
    "Your guide captures the whole experience with an underwater camera, and every high-quality photo and video is yours free of charge. Beyond turtle snorkeling, we also offer night tours, sunset SUP and drone SUP experiences across Miyakojima's sea and nature, from morning to night.",
  ],
  howToBookHeading: "How Booking Works",
  howToBook: [
    { title: "Choose your plan", text: "Browse our tours and pick the plan and date that fit your trip. The price for each tour is shown on its own plan page." },
    { title: "Send a booking request", text: "Submit a booking request through our website. You'll need to log in with LINE, a free messaging app, to send it. Please note: a booking request is not a confirmed reservation." },
    { title: "Get confirmation via LINE", text: "Our staff will check availability and reply to you on LINE. Your booking is confirmed only after you receive our reply." },
    { title: "Pay cash on the day", text: "No prepayment needed — simply pay in cash on site on the day of your tour. Cancellation is free until the day before your tour." },
  ],
  lineExplainer: {
    title: "Why do I need LINE?",
    text: "LINE is a free messaging app — it's the most popular way to chat in Japan, and it's how we confirm bookings and stay in touch with guests before the tour. To send a booking request, you'll need a LINE account, so we recommend downloading the app from the App Store or Google Play before booking (it only takes a minute). Remember, your booking is not confirmed until our staff replies to you on LINE. If you have questions or aren't able to use LINE, feel free to email us at info@umigamekyoudaimiyakojima.com or call +81-80-5344-2439.",
  },
  toursHeading: "Our Tours",
  toursIntro: "Four experiences across Miyakojima's sea and nature — private sea turtle snorkeling, a private jungle night tour, private drone SUP, and a one-group-per-day sunset SUP.",
  faqHeading: "Frequently Asked Questions",
  faqIntro: "Planning your first snorkeling trip in Miyakojima? Here are answers to the questions travelers ask us most — from swimming ability and kids' participation to cancellation and payment.",
  contactHeading: "Questions? We're Happy to Help",
  contactText: "Message us on LINE anytime, email us, or call during business hours (7:00 AM – 6:00 PM, open year-round).",
} as const

// ---------------------------------------------------------------------------
// Legal pages
// ---------------------------------------------------------------------------

export const EN_TERMS: EnSectionsContent = {
  metaTitle: "Terms of Service & Cancellation Policy",
  metaDescription: "Terms of service and cancellation policy for Sea Turtle Brothers in Miyakojima: bookings, payment, cancellation fees, and weather cancellations.",
  heroTitle: "Terms of Service & Cancellation Policy",
  heroSubtitle: "Please review the following terms before submitting a booking request for our tours.",
  sections: [
    { heading: "Article 1: Scope of These Terms", paragraphs: ["These Terms set out the conditions for booking and participating in the marine tours (the \"Tours\") offered by Sea Turtle Brothers (\"we,\" \"us,\" or \"our\"). By submitting the booking form, you are deemed to have agreed to these Terms."] },
    { heading: "Article 2: Booking Confirmation", paragraphs: ["Submitting the booking form is a booking request only; it does not confirm your booking. Your booking is confirmed only when we contact you via LINE or by phone to confirm it. Depending on availability and sea conditions, we may be unable to accommodate your request."] },
    { heading: "Article 3: Fees and Payment", paragraphs: ["Tour fees are the prices shown on each plan page (tax included). Payment is made in cash, on site, on the day of your tour."] },
    { heading: "Article 4: Cancellation Policy", paragraphs: ["The following cancellation terms apply to all Tours."], bullets: ["Free cancellation until the day before your tour", "Same-day cancellation: 100% of the tour fee", "No-show: 100% of the tour fee", "Please contact us via LINE or by phone to cancel or change your booking"] },
    { heading: "Article 5: Cancellation Due to Weather", paragraphs: ["With safety as our top priority, we may cancel a tour at our discretion due to poor weather, rough sea conditions, or similar circumstances. In that case, no cancellation fee applies. Since payment is made in cash on site on the day, there is no advance payment, so nothing is charged."] },
    { heading: "Article 6: Safety and Participation Requirements", paragraphs: ["To keep every tour safe, we ask all guests to observe the following."], bullets: ["Please follow your guide's instructions throughout the tour. For safety reasons, we may ask you to stop participating if instructions are not followed", "Guests who have consumed alcohol or who are feeling unwell may not participate", "If you have a preexisting medical condition, are pregnant, or have any other health concerns, please consult us in advance", "Age limits and participation requirements for each plan are as stated on the respective plan page"] },
    { heading: "Article 7: Photos and Videos", paragraphs: ["Photos and videos taken by our staff during your tour are provided to you free of charge. If we would like to use photos or videos featuring you on our website, social media, or other promotional channels, we will confirm your consent in advance."] },
    { heading: "Article 8: Limitation of Liability", paragraphs: ["While we make every effort to ensure safety, we are not liable for damages arising from a guest's intentional act or negligence, a violation of these Terms, or force majeure, except where the damage results from our own intentional misconduct or gross negligence."] },
    { heading: "Article 9: Changes to These Terms", paragraphs: ["We may revise these Terms as necessary. Revised Terms take effect when they are posted on this page."] },
    { heading: "Article 10: Governing Law and Jurisdiction", paragraphs: ["These Terms are governed by the laws of Japan. Any dispute arising in connection with the Tours shall be subject to the exclusive jurisdiction, in the first instance, of the court having jurisdiction over our place of business."] },
    { heading: "Related Policies and Effective Date", paragraphs: ["For details on how we handle personal information, please see our Privacy Policy. For our business operator information, please see our Commercial Transactions Disclosure (Japanese).", "These Terms were established on June 13, 2026."] },
  ],
}

export const EN_PRIVACY: EnSectionsContent = {
  metaTitle: "Privacy Policy",
  metaDescription: "How Sea Turtle Brothers (Miyakojima sea turtle snorkeling tours) collects, uses, and protects the personal information you share when you book or contact us.",
  heroTitle: "Privacy Policy",
  heroSubtitle: "Sea Turtle Brothers (referred to below as \"we\" or \"us\") handles your personal information responsibly, in accordance with the policy set out below.",
  sections: [
    { heading: "1. Information We Collect", paragraphs: ["We collect the following information when you make a booking or contact us."], bullets: ["The lead guest's name, phone number, and email address", "Your LINE user ID and display name (if you connect with us via LINE)", "Each participant's name (optional), age, height and weight (optional), and shoe size", "Any requests or questions you enter in our forms"] },
    { heading: "2. How We Use Your Information", paragraphs: ["We use the information we collect for the following purposes."], bullets: ["Receiving, confirming, changing, or canceling your booking, and contacting you about it", "Managing safety and preparing equipment (fins, wetsuits, and so on)", "Delivering the photos and videos taken during your tour", "Responding to your inquiries"] },
    { heading: "3. Sharing With Third Parties", paragraphs: ["We do not share your personal information with third parties without your consent, except where required by law."] },
    { heading: "4. Third-Party Services We Use", paragraphs: ["We use the following external services to operate our business, and information is stored with these services to the extent necessary."], bullets: ["Booking management: Google Sheets (Google LLC)", "Guest communication: LINE (LY Corporation)", "Website usage analytics: Vercel Analytics (aggregated statistics that do not identify individuals)", "Website usage analytics: Google Analytics (Google LLC). It uses cookies to collect usage data that does not identify individuals. See Google's Policies and Terms for details."] },
    { heading: "5. Data Security", paragraphs: ["We take appropriate security measures to protect the personal information in our care against unauthorized access, loss, and leaks."] },
    { heading: "6. Requests to Access, Correct, or Delete Your Information", paragraphs: ["If you would like to access, correct, or delete your personal information, we will respond promptly after verifying your identity. Please reach out using the contact details below."] },
    { heading: "7. Contact", paragraphs: ["Sea Turtle Brothers (107-1 Hirara Matsubara, Miyakojima City, Okinawa 906-0014, Japan)", "Phone: +81-80-5344-2439 (7:00 AM to 6:00 PM, open year-round)", "Email: info@umigamekyoudaimiyakojima.com"] },
    { heading: "8. Changes to This Policy", paragraphs: ["We may update this policy from time to time in response to changes in the law or in our services. Significant changes will be announced on this page.", "Effective date: June 13, 2026"] },
  ],
}

// ---------------------------------------------------------------------------
// Shared UI strings (footer / mobile CTA)
// ---------------------------------------------------------------------------

export const EN_UI = {
  footer: {
    tagline: "Private ocean experiences for families, built on safety, sincerity, and a gentle sense of wonder. Meet sea turtles up close in beautifully clear waters.",
    quickLinksHeading: "Quick Links",
    businessHoursHeading: "Business Hours",
    hours: "7:00 AM - 6:00 PM",
    openYearRound: "Open year-round",
    hoursNote: "Hours may change depending on weather conditions.",
    lineLabel: "Official LINE Account",
    logoAlt: "Sea Turtle Brothers - EST. 2024",
    quickLinks: [
      { href: "/en", label: "Home" },
      { href: "/en/plans", label: "All Tours" },
      { href: "/en/book", label: "Book a Tour" },
      { href: "/en/miyakojima-sea-turtle", label: "Sea Turtle Guide" },
      { href: "/en/faq", label: "FAQ" },
    ],
    legalLinks: [
      { href: "/en/terms", label: "Terms of Service & Cancellation Policy" },
      { href: "/en/privacy", label: "Privacy Policy" },
      { href: "/tokushoho", label: "Legal Notice (Japanese)" },
    ],
    copyright: "Sea Turtle Brothers. All rights reserved.",
  },
  mobileCta: {
    line: "Ask on LINE",
    book: "Book Now",
    bookHref: "/en/book",
  },
} as const

// ---------------------------------------------------------------------------
// Shared page-template copy (headings, buttons, breadcrumbs, metadata)
// ---------------------------------------------------------------------------

export const EN_COMMON: IntlCommonCopy = {
  breadcrumbHome: "Home",
  breadcrumbTours: "Tours",
  breadcrumbFaq: "FAQ",
  breadcrumbGuide: "Sea Turtle Guide",
  breadcrumbTerms: "Terms of Service",
  breadcrumbPrivacy: "Privacy Policy",
  checkAvailability: "Check Availability & Book",
  seeAllTours: "See All Tours",
  readGuideLink: "Read our sea turtle snorkeling guide",
  seeAllQuestions: "See all questions",
  messageOnLine: "Message us on LINE",
  emailUs: "Email us",
  comingSoon: "Coming Soon",
  comingSoonDetail: "Coming Soon — booking not open yet",
  perAdult: "/ adult",
  perChild: "/ child",
  heroImageAlt: "Two sea turtles swimming together in the clear waters of Miyakojima",
  guideHeroImageAlt: "A sea turtle swimming in the clear blue water of Miyakojima",
  legalEyebrow: "Legal",
  faqEyebrow: "FAQ",
  tourPlansEyebrow: "Tour Plans",
  guideEyebrow: "Sea Turtle Guide",
  plansMetaTitle: "Tours & Prices | Sea Turtle Brothers Miyakojima",
  plansMetaDescription:
    "Compare Sea Turtle Brothers tours in Miyakojima: snorkeling, private trips, night tours and SUP. Free photos and videos; free cancellation until the day before.",
  plansTitle: "Tours & Prices in Miyakojima",
  plansIntro:
    "Private sea turtle snorkeling, a private jungle night tour, private drone SUP, and a one-group-per-day sunset SUP. Every tour includes free photos and videos, with free cancellation until the day before.",
  faqMetaTitle: "FAQ | Sea Turtle Brothers Miyakojima",
  faqMetaDescription:
    "Answers to common questions about Sea Turtle Brothers tours in Miyakojima: swimming ability, kids, what to bring, cancellation, weather, payment and more.",
  faqTitle: "Frequently Asked Questions",
  faqIntro:
    "Everything you need to know before joining a tour — swimming ability, kids, cancellation, what to bring and more. Can't find your answer? Message us on LINE anytime.",
  faqStillQuestions: "Still have questions? We reply carefully during business hours (7:00 AM – 6:00 PM).",
  askOnLine: "Ask on LINE",
  orEmail: "or email",
  readyToBook: "Ready to book? Check availability here",
  durationAbout: (hours) => `About ${hours} ${hours === 1 ? "hour" : "hours"}`,
  durationShort: (hours) => `About ${hours}h`,
  priceAdultLabel: "Price (adult)",
  childPricePrefix: "Child ",
  durationLabel: "Duration",
  agesLabel: "Ages",
  startTimesLabel: "Start times",
  dependsOnSunset: "Depends on sunset",
  highlightsHeading: "Highlights",
  includedHeading: "What's included",
  optionalRentalsHeading: "Optional rentals",
  bringHeading: "What to bring",
  notesHeading: "Important notes",
  paymentNote: {
    before: "Payment is in cash, on site, on the day of your tour. Free cancellation until the day before — see our ",
    linkText: "cancellation policy",
    after: ".",
  },
  comingSoonCta: {
    before: "This plan is coming soon. Follow us on ",
    linkText: "LINE",
    after: " to hear when booking opens.",
  },
  bookThisTour: "Book this tour",
  detailsLabel: "Details",
  guideCtaHeading: "Ready to meet the turtles?",
  guideCtaText: "Private tours with free photos & videos. Free cancellation until the day before.",
  bookMetaTitle: "Book a Tour | Sea Turtle Brothers Miyakojima",
  bookMetaDescription:
    "Send a tour booking request in Miyakojima. Check prices automatically, cancel free until the day before, and receive availability confirmation via LINE.",
  bookTitle: "Booking Request",
  bookIntro:
    "Fill in your details below — the price is calculated automatically. We'll confirm availability and reply via LINE. ",
  bookIntroStrong: "Your booking is not final until you hear back from us.",
  planMetaTitles: {
    S2: "Private Sea Turtle Snorkeling | Sea Turtle Brothers",
    S4: "Sunset SUP Tour | Sea Turtle Brothers",
    S5: "Private Jungle Night Tour | Sea Turtle Brothers",
    S7: "Private Drone SUP in Miyakojima | Sea Turtle Brothers",
  },
}

// ---------------------------------------------------------------------------
// Booking form copy
// ---------------------------------------------------------------------------

export const EN_FORM: IntlFormCopy = {
  staffNoPreference: "No preference",
  staffNames: { staff1: "Yama-chan", staff2: "Hikaru", staff5: "Sotaro", staff3: "Soichiro", staff4: "Nagi" },
  limitToast: (max) => `Online booking is limited to ${max} guests. Please contact us on LINE for 11 or more.`,
  groupLimitInfo: (max, current) =>
    `Online booking is limited to ${max} guests. Current group: ${current}. Contact us on LINE for 11 or more.`,
  sectionChooseTour: "Choose your tour",
  sectionDateTime: "Date & start time",
  sectionParticipants: "Who's joining?",
  sectionStaff: "Request a guide (optional)",
  sectionContact: "Your contact details",
  dateLabel: "Date (Japan time) *",
  startTimeLabel: "Start time",
  startTimeSunset: "(decided by sunset)",
  sunsetNote:
    "The start time follows the sunset and changes by season — you'll meet about 90 minutes before sunset (around 5:45 PM in August). We'll confirm the exact time and meeting spot via LINE the day before your tour.",
  sunsetDateGuide: (month, meet, end) => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    return `Guide for ${months[month - 1]}: meet around ${meet}, finish around ${end}.`
  },
  daySupNote:
    "Your start time may shift slightly depending on sea conditions and tide — we'll confirm the final time via LINE.",
  chooseTourFirst: "Choose a tour first",
  participantsIntroBase: "Age is required for safety.",
  participantsIntroShoe:
    "Shoe size (in cm) is required so we can prepare your fins — height and weight are optional but help us pick the right gear.",
  addAdult: "Adult (13+)",
  addChild: (minAge) => `Child (${minAge}–12)`,
  addUnder3: "Age 0–3 (free)",
  guestCategoryLabel: { adult: "Adult", child: "Child", under3: "Age 0–3" },
  guestHeading: (index, categoryLabel) => `Guest ${index} (${categoryLabel})`,
  removeGuestAria: (index) => `Remove guest ${index}`,
  defaultGuestName: (index) => `Guest ${index}`,
  nameLabel: "Name (optional)",
  ageLabel: "Age *",
  heightLabel: "Height cm (optional)",
  weightLabel: "Weight kg (optional)",
  shoeLabel: "Shoe size cm *",
  shoePlaceholder: "e.g. 26.5",
  shoeConversionNote: "Shoe size in cm: US men's 8.5 ≈ 26.5 cm, US women's 7 ≈ 23.5 cm, EU 42 ≈ 26.5 cm.",
  rentalHeading: "Rental options",
  wetsuitRentalLabel: "Wetsuit rental",
  prescriptionMaskRentalLabel: "Prescription mask rental",
  rentalIncludedLabel: "included in tour price",
  rentalPriceLabel: (price) => `+¥${price}`,
  prescriptionMaskAdultsOnly: "Prescription masks are available in adult sizes only; child sizes are not available.",
  rentalSummary: (wetsuitCount, maskCount) =>
    `Rentals: ${wetsuitCount} wetsuit${wetsuitCount === 1 ? "" : "s"}, ${maskCount} prescription mask${maskCount === 1 ? "" : "s"}`,
  needAdultError: "At least one adult (13+) must join.",
  seniorNotice: { before: "For safety, groups including guests aged 60+ should book the ", after: " instead." },
  seniorFallbackPlanName: "the private plan",
  staffIntro: "No preference is perfectly fine — every guide will give you a great tour.",
  fullNameLabel: "Full name *",
  phoneLabel: "Phone (with country code) *",
  phonePlaceholder: "+1 555 123 4567",
  emailLabel: "Email (recommended)",
  requestsLabel: "Questions or requests (optional)",
  couponLabel: "Coupon code (optional)",
  couponApply: "Apply",
  couponChecking: "Checking...",
  couponAppliedToast: "Coupon applied!",
  couponAppliedLine: (amount) => `Coupon applied: −¥${amount}`,
  couponInvalid: "That coupon code is not valid.",
  couponNetworkError: "Could not verify the coupon. Please check your connection.",
  couponChangedInvalid: "This coupon is not available after changing the booking details.",
  couponRecalcError: "Could not recalculate the coupon. Please apply it again.",
  partySummary: (counts) => {
    const parts = [`${counts.adult} adult${counts.adult !== 1 ? "s" : ""}`]
    if (counts.child > 0) parts.push(`${counts.child} child${counts.child !== 1 ? "ren" : ""}`)
    if (counts.under3 > 0) parts.push(`${counts.under3} under 3 (free)`)
    return parts.join(", ")
  },
  guideFeeLine: (fee) => `Guide request: +¥${fee}`,
  estimatedTotalLabel: "Estimated total:",
  cashOnDay: "cash on the day",
  agreeText: {
    before: "I agree to the ",
    termsLabel: "Terms of Service & Cancellation Policy",
    between: " and the ",
    privacyLabel: "Privacy Policy",
    after: ".",
  },
  cancellationSmallPrint:
    "Free cancellation until the day before. Same-day cancellations and no-shows are charged 100% of the tour fee. Full refund if we cancel due to weather.",
  lineLoginHeading: "One last step: log in with LINE",
  lineLoginBody: {
    before:
      "We confirm every booking through LINE, a free messaging app. Please log in with LINE to send your request — if you don't have the app yet, download it from the App Store or Google Play first (it takes a minute). Your entries are saved automatically, so everything will still be here after you log in. Can't use LINE? Email us at ",
    after: " instead.",
  },
  lineLoginButton: "Log in with LINE",
  lineConnecting: "Connecting to LINE...",
  lineErrorPrefix: "LINE connection error: ",
  missingHeading: (count) => `Almost there — ${count} ${count === 1 ? "item" : "items"} left:`,
  missingChooseTour: "Choose a tour",
  missingDate: "Pick a date",
  missingTime: "Pick a start time",
  missingAddGuest: "Add at least one guest",
  missingAdult: "Include at least one adult (13+)",
  missingReduceGroup: (max) => `Reduce the group to ${max} guests (contact us on LINE for 11+)`,
  missingAgeFor: (index) => `Age/category for guest ${index}`,
  missingShoeFor: (index) => `Shoe size for guest ${index}`,
  missingFullName: "Your full name",
  missingPhone: "Phone number (at least 10 digits, with country code)",
  missingAgree: "Agree to the cancellation policy",
  missingLineLogin: "Log in with LINE",
  lineExpiredError: "Your LINE login has expired. Please log in with LINE again and resend — your entries are saved.",
  submitFailedError:
    "We couldn't send your booking request. Please try again in a little while, or message us on LINE.",
  genericError: "Something went wrong. Please try again.",
  submitSending: "Sending...",
  submitLabel: "Send booking request",
  requestNote: "This sends a booking request — your booking is confirmed only after our staff replies on LINE.",
  addFriendWarning: {
    before: "⚠️ We reply on LINE, so please also ",
    linkText: "add our LINE official account as a friend",
    after: " — otherwise we can't reach you.",
  },
  successTitle: "Booking request sent!",
  successBody: {
    text: "Thank you! Our staff will check availability and reply to you on LINE.",
    strong: "Your booking is not confirmed until you receive our reply.",
  },
  successTourLabel: "Tour: ",
  successDateLabel: "Date & time: ",
  successSunsetNote: "(start time & meeting spot will be confirmed via LINE the day before)",
  successGuestsLabel: "Guests: ",
  successCouponLabel: "Coupon discount: ",
  successTotalPrefix: "Estimated total: ",
  successTotalSuffix: " (cash, on the day)",
  addFriendBox: {
    title: "⚠️ Please read this",
    bodyPre: "We send your booking confirmation through our ",
    bodyStrong1: "LINE official account",
    bodyMid: ". ",
    bodyStrong2: "If you haven't added us as a friend on LINE, we can't reach you.",
    bodyPost: " Please tap the button below to add us as a friend.",
    note: "Logging in with LINE alone is not enough to receive messages.",
    button: "Add us on LINE",
  },
  backHome: "Back to home",
  bookedViaSite: "Booked via English site",
}

// ---------------------------------------------------------------------------
// Assembled dictionary
// ---------------------------------------------------------------------------

const EN_UI_INTL: IntlUiCopy = {
  footer: EN_UI.footer,
  mobileCta: EN_UI.mobileCta,
  nav: {
    items: [
      { href: "/en", label: "Home" },
      { href: "/en/plans", label: "Tours" },
      { href: "/en/miyakojima-sea-turtle", label: "Sea Turtle Guide" },
      { href: "/en/faq", label: "FAQ" },
    ],
    line: "Ask on LINE",
    book: "Book Now",
    menuAria: "Menu",
    homeHref: "/en",
    bookHref: "/en/book",
  },
  bookingFormLoading: "Loading booking form",
}

export const EN_DICT: IntlDict = {
  plans: EN_PLANS,
  planById: EN_PLAN_BY_ID,
  faqs: EN_FAQS,
  guide: EN_GUIDE,
  home: EN_HOME,
  terms: EN_TERMS,
  privacy: EN_PRIVACY,
  ui: EN_UI_INTL,
  common: EN_COMMON,
  form: EN_FORM,
  priceSupportNote: EN_PRICE_SUPPORT_NOTE,
}
