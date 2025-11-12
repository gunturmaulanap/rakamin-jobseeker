import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";

interface ProtectedPageProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default async function ProtectedPage({
  children,
  allowedRoles = []
}: ProtectedPageProps) {
  try {
    const user = await getServerUser();

    // Check if user is authenticated
    if (!user) {
      redirect("/login");
    }

    // Check if user has allowed role (if specified)
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {

      // Redirect admin users trying to access candidate pages
      if (user.role === "admin") {
        redirect("/admin/jobs");
      } else if (user.role === "candidate") {
        redirect("/candidate");
      } else {
        redirect("/login");
      }
    }

    return <>{children}</>;
  } catch (error) {
    redirect("/login");
  }
}