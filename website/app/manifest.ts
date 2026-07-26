import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Augorithm — Visual Algorithm Editor",
    short_name: "Augorithm",
    description: "Build, run, and export executable flowcharts from pseudocode.",
    start_url: "/editor",
    display: "standalone",
    background_color: "#f4f7fb",
    theme_color: "#09294f",
    orientation: "any",
    icons: [
      { src: "/augorithm-icon.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
      { src: "/augorithm-icon.png", sizes: "1024x1024", type: "image/png", purpose: "maskable" },
    ],
  };
}
