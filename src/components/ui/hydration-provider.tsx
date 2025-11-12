"use client";

import { useEffect, useState } from "react";

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    // Cleanup browser extension attributes that cause hydration issues
    const cleanupExtensionAttributes = () => {
      const elements = document.querySelectorAll('[bis_skin_checked]');
      elements.forEach(el => {
        (el as HTMLElement).removeAttribute('bis_skin_checked');
      });
    };

    // Run cleanup immediately and after a delay
    cleanupExtensionAttributes();
    const timeoutId = setTimeout(cleanupExtensionAttributes, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Prevent hydration mismatch by not rendering until client-side hydration is complete
  return <>{isHydrated ? children : null}</>;
}