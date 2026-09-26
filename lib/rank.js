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

  return scored.sort((a, b) => b.score - a.score);
}

// Hot tab: helpful count with a recency gravity so old hits sink over time.
export function rankHot(posts) {
  const heat = (p) => (p.helpful_count + 1) / Math.pow(p.hours_ago + 2, 1.2);
  return posts
    .map((post) => ({ post, author: getProfile(post.author_id), reason: null }))
    .sort((a, b) => heat(b.post) - heat(a.post));
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
