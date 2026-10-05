import { redirect } from "next/navigation"

export default function AcademicsSubjectsRedirect() {
  redirect("/academics?tab=subjects")
}
