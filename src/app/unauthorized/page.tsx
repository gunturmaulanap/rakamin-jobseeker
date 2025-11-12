import EmptyPage from "@/components/EmptyPage";

export default function UnauthorizedPage() {
  return (
    <EmptyPage
      type="unauthorized"
      title="Akses Ditolak"
      message="Anda tidak memiliki izin untuk mengakses halaman ini. Silakan login dengan akun yang memiliki akses atau hubungi administrator."
      showHomeButton={true}
      showBackButton={true}
    />
  );
}