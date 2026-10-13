import { redirect } from "next/navigation"

export default function FacultyMyStudentsRedirect() {
  redirect("/faculty/mentees")
}
