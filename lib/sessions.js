// The session journey after a request, shared by the request form, the API
// and the Requests tab: where to meet, how times read, the first message.
export const PLACES = ["On campus (library)", "Online (Teams)", "Online (Zoom)", "Other"];

export const MAX_DAYS_AHEAD = 60;

// "Thu 8 Oct, 5:00 pm" in Melbourne time, where Deakin is.
export function formatWhen(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-AU", {
    timeZone: "Australia/Melbourne",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// A ready-to-copy first message once a request is accepted.
export function firstMessage({ fromName, toName, unitCode, proposedTime, proposedPlace, fromMentor }) {
  const first = (name) => name?.split(" ")[0] ?? "there";
  const when = formatWhen(proposedTime);
  const plan = [when, proposedPlace].filter(Boolean).join(", ");
  return fromMentor
    ? `Hi ${first(toName)}, it's ${first(fromName)} from Sodu. Happy to help with ${unitCode}${plan ? `. Does ${plan} still work for you?` : ". When suits you?"} Bring the part you're stuck on and we'll go through it together.`
    : `Hi ${first(toName)}, it's ${first(fromName)} from Sodu. Thanks for accepting my ${unitCode} session${plan ? ` (${plan})` : ""}. I'll bring the part I'm stuck on. See you then!`;
}

// Average rating, number of ratings and how many said it helped, for a
// mentor listing. null when nobody has rated yet.
export function ratingSummary(requests) {
  const rated = requests.filter((r) => typeof r.rating === "number");
  if (rated.length === 0) return null;
  const average = rated.reduce((sum, r) => sum + r.rating, 0) / rated.length;
  const helped = rated.filter((r) => r.helped === true).length;
  return {
    average: Math.round(average * 10) / 10,
    count: rated.length,
    helpedPercent: Math.round((helped / rated.length) * 100),
  };
}
