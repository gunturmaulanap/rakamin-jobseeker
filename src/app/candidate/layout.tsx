"use client";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores";
import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";
import { FaSignOutAlt, FaUser } from "react-icons/fa";

export default function CandidateLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  // Clean up any browser extension attributes that cause hydration issues
  useEffect(() => {
    const cleanupAttributes = () => {
      const elements = document.querySelectorAll("[bis_skin_checked]");
      elements.forEach((el) => {
        (el as HTMLElement).removeAttribute("bis_skin_checked");
      });
    };

    cleanupAttributes();
    // Run cleanup again after a delay to catch dynamically added attributes
    const timeoutId = setTimeout(cleanupAttributes, 100);

    return () => clearTimeout(timeoutId);
  }, []);
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 ">
        <div className="max-w-8xl  px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4"></div>
            <div className="flex items-center space-x-4 border-l-2 pl-4">
              <div className="relative ">
                {" "}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className="h-8 w-8 p-0 rounded-full overflow-hidden cursor-pointer"
                >
                  <Image
                    src="/profile/profile-icon-candidate.svg"
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
        <div className="max-w-8xl xl:mx-26 ">{children}</div>
        <Toaster position="bottom-left" richColors closeButton />
      </main>

      {/* Loading overlay during logout */}
      {isLoggingOut && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01959F] mb-4"></div>
            <p className="text-gray-700">Logging out...</p>
          </div>
        </div>
      )}
    </div>
  );
}
