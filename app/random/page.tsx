import { getRandomJobs } from "@/lib/services/job-service";
import RandomPageClient from "./RandomPageClient";

export default async function RandomPage() {
  const jobs = await getRandomJobs(20);

  return (
    <div className="min-h-screen relative z-10">
      <RandomPageClient initialJobs={jobs} />
    </div>
  );
}
