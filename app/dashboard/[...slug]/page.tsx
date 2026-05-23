import { notFound } from "next/navigation";
import DashboardToolPageClient from "./tool-page-client";

const validToolPageKeys = [
  "billing",
  "orders",
  "report-service",
  "settings",
  "profile",
  "activity-logs",
  "discord",
  "plan",
  "notifications",
  "extensions/guard",
  // "extensions/main" — ditangani oleh app/dashboard/extensions/main/page.tsx
];

export default async function DashboardToolPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugKey = slug.join("/");
  if (!validToolPageKeys.includes(slugKey)) notFound();

  return <DashboardToolPageClient slugKey={slugKey} />;
}
