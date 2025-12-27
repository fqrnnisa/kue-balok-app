"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/supabase";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Package } from "lucide-react";

export default function AdminInventoryPage() {
  const supabase = createClient();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Fungsi fetch data (Sama seperti staff, tapi tanpa logika insert)
  const fetchIngredients = async () => {
    let query = supabase.from('ingredients').select('*').order('name');
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data } = await query;
    if (data) setItems(data);
    setLoading(false);
  };

  // Debounce search effect
  useEffect(() => {
    const t = setTimeout(fetchIngredients, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header tanpa tombol 'Baru' */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gudang Bahan Baku</h1>
          <p className="text-muted-foreground">Monitor stok inventory (Read Only).</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600"/>
                    Daftar Stok
                </CardTitle>
                
                {/* Search Bar */}
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Cari bahan..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="pl-9 bg-white" 
                    />
                </div>
            </div>
        </CardHeader>
        
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Bahan</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead className="text-right">Stok Saat Ini</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className={`text-right font-mono font-medium ${item.stock_qty <= item.min_stock_alert ? "text-red-600" : ""}`}>
                      {item.stock_qty}
                    </TableCell>
                  </TableRow>
                ))}
                
                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Data bahan tidak ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}