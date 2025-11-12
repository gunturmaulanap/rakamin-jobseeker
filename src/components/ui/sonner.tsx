"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // 1. Tambahkan unstyled={true} untuk kustomisasi yang lebih baik (termasuk accent bar)
      icons={{
        // Pastikan ikon sukses memiliki warna yang kontras dengan latar belakang putih
        success: <CircleCheckIcon className="size-4 text-green-500" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          // --- DEFAULT COLORS ---
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",

          // --- SUCCESS COLORS (Untuk mencocokkan desain gambar) ---
          "--success-bg": "white", // Latar belakang putih
          "--success-text": "black", // Teks gelap
          "--success-border": "var(--border)", // Border tipis

          // Warna untuk bar vertikal di sisi kiri (sesuai gambar, biru/teal)
          "--success-accent": "#01959F", // Ganti dengan warna teal/biru yang Anda inginkan
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
