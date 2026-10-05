import { redirect } from "next/navigation"

export default function AcademicsCalendarRedirect() {
  redirect("/academics?tab=calendar")
}
