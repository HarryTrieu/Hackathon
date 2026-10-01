// Choices on the /welcome form, shared by the page and the server check.
// Courses and goals match what the seeded profiles use, so ranking works
// the same for real accounts.
export const COURSES = ["CS", "IT", "Data Science", "Business", "Design"];

export const YEARS = [1, 2, 3, 4];

export const GOALS = [
  "internship",
  "analyst-internship",
  "web-development",
  "game-development",
  "ui-design",
  "portfolio",
  "consulting",
  "exchange",
  "kaggle",
  "cybersecurity",
  "certifications",
];

export const MAX_UNITS = 8;
export const MAX_GOALS = 5;

export const goalLabel = (goal) => goal.replaceAll("-", " ");
