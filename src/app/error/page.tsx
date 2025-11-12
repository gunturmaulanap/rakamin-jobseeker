import EmptyPage from "@/components/EmptyPage";

export default function ErrorPage() {
  return (
    <EmptyPage
      type="error"
      title="Terjadi Kesalahan"
      message="Terjadi masalah teknis saat memuat halaman ini. Kami sedang memperbaikinya. Silakan coba lagi beberapa saat."
      showHomeButton={true}
      showBackButton={false}
    />
  );
}