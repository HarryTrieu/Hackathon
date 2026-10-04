// Permission checks against a running Sodu (default http://localhost:3107,
// or SODU_URL). Every private action is tried by someone who shouldn't be
// allowed: a stranger posing as a real account, a demo student trying
// moderator actions, and the wrong person acting on someone else's things.
// Every one must be refused. Refusals never change data; the "wrong person"
// checks target rows the server filters by owner, so a pass changes nothing.
import { test } from "node:test";
import assert from "node:assert/strict";

const BASE = (process.env.SODU_URL ?? "http://localhost:3107").replace(/\/$/, "");
// A real-account id nobody is signed in as (the shape of a Google account).
const U = "u-00000000-0000-4000-8000-000000000000";
const FAKE_UUID = "00000000-0000-4000-8000-000000000000";

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.status;
}

const up = await fetch(BASE + "/api/posts").then((r) => r.ok, () => false);
const check = (name, method, path, body, expected) =>
  test(name, { skip: !up && `Sodu isn't running at ${BASE}` }, async () => {
    const status = await call(method, path, body);
    assert.ok([expected].flat().includes(status), `${method} ${path} returned ${status}, expected ${expected}`);
  });

// ---- A stranger (not signed in) posing as a real Google account: 401 ----
const STRANGER = [
  ["read their notifications", "GET", `/api/notifications?profile_id=${U}`],
  ["read their messages", "GET", `/api/messages?profile_id=${U}`],
  ["send a message as them", "POST", "/api/messages", { profile_id: U, to_id: "p1", text: "hi" }],
  ["read their session rooms", "GET", `/api/session-chat?profile_id=${U}`],
  ["read their saved posts", "GET", `/api/saved?profile_id=${U}`],
  ["post as them", "POST", "/api/posts", { author_id: U, text: "test post" }],
  ["reply as them", "POST", "/api/replies", { post_id: "s1", author_id: U, text: "test reply" }],
  ["read their unit memberships", "GET", `/api/membership?profile_id=${U}`],
  ["book a session as them", "POST", "/api/session-request", { listing_id: "p1-SIT102", mentee_id: U, message: "hello there" }],
  ["read their study plans", "GET", `/api/study-plan?profile_id=${U}&unit=SIT102`],
  ["listen to their live updates", "GET", `/api/realtime?profile_id=${U}`],
  ["open their mentor hub", "GET", `/api/mentor-hub?profile_id=${U}`],
  ["read their Helpful votes", "GET", `/api/helpful?profile_id=${U}`],
  ["follow someone as them", "POST", "/api/follows", { follower_id: U, followee_id: "p1", follow: true }],
  ["edit an account without signing in", "POST", "/api/me", { name: "x" }],
  ["delete an account without signing in", "DELETE", "/api/me"],
  ["reset the demo database", "POST", "/api/demo/reset"],
];
for (const [what, method, path, body] of STRANGER) check(`stranger can't ${what}`, method, path, body, 401);

// ---- A demo student trying moderator actions: 403 ----
const STUDENT = [
  ["see reports", "GET", "/api/reports?moderator_id=p9"],
  ["see the review queue count", "GET", "/api/review/count?moderator_id=p9"],
  ["remove a post", "POST", "/api/review", { post_id: "s1", action: "remove", moderator_id: "p9" }],
  ["approve their own mentor application", "POST", "/api/mentors/review", { id: "p9-SIT102", action: "approve", moderator_id: "p9" }],
  ["resolve a report", "POST", "/api/reports", { action: "resolve", id: "x", moderator_id: "p9" }],
  ["claim moderator as an unsigned real account", "GET", `/api/reports?moderator_id=${U}`],
  ["edit a demo profile's links", "POST", "/api/profile-links", { profile_id: "p9", links: ["https://github.com/x"] }],
];
for (const [what, method, path, body] of STUDENT) check(`student can't ${what}`, method, path, body, 403);

// ---- The wrong person acting on someone else's things ----
check("can't delete someone else's post", "DELETE", "/api/posts", { id: "s1", author_id: "p9" }, 403);
check("can't edit someone else's post tags", "PATCH", "/api/posts", { id: "s1", author_id: "p9", tags: ["hacked"] }, 403);
check("can't delete someone else's reply", "DELETE", "/api/replies", { id: FAKE_UUID, author_id: "p9" }, 403);
check("can't delete someone else's message", "POST", "/api/messages", { profile_id: "p9", message_id: FAKE_UUID, action: "delete" }, 404);
check("unknown ids are rejected", "GET", "/api/notifications?profile_id=hacker", null, 400);

// A real session between two other people, found as its own mentor.
async function someoneElsesSession() {
  for (const mentor of ["p1", "p2", "p3", "p5", "p13"]) {
    const res = await fetch(`${BASE}/api/session-request?mentor_id=${mentor}`);
    if (!res.ok) continue;
    const data = await res.json();
    const s = (data.requests ?? []).find((r) => r.mentee_id !== "p12" && r.mentor_id !== "p12");
    if (s) return s;
  }
  return null;
}
const session = up ? await someoneElsesSession() : null;
const sessionCheck = (name, method, path, body, expected) =>
  test(name, { skip: (!up && "Sodu isn't running") || (!session && "no session to test against") }, async () => {
    const status = await call(method, path, typeof body === "function" ? body(session) : body);
    assert.equal(status, expected);
  });
sessionCheck("can't read someone else's session room", "GET", session ? `/api/session-chat?profile_id=p12&id=${session.id}` : "", null, 404);
sessionCheck("can't write in someone else's session room", "POST", "/api/session-chat", (s) => ({ profile_id: "p12", session_id: s.id, text: "hi" }), 404);
sessionCheck("can't end someone else's session", "PATCH", "/api/session-request", (s) => ({ action: "end", id: s.id, mentee_id: "p12", rating: 5, helped: true }), 409);
sessionCheck("can't accept a request sent to another mentor", "PATCH", "/api/session-request", (s) => ({ action: "accept", id: s.id, mentor_id: "p12" }), 409);

// ---- The server won't fetch private addresses for link previews: 400 ----
for (const url of ["http://169.254.169.254/latest/meta-data", "http://localhost:3107/api/posts", "http://10.0.0.1/", "file:///etc/passwd"]) {
  check(`link preview refuses ${url}`, "GET", `/api/link-preview?url=${encodeURIComponent(url)}`, null, 400);
}
