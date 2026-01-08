import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default async function InventoryReportPage() {
  const supabase = await createClient();

  // Ambil Data Logs join Ingredients
  const { data: logs } = await supabase
    .from("ingredient_logs")
    .select(`
      *,
      ingredients (name, unit),
      profiles (full_name)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Mutasi Stok</h1>
          <p className="text-slate-500">Riwayat pergerakan bahan baku (Masuk/Keluar).</p>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
            <tr>
              <th className="px-6 py-4">Waktu</th>
              <th className="px-6 py-4">Bahan Baku</th>
              <th className="px-6 py-4">Tipe Transaksi</th>
              <th className="px-6 py-4 text-right">Jumlah</th>
              <th className="px-6 py-4">Staff</th>
              <th className="px-6 py-4">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs?.map((log) => {
              const isRestock = log.action_type === 'RESTOCK';
              
              return (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-slate-600">
                    {format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: id })}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {log.ingredients?.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      isRestock 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {isRestock ? "RESTOCK" : "PRODUKSI"}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${
                    isRestock ? "text-emerald-600" : "text-amber-600"
                  }`}>
                    {log.change_qty > 0 ? "+" : ""}{log.change_qty} {log.ingredients?.unit}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {log.profiles?.full_name || "System"}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs italic">
                    {log.notes}
                  </td>
                </tr>
              );
            })}
            
            {logs?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  Belum ada data transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}