"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores";
import type { User } from "@/stores/authStore";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState<string>("");
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Get email from URL first
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get("email");

    if (emailParam) {
      setEmail(emailParam);
    } else {
      // Fallback: Get email from localStorage (set during registration/login)
      const storedEmail = localStorage.getItem("pending_verification_email");
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, []);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuthState = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.email_confirmed_at) {
        await handleSuccess(session);
      } else {
        setIsCheckingAuth(false);
      }
    };

    checkAuthState();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
        setIsCheckingAuth(false);
        await handleSuccess(session);
      } else if (
        event === "TOKEN_REFRESHED" &&
        session?.user?.email_confirmed_at
      ) {
        setIsCheckingAuth(false);
        await handleSuccess(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSuccess = async (session: any) => {
    try {
      console.log(
        "Handling successful authentication for:",
        session.user.email
      );

      // Determine role based on email patterns (same logic as auth store)
      const isAdminEmail =
        session.user.email?.includes("admin") ||
        session.user.email?.includes("recruitment") ||
        session.user.email?.endsWith("@rakamin.com");

      const userRole = isAdminEmail ? "admin" : "candidate";

      // Create user data using same logic as auth store
      const userData: User = {
        id: session.user.id,
        email: session.user.email || "",
        full_name:
          session.user.user_metadata?.full_name ||
          session.user.email?.split("@")[0] ||
          "",
        role: userRole as "admin" | "candidate",
      };

      // Check or create user in database (asynchronous, don't wait for redirect)
      supabase
        .from("users")
        .upsert(
          {
            id: session.user.id,
            email: session.user.email,
            full_name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              null,
            role: userRole,
            email_confirmed_at: session.user.email_confirmed_at,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        )
        .then(({ error }) => {
          if (error) {
            console.error("❌ Database upsert error:", error);
          } else {
            console.log("✅ User data stored in database successfully");
          }
        });

      // Update Zustand store immediately
      setUser(userData);

      setIsVerified(true);
      setError("");

      // Clear pending email from localStorage since verification is complete
      localStorage.removeItem("pending_verification_email");
      localStorage.removeItem("registration_flow");
      localStorage.removeItem("login_flow");

      console.log(
        "Redirecting to:",
        userRole === "admin" ? "/admin/jobs" : "/candidate"
      );

      // Redirect after a short delay
      setTimeout(() => {
        const redirectPath =
          userRole === "admin" ? "/admin/jobs" : "/candidate";
        router.push(redirectPath);
      }, 1500);
    } catch (err) {
      console.error("❌ Success handler error:", err);
      setError("Authentication failed. Please try again.");
    }
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4 sm:py-12">
        <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl xl:max-w-2xl bg-white rounded-xl py-6 sm:py-8 space-y-6 mx-auto">
          <div className="flex flex-col items-center justify-center text-center px-4 sm:px-6">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-[#01959F] mx-auto mb-6"></div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-4">
              Memverifikasi email Anda
            </h1>
            <div className="text-gray-600 text-base sm:text-lg">
              Mohon tunggu, kami sedang memverifikasi email Anda...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success state
  if (isVerified) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4 sm:py-12">
        <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl xl:max-w-2xl bg-white rounded-xl py-6 sm:py-8 space-y-6 mx-auto">
          <div className="flex flex-col items-center justify-center text-center px-4 sm:px-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-4">
              Email Terverifikasi!
            </h1>
            <div className="text-gray-600 text-base sm:text-lg">
              Email Anda berhasil diverifikasi. Anda akan dialihkan ke dashboard
              dalam beberapa saat.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4 sm:py-12">
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl xl:max-w-3xl bg-white rounded-xm py-6 sm:py-20 space-y-6 mx-auto px-10">
        {/* Content */}
        <div className="flex flex-col items-center justify-center text-center px-4 sm:px-6">
          <h1 className="text-2xl sm:text-4xl font-bold mb-4">
            Periksa email Anda
          </h1>
          <div className="text-gray-600 text-base sm:text-lg">
            {email ? (
              <div>
                Kami sudah mengirimkan link login ke{" "}
                <span className="font-semibold text-gray-700 break-all">
                  {email}
                </span>{" "}
                yang berlaku dalam{" "}
                <span className="font-bold text-gray-700">30 menit</span>
              </div>
            ) : (
              <div>
                Kami sudah mengirimkan link login ke email Anda yang berlaku
                dalam 30 menit
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 w-full">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Illustration */}
        <div className="flex justify-center px-4">
          <Image
            src="/empty/pana.png"
            alt="Email verification illustration"
            width={192}
            height={192}
            loading="eager"
            sizes="(max-width: 768px) 150px, 192px"
            className="object-contain"
            style={{
              width: "250px",
              height: "250px",
              maxWidth: "80vw",
              maxHeight: "40vh",
            }}
          />
        </div>
      </div>
    </div>
  );
}
