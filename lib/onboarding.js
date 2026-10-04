// Choices on the /welcome form, shared by the page and the server check.
// The first five match the seeded profiles (ranking uses them); the rest
// make sure no Deakin student is blocked from finishing setup.
export const COURSES = [
  "CS",
  "IT",
  "Data Science",
  "Business",
  "Design",
  "Engineering",
  "Science",
  "Health & Nursing",
  "Law",
  "Arts & Education",
  "Other",
];

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
