import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AuthRouteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return <>{children}</>;
}