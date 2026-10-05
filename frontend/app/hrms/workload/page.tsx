import { redirect } from "next/navigation"

export default function HRMSWorkloadRedirect() {
  redirect("/hrms/staff?tab=workload")
}
