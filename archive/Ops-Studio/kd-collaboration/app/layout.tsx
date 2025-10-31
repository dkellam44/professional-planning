import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creating Spaciousness Through Structure — David Kellam",
  description: "KD Collaboration Pitch",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
