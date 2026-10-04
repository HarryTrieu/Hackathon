// Languages a post can be translated into: the most common home languages
// among Deakin's students, plus English.
export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "zh", name: "中文" },
  { code: "hi", name: "हिन्दी" },
  { code: "ne", name: "नेपाली" },
  { code: "si", name: "සිංහල" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ko", name: "한국어" },
  { code: "ja", name: "日本語" },
  { code: "es", name: "Español" },
  { code: "ar", name: "العربية" },
];
export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);
export const languageName = (code) => LANGUAGES.find((l) => l.code === code)?.name ?? code;
// English names for the AI prompt.
export const ENGLISH_NAME = {
  en: "English", vi: "Vietnamese", zh: "Simplified Chinese", hi: "Hindi", ne: "Nepali", si: "Sinhala",
  id: "Indonesian", ko: "Korean", ja: "Japanese", es: "Spanish", ar: "Arabic",
};
