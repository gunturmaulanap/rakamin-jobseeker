import ProtectedPage from "@/components/ProtectedPage";
import CandidateClient from "./components/CandidateClient";

export default function CandidatePage() {
  return (
    <ProtectedPage allowedRoles={["candidate"]}>
      <CandidateClient />
    </ProtectedPage>
  );
}
