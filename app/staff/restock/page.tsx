import { createClient } from "@/lib/supabase/server";
import { submitRestock } from "@/app/actions/productions";

export default async function RestockPage() {
  const supabase = await createClient();
  
  // Ambil daftar bahan baku
  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("id, name, unit, stock_qty")
    .eq("is_active", true)
    .order("name");

  // --- FIX: Wrapper Function ---
  // Fungsi ini membungkus server action agar tipe return-nya menjadi 'void' (Promise<void>)
  // sehingga sesuai dengan standar TypeScript untuk properti <form action={...}>
  async function handleRestockSubmit(formData: FormData) {
    "use server";
    await submitRestock(formData);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Restock Bahan Baku</h1>
        <p className="text-slate-500">Catat pembelian atau penambahan stok bahan baku baru.</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-slate-200 p-6">
        {/* Update action ke wrapper function */}
        <form action={handleRestockSubmit} className="space-y-4">
          
          {/* Pilih Bahan */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bahan Baku</label>
            <select name="ingredient_id" className="w-full border-slate-300 rounded-md shadow-sm p-2 border" required>
              <option value="">-- Pilih Bahan --</option>
              {ingredients?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (Sisa: {item.stock_qty} {item.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Input Jumlah */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Masuk</label>
            <input 
              type="number" 
              name="qty" 
              step="0.01" 
              required 
              className="w-full border-slate-300 rounded-md shadow-sm p-2 border"
              placeholder="0.00"
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan / Supplier</label>
            <textarea name="notes" rows={2} className="w-full border-slate-300 rounded-md shadow-sm p-2 border"></textarea>
          </div>

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-md transition">
            Simpan Stok Masuk
          </button>
        </form>
      </div>
    </div>
  );
}