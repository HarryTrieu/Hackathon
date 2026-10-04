// Interest communities: life outside units (hobbies, student life). A post
// belongs to an interest when it carries one of the interest's tags; the AI
// tagger knows these tags (lib/enrich.js), and posting from an interest page
// adds its main tag.
export const INTERESTS = [
  { slug: "gaming", name: "Gaming", emoji: "🎮", blurb: "Game nights, game dev side projects and esports.", tags: ["gaming", "esports", "game-development"] },
  { slug: "photography", name: "Photography", emoji: "📷", blurb: "Campus shots, editing tips and photo walks.", tags: ["photography"] },
  { slug: "fitness", name: "Fitness & sport", emoji: "🏃", blurb: "Gym buddies, running groups and Deakin sport.", tags: ["fitness", "gym", "running", "sport"] },
  { slug: "cooking", name: "Cooking on a budget", emoji: "🍳", blurb: "Cheap meals, meal prep and recipes from home.", tags: ["cooking", "food", "recipes"] },
  { slug: "music", name: "Music", emoji: "🎸", blurb: "Jams, gigs around Melbourne and what you're listening to.", tags: ["music"] },
  { slug: "startups", name: "Startups & side projects", emoji: "🚀", blurb: "Hackathons, side hustles and building things.", tags: ["startups", "side-projects", "hackathons"] },
  { slug: "international", name: "International students", emoji: "🌏", blurb: "Settling in, visas, part-time work and finding home food.", tags: ["international-students", "visa", "part-time-work"] },
  { slug: "volunteering", name: "Volunteering", emoji: "🤝", blurb: "Giving back and volunteering that also builds your CV.", tags: ["volunteering"] },
  { slug: "anime", name: "Anime & manga", emoji: "🌸", blurb: "What you're watching, reading and drawing.", tags: ["anime", "manga"] },
];

export const INTEREST_SLUGS = INTERESTS.map((i) => i.slug);
export const getInterest = (slug) => INTERESTS.find((i) => i.slug === slug) ?? null;

// Every tag the AI may use to file a post into an interest.
export const INTEREST_TAGS = [...new Set(INTERESTS.flatMap((i) => i.tags))];

export const postsForInterest = (interest, posts) =>
  posts.filter((p) => p.status !== "removed" && p.tags?.some((t) => interest.tags.includes(t)));
