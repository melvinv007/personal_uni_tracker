/**
 * Class Detail Page — Server Component
 *
 * Page: /semester/[id]/class/[classId]
 * Auth: Redirects to login if unauthenticated.
 * Renders ClassContent client component with class ID.
 *
 * Reference: PRD Section 11 (Class Detail Page)
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClassContent from "@/components/class/class-content";

interface ClassPageProps {
  params: Promise<{ id: string; classId: string }>;
}

export default async function ClassPage({ params }: ClassPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id: semesterId, classId } = await params;

  return <ClassContent classId={classId} semesterId={semesterId} />;
}
