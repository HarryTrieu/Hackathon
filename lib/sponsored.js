// Sponsored posts: employer opportunities shown in the feed. All but the
// first are made-up demo advertisers, so no real brand appears to endorse
// Sodu; the first is a real post (real: true) and links to it (url).
// pinned: shown to everyone, at the very top of the feed.
// Targeting uses only the units, course and goals on the viewer's profile.
// No browsing history, posts or chats, and advertisers only get totals.

export const SPONSORED = [
  {
    id: "sponsored-posts-mentorme-futura",
    advertiser: "MentorME",
    real: true,
    pinned: true,
    url: "https://www.facebook.com/helloMentorME/posts/1081543644398148",
    headline: "Futura Remix: Australia's first national, multi-stage AI vibecoding hackathon",
    body: "Learn, build, pitch: build a portfolio that proves it. Teams of 4 to 5 (vibe coder, business analyst, data analyst and a business lead) understand and define a problem on day 1, build and iterate on day 2, then refine and showcase on day 3.",
    details: ["Online, Brisbane, Canberra, Sydney, Melbourne", "National final · 2 Oct, Sydney", "Teams of 4 to 5 · from $5"],
    cta: "See the post",
    image: "/sponsored/mentorme-futura.webp",
    imageAlt: "Futura Remix Australia National Hackathon poster: timeline of state rounds from August to the national final on 2 October in Sydney",
    poster: true,
    units: [],
    goals: [],
    courses: [],
  },
  {
    id: "sponsored-posts-northline",
    advertiser: "Northline Analytics",
    headline: "Summer data analyst internship (paid)",
    body: "A 12-week paid internship from November to February. You'll clean real retail data in SQL and Python and present what you find to a client team. Open to 2nd and 3rd year Data Science, IT and Business Analytics students.",
    details: ["Melbourne CBD · Hybrid", "Paid · 12 weeks", "Apply by 31 Oct"],
    cta: "View internship",
    image: "/sponsored/northline.webp",
    imageAlt: "Two students looking at a chart on a laptop in a bright office",
    units: ["SIT103", "SIT191", "MIS171"],
    goals: ["analyst-internship", "kaggle"],
    courses: ["Data Science"],
  },
  {
    id: "sponsored-posts-brightpath",
    advertiser: "Brightpath Consulting",
    headline: "Free case interview workshop for 1st and 2nd years",
    body: "Two hands-on hours on how consultants break down a business problem, with a live mock case and feedback from our analysts. No experience needed.",
    details: ["Burwood campus", "Free · 2 hours", "Thu 22 Oct, 5pm"],
    cta: "Save a spot",
    image: "/sponsored/brightpath.webp",
    imageAlt: "A consultant guiding a group of students around a table covered in sticky notes",
    units: ["MMK101", "MAA103"],
    goals: ["consulting"],
    courses: ["Business"],
  },
  {
    id: "sponsored-posts-stackwise",
    advertiser: "Stackwise",
    headline: "Junior web developer internship (React)",
    body: "Build real features with a small product team and pair with a senior engineer every day. One deployed project with a clear README matters more to us than your marks.",
    details: ["Geelong · Hybrid", "Paid · 2 days a week", "Rolling applications"],
    cta: "View internship",
    image: "/sponsored/stackwise.webp",
    imageAlt: "A student and a senior engineer pair programming at a standing desk",
    units: ["SIT120", "SIT102"],
    goals: ["web-development", "internship", "portfolio"],
    courses: ["IT", "CS"],
  },
  {
    id: "sponsored-posts-kookaburra",
    advertiser: "Kookaburra Labs",
    headline: "Student game jam: build a game in 48 hours",
    body: "Teams of 2 to 4, developers from our studio on the floor all weekend, and a paid summer placement for the winning team.",
    details: ["Docklands", "Free entry", "7 to 8 Nov"],
    cta: "Register a team",
    image: "/sponsored/kookaburra.webp",
    imageAlt: "Four students laughing around laptops and a game controller at night",
    units: ["SIT102"],
    goals: ["game-development"],
    courses: ["CS", "IT"],
  },
  {
    id: "sponsored-posts-harbour",
    advertiser: "Harbour & Co",
    headline: "Marketing intern: social media and content",
    body: "Help a Melbourne agency plan and film content for cafe and retail clients. You'll finish with a portfolio of real campaigns.",
    details: ["Richmond", "Paid · 1 day a week", "Starts February"],
    cta: "View role",
    image: "/sponsored/harbour.webp",
    imageAlt: "A student filming a barista serving a latte with a phone on a gimbal",
    units: ["MMK101"],
    goals: ["ui-design"],
    courses: ["Business", "Design"],
  },
  {
    id: "sponsored-posts-sentinel",
    advertiser: "Sentinel Cyber",
    headline: "Capture the flag night for beginners",
    body: "Your first CTF, with hints on tap and security engineers walking the room. Laptops provided if you need one.",
    details: ["Burwood campus", "Free · 3 hours", "Tue 20 Oct, 6pm"],
    cta: "Save a spot",
    image: "/sponsored/sentinel.webp",
    imageAlt: "A security engineer helping students working on laptops in an evening workshop",
    units: [],
    goals: ["cybersecurity", "certifications"],
    courses: ["IT", "CS"],
  },
  {
    id: "sponsored-posts-aurora",
    advertiser: "Aurora Careers Expo",
    headline: "Careers expo: 40 employers hiring students and graduates",
    body: "Internships, graduate programs and part-time roles across tech, business and health. Bring your resume: free resume checks at the door.",
    details: ["Melbourne Convention Centre", "Free", "Wed 14 Oct"],
    cta: "Get a free ticket",
    image: "/sponsored/aurora.webp",
    imageAlt: "Students with resumes talking to recruiters at booths in a large expo hall",
    units: [],
    goals: [],
    courses: [],
  },
];

export const SPONSORED_IDS = SPONSORED.map((ad) => ad.id);

export const MATCH_KINDS = ["unit", "goal", "course", "general"];

const MAX_ADS_PER_FEED = 3;
const FIRST_AD_AFTER = 3;
const POSTS_BETWEEN_ADS = 8;

function readable(slug) {
  return slug.replaceAll("-", " ");
}

// Best single reason this viewer sees an ad, strongest signal first.
function matchFor(ad, persona) {
  const unit = (persona.units ?? []).find((u) => ad.units.includes(u.code));
  if (unit) return { match: "unit", score: 3, reason: `You're taking ${unit.code}.` };
  const goal = (persona.goals ?? []).find((g) => ad.goals.includes(g));
  if (goal) return { match: "goal", score: 2, reason: `Your profile lists ${readable(goal)} as a goal.` };
  if (persona.course && ad.courses.includes(persona.course)) {
    return { match: "course", score: 1, reason: `You study ${persona.course}.` };
  }
  return { match: "general", score: 0, reason: "It's shown to every student, not matched to you." };
}

function untargeted(ad) {
  return ad.units.length === 0 && ad.goals.length === 0 && ad.courses.length === 0;
}

// Ads for this viewer, most relevant first, without the ones they hid. Ads
// aimed at other students never fill gaps, so "shown to every student" stays true.
export function sponsoredFor(persona, hiddenIds = []) {
  const hidden = new Set(hiddenIds);
  return SPONSORED.filter((ad) => !hidden.has(ad.id))
    .map((ad, i) => ({ ad, i, ...matchFor(ad, persona) }))
    .filter((entry) => entry.score > 0 || untargeted(entry.ad))
    .sort((a, b) => Boolean(b.ad.pinned) - Boolean(a.ad.pinned) || b.score - a.score || a.i - b.i)
    .slice(0, MAX_ADS_PER_FEED)
    .map(({ ad, match, reason }) => ({ ad, match, reason }));
}

// Mixes ads into a ranked feed: a pinned ad first of all, the others after
// a few posts, then spaced out.
// Ad items look like { sponsored: { ad, match, reason } }.
export function withSponsored(items, ads) {
  const out = [];
  if (ads[0]?.ad.pinned && items.length > 0) {
    out.push({ sponsored: ads[0] });
    ads = ads.slice(1);
  }
  let next = 0;
  items.forEach((item, index) => {
    out.push(item);
    const position = index + 1;
    const due = position === FIRST_AD_AFTER + next * POSTS_BETWEEN_ADS;
    if (due && next < ads.length) {
      out.push({ sponsored: ads[next] });
      next += 1;
    }
  });
  return out;
}
