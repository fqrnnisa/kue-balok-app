"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/supabase";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; // Import Input
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Minus, Trash2, ShoppingBag, Archive, ChevronRight, Search } from "lucide-react"; // Import Search Icon

type CartItem = {
  id: string; 
  name: string; 
  price: number; 
  qty: number; 
  productName: string; 
  stockLeft: number; 
};

export default function SalesPage() {
  const supabase = createClient();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // State untuk pencarian
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('selling_units')
        .select(`*, products (name, stock_qty)`) 
        .order('name');
      
      if (data) setMenuItems(data);
    } catch (e) { 
      toast.error("Gagal memuat data"); 
    } finally { 
      setLoading(false); 
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Logika Filter Produk
  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (item: any) => {
    const maxStock = item.products?.stock_qty ?? item.stockLeft ?? 0;
    const itemInCart = cart.find(c => c.id === item.id);
    const currentQty = itemInCart?.qty || 0;
    
    if (currentQty + 1 > maxStock) {
      const unitLabel = item.products?.unit || 'Pcs';
      toast.error("Stok Habis!", { description: `Sisa stok hanya: ${maxStock} ${unitLabel}` });
      return;
    }

    setCart(prev => {
      const exists = prev.find(c => c.id === item.id);
      if (exists) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { 
        id: item.id, 
        name: item.name, 
        price: item.price, 
        qty: 1, 
        productName: item.products?.name, 
        stockLeft: maxStock
      }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item).filter(i => i.qty > 0));
  };

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Login required");

      const { error } = await supabase.from('sales_logs').insert(
        cart.map(item => ({ 
          selling_unit_id: item.id, 
          qty_sold: item.qty, 
          created_by: user.id 
        }))
      );
      if (error) throw error;
      
      toast.success("Transaksi Berhasil");
      setCart([]);
      await fetchData(); 
    } catch (e: any) { 
      toast.error(e.message); 
    } finally { 
      setProcessing(false); 
    }
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] lg:h-screen gap-6 p-4 lg:p-6 bg-slate-50/50">
      
      {/* Product List Section */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* Header + Search Bar */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kasir</h1>
            <p className="text-muted-foreground">Pilih produk untuk dijual.</p>
          </div>
          
          {/* Input Pencarian */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari menu..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white shadow-sm"
            />
          </div>
        </div>
        
        {/* Product List */}
        <ScrollArea className="flex-1 pr-4">
          <div className="flex flex-col gap-3 pb-20">
            {filteredItems.map(item => (
              <Card 
                key={item.id} 
                onClick={() => addToCart(item)}
                className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary"
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Icon Avatar */}
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                    {item.name.charAt(0)}
                  </div>
                  
                  {/* Info Produk */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate pr-2">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <Badge variant="outline" className="text-xs px-2 py-0 h-6 gap-1 font-normal text-muted-foreground border-slate-200 bg-slate-50">
                          <Archive className="w-3 h-3" /> 
                          Stok: {item.products?.stock_qty ?? 0}
                       </Badge>
                    </div>
                  </div>
                  
                  {/* Harga & Action */}
                  <div className="text-right shrink-0">
                     <div className="font-bold text-primary text-base">
                        Rp {item.price.toLocaleString('id-ID')}
                     </div>
                     <p className="text-xs text-muted-foreground mt-1 flex justify-end items-center group-hover:text-primary transition-colors">
                        Tambah <ChevronRight className="w-3 h-3 ml-1" />
                     </p>
                  </div>
                </div>
              </Card>
            ))}

            {/* Empty State jika hasil pencarian kosong */}
            {filteredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <p>Menu tidak ditemukan.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Cart Sidebar (Tidak Berubah) */}
      <Card className="w-full lg:w-96 flex flex-col shadow-lg border-none lg:border lg:h-full">
        <div className="p-4 border-b bg-muted/20">
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Pesanan
          </h2>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm">
              Keranjang kosong
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-start animate-in slide-in-from-right-2">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">@ {item.price.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(item.id, -1)}>
                      <Minus className="w-3 h-3"/>
                    </Button>
                    <span className="w-4 text-center text-sm font-medium">{item.qty}</span>
                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => addToCart(item)}>
                      <Plus className="w-3 h-3"/>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 bg-muted/20 space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-bold">Rp {total.toLocaleString('id-ID')}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" className="col-span-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setCart([])} disabled={cart.length === 0}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button className="col-span-3" onClick={handleCheckout} disabled={cart.length === 0 || processing}>
              {processing ? <Loader2 className="mr-2 animate-spin" /> : "Bayar"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}