import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Augorithm — Think it. Chart it. Run it.",
      template: "%s · Augorithm",
    },
    description:
      "Stop losing study time to disconnected arrows and strict syntax. Turn classroom pseudocode into clear, executable flowcharts on web, Mac, Windows, and iPad.",
    keywords: [
      "Augorithm",
      "flowchart",
      "pseudocode",
      "programming education",
      "Flowgorithm for Mac",
      "algorithm visualizer",
    ],
    authors: [{ name: "Kaung Khant Ko" }],
    creator: "Kaung Khant Ko",
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
      apple: "/augorithm-icon.png",
    },
    openGraph: {
      type: "website",
      url: origin,
      title: "Augorithm — Your algorithm makes sense. Your flowchart should too.",
      description:
        "Write student-friendly pseudocode, build a clean flowchart, run it, and export work that is ready to submit.",
      siteName: "Augorithm",
      images: [{ url: `${origin}/og.png`, width: 1726, height: 911, alt: "Augorithm turns student pseudocode into a clean executable flowchart" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Augorithm — Your flowchart should explain your logic.",
      description:
        "Pseudocode, flowcharts, execution, and source code in one student-friendly workspace.",
      images: [`${origin}/og.png`],
    },
  };
}

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
