import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import EmptyPage from "@/components/EmptyPage";

export default async function ProfilePage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <EmptyPage
      type="empty"
      title="Halaman Profile Kosong"
      message="Fitur profile sedang dalam pengembangan. Silakan kembali lagi nanti."
      showHomeButton={true}
      showBackButton={true}
      customActions={
        <div className="space-y-2">
          {user.role === "admin" && (
            <a
              href="/admin/jobs"
              className="block w-full  items-center justify-center gap-2 bg-[#01959F] hover:bg-[#017a82] text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              Dashboard Admin
            </a>
          )}
          {user.role === "candidate" && (
            <a
              href="/candidate"
              className="block w-full  items-center justify-center gap-2 bg-[#01959F] hover:bg-[#017a82] text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              Dashboard Kandidat
            </a>
          )}
        </div>
      }
    />
  );
}
