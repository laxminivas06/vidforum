import { redirect } from "next/navigation"

export default function AcademicsYearsRedirect() {
  redirect("/academics?tab=years")
}
