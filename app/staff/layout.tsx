import { StaffSidebar } from "@/components/staff-sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Optional: Cek role lagi jika ingin strict
  // const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  // if (!profile) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-slate-50">
      <StaffSidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          {children}
        </div>
      </main>
    </div>
  );
}