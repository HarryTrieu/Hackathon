import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PersonaProvider } from "@/lib/persona-context";
import { LeftNav, MobileNav } from "@/components/left-nav";
import { RightSidebar } from "@/components/right-sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sodu · study experience feed",
  description:
    "A distraction-free social feed where students and seniors share study experience.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <PersonaProvider>
          <div className="mx-auto flex min-h-svh max-w-6xl">
            <LeftNav />
            <main className="min-w-0 flex-1 border-x">{children}</main>
            <RightSidebar />
          </div>
          <MobileNav />
        </PersonaProvider>
      </body>
    </html>
  );
}
