import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layouts/sidebar";
import { MobileSidebar } from "@/components/layouts/mobile-sidebar";
import { Topbar } from "@/components/layouts/topbar";
import { KeyboardShortcuts } from "@/components/layouts/keyboard-shortcuts";
import { GlobalSearch } from "@/components/layouts/global-search";
import { PageTransition } from "@/components/animations/page-transition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <KeyboardShortcuts />
      <GlobalSearch />
    </div>
  );
}
