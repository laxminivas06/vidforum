import { redirect } from "next/navigation"

export default function HRMSOnLeaveRedirect() {
  redirect("/hrms/staff?status=ON_LEAVE")
}
