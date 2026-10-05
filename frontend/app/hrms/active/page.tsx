import { redirect } from "next/navigation"

export default function HRMSActiveRedirect() {
  redirect("/hrms/staff?status=ACTIVE")
}
