import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Club",
  description: "Our book club app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: "var(--background)" }}>
        {children}
      </body>
    </html>
  );
}
