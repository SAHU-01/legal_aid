"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import type { Role } from "@/lib/demoData";

export function useRole() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const raw = searchParams.get("role");
  const role: Role =
    raw === "applicant" || raw === "lawyer" || raw === "operator"
      ? raw
      : "lawyer";

  const setRole = useCallback(
    (r: Role) => {
      router.replace(`/dashboard?role=${r}`, { scroll: false });
    },
    [router],
  );

  return { role, setRole };
}
