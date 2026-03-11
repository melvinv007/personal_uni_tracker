/**
 * Home Page - Server Component
 *
 * Page: / (root)
 * Layout: Desktop = 2/3 left (content) + 1/3 right (day view calendar)
 *         Mobile = stacked (calendar hidden, accessible via scroll)
 *
 * Reference: PRD Section 9 (Home Page)
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HomeContent from "@/components/home/home-content";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <HomeContent />;
}
