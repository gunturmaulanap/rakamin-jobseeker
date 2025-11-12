"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Eye, EyeOff, Lock, AlertCircle, Mail } from "lucide-react";
import { useAuthStore } from "@/stores";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Alamat email tidak boleh kosong")
    .email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi tidak boleh kosong"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function PasswordLoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const {
    signInWithPassword,
    isLoading,
    error,
    success,
    resetMessages,
    isSubmitting,
    setError,
    setSuccess,
    user,
    isAuthenticated,
  } = useAuthStore();

  // Clear error and success on mount to prevent showing old messages
  useEffect(() => {
    resetMessages();
  }, [resetMessages]);

  // Add loading check to prevent errors during hydration
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cek URL parameter untuk error message
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message");

    if (errorParam === "expired" && messageParam) {
      useAuthStore.getState().setError(messageParam);
    } else if (errorParam === "auth_error" && messageParam) {
      useAuthStore.getState().setError(messageParam);
    }
  }, [searchParams]);

  // Redirect user if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && isMounted) {
      console.log(
        "✅ User authenticated, redirecting to:",
        user.role === "admin" ? "/admin/jobs" : "/candidate"
      );

      // Add small delay to ensure state is properly set
      const redirectTimer = setTimeout(() => {
        if (user.role === "admin") {
          console.log("🔄 Redirecting to admin dashboard...");
          router.push("/admin/jobs");
        } else {
          console.log("🔄 Redirecting to candidate dashboard...");
          router.push("/candidate");
        }
      }, 100);

      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, user, router, isMounted]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log("🔄 Starting password login for:", data.email);
    console.log("🔑 Password provided:", data.password ? "YES" : "NO");

    // Clear previous messages
    resetMessages();

    try {
      console.log("📞 Calling signInWithPassword...");
      // Use the store's signInWithPassword function which handles both client and server auth
      const loginSuccess = await signInWithPassword(data.email, data.password);
      console.log("🎯 Login result:", loginSuccess);

      if (loginSuccess) {
        console.log("✅ Login returned TRUE - checking user data...");

        // Get the updated user info from store after successful login
        const updatedUser = useAuthStore.getState().user;
        console.log("👤 Updated user from store:", updatedUser);

        // Check if we have valid user data
        if (!updatedUser) {
          console.log("❌ No user data found in store after login");
          return;
        }

        console.log("✅ Login successful, user:", {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          full_name: updatedUser.full_name,
        });

        // Set a temporary admin auth cookie to help with server-side validation
        const adminAuthData = btoa(
          JSON.stringify({
            userId: updatedUser?.id,
            role: updatedUser?.role,
            timestamp: Date.now(),
          })
        );
        document.cookie = `admin_auth_token=${adminAuthData}; Path=/; Max-Age=3600; SameSite=Strict`;
        console.log("🍪 Admin auth cookie set");

        // Small delay to ensure state is properly updated before redirect
        setTimeout(() => {
          console.log("⏰ Timeout reached, checking redirect logic...");

          // Check current auth state before redirect
          const currentState = useAuthStore.getState();
          console.log("🔍 Current auth state:", {
            isAuthenticated: currentState.isAuthenticated,
            user: currentState.user,
            isLoading: currentState.isLoading,
          });

          // Immediate redirect based on user role
          if (updatedUser?.role === "admin") {
            console.log("🔄 Redirecting to admin dashboard...");
            router.push("/admin/jobs");
          } else if (updatedUser?.role === "candidate") {
            console.log("🔄 Redirecting to candidate dashboard...");
            router.push("/candidate");
          } else {
            console.log(
              "❌ Unknown user role, not redirecting. Role:",
              updatedUser?.role
            );
          }
        }, 100);
      } else {
        console.log("❌ Login returned FALSE");
        // Check auth store state after failed login
        const failedState = useAuthStore.getState();
        console.log("🔍 Auth state after failed login:", {
          isAuthenticated: failedState.isAuthenticated,
          user: failedState.user,
          error: failedState.error,
          isLoading: failedState.isLoading,
        });
      }
    } catch (error: any) {
      console.error("❌ Login error in onSubmit:", error);
      console.error("❌ Error details:", {
        message: error?.message || "Unknown error",
        stack: error?.stack || "No stack trace",
      });
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
        <div className="bg-white  shadow-xl p-8">
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
              {/* Error Message - Only show if mounted and has error */}
              {isMounted && error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message - Only show if mounted and has success */}
              {isMounted && success && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}
              {/* Email Field */}
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
                          className="pl-10 h-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01959F] focus:border-[#01959F]"
                          {...field}
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Kata sandi"
                          className="pl-10 pr-10 h-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01959F] focus:border-[#01959F]"
                          {...field}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-end space-x-4">
                <div className="flex justify-between items-center text-sm">
                  <a
                    href="#"
                    className="font-medium text-[#01959F] hover:underline"
                  >
                    Lupa kata sandi?
                  </a>
                  <span className="text-gray-400">|</span>
                </div>
              </div>

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
                <div className="flex-1 h-px bg-gray-200" />
                <span className="px-3 text-sm text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Secondary Actions */}
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-900 py-2 px-4 rounded-md h-11 hover:bg-gray-50"
                >
                  <Mail className="h-4 w-4 text-gray-800" />
                  Kirim link melalui email
                </Link>

                <Button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 py-2 px-4 rounded-md h-11 hover:bg-gray-100"
                >
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
