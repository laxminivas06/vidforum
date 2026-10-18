import type { MetadataRoute } from "next"

// Installable app (phones, tablets, kiosks) for offline Face Attendance
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VID Face Attendance",
    short_name: "VID Attendance",
    start_url: "/attendance/face",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [],
  }
}
