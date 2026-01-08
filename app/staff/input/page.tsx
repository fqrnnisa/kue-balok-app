import { createClient } from "@/lib/supabase/server";
import { submitProduction } from "@/app/actions/productions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"; // Optional, adds nice touch

export default async function ProductionInputPage() {
  const supabase = await createClient();

  // Ambil daftar produk
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  // --- FIX: Wrapper Function ---
  async function handleProductionSubmit(formData: FormData) {
    "use server";
    await submitProduction(formData);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Input Produksi</h1>
        <p className="text-muted-foreground">
          Catat hasil produksi harian. Stok bahan akan otomatis terpotong.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Produksi</CardTitle>
          <CardDescription>
            Pastikan jumlah batch dan hasil aktual sesuai dengan resep.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleProductionSubmit} className="space-y-6">
            
            {/* Pilih Produk */}
            <div className="space-y-2">
              <Label htmlFor="product_id">Produk Dibuat</Label>
              <select 
                id="product_id"
                name="product_id" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                defaultValue=""
              >
                <option value="" disabled>-- Pilih Produk --</option>
                {products?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Jumlah Batch */}
              <div className="space-y-2">
                <Label htmlFor="batch_qty">Jml Batch (Adonan)</Label>
                <Input 
                  id="batch_qty"
                  type="number" 
                  name="batch_qty" 
                  step="0.1" 
                  defaultValue="1" 
                  required 
                  placeholder="Contoh: 1.5"
                />
                <p className="text-[0.8rem] text-muted-foreground">
                  Dikali resep per batch.
                </p>
              </div>

              {/* Hasil Jadi */}
              <div className="space-y-2">
                <Label htmlFor="actual_result">Hasil Jadi (Qty)</Label>
                <Input 
                  id="actual_result"
                  type="number" 
                  name="actual_result" 
                  required 
                  placeholder="Total Pcs"
                />
              </div>
            </div>

            {/* Catatan */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea 
                id="notes"
                name="notes" 
                rows={3} 
                placeholder="Ada kejadian khusus saat produksi?" 
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Simpan & Update Stok
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}