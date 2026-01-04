"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
// Added Pencil icon
import { Plus, Search, Archive, Package, Image as ImageIcon, Pencil } from "lucide-react";

export default function ProductsManagePage() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  
  // State Form
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // New State for Edit Mode
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    // Modified select to include price from selling_units for the edit form
    let q = supabase
      .from('products')
      .select('*, selling_units(price)')
      .eq('is_active', true)
      .order('name');
    
    if(search) q = q.ilike('name', `%${search}%`);
    
    const { data } = await q;
    if(data) setProducts(data);
  };

  useEffect(() => { const t = setTimeout(fetch, 300); return () => clearTimeout(t); }, [search]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  // Helper to reset form state
  const resetForm = () => {
    setNewName("");
    setNewPrice("");
    setImageFile(null);
    setEditingId(null);
  };

  // Pre-fill form when Edit button is clicked
  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setNewName(product.name);
    // Get price from the joined selling_units array (assuming 1 unit per product for now)
    const currentPrice = product.selling_units?.[0]?.price || "";
    setNewPrice(currentPrice.toString());
    setImageFile(null); // Clear file input so we don't upload unless changed
    setOpen(true);
  };

  const handleCreate = async () => {
    if (!newName || !newPrice) return toast.error("Isi nama dan harga");
    setLoading(true);
    
    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images') 
          .upload(filePath, imageFile);

        if (uploadError) throw new Error("Gagal upload gambar: " + uploadError.message);

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrlData.publicUrl;
      }

      const { data: prod, error: pe } = await supabase
        .from('products')
        .insert({ 
          name: newName, 
          stock_qty: 0, 
          is_active: true,
          image_url: imageUrl 
        })
        .select()
        .single();
      if(pe) throw pe;

      const { error: se } = await supabase
        .from('selling_units')
        .insert({ product_id: prod.id, name: newName, price: parseFloat(newPrice), qty_content: 1 });
      if(se) throw se;

      toast.success("Produk berhasil dibuat"); 
      
      setOpen(false); 
      fetch(); 
      resetForm();

    } catch(e:any){ 
      toast.error("Gagal: " + e.message); 
    } finally {
      setLoading(false);
    }
  };

  // New Function for Update Logic
  const handleUpdate = async () => {
    if (!newName || !newPrice || !editingId) return toast.error("Data tidak lengkap");
    setLoading(true);

    try {
      let imageUrl = undefined; // undefined means "don't update this column"

      // Only upload if a new file is selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

        if (uploadError) throw new Error("Gagal upload gambar: " + uploadError.message);

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      // 1. Update Product Table
      const updateData: any = { name: newName };
      if (imageUrl) updateData.image_url = imageUrl;

      const { error: pe } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', editingId);

      if (pe) throw pe;

      // 2. Update Selling Units (Price)
      // Note: This updates all units for this product. 
      // In a complex system you might need to update specific unit IDs.
      const { error: se } = await supabase
        .from('selling_units')
        .update({ name: newName, price: parseFloat(newPrice) })
        .eq('product_id', editingId);
      
      if (se) throw se;

      toast.success("Produk berhasil diperbarui");
      setOpen(false);
      fetch();
      resetForm();

    } catch(e:any) {
      toast.error("Gagal update: " + e.message);
    } finally {
      setLoading(false);
    }
  };

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
        
        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) resetForm(); // Reset form when dialog closes
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 w-4 h-4"/> Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Produk" : "Produk Baru"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              
              {/* Input Nama */}
              <div className="space-y-2">
                <Input 
                  placeholder="Nama Produk" 
                  value={newName} 
                  onChange={e=>setNewName(e.target.value)} 
                />
              </div>

              {/* Input Harga */}
              <div className="space-y-2">
                <Input 
                  type="number" 
                  placeholder="Harga Satuan (Rp)" 
                  value={newPrice} 
                  onChange={e=>setNewPrice(e.target.value)} 
                />
              </div>

              {/* Input Gambar */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-slate-50">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="border-0 bg-transparent shadow-none p-0 h-auto file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-2 file:text-xs file:mr-2 cursor-pointer"
                  />
                </div>
                
                {imageFile ? (
                  <p className="text-xs text-green-600 truncate">
                    File baru: {imageFile.name}
                  </p>
                ) : editingId && (
                  <p className="text-xs text-muted-foreground">
                    *Biarkan kosong jika tidak ingin mengubah gambar
                  </p>
                )}
              </div>

              {/* Conditional Button Action */}
              <Button 
                onClick={editingId ? handleUpdate : handleCreate} 
                disabled={loading} 
                className="w-full"
              >
                {loading ? "Menyimpan..." : (editingId ? "Update Produk" : "Simpan Produk")}
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
              <TableHead>Produk</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium flex items-center gap-3">
                  {p.image_url ? (
                    <img 
                      src={p.image_url} 
                      alt={p.name} 
                      className="w-10 h-10 object-cover rounded bg-slate-100"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center rounded bg-slate-100 text-slate-400">
                      <Package className="w-5 h-5"/>
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    {/* Display price in table list for better visibility */}
                    <div className="text-xs text-muted-foreground">
                      Rp {p.selling_units?.[0]?.price?.toLocaleString('id-ID') ?? '-'}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">{p.stock_qty}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    
                    {/* EDIT BUTTON */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                      title="Edit Produk"
                      onClick={() => handleEditClick(p)}
                    >
                      <Pencil className="w-4 h-4"/>
                    </Button>

                    {/* DELETE BUTTON */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                          title="Hapus Produk"
                        >
                          <Archive className="w-4 h-4"/>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus <b>"{p.name}"</b>? 
                            Produk ini tidak akan muncul di menu kasir.
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
                  </div>
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