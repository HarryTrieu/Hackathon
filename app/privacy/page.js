import { ShieldCheck } from "lucide-react";
import { BackButton } from "@/components/back-button";

export const metadata = { title: "Privacy · Sodu" };

// Plain-language privacy page (also the link on Google's sign-in screen and
// the /welcome consent line). Keep it true: update it when the AI tier,
// hosting or data handling changes.
const SECTIONS = [
  {
    title: "What we keep",
    items: [
      "From Google sign-in: your name, email address and profile picture. We never see your Google password.",
      "What you tell us at setup: course, year, units and goals, plus any profile links or resources you add.",
      "What you create: posts, replies, helpful votes, saved posts, follows, messages, session requests, ratings and mentor applications.",
      "For mentors: your teaching answers, price and a yes/no flag that your Deakin email was checked. Never your transcript file or exact grade.",
    ],
  },
  {
    title: "Who can see what",
    items: [
      "Posts, replies, your profile, links and resources are visible to other Sodu users.",
      "Messages and session chats are private between the two people in them. Moderators only see a conversation if one of you reports it.",
      "Moderators (the Sodu team) see reported content, AI-flagged posts and mentor applications, so a person always makes the decision.",
      "We don't sell your data and there are no third-party trackers. Sponsored posts are shown by Sodu itself; advertisers only get view and click totals.",
    ],
  },
  {
    title: "How AI is used",
    items: [
      "When you post, an AI model (Google Gemini) reads the post to add tags and a summary, and to flag posts that may break the community rules. It never removes anything: a moderator decides.",
      "The AI mentor preview, mentor matching, study plans and translation send what you type (and the post or mentor answers involved) to Gemini. Your name, email and profile are not sent.",
      "No AI reads your private messages or session chats.",
      "During this beta we use Gemini's free tier, where Google may use what is sent to improve its products. Please don't put personal details in AI chats or posts. Before a university pilot we move to a paid tier, which doesn't use your data that way.",
    ],
  },
  {
    title: "Where it is stored",
    items: [
      "The app runs on Vercel in its Sydney region; the database and sign-in are run by Supabase. Access to the database only goes through our server, which checks who you are.",
      "Images you upload are stored with Cloudinary.",
    ],
  },
  {
    title: "Your choices",
    items: [
      "Edit your details at any time from the account menu (Edit details).",
      "Delete your account from the same page: your personal details and Google sign-in are removed, and your posts and messages stay but show as \"Deleted user\".",
      "Report anything that worries you with the Report button on any post, profile or chat.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="pb-16 md:pb-8">
      <div className="sticky top-0 z-10 border-b bg-background px-4 py-3 md:bg-background/95 md:backdrop-blur">
        <BackButton className="-ml-2 mb-1" />
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <ShieldCheck className="size-5 text-primary" />
          Privacy
        </h1>
        <p className="text-sm text-muted-foreground">What Sodu keeps, who sees it, and how AI is used. In plain language.</p>
      </div>
      <div className="space-y-6 px-4 py-5 text-sm leading-relaxed">
        {SECTIONS.map((s) => (
          <section key={s.title} className="space-y-2">
            <h2 className="text-base font-semibold">{s.title}</h2>
            <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
              {s.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-muted-foreground">
          Sodu is a student project in beta for Deakin University students. Questions or a data request? Use
          the Report button on any page and the Sodu team will get back to you. Last updated 4 October 2026.
        </p>
      </div>
    </div>
  );
}
