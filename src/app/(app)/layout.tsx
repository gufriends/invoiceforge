import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Topbar } from "@/components/layouts/topbar";
import { KeyboardShortcuts } from "@/components/layouts/keyboard-shortcuts";
import { GlobalSearch } from "@/components/layouts/global-search";
import { PageTransition } from "@/components/animations/page-transition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <PageTransition>{children}</PageTransition>
        </main>
      </SidebarInset>
      <KeyboardShortcuts />
      <GlobalSearch />
    </SidebarProvider>
  );
}
