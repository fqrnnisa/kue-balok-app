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
import { Plus, Search, Archive, AlertCircle } from "lucide-react"; 

export default function IngredientsManagePage() {
  const supabase = createClient();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", unit: "Kg", min: "5" });

  const fetch = async () => {
    let q = supabase
      .from('ingredients')
      .select('*')
      .eq('is_active', true) 
      .order('name');
      
    if(search) q = q.ilike('name', `%${search}%`);
    const { data } = await q;
    if(data) setItems(data);
  };

  useEffect(() => { const t = setTimeout(fetch, 300); return () => clearTimeout(t); }, [search]);

  const handleCreate = async () => {
    if (!form.name || form.name.trim() === "") {
      toast.error("Nama bahan wajib diisi!");
      return;
    }

    const { error } = await supabase.from('ingredients').insert({ 
      name: form.name, 
      unit: form.unit, 
      min_stock_alert: parseFloat(form.min) || 5, 
      stock_qty: 0,
      is_active: true 
    });

    if(error) {
      toast.error(error.message); 
    } else { 
      toast.success("Bahan disimpan"); 
      setOpen(false); 
      fetch(); 
      setForm({name:"", unit:"Kg", min:"5"}); 
    }
  };

  // 2. Simplified Delete Handler (Removed window.confirm)
  const handleDelete = async (id: string) => {
    // No need for confirm() here, the UI handles it
    const { error } = await supabase
      .from('ingredients')
      .update({ is_active: false })
      .eq('id', id);
    
    if(error) {
      toast.error("Gagal Menghapus: " + error.message);
    } else { 
      toast.success("Bahan berhasil dihapus"); 
      fetch(); 
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bahan Baku</h1>
          <p className="text-muted-foreground">Master data inventory.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 w-4 h-4"/> Baru</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Bahan</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Nama Bahan</span>
                <Input 
                  placeholder="Contoh: Tepung Terigu" 
                  value={form.name} 
                  onChange={e=>setForm({...form, name:e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Satuan</span>
                  <Input 
                    placeholder="Kg/Pcs" 
                    value={form.unit} 
                    onChange={e=>setForm({...form, unit:e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Min. Stok (Alert)</span>
                  <Input 
                    placeholder="5" 
                    type="number" 
                    value={form.min} 
                    onChange={e=>setForm({...form, min:e.target.value})} 
                  />
                </div>
              </div>
              
              <Button onClick={handleCreate} className="w-full" disabled={!form.name.trim()}>
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground"/>
        <Input 
          placeholder="Cari..." 
          value={search} 
          onChange={e=>setSearch(e.target.value)} 
          className="bg-white" 
        />
      </div>
      
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Satuan</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(i => {
              const isLowStock = i.stock_qty <= i.min_stock_alert;

              return (
                <TableRow key={i.id} className={isLowStock ? "bg-red-50 hover:bg-red-100" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {i.name}
                      {isLowStock && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </TableCell>
                  <TableCell>{i.unit}</TableCell>
                  <TableCell className={`text-right font-mono ${isLowStock ? "text-red-600 font-bold" : ""}`}>
                    {i.stock_qty}
                  </TableCell>
                  <TableCell>
                    {/* 3. Implemented AlertDialog Logic */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                          title="Delete Ingredient"
                        >
                          <Archive className="w-4 h-4"/>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Bahan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin delete bahan <b>"{i.name}"</b>? 
                            Data ini akan disembunyikan dari daftar tapi tidak terhapus permanen dari database.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          {/* Execute delete on confirmation */}
                          <AlertDialogAction onClick={() => handleDelete(i.id)} className="bg-orange-600 hover:bg-orange-700">
                            Ya, Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Data tidak ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}