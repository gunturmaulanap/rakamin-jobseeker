"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useJobStore } from "@/stores";
import { Application } from "@/types/job";
import { Checkbox } from "@/components/ui/checkbox";

export default function CandidateManagementPage() {
  const params = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(
    new Set()
  );

  const {
    currentJob,
    applications,
    isLoading,
    fetchJobById,
    fetchApplications,
    updateApplicationStatus: updateAppStatus,
  } = useJobStore();

  const jobId = params.id as string;

  useEffect(() => {
    if (jobId) {
      fetchJobById(jobId);
      fetchApplications(jobId);
    }
  }, [jobId, fetchJobById, fetchApplications]);

  const updateApplicationStatus = async (
    applicationId: string,
    newStatus: string
  ) => {
    setIsUpdating(applicationId);
    await updateAppStatus(applicationId, newStatus as Application["status"]);
    setIsUpdating(null);
  };

  // Checkbox handlers
  const handleSelectAll = () => {
    if (selectedCandidates.size === filteredApplications.length) {
      // Deselect all
      setSelectedCandidates(new Set());
    } else {
      // Select all
      setSelectedCandidates(new Set(filteredApplications.map((app) => app.id)));
    }
  };

  const handleSelectCandidate = (candidateId: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId);
    } else {
      newSelected.add(candidateId);
    }
    setSelectedCandidates(newSelected);
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      app.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;

    const matchesStatus = statusFilter === "all" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const isAllSelected =
    filteredApplications.length > 0 &&
    selectedCandidates.size === filteredApplications.length;
  const isIndeterminate =
    selectedCandidates.size > 0 &&
    selectedCandidates.size < filteredApplications.length;

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#017B7F] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentJob?.title}
              </h2>
            </div>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 rounded-lg border border-gray-200 min-h-screen bg-white">
              <div className="text-center">
                <Image
                  src="/empty/no-candidates.png"
                  alt="No candidates available"
                  width={800}
                  height={800}
                  sizes="(max-width: 768px) 400px, 800px"
                  className="mx-auto mb-6 object-contain"
                  style={{
                    width: "300px",
                    height: "300px",
                    maxWidth: "90vw",
                    maxHeight: "50vh",
                  }}
                />
                <h3 className="text-xl text-gray-900 font-bold mb-2">
                  {searchTerm || statusFilter !== "all"
                    ? "No matching candidates found"
                    : "No candidates found"}
                </h3>
                <p className="text-gray-600 font-medium text-lg">
                  {searchTerm || statusFilter !== "all"
                    ? "Try changing the filter or search keyword"
                    : "Share your job vacancies so that more candidates will apply."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="border border-gray-200 bg-shite rounded-lg p-5">
              {" "}
              <div className="overflow-x-auto shadow-xl rounded-sm">
                <table className="w-full border border-gray-100  ">
                  <thead className="border border-gray-100 ">
                    <tr className=" bg-gray-50 h-18 space-x-2 ">
                      <th className="text-left py-6 px-4 font-semibold text-gray-800 uppercase border-b-2 border-gray-100 border-r-4 shadow-sm">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            className="h-5 w-5 text-[#01959F] border-2 border-[#01959F] rounded focus:ring-[#01959F]/20 focus:ring-2 focus:border-[#01959F]"
                            data-state={
                              isIndeterminate
                                ? "indeterminate"
                                : isAllSelected
                                ? "checked"
                                : "unchecked"
                            }
                          />
                          <span>Nama Lengkap</span>
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-800 uppercase">
                        Email Address
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-800 uppercase">
                        Phone Number
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-800 uppercase">
                        Date of Birth
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-800 uppercase">
                        Domicile
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-800 uppercase">
                        Gender
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-800 uppercase">
                        Link Linkedin
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((application) => (
                      <tr
                        key={application.id}
                        className="hover:bg-gray-50 h-16"
                      >
                        <td className="py-3 px-4 border-r-3 border-gray-100 border-b-2 shadow-sm">
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={selectedCandidates.has(application.id)}
                              onCheckedChange={() =>
                                handleSelectCandidate(application.id)
                              }
                              className="h-5 w-5 text-[#01959F] border-2 border-[#01959F] rounded focus:ring-[#01959F]/20 focus:ring-2 focus:border-[#01959F]"
                            />
                            <div>
                              <div className="font-light text-lg text-black ">
                                {application.full_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 border-b border-gray-200">
                          {application.email}
                        </td>
                        <td className="py-3 px-4 border-b border-gray-200">
                          {application.phone}
                        </td>
                        <td className="py-3 px-4 border-b border-gray-200">
                          {application.date_of_birth}
                        </td>
                        <td className="py-3 px-4 border-b border-gray-200">
                          {application.domicile}
                        </td>
                        <td className="py-3 px-4 border-b border-gray-200 capitalize">
                          {application.gender}
                        </td>
                        <td className="py-3 px-4 border-b border-gray-200">
                          {application.linkedin ? (
                            <a
                              href={application.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#01959F] hover:text-[#017B7F] hover:underline transition-colors"
                            >
                              {application.linkedin}
                            </a>
                          ) : (
                            <span className="text-gray-400">No LinkedIn</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
