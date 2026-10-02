import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { unstable_rethrow } from "next/navigation";
import "./globals.css";

import { AppShell } from "@/client/components/AppShell";
import { usersDao } from "@/server/database/dao";
import { getCurrentUser } from "@/server/lib/currentUser";
import type { CurrentUser, SwitcherAccount } from "@/server/models/domain";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project It",
  description:
    "See what candidates can do, not just what their resumes say.",
};

/** Never let a missing .env.local or DB hiccup take down every page. */
async function loadShellData(): Promise<{
  current: CurrentUser | null;
  accounts: SwitcherAccount[];
}> {
  try {
    const [current, accounts] = await Promise.all([
      getCurrentUser(),
      usersDao.listForSwitcher(),
    ]);
    return { current, accounts };
  } catch (err) {
    unstable_rethrow(err); // let Next's own signals (e.g. dynamic rendering) through
    console.error("Role switcher unavailable:", err);
    return { current: null, accounts: [] };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { current, accounts } = await loadShellData();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
        <AppShell current={current} accounts={accounts}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
