"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";

export default function ProductionInputPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState("");
  const [batchQty, setBatchQty] = useState("1");
  const [resultQty, setResultQty] = useState("");

  useEffect(() => {
    // Ambil daftar produk untuk dropdown
    // Filter produk yang aktif saja (opsional, tapi disarankan)
    supabase.from('products').select('id, name').eq('is_active', true).order('name').then(({data}) => {
      if(data) setProducts(data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !batchQty || !resultQty) return toast.error("Mohon lengkapi data");
    
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi habis, silakan login ulang.");

      const batch = parseFloat(batchQty);

      // 1. AMBIL RESEP & INFO BAHAN TERBARU
      // Tambahkan 'is_active' ke dalam query
      const { data: recipes, error: recipeError } = await supabase
        .from('product_recipes')
        .select(`
          quantity_per_batch,
          ingredients (
            id,
            name,
            stock_qty,
            unit,
            is_active
          )
        `)
        .eq('product_id', selectedProduct);

      if (recipeError) throw recipeError;

      // Validasi 1: Cek apakah produk punya resep
      if (!recipes || recipes.length === 0) {
        throw new Error("Produk ini belum memiliki RESEP! Tidak bisa diproduksi.");
      }

      // 2. VALIDASI (STATUS AKTIF & STOK)
      const errorList: string[] = [];

      recipes.forEach((r: any) => {
        const ingredient = r.ingredients;
        
        // Cek A: Apakah bahan sudah diarsipkan (Soft Delete)?
        // Kita anggap null sebagai active (backward compatibility), hanya false yang ditolak
        if (ingredient.is_active === false) {
          errorList.push(`- ${ingredient.name} (Bahan sudah DIARSIPKAN/NON-AKTIF)`);
          return; // Skip cek stok jika bahan sudah mati
        }

        // Cek B: Hitung Kebutuhan vs Stok
        const requiredQty = r.quantity_per_batch * batch; 
        const currentStock = ingredient.stock_qty || 0; 
        
        if (currentStock < requiredQty) {
          errorList.push(
            `- ${ingredient.name} (Butuh: ${requiredQty}, Ada: ${currentStock} ${ingredient.unit})`
          );
        }
      });

      // Jika ada masalah (Entah stok kurang ATAU bahan tidak aktif), lempar Error
      if (errorList.length > 0) {
        throw new Error(`Kendala Bahan Baku:\n${errorList.join('\n')}`);
      }

      // 3. SIMPAN LOG (Jika semua aman)
      const { error } = await supabase.from('production_logs').insert({
        product_id: selectedProduct,
        batch_qty: batch,
        product_result_actual: parseFloat(resultQty),
        created_by: user.id
      });

      if (error) throw error;

      toast.success("Produksi Sukses!", { 
        description: "Bahan baku telah dikurangi dari stok gudang." 
      });
      
      setResultQty(""); 
      setBatchQty("1");
      
    } catch (e: any) { 
      // Tampilkan error dengan styling agar list terlihat rapi
      toast.error("Gagal Input Produksi", { 
        description: e.message,
        style: { whiteSpace: 'pre-line' } 
      });
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Input Produksi</h1>
        <p className="text-muted-foreground">Catat hasil masakan dari dapur.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulir Harian</CardTitle>
          <CardDescription>
            Sistem memvalidasi resep, status aktif bahan, dan ketersediaan stok.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Produk yang dimasak</Label>
              <Select onValueChange={setSelectedProduct} value={selectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Jumlah Adonan (Batch)</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    step="0.1" 
                    min="0.1"
                    value={batchQty} 
                    onChange={e => setBatchQty(e.target.value)} 
                  />
                  <span className="text-sm font-medium text-muted-foreground w-12">Kali</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  *Total bahan baku akan dikalikan jumlah batch ini.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Hasil Jadi (Bersih)</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={resultQty} 
                    onChange={e => setResultQty(e.target.value)} 
                  />
                  <span className="text-sm font-medium text-muted-foreground w-12">Pcs</span>
                </div>
              </div>
            </div>

            <Button className="w-full" disabled={submitting || loading}>
              {submitting ? <Loader2 className="mr-2 animate-spin" /> : <Check className="mr-2 w-4 h-4" />}
              {submitting ? "Memvalidasi..." : "Simpan Data"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}