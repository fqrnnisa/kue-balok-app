import { createClient } from "@/lib/supabase/server";
import { submitProduction } from "@/app/actions/productions";

export default async function ProductionInputPage() {
  const supabase = await createClient();

  // Ambil daftar produk
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  // --- FIX: Wrapper Function ---
  // Fungsi ini membungkus action asli untuk memenuhi syarat tipe data <form>
  // dan mengabaikan return value (karena ini Server Component, kita tidak bisa handle error UI di sini)
  async function handleProductionSubmit(formData: FormData) {
    "use server";
    await submitProduction(formData);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Input Produksi</h1>
        <p className="text-slate-500">Catat hasil produksi. Stok bahan baku akan berkurang otomatis sesuai resep.</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-slate-200 p-6">
        {/* GUNAKAN WRAPPER DI SINI */}
        <form action={handleProductionSubmit} className="space-y-5">
          
          {/* Pilih Produk */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Produk Dibuat</label>
            <select name="product_id" className="w-full border-slate-300 rounded-md shadow-sm p-2 border" required>
              <option value="">-- Pilih Produk --</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Jumlah Batch */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jml Batch (Adonan)</label>
              <input 
                type="number" 
                name="batch_qty" 
                step="0.1" 
                defaultValue="1" 
                required 
                className="w-full border-slate-300 rounded-md shadow-sm p-2 border"
              />
              <p className="text-xs text-slate-400 mt-1">Dikali resep per batch.</p>
            </div>

            {/* Hasil Jadi */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hasil Jadi (Qty)</label>
              <input 
                type="number" 
                name="actual_result" 
                required 
                className="w-full border-slate-300 rounded-md shadow-sm p-2 border"
                placeholder="Total Pcs"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan (Opsional)</label>
            <textarea name="notes" rows={2} className="w-full border-slate-300 rounded-md shadow-sm p-2 border"></textarea>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition">
            Simpan & Update Stok
          </button>
        </form>
      </div>
    </div>
  );
}