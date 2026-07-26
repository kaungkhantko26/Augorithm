import type { Metadata } from "next";
import { EditorWorkspace } from "./editor-workspace";
import "./editor.css";

export const metadata: Metadata = {
  title: "Web Editor",
  description: "Build, run, and export executable flowcharts in the Augorithm web editor.",
};

export default function EditorPage() {
  return <EditorWorkspace />;
}
