"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Save, Info } from "lucide-react";

export default function RecipeManagePage() {
  const supabase = createClient();
  
  // State Data
  const [products, setProducts] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [recipe, setRecipe] = useState<any[]>([]);
  
  // State Selection & Form
  const [selectedProd, setSelectedProd] = useState<string | null>(null);
  const [expectedQty, setExpectedQty] = useState<string>(""); // State untuk Target Produksi
  const [form, setForm] = useState({ ingId: "", qty: "" });
  const [loading, setLoading] = useState(false);

  // 1. Load Initial Data (Products & Ingredients)
  useEffect(() => {
    const init = async () => {
      const [p, i] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('ingredients').select('*').order('name')
      ]);
      if (p.data) setProducts(p.data);
      if (i.data) setIngredients(i.data);
    };
    init();
  }, []);

  // 2. Load Recipe & Product Settings when Product Changes
  useEffect(() => {
    if (!selectedProd) return;

    const fetchData = async () => {
      setLoading(true);
      
      // Ambil komposisi resep
      const recipeReq = supabase
        .from('product_recipes')
        .select('id, quantity_per_batch, ingredients(id, name, unit)')
        .eq('product_id', selectedProd);

      // Ambil setting produk (Target Produksi)
      const productReq = supabase
        .from('products')
        .select('product_result_expected')
        .eq('id', selectedProd)
        .single();

      const [resRecipe, resProduct] = await Promise.all([recipeReq, productReq]);

      if (resRecipe.data) setRecipe(resRecipe.data);
      
      // Set nilai input target produksi dari database
      if (resProduct.data) {
        setExpectedQty(resProduct.data.product_result_expected?.toString() || "");
      } else {
        setExpectedQty("");
      }
      
      setLoading(false);
    };

    fetchData();
  }, [selectedProd]);

  // 3. Add Ingredient to Recipe
  const addIng = async () => {
    if (!selectedProd || !form.ingId || !form.qty) return;
    
    const { error } = await supabase.from('product_recipes').insert({
      product_id: selectedProd,
      ingredient_id: form.ingId,
      quantity_per_batch: form.qty
    });

    if (!error) {
      toast.success("Bahan ditambahkan");
      setForm({ ingId: "", qty: "" });
      // Refresh list resep
      const { data } = await supabase
        .from('product_recipes')
        .select('id, quantity_per_batch, ingredients(id, name, unit)')
        .eq('product_id', selectedProd);
      if (data) setRecipe(data);
    } else {
      toast.error("Gagal menambahkan bahan");
    }
  };

  // 4. Remove Ingredient
  const removeIng = async (id: string) => {
    const { error } = await supabase.from('product_recipes').delete().eq('id', id);
    if (!error) {
      setRecipe(prev => prev.filter(r => r.id !== id));
      toast.success("Bahan dihapus");
    }
  };

  // 5. Save Product Target Settings (Fungsi Baru)
  const saveProductSettings = async () => {
    if (!selectedProd) return;
    
    const { error } = await supabase
      .from('products')
      .update({ product_result_expected: expectedQty ? parseFloat(expectedQty) : 0 })
      .eq('id', selectedProd);

    if (!error) {
      toast.success("Target produksi berhasil disimpan!");
    } else {
      console.error(error);
      toast.error("Gagal menyimpan target. Pastikan kolom 'product_result_expected' ada di tabel products.");
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resep & Standar Produksi</h1>
        <p className="text-muted-foreground">Atur komposisi bahan dan target hasil untuk setiap produk.</p>
      </div>
      
      <div className="grid md:grid-cols-12 gap-6">
        {/* Kolom Kiri: Pilih Produk */}
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Pilih Produk</CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={setSelectedProd} value={selectedProd || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Produk..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedProd && (
                <p className="text-sm text-muted-foreground mt-4 italic">
                  Silakan pilih produk untuk mulai mengedit resep dan target.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Detail Resep & Target */}
        {selectedProd && (
          <div className="md:col-span-8 space-y-6">
            
            {/* Bagian 1: Target Produksi (Yang Anda minta) */}
            <Card className="border-blue-100 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600"/> 
                  Target Hasil Produksi (Yield)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                  <div className="text-sm text-muted-foreground flex-1">
                    Berapa pcs/pack produk jadi yang dihasilkan dari <strong>1x adonan</strong> (batch) resep di bawah ini?
                    <br/>
                    <span className="text-xs opacity-70">Angka ini akan digunakan otomatis saat input log produksi.</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input 
                      placeholder="Contoh: 50" 
                      type="number" 
                      value={expectedQty} 
                      onChange={e => setExpectedQty(e.target.value)} 
                      className="w-full sm:w-32 bg-white"
                    />
                    <Button onClick={saveProductSettings} size="sm" className="shrink-0">
                      <Save className="w-4 h-4 mr-2" />
                      Simpan Target
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bagian 2: Komposisi Bahan */}
            <Card>
              <CardHeader>
                <CardTitle>Komposisi Bahan (Per Batch)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Form Tambah Bahan */}
                <div className="flex flex-col sm:flex-row gap-3 items-end p-4 bg-muted/40 rounded-lg border">
                  <div className="flex-1 space-y-2 w-full">
                    <span className="text-sm font-medium">Bahan Baku</span>
                    <Select onValueChange={v => setForm({...form, ingId:v})} value={form.ingId}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Pilih Bahan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map(i => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name} ({i.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full sm:w-32 space-y-2">
                    <span className="text-sm font-medium">Qty ({ingredients.find(i=>i.id===form.ingId)?.unit || 'Unit'})</span>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={form.qty} 
                      onChange={e => setForm({...form, qty:e.target.value})} 
                      className="bg-white" 
                    />
                  </div>
                  <Button onClick={addIng} disabled={!form.ingId || !form.qty}>
                    <Plus className="w-4 h-4 mr-2 sm:mr-0"/> <span className="sm:hidden">Tambah</span>
                  </Button>
                </div>

                {/* Tabel List Bahan */}
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Bahan</TableHead>
                        <TableHead className="text-right">Jumlah Dibutuhkan</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipe.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.ingredients.name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {r.quantity_per_batch} <span className="text-muted-foreground text-xs">{r.ingredients.unit}</span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeIng(r.id)} 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4"/>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {recipe.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            Belum ada komposisi bahan untuk produk ini.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}