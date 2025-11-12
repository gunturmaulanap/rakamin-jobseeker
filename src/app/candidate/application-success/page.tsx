"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ApplicationSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/candidate");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-3xl mx-auto px-10">
        <div className="mb-8">
          <div className="w-20 h-20   flex items-center justify-center mx-auto mb-20">
            <Image
              src="/success/1.svg"
              alt="Success Icon"
              width={192}
              height={192}
              loading="eager"
              sizes="(max-width: 768px) 150px, 192px"
              className="mx-auto mb-6 object-contain"
              style={{
                width: "300px",
                height: "300px",
                maxWidth: "90vw",
                maxHeight: "50vh",
              }}
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Your application was sent!
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Congratulations! You've taken the first step towards a rewarding
            career at Rakamin. We look forward to learning more about you during
            the application process.
          </p>
        </div>
      </div>
    </div>
  );
}
