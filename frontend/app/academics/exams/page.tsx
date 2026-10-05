import { redirect } from "next/navigation"

export default function AcademicsExamsRedirect() {
  redirect("/academics?tab=exams")
}
