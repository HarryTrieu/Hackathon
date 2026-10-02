// Who sees moderator tools: the demo Moderator persona, or a real account
// marked as moderator in the database. The server checks the same rule
// (lib/actor.js); this only decides what the UI shows.
export const canModerate = (persona) => persona?.role === "admin" || persona?.moderator === true;
