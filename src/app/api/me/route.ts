/**
 * Current User API — GET profile row from public.users
 *
 * GET /api/me — Returns the authenticated user's row from public.users.
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRow = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return NextResponse.json({ user: userRow[0] ?? null });
}
