import type { Metadata } from "next";
import { ResultView } from "@/components/ResultView";

export const metadata: Metadata = { title: "あなたのおみくじ | AIおみくじ" };

export default function ResultPage() {
  return <ResultView />;
}
