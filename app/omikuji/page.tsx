import type { Metadata } from "next";
import { KioskApp } from "@/components/kiosk/KioskApp";

export const metadata: Metadata = { title: "AIおみくじ | おみくじ画面" };

export default function Page() {
  return <KioskApp />;
}
