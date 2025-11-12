"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatSalary, formatDate } from "@/lib/utils";
import CreateJobModal from "@/app/admin/components/CreateJobModal";
import Image from "next/image";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import { useJobStore } from "@/stores";
import { Job } from "@/types/job";
import { useAuthStore } from "@/stores";
import JobCardSkeleton from "./JobsCardSkeleton";

export default function AdminJobsClient() {
  const [isMounted, setIsMounted] = useState(false);
  const { logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const {
    isLoading,
    searchTerm,
    statusFilter,
    isCreateModalOpen,
    getFilteredJobs,
    fetchJobs,
    updateJob,
    setSearchTerm,
    openCreateModal,
    closeCreateModal,
  } = useJobStore();

  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Call the filter function
  const filteredJobs = getFilteredJobs();

  // Loading skeleton for job cards

  const handleJobSuccess = (message: string) => {
    toast.success(message, { duration: 3000 });
    fetchJobs();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setIsMounted(true);
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      closeCreateModal();
      setSearchTerm("");
      setEditingJob(null);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [closeCreateModal, setSearchTerm, setEditingJob]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        closeCreateModal();
        setSearchTerm("");
        setEditingJob(null);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [closeCreateModal, setSearchTerm, setEditingJob]);

  const handleToggleJobStatus = async (
    jobId: string,
    currentStatus: string
  ) => {
    try {
      let newStatus: "active" | "inactive" | "draft";
      let message: string;

      if (currentStatus === "active") {
        newStatus = "inactive";
        message = "Job successfully set to Inactive.";
      } else if (currentStatus === "inactive") {
        newStatus = "active";
        message = "Job successfully reactivated.";
      } else {
        newStatus = "active";
        message = "Draft successfully set to Active.";
      }

      await updateJob(jobId, { status: newStatus });
      toast.success(message);
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update job status.");
    }
  };

  const handleCloseEditModal = () => {
    setEditingJob(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "border border-[#B8DBCA] text-[#43936C]";
      case "inactive":
        return "border border-[#F5B1B7] text-[#E11428]";
      case "draft":
        return "border border-[#FEEABC] text-[#FBC037]";
      default:
        return "border border-gray-100 text-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "draft":
        return "Draft";
      default:
        return status;
    }
  };

  // Show loading state only for initial mounting
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 -m-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01959F]  mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-8xl mx-auto">
        {/* Search and Filter */}
        <div className="bg-white  p-6 ">
          <div
            className="flex flex-col sm:flex-row gap-4 space-y-6 px-4 h-[calc(100vh-80px)] overflow-y-auto
                  [&::-webkit-scrollbar]:w-2
                  [&::-webkit-scrollbar-track]:rounded-full
                  [&::-webkit-scrollbar-track]:bg-gray-100
                  [&::-webkit-scrollbar-thumb]:rounded-full
                  [&::-webkit-scrollbar-thumb]:bg-[#01959F]
                  [&::-webkit-scrollbar-thumb]:hover:bg-[#017B7F]"
            style={{ minHeight: "500px", maxHeight: "100%" }}
          >
            <div className="flex-1">
              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#01959F] h-6 w-6" />
                <Input
                  value={searchTerm}
                  placeholder="Search jobs by job details"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className=" h-11"
                />
              </div>

              <div className="">
                {filteredJobs.length === 0 ? (
                  <Card className="min-h-screen">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="text-center">
                        <Image
                          src="/empty/no-jobs.svg"
                          alt="No jobs available"
                          width={192}
                          height={192}
                          loading="eager"
                          sizes="(max-width: 768px) 150px, 192px"
                          className="mx-auto mb-6 object-contain"
                          style={{
                            width: "300px",
                            height: "300px",
                            maxWidth: "90vw",
                            maxHeight: "50vh",
                          }}
                        />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {searchTerm || statusFilter !== "all"
                            ? "No jobs found matching your criteria"
                            : "No job openings available"}
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md">
                          {searchTerm || statusFilter !== "all"
                            ? "Try adjusting your search or filter to find what you're looking for."
                            : "Create a job opening now and start the candidate process."}
                        </p>
                        {!searchTerm && statusFilter === "all" && (
                          <Button
                            className="bg-yellow-400 hover:bg-yellow-500"
                            onClick={openCreateModal}
                          >
                            Create a new job
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : isLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <JobCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredJobs.map((job) => (
                      <Card
                        key={job.id}
                        className="bg-white shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100 relative z-10 p-1"
                      >
                        <CardHeader className="pb-4">
                          <div className="space-y-4">
                            <div className="">
                              <span
                                className={`p-2 text-xs font-medium rounded-lg ${getStatusColor(
                                  job.status
                                )}`}
                              >
                                {getStatusLabel(job.status)}
                              </span>
                              <span className="p-2 text-xs text-[#404040] font-medium rounded-lg border border-gray-400 ml-2">
                                started on {formatDate(job.created_at)}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <CardTitle className="text-xl font-semibold text-gray-900">
                                  {job.title}
                                </CardTitle>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="text-sm font-semibold text-gray-500">
                                {formatSalary(job.salary_min, job.salary_max)}
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {job.status === "active" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                                    onClick={() =>
                                      handleToggleJobStatus(job.id, job.status)
                                    }
                                  >
                                    Set Inactive
                                  </Button>
                                )}
                                {job.status === "inactive" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 border-green-200 text-green-600 hover:bg-green-50 cursor-pointer"
                                    onClick={() =>
                                      handleToggleJobStatus(job.id, job.status)
                                    }
                                  >
                                    Set Active
                                  </Button>
                                )}
                                {job.status === "draft" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
                                    onClick={() => setEditingJob(job)}
                                  >
                                    Continue Draft
                                  </Button>
                                )}
                                <Link href={`/admin/jobs/${job.id}/candidates`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 bg-[#01959F] text-white rounded-xl px-4  hover:bg-[#046265] hover:text-white cursor-pointer"
                                  >
                                    Manage Job
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="w-full sm:w-90">
              <div
                className="bg-cover bg-center bg-no-repeat rounded-xl p-8 mb-6 relative overflow-hidden text-white"
                style={{
                  backgroundImage: "url('/background/create-button.jpg')",
                }}
              >
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/60"></div>

                <div className="relative z-10 text-center">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold mb-2">
                      Recruit the best candidates
                    </h2>
                    <p className="text-gray-300 max-w-lg mx-auto">
                      Create jobs, invite, and hire with ease
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      className="bg-[#01959F] hover:bg-[#046265] text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 w-full cursor-pointer"
                      onClick={openCreateModal}
                    >
                      Create a new jobs
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSuccess={handleJobSuccess}
      />

      {/* Edit Draft Modal */}
      <CreateJobModal
        isOpen={!!editingJob}
        onClose={handleCloseEditModal}
        onSuccess={(message) => {
          handleCloseEditModal();
          handleJobSuccess(message);
        }}
        editingJob={editingJob}
      />
    </div>
  );
}
