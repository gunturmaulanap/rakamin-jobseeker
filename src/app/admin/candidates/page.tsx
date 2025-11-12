"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  Users,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Download,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { formatDateTime, formatDate } from "@/lib/utils";

interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  linkedin: string | null;
  domicile: string | null;
  resume_url: string | null;
  portfolio_url: string | null;
  photo_url: string | null;
  status: "pending" | "reviewing" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
  jobs?: {
    title: string;
    department: string;
  };
}

interface CandidateStats {
  totalCandidates: number;
  pendingReview: number;
  reviewing: number;
  accepted: number;
  rejected: number;
}

export default function AdminCandidatesPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<CandidateStats>({
    totalCandidates: 0,
    pendingReview: 0,
    reviewing: 0,
    accepted: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    fetchApplications();
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, department")
        .order("title");

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error("Error fetching jobs:", error.message);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          jobs (
            title,
            department
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);

      // Calculate stats
      const statsData: CandidateStats = {
        totalCandidates: data?.length || 0,
        pendingReview: data?.filter((app) => app.status === "pending").length || 0,
        reviewing: data?.filter((app) => app.status === "reviewing").length || 0,
        accepted: data?.filter((app) => app.status === "accepted").length || 0,
        rejected: data?.filter((app) => app.status === "rejected").length || 0,
      };
      setStats(statsData);
    } catch (error: any) {
      console.error("Error fetching applications:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    setIsUpdating(applicationId);

    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus as Application["status"] } : app
        )
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        pendingReview:
          newStatus === "pending"
            ? prev.pendingReview + 1
            : prev.pendingReview - 1,
        reviewing:
          newStatus === "reviewing"
            ? prev.reviewing + 1
            : prev.reviewing - 1,
        accepted:
          newStatus === "accepted"
            ? prev.accepted + 1
            : prev.accepted - 1,
        rejected:
          newStatus === "rejected"
            ? prev.rejected + 1
            : prev.rejected - 1,
      }));
    } catch (error: any) {
      console.error("Error updating application:", error.message);
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobs?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobs?.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesJob = jobFilter === "all" || app.job_id === jobFilter;

    return matchesSearch && matchesStatus && matchesJob;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    switch (sortBy) {
      case "created_at":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "full_name":
        return (a.full_name || "").localeCompare(b.full_name || "");
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewing":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Menunggu Review";
      case "reviewing":
        return "Sedang Direview";
      case "accepted":
        return "Diterima";
      case "rejected":
        return "Ditolak";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 -m-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data pelamar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Pelamar</h1>
              <p className="text-sm text-gray-600">
                Kelola semua pelamar untuk semua lowongan
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Selamat datang, Admin
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pelamar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalCandidates}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Menunggu Review</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingReview}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sedang Direview</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.reviewing}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Diterima</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.accepted}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ditolak</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.rejected}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan nama, email, telepon, judul lowongan, atau departemen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-11 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu Review</option>
                <option value="reviewing">Sedang Direview</option>
                <option value="accepted">Diterima</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>

            {/* Job Filter */}
            <div className="w-full lg:w-64">
              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="w-full h-11 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Semua Lowongan</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="w-full lg:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full h-11 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="created_at">Terbaru</option>
                <option value="full_name">Nama</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Candidate Cards */}
        {sortedApplications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center">
                <img
                  src="/empty/empty.png"
                  alt="No candidates available"
                  className="w-48 h-48 mx-auto mb-6 object-contain"
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== "all" || jobFilter !== "all"
                    ? "Tidak ada pelamar ditemukan"
                    : "Belum ada pelamar"}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  {searchTerm || statusFilter !== "all" || jobFilter !== "all"
                    ? "Coba ubah filter atau kata kunci pencarian untuk menemukan pelamar yang sesuai."
                    : "Belum ada pelamar yang mengirim aplikasi untuk lowongan yang tersedia."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {sortedApplications.map((application) => (
              <Card
                key={application.id}
                className="bg-white border hover:shadow-lg transition-shadow duration-200"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {application.photo_url && (
                          <img
                            src={application.photo_url}
                            alt={application.full_name || "Photo"}
                            className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                          />
                        )}
                        <div>
                          <CardTitle className="text-xl font-semibold text-gray-900">
                            {application.full_name || "Nama tidak tersedia"}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600">
                            Melamar pada {formatDate(application.created_at)} •{" "}
                            {application.jobs?.title} - {application.jobs?.department}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {getStatusLabel(application.status)}
                      </span>
                      <Link href={`/admin/jobs/${application.job_id}/candidates`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ChevronDown className="h-4 w-4 rotate-270" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                    {application.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a
                          href={`mailto:${application.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {application.email}
                        </a>
                      </div>
                    )}

                    {application.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a
                          href={`tel:${application.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {application.phone}
                        </a>
                      </div>
                    )}

                    {application.gender && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-medium">{application.gender}</span>
                      </div>
                    )}

                    {application.linkedin && (
                      <div className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                        <a
                          href={application.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          LinkedIn Profile
                        </a>
                      </div>
                    )}

                    {application.domicile && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Domisili:</span>
                        <span className="font-medium">{application.domicile}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {application.resume_url && (
                      <a
                        href={application.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download Resume
                      </a>
                    )}

                    {application.portfolio_url && (
                      <a
                        href={application.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Lihat Portfolio
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {application.status !== "reviewing" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => updateApplicationStatus(application.id, "reviewing")}
                        disabled={isUpdating === application.id}
                      >
                        {isUpdating === application.id ? "..." : "Mulai Review"}
                      </Button>
                    )}

                    {application.status !== "accepted" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-green-600 hover:text-green-700 hover:border-green-300"
                        onClick={() => updateApplicationStatus(application.id, "accepted")}
                        disabled={isUpdating === application.id}
                      >
                        {isUpdating === application.id ? "..." : "Terima"}
                      </Button>
                    )}

                    {application.status !== "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-red-600 hover:text-red-700 hover:border-red-300"
                        onClick={() => updateApplicationStatus(application.id, "rejected")}
                        disabled={isUpdating === application.id}
                      >
                        {isUpdating === application.id ? "..." : "Tolak"}
                      </Button>
                    )}

                    <Link href={`/admin/jobs/${application.job_id}/candidates`}>
                      <Button variant="outline" size="sm" className="h-9">
                        Lihat Detail Lowongan
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}