// Plain-code feed ranking from tag overlap. No AI here by design.

import { getProfile } from "@/lib/seed";

function labelForTag(tag) {
  return tag.replaceAll("-", " ");
}

// Returns [{ post, author, score, reason }] sorted best-first for the persona.
export function rankForYou(posts, persona, followedTags = []) {
  const skills = new Set(persona.skills);
  const goals = new Set(persona.goals);
  const followed = new Set(followedTags);

  const scored = posts.map((post) => {
    const author = getProfile(post.author_id);
    const postTags = [...post.tags, ...post.unit_codes.map((c) => c.toLowerCase())];

    const followHits = post.tags.filter((t) => followed.has(t));
    const goalHits = post.tags.filter((t) => goals.has(t));
    const skillHits = postTags.filter((t) => skills.has(t));
    const courseMatch = author.course === persona.course;
    const unitMatch = post.unit_codes.some((code) =>
      persona.units.some((u) => u.code === code)
    );

    let score = 0;
    score += followHits.length * 4;
    score += goalHits.length * 3;
    score += skillHits.length * 2;
    if (unitMatch) score += 3;
    if (courseMatch) score += 2.5;
    // Mentees see mentor advice first; mentors see mentee questions first.
    if (persona.role === "mentee" && author.role === "mentor") score += 1.5;
    if (persona.role === "mentor" && author.role === "mentee") score += 1.5;
    score += Math.min(post.helpful_count, 60) * 0.02;
    score -= post.hours_ago * 0.005; // slight recency tiebreak

    // Reason mirrors the strongest signal, in the same priority order.
    let reason;
    if (followHits.length > 0) {
      reason = `Because you follow ${labelForTag(followHits[0])}`;
    } else if (goalHits.length > 0) {
      reason = `Because your goal is ${labelForTag(goalHits[0])}`;
    } else if (unitMatch) {
      reason = `Because you're taking ${post.unit_codes[0]}`;
    } else if (skillHits.length > 0) {
      reason = `Because you're interested in ${labelForTag(skillHits[0])}`;
    } else if (courseMatch) {
      reason = persona.year
        ? `Because you're in ${persona.course} year ${persona.year}`
        : `Because you're in ${persona.course}`;
    } else if (persona.role === "mentee" && author.role === "mentor") {
      reason = `From a ${author.course} mentor`;
    } else if (persona.role === "mentor" && author.role === "mentee") {
      reason = "A student you could help";
    } else {
      reason = "Popular with students this week";
    }

    return { post, author, score, reason };
  });

  // Posts with an image or link preview always come first; relevance orders
  // posts within each group.
  const hasMedia = (post) => Boolean(post.image_url || post.link_preview?.url);
  const ranked = scored.sort(
    (a, b) => hasMedia(b.post) - hasMedia(a.post) || b.score - a.score
  );
  return pinSecond(ranked, "s3");
}

// Keep Sarah's NeetCode post in slot 2 so the demo always shows a CS mentor
// thread under the persona's top match.
function pinSecond(ranked, postId) {
  const pinned = ranked.find((row) => row.post.id === postId);
  if (!pinned || ranked.length < 2) return ranked;
  const rest = ranked.filter((row) => row.post.id !== postId);
  return [rest[0], pinned, ...rest.slice(1)];
}

// Hot tab: most Helpful votes first, newer post wins a tie.
export function rankHot(posts) {
  return posts
    .map((post) => ({ post, author: getProfile(post.author_id), reason: null }))
    .sort(
      (a, b) =>
        b.post.helpful_count - a.post.helpful_count ||
        a.post.hours_ago - b.post.hours_ago
    );
}

// New tab: purely most recent first.
export function rankNew(posts) {
  return posts
    .map((post) => ({ post, author: getProfile(post.author_id), reason: null }))
    .sort((a, b) => a.post.hours_ago - b.post.hours_ago);
}

export function trendingTags(posts, limit = 6) {
  const counts = new Map();
  for (const post of posts) {
    for (const tag of [...post.tags, ...post.unit_codes]) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

export function suggestedMentors(profiles, persona, limit = 3) {
  return profiles
    .filter((p) => p.role === "mentor" && p.id !== persona.id)
    .sort((a, b) => {
      const aMatch = a.course === persona.course ? 1 : 0;
      const bMatch = b.course === persona.course ? 1 : 0;
      return bMatch - aMatch;
    })
    .slice(0, limit);
}

export function suggestedStudents(profiles, persona, limit = 4) {
  return profiles
    .filter((p) => p.role === "mentee" && p.id !== persona.id)
    .sort((a, b) => {
      const aMatch = a.course === persona.course ? 1 : 0;
      const bMatch = b.course === persona.course ? 1 : 0;
      return bMatch - aMatch;
    })
    .slice(0, limit);
}
