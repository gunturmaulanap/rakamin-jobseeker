"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      const authCode = searchParams.get("code");
      const email = searchParams.get("email");
      const error = searchParams.get("error");

      if (error) {
        console.error("❌ Auth error:", error);
        router.push(`/login?error=callback_error&message=${encodeURIComponent(error)}`);
        return;
      }

      if (!authCode) {
        console.error("❌ No auth code found");
        router.push("/login?error=no_code&message=No authentication code found");
        return;
      }

      try {
        // Exchange auth code for session immediately
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("❌ Session error:", sessionError);
          if (email) {
            router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
          } else {
            router.push("/login?error=session_error");
          }
          return;
        }

        if (!session) {
          if (email) {
            router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
          } else {
            router.push("/login?error=no_session");
          }
          return;
        }

        // Check if email is confirmed
        if (!session.user.email_confirmed_at) {
          if (session.user.email) {
            router.push(`/auth/verify-email?email=${encodeURIComponent(session.user.email)}`);
          } else {
            router.push("/auth/verify-email");
          }
          return;
        }

        // Create or update user in database

        const { data: userData, error: userError } = await supabase
          .from("users")
          .upsert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || null,
            role: "candidate",
            email_confirmed_at: session.user.email_confirmed_at,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
          .select()
          .single();

        if (userError) {
          console.error("❌ Database error:", userError);
          router.push(`/login?error=db_error&message=${encodeURIComponent(userError.message)}`);
          return;
        }

        // Update Zustand store
        setUser({
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
        });

        // Redirect based on role
        const redirectPath = userData.role === "admin" ? "/admin/jobs" : "/candidate";
        router.push(redirectPath);

      } catch (error) {
        console.error("❌ Callback error:", error);
        router.push(`/login?error=callback_failed&message=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        )}`);
      }
    };

    handleCallback();
  }, [router, searchParams, setUser]);

  // Add timeout to prevent indefinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      const email = searchParams.get("email");
      if (email) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        router.push("/login?error=timeout");
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing authentication...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we verify your account</p>
      </div>
    </div>
  );
}

export default function SupabaseCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}