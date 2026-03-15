"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface UserMenuProps {
  userId: string;
  email: string;
}

/**
 * UserMenu — fixed top-right avatar with account actions.
 */
export function UserMenu({ userId, email }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleLogOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="h-9 w-9 overflow-hidden rounded-full border border-white/10 transition-colors hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-label="User menu"
      >
      {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt="User avatar"
          width={36}
          height={36}
          className="h-full w-full bg-neutral-800 object-cover"
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-neutral-950 shadow-xl">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-xs text-neutral-400">{email}</p>
          </div>
          <button
            onClick={handleLogOut}
            className="w-full px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/5"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
