import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Social Media AI Agent Team",
  description: "Generate posts for your social media",
};

function Header() {
  return (
    <header
      style={{
        position: "absolute",
        display: "flex",
        justifyContent: "space-between",
        padding: 10,
        width: "100%",
      }}
    >
      <div className="block md:flex items-end gap-3">
        <span className="author">
          Built by{" "}
          <a href="https://www.codebender.ai/" target="_blank">
            The Codebender
          </a>
        </span>
      </div>
      <div className="flex space-x-6 justify-center items-center">
        <SignedIn>
          <Link href="/" className=" hover:text-primary transition-colors">
            Agent
          </Link>
          <Link href="/saved" className=" hover:text-primary transition-colors">
            Saved
          </Link>
          <UserButton appearance={{ baseTheme: dark }} afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-primary-foreground border border-white hover:bg-primary hover:border-primary py-2 px-4 rounded-3xl transition duration-300 ease-in-out">
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en">
        <body>
          <Header />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
