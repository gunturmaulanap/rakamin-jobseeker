"use client";

import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* Empty State Illustration */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
        </div>

        {/* Main Content */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Halaman Tidak Ditemukan
        </h1>

        <p className="text-gray-600 mb-8 text-sm leading-relaxed">
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
          Halaman ini mungkin tidak ada atau Anda tidak memiliki akses untuk
          melihatnya.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#01959F] hover:bg-[#017a82] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full inline-flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Halaman Sebelumnya
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Butuh bantuan?
          </h3>
          <p className="text-sm text-blue-700">
            Jika Anda merasa ada yang salah dengan halaman ini, silakan hubungi
            tim support kami.
          </p>
        </div>

        {/* Footer Info */}
        <div className="mt-8">
          <p className="text-xs text-gray-500">
            Error Code: 404 - Page Not Found
          </p>
        </div>
      </div>
    </div>
  );
}
