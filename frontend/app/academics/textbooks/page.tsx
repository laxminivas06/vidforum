import { redirect } from "next/navigation"

export default function AcademicsTextbooksRedirect() {
  redirect("/academics?tab=textbooks")
}
