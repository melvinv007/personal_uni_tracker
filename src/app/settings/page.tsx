/**
 * Settings Page — Server Component
 *
 * Purpose: Settings and data management page.
 * Contains data export, notification preferences, and account info.
 *
 * Reference: PRD Section 23 (Data Export)
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsContent from "@/components/settings/settings-content";

export default async function SettingsPage() {
  /* Auth check — redirect to login if not authenticated */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <SettingsContent user={{ email: user.email || "", id: user.id }} />;
}
