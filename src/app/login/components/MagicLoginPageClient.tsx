"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FcGoogle } from "react-icons/fc";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";

const magicLoginSchema = z.object({
  email: z
    .string()
    .min(1, "Alamat email tidak boleh kosong")
    .email("Format email tidak valid"),
});

type MagicLoginFormData = z.infer<typeof magicLoginSchema>;

export default function MagicLoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const form = useForm<MagicLoginFormData>({
    resolver: zodResolver(magicLoginSchema),
    mode: "onSubmit",
  });

  useEffect(() => {
    // Check for URL parameters on component mount
    const urlError = searchParams.get("error");
    const urlMessage = searchParams.get("message");

    if (urlError && urlMessage) {
      switch (urlError) {
        case "expired":
          setError(urlMessage);
          break;
        case "auth_error":
          setError(urlMessage);
          break;
        case "user_not_found":
          setError(urlMessage);
          break;
        default:
          setError(urlMessage);
      }
    }

    // Clear URL parameters after processing
    if (urlError || urlMessage) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      newUrl.searchParams.delete("message");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  // Redirect user if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") {
        router.push("/admin/jobs");
      } else {
        router.push("/candidate");
      }
    }
  }, [isAuthenticated, user, router]);

  const onSubmit = async (data: MagicLoginFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: false, // Only login existing users
          emailRedirectTo: `${
            window.location.origin
          }/auth/callback?email=${encodeURIComponent(data.email)}`,
          data: {
            is_login_attempt: true,
            login_timestamp: new Date().toISOString(),
          },
        },
      });

      if (authError) {
        let errorMessage = authError.message;

        // Provide user-friendly error messages
        if (
          authError.message?.includes("User not found") ||
          authError.message?.includes("Signups not allowed for otp")
        ) {
          errorMessage =
            'Email ini belum terdaftar sebagai akun di Rakamin Academy. <a href="/register" class="text-red-600 hover:underline font-semibold">Daftar</a>.';
        } else if (authError.message?.includes("rate limit")) {
          errorMessage =
            "Terlalu banyak percobaan. Silakan tunggu beberapa saat.";
        }

        setError(errorMessage);
        return;
      }

      setSuccess("Link login telah dikirim ke email Anda!");

      // Store email for verify page and redirect
      localStorage.setItem("pending_verification_email", data.email);
      localStorage.setItem("login_flow", "magic_link");

      setTimeout(() => {
        router.push(
          `/auth/verify-email?email=${encodeURIComponent(data.email)}`
        );
      }, 2000);
    } catch (err: any) {
      console.error("❌ Login error:", err);
      setError(err.message || "Terjadi kesalahan saat login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 -m-8">
      <div className="max-w-xl w-full">
        {/* Logo only (keep outside card) */}
        <div className="text-left -mb-8 ">
          <div className="flex items-center">
            <img
              src="/logo/logo-rakamin.svg"
              alt="Rakamin Logo"
              className="w-50 h-40"
            />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white  shadow-xl p-8 rounded-md">
          <h4 className="text-xl font-semibold text-gray-900 mb-2">
            Masuk ke Rakamin
          </h4>
          <p className="text-gray-600 text-sm mb-6">
            Belum punya akun?
            <span>
              <Link
                href="/register"
                className="text-[#01959F] hover:underline ml-1"
              >
                Daftar menggunakan email
              </Link>
            </span>
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <p
                      className="text-sm text-red-800"
                      dangerouslySetInnerHTML={{ __html: error }}
                    />
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      Alamat email <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          type="email"
                          placeholder="Alamat email"
                          className="pl-10 h-12"
                          {...field}
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 px-4 rounded-lg h-12 shadow-md cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Memproses..." : "Masuk"}
              </Button>

              {/* Divider */}
              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-gray-400" />
                <span className="px-3 text-sm text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-400" />
              </div>

              {/* Secondary Actions */}
              <div className="space-y-3">
                <Link
                  href="/login/password"
                  className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 py-2 px-4 rounded-md h-11 hover:bg-gray-100"
                >
                  <Mail className="h-4 w-4 text-gray-600" />
                  Masuk dengan kata sandi
                </Link>

                <Button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 py-2 px-4 rounded-md h-11 hover:bg-gray-100"
                >
                  {/* Full-color Google G */}
                  <FcGoogle className="h-4 w-4 text-gray-600" />
                  Masuk dengan Google
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
