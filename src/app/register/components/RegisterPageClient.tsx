"use client";

import { useRouter } from "next/navigation";
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
import { Mail, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/stores";
import { MdErrorOutline } from "react-icons/md";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPageClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?email=${encodeURIComponent(data.email)}`,
          data: {
            is_registration: true,
            registration_timestamp: new Date().toISOString(),
          },
        },
      });

      if (authError) {
        console.error("❌ Registration error:", authError);
        setError(authError.message || "Gagal mengirim link verifikasi");
        return;
      }

      setSuccess("Link verifikasi telah dikirim ke email Anda!");

      // Store email for verify page and redirect
      localStorage.setItem("pending_verification_email", data.email);
      localStorage.setItem("registration_flow", "magic_link");

      setTimeout(() => {
        router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
      }, 2000);

    } catch (err: any) {
      console.error("❌ Registration error:", err);
      setError(err.message || "Terjadi kesalahan saat registrasi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 -m-8">
      <div className="max-w-xl  w-full">
        {/* Logo only (keep outside card) */}
        <div className="text-left -mb-8 ">
          <div className="flex items-center">
            <img
              src="/logo/rakamin-logo.png"
              alt="Rakamin Logo"
              className="w-50 h-40"
            />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white shadow-xl p-8 rounded-md ">
          <h4 className="text-xl font-semibold text-gray-900 mb-2">
            Bergabung dengan Rakamin
          </h4>
          <p className="text-gray-600 text-sm mb-6">
            Sudah punya akun?
            <span>
              <Link
                href="/login"
                className="text-[#01959F] hover:underline ml-1"
              >
                Masuk
              </Link>
            </span>
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex items-start gap-2">
                    <MdErrorOutline className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <p
                      className="text-sm text-red-600"
                      dangerouslySetInnerHTML={{ __html: error }}
                    />
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      Alamat Email <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          type="email"
                          placeholder="nama@example.com"
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

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 px-4 rounded-lg h-12 shadow-md cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Mengirim..." : "Daftar dengan email"}
              </Button>
              {/* Divider */}
              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-gray-400" />
                <span className="px-3 text-sm text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-400" />
              </div>
              <Button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 py-2 px-4 rounded-md h-11 hover:bg-gray-100"
              >
                <FcGoogle className="h-4 w-4 text-gray-600" />
                Masuk dengan Google
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}