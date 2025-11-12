import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import PasswordLoginPageClient from "@/app/login/components/PasswordLoginPageClient";

export default async function PasswordLoginPage() {
  const user = await getServerUser();

  // If user is already authenticated, redirect to appropriate dashboard
  if (user) {
    if (user.role === "admin") {
      redirect("/admin/jobs");
    } else if (user.role === "candidate") {
      redirect("/candidate");
    } else {
      redirect("/candidate");
    }
  }

  // User not authenticated, show password login page
  return <PasswordLoginPageClient />;
}