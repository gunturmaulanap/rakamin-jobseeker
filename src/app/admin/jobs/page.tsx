import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminJobsClient from "../components/AdminJobsClient";

export default async function AdminJobsPage() {
  const user = await getServerUser();

  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  return <AdminJobsClient />;
}
