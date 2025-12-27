"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowDownToLine } from "lucide-react";

export default function RestockPage() {
  const supabase = createClient();
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState("");

  useEffect(() => {
    supabase.from('ingredients').select('*').order('name').then(({data}) => {
      if(data) setIngredients(data);
    });
  }, []);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !qty) return toast.error("Data tidak lengkap");
    setSubmitting(true);

    try {
      const current = ingredients.find(i => i.id === selectedId);
      const newStock = (current?.stock_qty || 0) + parseFloat(qty);
      
      const { error } = await supabase.from('ingredients').update({ stock_qty: newStock }).eq('id', selectedId);
      if (error) throw error;

      toast.success("Stok ditambahkan!");
      setQty(""); setSelectedId("");
      
      // Refresh local state to avoid stale data visual
      setIngredients(prev => prev.map(i => i.id === selectedId ? {...i, stock_qty: newStock} : i));
    } catch (e: any) { toast.error(e.message); } 
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-xl mx-auto p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stok Masuk</h1>
        <p className="text-muted-foreground">Input bahan baku yang baru dibeli.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Terima Barang</CardTitle>
          <CardDescription>Stok gudang akan bertambah sesuai input.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRestock} className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Bahan</Label>
              <Select onValueChange={setSelectedId} value={selectedId}>
                <SelectTrigger><SelectValue placeholder="Pilih item..." /></SelectTrigger>
                <SelectContent>
                  {ingredients.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.name} (Stok: {i.stock_qty} {i.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jumlah Masuk</Label>
              <Input type="number" step="0.1" placeholder="0.0" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <Button className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 animate-spin" /> : <ArrowDownToLine className="mr-2 w-4 h-4" />}
              Simpan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}