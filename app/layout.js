import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PersonaProvider } from "@/lib/persona-context";
import { LeftNav, MobileNav } from "@/components/left-nav";
import { RightSidebar } from "@/components/right-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const THEME_BOOT =
  '(function(){try{var t=localStorage.getItem("sodu-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})();';

export const metadata = {
  title: "Sodu · study experience feed",
  description:
    "A distraction-free social feed where students and seniors share study experience.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="min-h-full">
        <PersonaProvider>
          <div className="mx-auto flex min-h-svh max-w-6xl">
            <LeftNav />
            <main className="min-w-0 flex-1 border-x">{children}</main>
            <RightSidebar />
          </div>
          <ThemeToggle
            compact
            className="fixed top-3 right-3 z-20 border bg-background/90 shadow-sm backdrop-blur md:hidden"
          />
          <MobileNav />
        </PersonaProvider>
      </body>
    </html>
  );
}
