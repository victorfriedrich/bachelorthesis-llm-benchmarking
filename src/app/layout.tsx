import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const title = "Testing an LLM judge when the human labels are biased · Victor Friedrich";
const description =
  "38% of hostel reviewers give every aspect the same score. A bachelor's thesis that tests LLM judges like measuring instruments, and finds that the output schema itself biases their scores.";

export const metadata: Metadata = {
  // absolute base for the preview image; set SITE_URL to the deployed address
  metadataBase: new URL(process.env.SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")),
  title,
  description,
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
