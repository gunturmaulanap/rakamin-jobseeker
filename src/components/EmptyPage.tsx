"use client";

import Link from "next/link";
import {
  Home,
  ArrowLeft,
  Search,
  FileQuestion,
  AlertCircle,
} from "lucide-react";

interface EmptyPageProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  customActions?: React.ReactNode;
  type?: "not-found" | "empty" | "unauthorized" | "error";
}

export default function EmptyPage({
  title = "Halaman Kosong",
  message = "Halaman yang Anda cari tidak tersedia atau belum memiliki konten.",
  showHomeButton = true,
  showBackButton = true,
  customActions,
  type = "empty",
}: EmptyPageProps) {
  // Icon berdasarkan tipe
  const getIcon = () => {
    switch (type) {
      case "not-found":
        return <Search className="w-12 h-12 text-gray-400" />;
      case "unauthorized":
        return <AlertCircle className="w-12 h-12 text-red-400" />;
      case "error":
        return <AlertCircle className="w-12 h-12 text-orange-400" />;
      default:
        return <FileQuestion className="w-12 h-12 text-gray-400" />;
    }
  };

  // Background color berdasarkan tipe
  const getIconBg = () => {
    switch (type) {
      case "not-found":
        return "bg-gray-200";
      case "unauthorized":
        return "bg-red-100";
      case "error":
        return "bg-orange-100";
      default:
        return "bg-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* Empty State Illustration */}
        <div className="mb-8">
          <div
            className={`mx-auto w-24 h-24 ${getIconBg()} rounded-full flex items-center justify-center`}
          >
            {getIcon()}
          </div>
        </div>

        {/* Main Content */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>

        <p className="text-gray-600 mb-8 text-sm leading-relaxed">{message}</p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Custom Actions */}
          {customActions}

          {/* Default Actions */}
          {!customActions && (
            <>
              {showHomeButton && (
                <Link
                  href="/"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#01959F] hover:bg-[#017a82] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  <Home className="w-4 h-4" />
                  Kembali ke Beranda
                </Link>
              )}

              {showBackButton && (
                <button
                  onClick={() => window.history.back()}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Halaman Sebelumnya
                </button>
              )}
            </>
          )}
        </div>

        {/* Type-specific Help Section */}
        {type === "unauthorized" && (
          <div className="mt-8 p-4 bg-red-50 rounded-lg">
            <h3 className="text-sm font-medium text-red-900 mb-2">
              Akses Ditolak
            </h3>
            <p className="text-sm text-red-700">
              Anda tidak memiliki izin untuk mengakses halaman ini. Silakan
              login dengan akun yang tepat atau hubungi administrator.
            </p>
          </div>
        )}

        {type === "error" && (
          <div className="mt-8 p-4 bg-orange-50 rounded-lg">
            <h3 className="text-sm font-medium text-orange-900 mb-2">
              Terjadi Kesalahan
            </h3>
            <p className="text-sm text-orange-700">
              Terjadi masalah teknis saat memuat halaman ini. Silakan coba lagi
              nanti atau hubungi support jika masalah berlanjut.
            </p>
          </div>
        )}

        {type === "not-found" && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Halaman Tidak Ditemukan
            </h3>
            <p className="text-sm text-blue-700">
              Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau
              URL yang Anda ketik salah.
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8">
          <p className="text-xs text-gray-500">
            {type === "not-found" && "Error Code: 404 - Page Not Found"}
            {type === "unauthorized" && "Error Code: 403 - Forbidden"}
            {type === "error" && "Error Code: 500 - Internal Server Error"}
            {type === "empty" && "Info: No Content Available"}
          </p>
        </div>
      </div>
    </div>
  );
}
