import type { Metadata } from "next";
import { MonitorApp } from "@/components/monitor/MonitorApp";

export const metadata: Metadata = { title: "AIおみくじ | 裏側モニター" };

export default function Page() {
  return <MonitorApp />;
}
