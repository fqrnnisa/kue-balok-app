"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// 1. Import Alert Dialog Components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Archive, Package } from "lucide-react";

export default function ProductsManagePage() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    let q = supabase.from('products').select('*').eq('is_active', true).order('name');
    if(search) q = q.ilike('name', `%${search}%`);
    
    const { data } = await q;
    if(data) setProducts(data);
  };

  useEffect(() => { const t = setTimeout(fetch, 300); return () => clearTimeout(t); }, [search]);

  const handleCreate = async () => {
    if (!newName || !newPrice) return toast.error("Isi nama dan harga");
    setLoading(true);
    try {
      const { data: prod, error: pe } = await supabase
        .from('products')
        .insert({ name: newName, stock_qty: 0, is_active: true })
        .select()
        .single();
      if(pe) throw pe;

      const { error: se } = await supabase
        .from('selling_units')
        .insert({ product_id: prod.id, name: newName, price: parseFloat(newPrice), qty_content: 1 });
      if(se) throw se;

      toast.success("Produk dibuat"); 
      setOpen(false); fetch(); setNewName(""); setNewPrice("");
    } catch(e:any){ 
      toast.error("Gagal: " + e.message); 
    } finally {
      setLoading(false);
    }
  };

  // 2. Remove 'confirm()' from handler, logic only
  const handleArchive = async (id: string) => {
    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
    
    if(error) {
      toast.error("Gagal menghapus");
      console.error(error);
    } else { 
      toast.success("Produk dihapus"); 
      fetch(); 
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Produk</h1>
          <p className="text-muted-foreground">Master data produk jual.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 w-4 h-4"/> Baru</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Produk Baru</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <Input placeholder="Nama Produk" value={newName} onChange={e=>setNewName(e.target.value)} />
              <Input type="number" placeholder="Harga Satuan" value={newPrice} onChange={e=>setNewPrice(e.target.value)} />
              <Button onClick={handleCreate} disabled={loading} className="w-full">
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground"/>
        <Input placeholder="Cari..." value={search} onChange={e=>setSearch(e.target.value)} className="bg-white" />
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground"/>
                  {p.name}
                </TableCell>
                <TableCell className="text-right font-mono">{p.stock_qty}</TableCell>
                <TableCell>
                  {/* 3. Implement AlertDialog Logic */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                        title="Dekete Product"
                      >
                        <Archive className="w-4 h-4"/>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus <b>"{p.name}"</b>? 
                          Produk ini tidak akan muncul di menu kasir, namun riwayat transaksi lama tetap tersimpan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleArchive(p.id)}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          Ya, Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {/* End AlertDialog */}
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  Tidak ada produk aktif.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}