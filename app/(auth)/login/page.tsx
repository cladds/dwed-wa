"use client";

import { Suspense } from "react";
import { signInWithDiscord } from "@/lib/auth";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="font-heading text-2xl text-gold mb-4 tracking-wide">
        CMDR Designation Required
      </h1>
      <p className="font-body text-text-mid text-sm mb-8 max-w-md text-center">
        Authenticate via Discord to access The Dark Wheel Archives.
        All operatives must verify their CMDR designation.
      </p>

      {error && (
        <p className="font-system text-status-danger text-xs mb-4">
          {"// authentication failed -- please try again"}
        </p>
      )}

      <button
        onClick={() => signInWithDiscord()}
        className="font-ui text-xs tracking-[0.2em] uppercase border border-gold text-gold px-6 py-3 hover:bg-gold hover:text-bg-deep transition-colors cursor-pointer"
      >
        Connect Discord
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
