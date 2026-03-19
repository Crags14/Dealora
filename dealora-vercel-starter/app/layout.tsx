import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dealora",
  description: "Analyze short-term rental deals in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
