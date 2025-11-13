"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useJobStore, useAuthStore } from "@/stores";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatSalary, formatDate } from "@/lib/utils";
import { Job } from "@/types/job";
import { supabase } from "@/lib/supabase";

export default function CandidateClient() {
  const {
    isLoading,
    searchTerm,
    statusFilter,
    isCreateModalOpen,
    getFilteredJobs,
    fetchJobs,
    setSearchTerm,
    openCreateModal,
    closeCreateModal,
  } = useJobStore();
  const { user, initializeAuth } = useAuthStore();
  const allFilteredJobs = getFilteredJobs();
  const filteredJobs = allFilteredJobs.filter((job) => job.status === "active");

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize auth and fetch data on component mount
  useEffect(() => {
    // Initialize auth state and fetch data in parallel for better performance
    const initialize = async () => {
      // Start fetching jobs immediately (no auth required)
      fetchJobs();

      // Initialize auth in parallel
      initializeAuth().then(() => {
        const currentUser = useAuthStore.getState().user;

        // Fetch user applications if user is logged in
        if (currentUser) {
          fetchUserApplications(currentUser.id);
        }
      });
    };

    initialize();
  }, []); // No dependencies needed

  // Fetch user applications from Supabase (only job_id needed)
  const fetchUserApplications = async (userId?: string) => {
    const userIdToUse = userId || user?.id;
    if (!userIdToUse) return;

    setApplicationsLoading(true);
    try {
      const { data: applications, error } = await supabase
        .from("applications")
        .select("job_id") // Only get job_id, not all fields
        .eq("candidate_id", userIdToUse);

      if (!error && applications) {
        const appliedJobIds = new Set(applications.map((app) => app.job_id));
        setAppliedJobs(appliedJobIds);
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setApplicationsLoading(false);
    }
  };

  // Update user applications when user changes
  useEffect(() => {
    if (user) {
      fetchUserApplications(user.id);
    } else {
      setAppliedJobs(new Set());
    }
  }, [user]);

  // Show loading state while loading data or not mounted yet
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 -m-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01959F]  mx-auto"></div>
        </div>
      </div>
    );
  }

  if (filteredJobs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <Image
                src="/empty/no-jobs.png"
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
                Please wait for the next batch of openings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-white py-4 px-4 sm:py-6 sm:px-6 shrink-0">
        <div className="relative mx-auto w-full max-w-8xl">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#01959F] h-5 w-5" />
          <Input
            value={searchTerm}
            placeholder="Search jobs by job details"
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 pr-12"
          />
        </div>
      </div>
      <div className="px-4 sm:px-6 flex-1 min-h-0">
        {filteredJobs.length === 0 && (
          <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center">
                <Image
                  src="/empty/no-jobs.png"
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
                  {searchTerm
                    ? "No jobs found matching your criteria"
                    : "No job openings available"}
                </h3>

                <p className="text-gray-600 mb-6 max-w-md">
                  {searchTerm
                    ? "Try adjusting your search to find what you're looking for."
                    : "Check back later for new job openings."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredJobs.length > 0 && (
          <div className="flex flex-col xl:flex-row gap-6">
            {/* Job List - Mobile First */}
            <div className="w-full xl:w-1/3 h-[calc(100vh-140px)]">
              <div
                className="grid grid-cols-1 gap-4 h-full pb-4 xl:pb-0 space-x-4
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:rounded-full
                [&::-webkit-scrollbar-track]:bg-gray-100
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-[#01959F]
                [&::-webkit-scrollbar-thumb]:hover:bg-[#017B7F]"
                style={{
                  overflowY: "auto",
                  contentVisibility: "auto",
                }}
              >
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`relative rounded-2xl border bg-white shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-200 ${
                      selectedJob?.id === job.id
                        ? "border-[#01959F] ring-2 ring-[#01959F]/20"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-4 pb-3">
                      <div className="rounded-2xl border border-gray-50 w-14 h-14 shrink-0">
                        <Image
                          src="/icon/logo.svg"
                          alt="Company Logo"
                          sizes="full"
                          width={56}
                          height={56}
                          className="object-contain"
                          style={{ width: "auto", height: "auto" }}
                        />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <h1 className="font-bold text-lg text-gray-600 line-clamp-1">
                          {job.title}
                        </h1>
                        <p className="font-medium text-gray-500 text-sm line-clamp-1">
                          {job.department}
                        </p>
                      </div>
                    </div>
                    <div className="border-t-2 border-dotted border-gray-200 pt-3 w-full"></div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <Image
                          src="/icon/location.svg"
                          alt="Location Icon"
                          width={16}
                          height={16}
                          style={{ width: "auto", height: "auto" }}
                        />
                        <p className="font-medium text-sm text-gray-500">
                          {job.department}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Image
                          src="/icon/u_money-bill.svg"
                          alt="Salary Icon"
                          width={16}
                          height={16}
                          style={{ width: "auto", height: "auto" }}
                        />
                        <p className="font-medium text-sm text-gray-500">
                          {formatSalary(job.salary_min, job.salary_max)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Job Details Panel - Desktop Only */}
            <div className="hidden xl:block w-2/3 bg-white h-[calc(100vh-140px)] p-6 rounded-2xl border border-gray-200">
              {selectedJob ? (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl border border-gray-50 w-15 h-15">
                        <Image
                          src="/icon/logo.svg"
                          alt="Company Logo"
                          sizes="full"
                          width={80}
                          height={80}
                          className="object-contain"
                          style={{ width: "auto", height: "auto" }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 w-fit">
                          Full-Time
                        </span>
                        <h1 className="font-bold text-3xl text-gray-800">
                          {selectedJob.title}
                        </h1>
                        <p className="font-medium text-lg text-gray-600">
                          {selectedJob.department || "Department"}
                        </p>
                      </div>
                    </div>
                    {appliedJobs.has(selectedJob.id) ? (
                      <button
                        disabled
                        className="bg-gray-300 text-gray-500 font-semibold py-2 px-6 rounded-lg shadow cursor-not-allowed inline-block"
                      >
                        Applied
                      </button>
                    ) : applicationsLoading ? (
                      <button
                        disabled
                        className="bg-gray-200 text-gray-400 font-semibold py-2 px-6 rounded-lg shadow cursor-not-allowed inline-block"
                      >
                        Loading...
                      </button>
                    ) : (
                      <Link
                        href={`/candidate/jobs/${selectedJob.id}/apply`}
                        className="bg-yellow-500 text-black font-semibold py-2 px-6 rounded-lg shadow hover:bg-yellow-600 transition-colors duration-200 inline-block"
                      >
                        Apply
                      </Link>
                    )}
                  </div>
                  <div
                    className="border-t-2 border-dotted border-gray-200 pb-6 w-full"
                    style={{ borderSpacing: "2px" }}
                  ></div>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    {selectedJob.description ? (
                      selectedJob.description
                        .split("\n")
                        .map((item, index) => <li key={index}>{item}</li>)
                    ) : (
                      <>
                        <li>
                          Develop, test, and maintain responsive,
                          high-performance web applications using modern
                          front-end technologies.
                        </li>
                        <li>
                          Collaborate with UI/UX designers to translate
                          wireframes and prototypes into functional code.
                        </li>
                        <li>
                          Integrate front-end components with APIs and backend
                          services.
                        </li>
                        <li>
                          Ensure cross-browser compatibility and optimize
                          applications for maximum speed and scalability.
                        </li>
                        <li>
                          Write clean, reusable, and maintainable code following
                          best practices and coding standards.
                        </li>
                        <li>
                          Participate in code reviews, contributing to
                          continuous improvement and knowledge sharing.
                        </li>
                        <li>
                          Troubleshoot and debug issues to improve usability and
                          overall application quality.
                        </li>
                        <li>
                          Stay updated with emerging front-end technologies and
                          propose innovative solutions.
                        </li>
                        <li>
                          Collaborate in Agile/Scrum ceremonies, contributing to
                          sprint planning, estimation, and retrospectives.
                        </li>
                      </>
                    )}
                  </ul>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Image
                    src="/icon/logo.svg"
                    alt="Select a job"
                    width={120}
                    height={120}
                    className="object-contain w-30 h-30 mb-6"
                    style={{ width: "auto", height: "auto" }}
                  />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Select a job to view details
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    Click on any job card from the left panel to view detailed
                    information and apply.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Job Details - Full Width */}
        {filteredJobs.length > 0 && selectedJob && (
          <div className="xl:hidden mt-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl border border-gray-50 w-14 h-14 shrink-0">
                    <Image
                      src="/icon/logo.svg"
                      alt="Company Logo"
                      sizes="full"
                      width={56}
                      height={56}
                      className="object-contain"
                      style={{ width: "auto", height: "auto" }}
                    />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 w-fit">
                      Full-Time
                    </span>
                    <h1 className="font-bold text-xl text-gray-800 line-clamp-2">
                      {selectedJob.title}
                    </h1>
                    <p className="font-medium text-gray-600">
                      {selectedJob.department || "Department"}
                    </p>
                  </div>
                </div>
                {appliedJobs.has(selectedJob.id) ? (
                  <button
                    disabled
                    className="bg-gray-300 text-gray-500 font-semibold py-2 px-4 rounded-lg shadow cursor-not-allowed text-sm"
                  >
                    Applied
                  </button>
                ) : applicationsLoading ? (
                  <button
                    disabled
                    className="bg-gray-200 text-gray-400 font-semibold py-2 px-4 rounded-lg shadow cursor-not-allowed text-sm"
                  >
                    Loading...
                  </button>
                ) : (
                  <Link
                    href={`/candidate/jobs/${selectedJob.id}/apply`}
                    className="bg-yellow-500 text-black font-semibold py-2 px-4 rounded-lg shadow hover:bg-yellow-600 transition-colors duration-200 text-sm"
                  >
                    Apply
                  </Link>
                )}
              </div>
              <div className="border-t-2 border-dotted border-gray-200 pt-6 w-full"></div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-800">
                  Job Description
                </h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 text-sm">
                  {selectedJob.description ? (
                    selectedJob.description
                      .split("\n")
                      .map((item, index) => <li key={index}>{item}</li>)
                  ) : (
                    <>
                      <li>
                        Develop, test, and maintain responsive, high-performance
                        web applications using modern front-end technologies.
                      </li>
                      <li>
                        Collaborate with UI/UX designers to translate wireframes
                        and prototypes into functional code.
                      </li>
                      <li>
                        Integrate front-end components with APIs and backend
                        services.
                      </li>
                      <li>
                        Ensure cross-browser compatibility and optimize
                        applications for maximum speed and scalability.
                      </li>
                      <li>
                        Write clean, reusable, and maintainable code following
                        best practices and coding standards.
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
