import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creating Spaciousness Through Structure",
  description: "Operations Support for KamalaDevi Creative",
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
