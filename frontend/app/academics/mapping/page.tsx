import { redirect } from "next/navigation"

export default function AcademicsMappingRedirect() {
  redirect("/academics?tab=mapping")
}
