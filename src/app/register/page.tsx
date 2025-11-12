import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import RegisterPageClient from "@/app/register/components/RegisterPageClient";

export default async function RegisterPage() {
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

  // User not authenticated, show register page
  return <RegisterPageClient />;
}
