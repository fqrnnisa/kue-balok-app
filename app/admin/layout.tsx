import { AdminSidebar } from "@/components/admin-sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Cek User Login (Server Side Check)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Kalau belum login -> Lempar ke Login
  if (!user) {
    redirect("/");
  }

  // 2. Cek Role (Double Security)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Kalau bukan admin -> Lempar ke Staff
  if (profile?.role !== 'admin') {
    redirect("/staff/input");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}