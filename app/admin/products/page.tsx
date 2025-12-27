"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/supabase"; // Client Client
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChefHat, Package, ShoppingCart, Eye } from "lucide-react";

export default function ProductsPage() {
  const supabase = createClient();

  const [products, setProducts] = useState<any[]>([]);
  const [sellingUnits, setSellingUnits] = useState<any[]>([]);
  
  // State untuk Resep (Grouped)
  const [groupedRecipes, setGroupedRecipes] = useState<Record<string, any[]>>({});
  
  // State untuk Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<{name: string, ingredients: any[]} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Produk
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (prodData) setProducts(prodData);

      // 2. Fetch Menu Jualan
      const { data: sellData } = await supabase
        .from('selling_units')
        .select(`*, products(name)`)
        .order('price');
      if (sellData) setSellingUnits(sellData);

      // 3. Fetch Resep & Grouping
      const { data: recipeData } = await supabase
        .from('product_recipes')
        .select(`
          id,
          quantity_per_batch,
          ingredients (name, unit),
          products (name)
        `)
        .order('product_id');

      if (recipeData) {
        // Logika Grouping: { "Donat": [Bahan A, Bahan B], "Kue Balok": [...] }
        const groups: Record<string, any[]> = {};
        recipeData.forEach((item: any) => {
          const pName = item.products?.name || "Unknown";
          if (!groups[pName]) {
            groups[pName] = [];
          }
          groups[pName].push(item);
        });
        setGroupedRecipes(groups);
      }
    };

    fetchData();
  }, []);

  // Handler saat baris resep diklik
  const handleRowClick = (productName: string) => {
    setSelectedProductDetails({
      name: productName,
      ingredients: groupedRecipes[productName] || []
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 p-1">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Produk & Resep</h1>
        <p className="text-muted-foreground">Monitoring master data produk, resep dapur, dan harga jual.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* SECTION 1: STOK PRODUK JADI */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              <CardTitle>Data Produk & Target</CardTitle>
            </div>
            <CardDescription>Stok gudang barang jadi & target hasil produksi.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead className="text-center">Target (1 Batch)</TableHead>
                  <TableHead className="text-right">Sisa Stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((prod) => (
                  <TableRow key={prod.id}>
                    <TableCell className="font-medium">{prod.name}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {prod.product_result_expected ? `${prod.product_result_expected} Pcs` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-bold">{prod.stock_qty} Pcs</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* SECTION 2: MENU JUALAN (KASIR) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              <CardTitle>Menu Kasir</CardTitle>
            </div>
            <CardDescription>Harga jual yang tampil di halaman kasir.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Menu</TableHead>
                  <TableHead>Konten</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellingUnits.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {unit.qty_content} {unit.products?.name}
                    </TableCell>
                    <TableCell className="text-right">
                      Rp {unit.price.toLocaleString('id-ID')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: RESEP DAPUR (GROUPED BY PRODUCT) */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-blue-500" />
            <CardTitle>Daftar Resep Produk</CardTitle>
          </div>
          <CardDescription>
            Klik pada baris produk untuk melihat detail komposisi bahan baku.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Produk (Resep)</TableHead>
                  <TableHead className="text-center">Jumlah Item Bahan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(groupedRecipes).length > 0 ? (
                  Object.keys(groupedRecipes).map((productName, index) => (
                    <TableRow 
                      key={index} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(productName)}
                    >
                      <TableCell className="font-medium">
                        {productName}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {groupedRecipes[productName].length} Bahan
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        <Eye className="w-4 h-4 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Belum ada data resep yang diinput.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* MODAL DETAIL RESEP */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Komposisi Resep: {selectedProductDetails?.name}</DialogTitle>
            <DialogDescription>
              Daftar bahan baku yang dibutuhkan untuk 1x Adonan (Batch).
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-md mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Bahan</TableHead>
                  <TableHead className="text-right">Takaran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedProductDetails?.ingredients.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.ingredients?.name}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {item.quantity_per_batch} {item.ingredients?.unit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}