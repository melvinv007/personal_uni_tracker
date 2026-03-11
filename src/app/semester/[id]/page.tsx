/**
 * Semester Detail Page — Server Component
 *
 * Page: /semester/[id]
 * Auth: Redirects to login if unauthenticated.
 * Renders SemesterContent client component with semester ID.
 *
 * Reference: PRD Section 10 (Semester Page)
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SemesterContent from "@/components/semester/semester-content";

interface SemesterPageProps {
  params: Promise<{ id: string }>;
}

export default async function SemesterPage({ params }: SemesterPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;

  return <SemesterContent semesterId={id} />;
}
