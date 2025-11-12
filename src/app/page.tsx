import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  // Redirect based on user role
  if (user.role === "admin") {
    redirect("/admin/jobs");
  } else if (user.role === "candidate") {
    redirect("/candidate");
  } else {
    redirect("/candidate");
  }
}
