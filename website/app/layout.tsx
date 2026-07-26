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
      "See your logic take shape. Turn pseudocode into living flowcharts, trace every step, and generate Java, Python, JavaScript, and Swift.",
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
      title: "Augorithm — See your logic take shape.",
      description:
        "From idea to flowchart in 3D. Write pseudocode, run your logic, and generate real source code.",
      siteName: "Augorithm",
      images: [{ url: `${origin}/og.png`, width: 1731, height: 909, alt: "A luminous 3D Augorithm flowchart" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Augorithm — See your logic take shape.",
      description:
        "The immersive visual algorithm workspace for web, macOS, Windows, and iPad.",
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
