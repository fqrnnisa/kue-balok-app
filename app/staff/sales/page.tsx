"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/supabase";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, Plus, Minus, Trash2, ShoppingBag, 
  Archive, Search, ChevronUp, ChevronDown 
} from "lucide-react";

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
  const [search, setSearch] = useState("");
  
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Note: fetching image_url from products relation
      const { data } = await supabase
        .from('selling_units')
        .select(`*, products (name, stock_qty, image_url)`) 
        .order('name');
      
      if (data) setMenuItems(data);
    } catch (e) { 
      toast.error("Gagal memuat data"); 
    } finally { 
      setLoading(false); 
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (item: any) => {
    const maxStock = item.products?.stock_qty ?? item.stockLeft ?? 0;
    const itemInCart = cart.find(c => c.id === item.id);
    const currentQty = itemInCart?.qty || 0;
    
    if (currentQty + 1 > maxStock) {
      toast.error("Stok Habis!", { description: `Sisa stok hanya: ${maxStock}` });
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
          created_by: user.id,
          // --- NEW LOGIC: SNAPSHOT PRICE ---
          // Stores the price at the exact moment of sale
          price_at_sale: item.price 
          // ---------------------------------
        }))
      );
      if (error) throw error;
      
      toast.success("Transaksi Berhasil");
      setCart([]);
      setIsMobileCartOpen(false); 
      await fetchData(); 
    } catch (e: any) { 
      toast.error(e.message); 
    } finally { 
      setProcessing(false); 
    }
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  if (loading) return <div className="flex h-[100dvh] items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] w-full overflow-hidden bg-slate-50">
      
      {/* --- LEFT SIDE: MENU LIST --- */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        
        {/* Header & Search */}
        <div className="p-4 lg:p-6 pb-2 shrink-0 z-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Kasir</h1>
              <p className="text-sm text-muted-foreground hidden lg:block">Pilih produk untuk dijual.</p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari menu..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white shadow-sm border-slate-200"
              />
            </div>
          </div>
        </div>
        
        {/* MENU ITEMS SCROLL AREA */}
        <ScrollArea className="flex-1 max-h-full pb-32 px-4 lg:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 pb-40">
            {filteredItems.map(item => (
              <Card 
                key={item.id} 
                onClick={() => addToCart(item)}
                className="group relative w-full cursor-pointer hover:border-primary-500/50 hover:shadow-md transition-all duration-200 border-transparent hover:border-l-primary-500 bg-white overflow-hidden border"
              >
                <div className="p-4 flex flex-row items-start gap-4 h-full">
                  
                  {/* --- Icon Box / Image --- */}
                  <div className="h-16 w-16 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-lg shrink-0 border border-primary-100 group-hover:bg-primary-100 transition-colors overflow-hidden">
                    {item.products?.image_url ? (
                      <img 
                        src={item.products.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{item.name.charAt(0)}</span>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-semibold text-sm lg:text-base text-slate-900 leading-tight mb-1 line-clamp-2">
                        {item.name}
                      </h3>
                      <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal text-slate-500 bg-slate-100 border-slate-200">
                         Stok: {item.products?.stock_qty ?? 0}
                      </Badge>
                    </div>
                    
                    {/* Price at bottom of content area */}
                    <div className="mt-2 font-bold text-primary-600 text-sm lg:text-base">
                      Rp {item.price.toLocaleString('id-ID')}
                    </div>
                  </div>

                  {/* Add Button (Visual Only) */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center shadow-sm">
                        <Plus className="w-5 h-5" />
                     </div>
                  </div>
                </div>
              </Card>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Search className="h-10 w-10 mb-3 opacity-20" />
                <p>Menu tidak ditemukan.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* --- RIGHT SIDE: CART --- */}
      <>
        {isMobileCartOpen && (
          <div 
            className="relative inset-0 bg-black/20 z-20 lg:hidden backdrop-blur-[1px]" 
            onClick={() => setIsMobileCartOpen(false)}
          />
        )}

        <div className={`
            fixed bottom-0 left-0 right-0 z-30 flex flex-col bg-white border-t shadow-2xl transition-transform duration-300 ease-in-out
            lg:static lg:w-96 lg:h-full lg:border-t-0 lg:border-l lg:shadow-none lg:transform-none
            ${isMobileCartOpen ? 'translate-y-0' : 'translate-y-0'} 
        `}>
          
          <div 
            className="flex items-center justify-center p-2 lg:hidden cursor-pointer active:bg-slate-50"
            onClick={() => setIsMobileCartOpen(!isMobileCartOpen)}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </div>

          <div className="px-5 py-4 border-b bg-slate-50/50 hidden lg:flex items-center justify-between shrink-0">
            <h2 className="font-semibold flex items-center gap-2 text-base">
              <ShoppingBag className="w-5 h-5 text-slate-500" /> Pesanan
            </h2>
            <Badge variant="secondary" className="font-normal bg-white border">{cart.length} Item</Badge>
          </div>

          <div className={`
             flex-1 overflow-hidden transition-all duration-300
             ${isMobileCartOpen ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0 lg:max-h-full lg:opacity-100'}
          `}>
             <ScrollArea className="h-fit p-4 lg:p-5">
              {cart.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50 m-2">
                  <ShoppingBag className="w-10 h-10 mb-2 opacity-20" />
                  Belum ada pesanan
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 items-start bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-2">{item.name}</p>
                        <p className="text-xs text-slate-500 mt-1">@ Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 bg-slate-50 rounded-lg p-1 border border-slate-100">
                        <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-white text-slate-600 transition-colors" onClick={() => updateQty(item.id, -1)}>
                          <Minus className="w-3 h-3"/>
                        </button>
                        <span className="w-4 text-center text-sm font-semibold tabular-nums">{item.qty}</span>
                        <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-white text-slate-600 transition-colors" onClick={() => addToCart(item)}>
                          <Plus className="w-3 h-3"/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="p-5 bg-white border-t space-y-4 shrink-0 lg:bg-slate-50/30 safe-area-bottom">
            <div 
              className="flex justify-between items-end lg:hidden cursor-pointer" 
              onClick={() => setIsMobileCartOpen(!isMobileCartOpen)}
            >
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Pembayaran</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-slate-900">Rp {total.toLocaleString('id-ID')}</span>
                  {isMobileCartOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                </div>
              </div>
              <Badge variant="outline" className="mb-2 bg-slate-100">
                {cart.length} Item
              </Badge>
            </div>

            <div className="hidden lg:flex justify-between items-end">
              <span className="text-sm text-muted-foreground">Total Tagihan</span>
              <span className="text-2xl font-bold text-slate-900">Rp {total.toLocaleString('id-ID')}</span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                className="col-span-1 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 h-12" 
                onClick={() => setCart([])} 
                disabled={cart.length === 0}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
              <Button 
                className="col-span-3 bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 text-base shadow-lg shadow-slate-900/20" 
                onClick={handleCheckout} 
                disabled={cart.length === 0 || processing}
              >
                {processing ? <Loader2 className="mr-2 animate-spin" /> : "Bayar Sekarang"}
              </Button>
            </div>
          </div>
        </div>
      </>
    </div>
  );
}