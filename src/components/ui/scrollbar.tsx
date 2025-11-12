"use client";

import { useEffect } from "react";

interface ScrollbarProps {
  children: React.ReactNode;
  className?: string;
  height?: string;
}

export default function CustomScrollbar({
  children,
  className = "",
  height,
}: ScrollbarProps) {
  useEffect(() => {
    // Inject custom scrollbar styles (page-level and inner containers)
    const style = document.createElement("style");
    style.textContent = `
      /* Ensure page uses full height so body scrollbar is active */
      html, body, #__next { height: 100%; }

      /* Page (body) scrollbar - visible teal thumb with white gap and shadow */
      body {
        scrollbar-width: thin;
        scrollbar-color: #01959F transparent;
      }
      body::-webkit-scrollbar { width: 12px; height: 12px; }
      body::-webkit-scrollbar-track { background: transparent; }
      body::-webkit-scrollbar-thumb {
        background: #01959F !important;
        border-radius: 9999px;
        border: 3px solid #ffffff;
        box-shadow: 0 4px 14px rgba(1,149,159,0.18);
      }
      body::-webkit-scrollbar-thumb:hover { background: #017B7F !important; }

      /* Inner panel subtle scrollbar */
      .custom-scrollbar::-webkit-scrollbar { width: 8px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(1,149,159,0.14) !important; border-radius: 10px;
        min-height: 36px; box-shadow: none !important;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(1,149,159,0.2) !important; }
      .custom-scrollbar { scrollbar-width: thin !important; scrollbar-color: rgba(1,149,159,0.14) #f1f1f1 !important; }
      .custom-scrollbar { overflow-y: auto !important; overflow-x: hidden !important; }

      /* Make sure all cards have consistent soft shadow */
      .card-soft-shadow {
        box-shadow: 0 10px 30px rgba(1,37,37,0.06) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const defaultHeight = "max-h-[calc(100vh-280px)]";

  return (
    <div
      className={`custom-scrollbar ${className}`}
      style={{ height: height || defaultHeight }}
    >
      {children}
    </div>
  );
}
