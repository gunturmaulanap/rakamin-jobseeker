"use client";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";
import { FaSignOutAlt, FaUser } from "react-icons/fa";
import { useAuthStore } from "@/stores";
import { usePathname } from "next/navigation";
import { IoIosArrowForward } from "react-icons/io";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

  // Check if current page is candidates management page
  const isCandidatesPage = pathname?.includes("/candidates");
  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setIsDropdownOpen(false);

    try {
      // Use the simplified logout from auth store
      await logout();

      // Redirect after logout
      window.location.href = "/login";
    } catch (error) {
      // Force redirect even on error
      window.location.href = "/login";
    }
  };
  useEffect(() => {
    const handleClickOutside = () => {
      if (isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isDropdownOpen]);
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {isCandidatesPage ? (
                <nav className="flex items-center space-x-2 text-sm">
                  <Link
                    href="/admin/jobs"
                    className="text-gray-800 font-semibold hover:text-gray-900 border border-[#E0E0E0] rounded-lg p-2 shadow-sm"
                  >
                    Job List
                  </Link>
                  <IoIosArrowForward className="text-gray-700 h-5 w-5" />
                  <span className="text-gray-800 hover:text-gray-900 border border-[#C2C2C2] bg-gray-100 rounded-lg p-2 shadow-sm font-semibold">
                    Manage Candidates
                  </span>
                </nav>
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">Job List</h1>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative ">
                {" "}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className="h-11 w-8 p-0 rounded-full overflow-hidden cursor-pointer"
                >
                  <Image
                    src="/profile/profile-icon-admin.svg"
                    priority
                    width={100}
                    height={100}
                    sizes="(max-width: 768px) 400px, 800px"
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </Button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        type="button"
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        disabled
                      >
                        <FaUser className="mr-2 h-4 w-4" />
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={`flex items-center w-full px-4 py-2 text-sm transition-colors duration-150 ${
                          isLoggingOut
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <FaSignOutAlt
                          className={`mr-2 h-4 w-4 ${
                            isLoggingOut ? "animate-spin" : ""
                          }`}
                        />
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-8xl mx-auto">{children}</div>
        <Toaster position="bottom-left" richColors closeButton />
      </main>

      {/* Loading overlay during logout */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01959F] mb-4"></div>
            <p className="text-gray-700">Logging out...</p>
          </div>
        </div>
      )}
    </div>
  );
}
