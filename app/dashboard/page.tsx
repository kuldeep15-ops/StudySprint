
import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export const instant = false;

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="p-10 text-center">Loading dashboard...</main>}>
      <DashboardContent />
    </Suspense>
  );
}
