import EmptyPage from "@/components/EmptyPage";

// Catch-all route untuk semua URL yang tidak dikenal
export default function CatchAllNotFound() {
  return (
    <EmptyPage
      type="not-found"
      title="Halaman Tidak Ditemukan"
      message="Halaman yang Anda cari tidak tersedia. URL yang Anda ketik mungkin salah atau halaman telah dipindahkan."
      showHomeButton={true}
      showBackButton={true}
    />
  );
}