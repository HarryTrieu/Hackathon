// Mentor marketplace data shared by client and server: the mentor
// questionnaire, seeded mentor listings, and small pure helpers.
// A listing = one mentor for one unit (a mentor can list several units).
import { getProfile } from "./seed.js";

export const MIN_GRADES = ["HD", "D"];
export const GRADE_LABELS = {
  HD: "High Distinction",
  D: "Distinction",
  C: "Credit",
  P: "Pass",
};

// Public copy never shows HD vs D. Reviewers still see the exact band internally.
export function gradeBand(_grade) {
  return "Distinction or above";
}

export const MAX_CHATS_PER_DAY = 5;

// Ten questions the matcher asks mentees, one at a time. Skip any the
// mentee already answered in their own words. Unit is skipped on a unit page.
export const MENTEE_QUESTIONS = [
  {
    id: "unit",
    question: "Which unit do you need help with?",
    suggestions: [],
    skipWhenUnitKnown: true,
    answeredBy: /\b[A-Z]{3}\d{3}\b|marketing|programming|statistics|design/i,
  },
  {
    id: "hardest",
    question: "What are you finding hardest right now?",
    suggestions: [
      "Concepts don't click yet",
      "Exam preparation",
      "Keeping up with readings",
      "Planning my study time",
    ],
    answeredBy:
      /hardest|struggle|stuck|confused|lost|don't understand|khó|chưa hiểu|concepts don't|exam prep|readings|planning my study/i,
  },
  {
    id: "goal",
    question: "What's your goal?",
    suggestions: ["Pass the unit", "Improve my grade", "Really understand it", "Prepare for an exam"],
    answeredBy: /pass the unit|improve my grade|really understand|prepare for an exam|goal|pass|improve|thi cuối|exam is/i,
  },
  {
    id: "teaching",
    question: "How do you learn best?",
    suggestions: ["Step-by-step", "Examples", "Big picture first", "Talking it through"],
    answeredBy:
      /step[- ]by[- ]step|từng bước|example|ví dụ|big picture|tổng quan|talking it through|thảo luận|explained? slowly|giải thích/i,
  },
  {
    id: "tone",
    question: "What kind of tone makes you comfortable?",
    suggestions: ["Calm", "Friendly", "Energetic", "Direct"],
    answeredBy: /calm|gentle|nhẹ nhàng|friendly|casual|thân thiện|energetic|năng động|direct|thẳng|patient/i,
  },
  {
    id: "pace",
    question: "How fast do you like to go?",
    suggestions: ["Slow and thorough", "Moderate", "Fast"],
    answeredBy: /slow|thorough|chậm|kỹ|moderate|fast|quick|nhanh|key points/i,
  },
  {
    id: "feedback",
    question: "How do you prefer feedback?",
    suggestions: ["Gentle", "Honest and direct", "Guided questions"],
    answeredBy: /feedback|gentle|encourag|honest and direct|guided questions|góp ý/i,
  },
  {
    id: "language",
    question: "Which language would you like to be mentored in?",
    suggestions: ["English", "Vietnamese", "Either is fine"],
    answeredBy: /english|vietnamese|tiếng việt|mandarin|hindi|arabic|either is fine/i,
  },
  {
    id: "format",
    question: "Online or in person? When are you usually free?",
    suggestions: ["Online", "In person", "Either", "Evenings after class"],
    answeredBy: /online|zoom|remote|in person|face to face|on campus|either|evenings|free (on|after)/i,
  },
  {
    id: "budget",
    question: "Do you have a budget per session in mind?",
    suggestions: [
      "Under $30",
      "$30-50",
      "Happy to pay more for a strong fit",
      "Just browsing / community only",
    ],
    answeredBy: /\$\d+|budget|under \$|just browsing|community only|afford|rẻ|giá/i,
  },
];

// Part A: multiple choice, used for matching.
export const STYLE_QUESTIONS = [
  {
    id: "teaching",
    label: "How would you describe your teaching style?",
    options: ["Step-by-step", "Big picture first", "Example-driven", "Q&A and discussion"],
  },
  {
    id: "tone",
    label: "What tone do you usually use?",
    options: ["Calm and gentle", "Friendly and casual", "Energetic and motivating", "Direct and to the point"],
  },
  {
    id: "pace",
    label: "What pace do you prefer when explaining?",
    options: ["Slow and thorough", "Moderate", "Fast, focused on key points"],
  },
  {
    id: "help",
    label: "What do you help with most in this unit?",
    options: [
      "Understanding concepts",
      "Exam preparation",
      "Study planning",
      "Reading and research skills",
      "Career advice related to this field",
    ],
    multiple: true,
  },
  {
    id: "feedback",
    label: "How do you give feedback?",
    options: [
      "Encouraging first, then corrections",
      "Honest and direct",
      "Mostly asking questions so you find the answer yourself",
    ],
  },
  {
    id: "languages",
    label: "Languages you can mentor in",
    options: ["English", "Vietnamese", "Mandarin", "Hindi", "Arabic", "Other"],
    multiple: true,
  },
  {
    id: "format",
    label: "Preferred format",
    options: ["Online", "In person", "Both"],
  },
];

// Part B: free text, used by the AI to learn the mentor's voice.
export const VOICE_QUESTIONS = [
  {
    id: "topics",
    label: "Which topics in this unit do you know best, and which ones do students usually struggle with?",
  },
  {
    id: "explain",
    label: "Explain one difficult concept from this unit the way you would to a first-year student.",
    hint: "The most important answer: this is the real voice sample the AI imitates.",
  },
  {
    id: "lost",
    label: "A student says \"I'm lost and the exam is next week.\" What would you reply?",
  },
  {
    id: "about",
    label: "Tell students a bit about yourself: why you mentor, and one thing that helped you do well in this unit.",
  },
];

export const SEED_MENTORS = [
  {
    profile_id: "p13",
    unit_code: "MMK101",
    grade: "HD",
    rate_per_hour: 35,
    show_experience: true,
    experience: [{ company: "Glow Lab Skincare", role: "Marketing intern", current: true }],
    style: {
      teaching: "Step-by-step",
      tone: "Calm and gentle",
      pace: "Slow and thorough",
      help: ["Understanding concepts", "Exam preparation", "Study planning"],
      feedback: "Encouraging first, then corrections",
      languages: ["English", "Vietnamese"],
      format: "Both",
    },
    voice: {
      topics: "I know the marketing mix (4Ps), segmentation and positioning really well. Students usually struggle with positioning maps and with writing the case study recommendation clearly.",
      explain: "Okay, let's take segmentation slowly. Imagine a bubble tea shop. Not everyone who walks past wants the same thing: some want cheap and fast, some want a nice place to study, some care about healthy options. Segmentation is just grouping people who want similar things. Once you have the groups, you pick the one you can serve best. That's targeting. Does that make sense so far? We can do one together with a brand you like.",
      lost: "Hey, first, take a breath. One week is enough if we're smart about it. Let's list the topics, mark the ones you already half-know, and spend most of the time there. I'll give you one practice question a day and we'll go through your answer together. You've got this.",
      about: "I'm Hannah, third year Business. I failed my first marketing quiz because I just memorised definitions. What changed everything was applying every framework to brands I actually use. I mentor because I remember how overwhelming first year felt, and I explain in Vietnamese too if that helps.",
    },
  },
  {
    profile_id: "p14",
    unit_code: "MMK101",
    grade: "D",
    rate_per_hour: 30,
    show_experience: true,
    experience: [{ company: "Brightside Creative", role: "Social media coordinator (part-time)", current: true }],
    style: {
      teaching: "Example-driven",
      tone: "Energetic and motivating",
      pace: "Fast, focused on key points",
      help: ["Career advice related to this field", "Understanding concepts"],
      feedback: "Honest and direct",
      languages: ["English"],
      format: "Online",
    },
    voice: {
      topics: "Digital marketing, social media strategy and the case study report. People struggle with turning research into an actual recommendation.",
      explain: "Positioning in one line: it's the spot your brand owns in someone's head. Nike = performance. Dove = real beauty. Your job in the assignment is to find that spot for your brand and prove it with evidence. Draw the positioning map, put competitors on it, find the empty space. Done. Next!",
      lost: "Right, no panic, let's be efficient. Give me your weakest two topics and we hammer those. Skip re-reading slides, do past-style questions and I'll tell you straight what's missing. A week is plenty if we stop wasting time.",
      about: "Ryan, second year. I work part-time running socials for an agency, and I got that job using my MMK101 case study as a portfolio piece. I mentor because marketing is way more fun when you see how it works in real jobs.",
    },
  },
  {
    profile_id: "p4",
    unit_code: "MMK101",
    grade: "HD",
    rate_per_hour: 40,
    show_experience: true,
    experience: [{ company: "PwC", role: "Summer vacationer", current: false }],
    style: {
      teaching: "Big picture first",
      tone: "Direct and to the point",
      pace: "Moderate",
      help: ["Exam preparation", "Study planning"],
      feedback: "Honest and direct",
      languages: ["English"],
      format: "In person",
    },
    voice: {
      topics: "Exam technique and how the unit connects to the rest of the business degree. Students struggle to structure long answers under time pressure.",
      explain: "Start with the big picture: marketing is about creating value a customer will pay for. Every framework in MMK101 is a tool for one part of that. The 4Ps is what you offer, segmentation is who you offer it to, positioning is why they pick you. Once you see the map, each lecture just fills in one box.",
      lost: "Okay. We build a plan today: five days of topics, one day of full practice exam, one day rest. Every answer uses the same structure: define, apply, evaluate. Structure alone is worth a grade band.",
      about: "James, third year Business, did a summer vacation program at PwC. I care about structure and exam technique because that's what moved me from a credit to an HD. I mentor in person on the Burwood campus.",
    },
  },
  {
    profile_id: "p2",
    unit_code: "SIT102",
    grade: "HD",
    rate_per_hour: 30,
    show_experience: true,
    experience: [
      { company: "Deakin University", role: "SIT102 tutor", current: true },
      { company: "Atlassian", role: "Incoming software engineering intern", current: false },
    ],
    style: {
      teaching: "Step-by-step",
      tone: "Friendly and casual",
      pace: "Moderate",
      help: ["Understanding concepts", "Exam preparation"],
      feedback: "Encouraging first, then corrections",
      languages: ["English", "Vietnamese"],
      format: "Both",
    },
    voice: {
      topics: "Loops, arrays, functions and debugging. Most students get stuck on arrays and on reading error messages.",
      explain: "Think of an array like a row of lockers. Each locker has a number starting at 0, and each one holds one thing. When you write scores[2], you're just opening locker number 2. A loop is you walking down the row opening every locker one by one. That's literally it.",
      lost: "Hey no stress, happens to heaps of people. Send me the last two lab tasks you did, we'll rebuild them from scratch together. The exam mostly repeats lab patterns, so if the labs click, you're good.",
      about: "I'm Duc, third year CS and a SIT102 tutor. I almost dropped programming in first year. What saved me was typing out every example myself instead of copying. I can explain in Vietnamese too.",
    },
  },
  {
    profile_id: "p1",
    unit_code: "SIT102",
    grade: "HD",
    rate_per_hour: 60,
    show_experience: true,
    experience: [{ company: "Google", role: "Software Engineer", current: true }],
    style: {
      teaching: "Big picture first",
      tone: "Direct and to the point",
      pace: "Fast, focused on key points",
      help: ["Career advice related to this field", "Understanding concepts"],
      feedback: "Mostly asking questions so you find the answer yourself",
      languages: ["English", "Mandarin"],
      format: "Online",
    },
    voice: {
      topics: "Problem decomposition and how intro programming connects to real engineering work and interviews.",
      explain: "Before any syntax: what problem are you solving, what goes in, what comes out? Write that in plain English first. Code is just translating that into instructions a computer can follow. What would the first step be for your current task?",
      lost: "What have you tried so far? Show me one problem you can't solve and walk me through your thinking. We'll find the exact gap instead of re-studying everything.",
      about: "Sarah, Deakin CS graduate, now a software engineer at Google. I mentor because good habits in SIT102 compound for years. I'll push you to think, not hand you answers.",
    },
  },
  {
    profile_id: "p5",
    unit_code: "SIT120",
    grade: "D",
    rate_per_hour: 35,
    show_experience: false,
    experience: [{ company: "Melbourne startup", role: "Frontend developer", current: true }],
    style: {
      teaching: "Example-driven",
      tone: "Calm and gentle",
      pace: "Moderate",
      help: ["Understanding concepts", "Career advice related to this field"],
      feedback: "Encouraging first, then corrections",
      languages: ["English", "Vietnamese"],
      format: "Online",
    },
    voice: {
      topics: "Responsive CSS, flexbox and building a portfolio from unit work. People struggle with layouts breaking on mobile.",
      explain: "Flexbox is like arranging books on a shelf. The shelf is the container, the books are the items. You tell the shelf: line them up in a row, spread them out evenly, centre them. Let's open your page and try one change at a time so you can see what each rule does.",
      lost: "That's okay, let's make it small. Pick your portfolio page and we'll fix one section a day. Seeing it work on your phone is the best motivation.",
      about: "Linh, Deakin IT graduate, now a frontend developer. SIT120 became my portfolio. I mentor gently and at your pace, in English or Vietnamese.",
    },
  },
  {
    profile_id: "p3",
    unit_code: "SIT191",
    grade: "HD",
    rate_per_hour: 50,
    show_experience: true,
    experience: [{ company: "Canva", role: "Data Analyst", current: true }],
    style: {
      teaching: "Example-driven",
      tone: "Friendly and casual",
      pace: "Slow and thorough",
      help: ["Understanding concepts", "Exam preparation"],
      feedback: "Encouraging first, then corrections",
      languages: ["English", "Hindi"],
      format: "Online",
    },
    voice: {
      topics: "Hypothesis testing, distributions and doing the analysis in Python. Students struggle with p-values and choosing the right test.",
      explain: "A p-value answers one question: if nothing interesting was going on, how surprised should I be by this data? Small p-value = very surprised = maybe something IS going on. Let's try it with a coin you suspect is unfair.",
      lost: "Totally fixable. Let's build a one-page formula sheet together and do one worked example per topic. Stats rewards practice more than reading.",
      about: "Priya, Deakin Data Science graduate, now an analyst at Canva. Redoing every workshop exercise in Python is what made stats click for me.",
    },
  },
  {
    profile_id: "p6",
    unit_code: "ADD105",
    grade: "D",
    rate_per_hour: 35,
    show_experience: true,
    experience: [{ company: "REA Group", role: "UX intern", current: false }],
    style: {
      teaching: "Q&A and discussion",
      tone: "Friendly and casual",
      pace: "Moderate",
      help: ["Understanding concepts", "Reading and research skills"],
      feedback: "Mostly asking questions so you find the answer yourself",
      languages: ["English", "Arabic"],
      format: "Both",
    },
    voice: {
      topics: "Design process, documenting your folio and visual hierarchy. Students struggle to explain why they made a design decision.",
      explain: "Hierarchy is what the eye sees first, second, third. Look at your poster: what did you notice first? Was that what you wanted people to notice? If not, what could you make bigger, bolder or brighter?",
      lost: "Let's talk it through. What does your folio have right now, and what's missing? Usually it's process photos. We can reconstruct a lot from your drafts.",
      about: "Ahmed, third year Design, UX intern at REA last summer. Documenting everything is what got me my grade. I mentor through conversation, not lectures.",
    },
  },
  {
    profile_id: "p2",
    unit_code: "SIT232",
    grade: "HD",
    rate_per_hour: 30,
    show_experience: true,
    experience: [{ company: "Deakin University", role: "SIT102 tutor", current: true }],
    style: {
      teaching: "Step-by-step",
      tone: "Friendly and casual",
      pace: "Moderate",
      help: ["Understanding concepts", "Study planning"],
      feedback: "Encouraging first, then corrections",
      languages: ["English", "Vietnamese"],
      format: "Both",
    },
    voice: {
      topics: "Classes, inheritance and design patterns for the custom program. People struggle to decide which class should own which behaviour.",
      explain: "A class is a blueprint, an object is the house built from it. If you have a Dog class, each actual dog is an object with its own name. Inheritance is saying a Puppy is a Dog, so it gets everything a Dog has, plus extras.",
      lost: "Chill, let's map the custom program first: draw every class as a box, arrows for who talks to who. Once the boxes make sense the code is just filling them in.",
      about: "Duc again, SIT232 was my favourite unit. I built a tiny game engine for the custom program and talked about it in every interview.",
    },
  },
  {
    profile_id: "p3",
    unit_code: "SIT103",
    grade: "HD",
    rate_per_hour: 40,
    availability: "Tue/Thu evenings, online",
    show_experience: true,
    experience: [{ company: "Canva", role: "Data Analyst", current: true }],
    style: {
      teaching: "Example-driven",
      tone: "Friendly and casual",
      pace: "Slow and thorough",
      help: ["Understanding concepts", "Reading and research skills"],
      feedback: "Encouraging first, then corrections",
      languages: ["English", "Hindi"],
      format: "Online",
    },
    voice: {
      topics: "SQL joins, keys and normalising a messy dataset. Students mix up INNER and LEFT joins.",
      explain: "A join is just lining up two spreadsheets on a shared column. INNER join keeps rows that match on both sides. LEFT join keeps every row from the first table and fills blanks on the right. Let's do it with a tiny students-and-enrolments table.",
      lost: "We can get you exam-ready. One join type a night, then a mixed practice sheet. SQL rewards repetition more than rereading slides.",
      about: "Priya again, now mentoring SIT103. Writing every query on paper first is what got me the HD.",
    },
  },
  {
    profile_id: "p4",
    unit_code: "MAA103",
    grade: "D",
    rate_per_hour: 35,
    availability: "Burwood campus, Wed afternoons",
    show_experience: true,
    experience: [{ company: "PwC", role: "Summer vacationer", current: false }],
    style: {
      teaching: "Step-by-step",
      tone: "Direct and to the point",
      pace: "Moderate",
      help: ["Exam preparation", "Study planning"],
      feedback: "Honest and direct",
      languages: ["English"],
      format: "In person",
    },
    voice: {
      topics: "Debits and credits, and how the group assignment is marked. People panic at the adjusting entries.",
      explain: "Every transaction hits two places. Spend cash on supplies: cash goes down, supplies go up. That's it. The names debit and credit just mean left and right on the T-account. We'll do three together.",
      lost: "We build a one-page cheat sheet tonight: journal, ledger, trial balance. Then one past question a day. Structure gets you the grade.",
      about: "James, mentoring MAA103 as well as marketing. I care about a clean exam structure because that's what moved my mark.",
    },
  },
  {
    profile_id: "p5",
    unit_code: "SIT111",
    grade: "D",
    rate_per_hour: 28,
    availability: "Weekends, online",
    show_experience: false,
    experience: [],
    style: {
      teaching: "Q&A and discussion",
      tone: "Calm and gentle",
      pace: "Slow and thorough",
      help: ["Understanding concepts", "Study planning"],
      feedback: "Mostly asking questions so you find the answer yourself",
      languages: ["English", "Vietnamese"],
      format: "Online",
    },
    voice: {
      topics: "Binary, how a CPU runs a program, and the first HTML page. Students trip on number bases.",
      explain: "Binary is just counting with two fingers. 1, 10, 11, 100. Same idea as ones and tens, except the columns are ones, twos, fours, eights. We'll convert your age together.",
      lost: "Let's pick one topic, binary or the webpage, and sit with it for 40 minutes. You don't need the whole unit tonight.",
      about: "Linh, mentoring SIT111 because I remember how abstract week 3 felt. I go slowly and I can switch to Vietnamese.",
    },
  },
].map((m) => ({
  ...m,
  id: `${m.profile_id}-${m.unit_code}`,
  status: "approved",
  email_verified: true,
  transcript_url: null,
  availability: m.availability ?? "Weeknights after 6, online or on campus",
  is_demo: true,
}));

export function mentorId(profileId, unitCode) {
  return `${profileId}-${unitCode}`;
}

// Helpful votes received across an author's posts.
export function reputationFor(profileId, posts) {
  return posts
    .filter((p) => p.author_id === profileId && p.status !== "removed")
    .reduce((sum, p) => sum + (p.helpful_count ?? 0), 0);
}

// Opening message of the AI mentor chat, built from the "about" answer so it
// costs no AI call and always works offline.
export function introMessage(listing, profile, unitName) {
  const first = profile.name.split(" ")[0];
  return `Hi, I'm ${first}'s AI mentor for ${listing.unit_code}${unitName ? ` ${unitName}` : ""}. ${listing.voice.about} Ask me anything to see if my teaching style suits you.`;
}

export function sampleQuestions(listing) {
  return [
    `Can you explain a hard topic in ${listing.unit_code} to me?`,
    "I'm lost and the exam is next week. What should I do?",
    "How would you give me feedback on my work?",
    "What do students usually struggle with?",
  ];
}

// localStorage fallback for applications when the database is unavailable.
const APPS_KEY = "sodu-mentor-apps";

export function readLocalApplications() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(APPS_KEY)) ?? [];
  } catch {
    return [];
  }
}

export function saveLocalApplication(app) {
  const rest = readLocalApplications().filter((a) => a.id !== app.id);
  window.localStorage.setItem(APPS_KEY, JSON.stringify([...rest, app]));
}

// Server listings win over local copies with the same id. Local copies get
// the same decoration the server adds (profile, reputation 0).
export function mergeLocalApplications(listings, { unitCode = null, includePending = false } = {}) {
  const ids = new Set(listings.map((l) => l.id));
  const local = readLocalApplications()
    .filter((a) => !ids.has(a.id))
    .filter((a) => !unitCode || a.unit_code === unitCode)
    .filter((a) => includePending || a.status === "approved")
    .map((a) => ({ ...a, profile: getProfile(a.profile_id), reputation: 0, local: true }))
    .filter((a) => a.profile);
  return [...listings, ...local];
}
