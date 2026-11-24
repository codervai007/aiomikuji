import type { Metadata } from "next";
import { KioskApp } from "@/components/kiosk/KioskApp";

export const metadata: Metadata = { title: "AIおみくじ | キオスク" };

export default function Page() {
  return <KioskApp />;
}
