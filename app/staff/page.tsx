import type { Metadata } from "next";
import { StaffApp } from "@/components/staff/StaffApp";

export const metadata: Metadata = { title: "AIおみくじ | スタッフ設定", robots: { index: false } };

export default function Page() {
  return <StaffApp />;
}
