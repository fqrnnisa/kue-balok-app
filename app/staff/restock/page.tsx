import { createClient } from "@/lib/supabase/server";
import { submitRestock } from "@/app/actions/productions";
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

export default async function RestockPage() {
  const supabase = await createClient();
  
  // Ambil daftar bahan baku
  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("id, name, unit, stock_qty")
    .eq("is_active", true)
    .order("name");

  // --- FIX: Wrapper Function ---
  async function handleRestockSubmit(formData: FormData) {
    "use server";
    await submitRestock(formData);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Restock Bahan Baku</h1>
        <p className="text-muted-foreground">
          Catat pembelian atau penambahan stok bahan baku baru.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Restock</CardTitle>
          <CardDescription>
            Stok akan bertambah sesuai jumlah yang diinput.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleRestockSubmit} className="space-y-6">
            
            {/* Pilih Bahan */}
            <div className="space-y-2">
              <Label htmlFor="ingredient_id">Bahan Baku</Label>
              <select 
                id="ingredient_id"
                name="ingredient_id" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                defaultValue=""
              >
                <option value="" disabled>-- Pilih Bahan --</option>
                {ingredients?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Sisa: {item.stock_qty} {item.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Input Jumlah */}
            <div className="space-y-2">
              <Label htmlFor="qty">Jumlah Masuk</Label>
              <Input 
                id="qty"
                type="number" 
                name="qty" 
                step="0.01" 
                required 
                placeholder="0.00"
              />
            </div>

            {/* Catatan */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan / Supplier</Label>
              <Textarea 
                id="notes"
                name="notes" 
                rows={3} 
                placeholder="Beli di mana? No nota?" 
              />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Simpan Stok Masuk
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}