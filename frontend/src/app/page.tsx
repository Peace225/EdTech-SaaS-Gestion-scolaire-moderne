
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const role = (session.user as { role?: string }).role;

    switch (role) {
      case "ADMIN":
        redirect("/admin/dashboard");
      case "TEACHER":
        redirect("/teacher/dashboard");
      case "PARENT":
        redirect("/parent/dashboard");
      case "STUDENT":
        redirect("/student/dashboard");
    }
  }

  return <LandingPage />;
}
