import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Tipe Data sesuai Database
type Ingredient = {
  id: string;
  name: string;
  unit: string;
  stock_qty: number;
  min_stock_alert: number;
};

export default async function InventoryPage() {
  const supabase = await createClient();

  // Fetch Data Bahan Baku
  const { data: ingredients, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return <div>Error loading inventory: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gudang Bahan Baku</h1>
          <p className="text-muted-foreground">Monitor stok bahan untuk produksi Kue Balok.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Stok Bahan</CardTitle>
          <CardDescription>
            Bahan baku yang stoknya di bawah batas minimum akan ditandai Merah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Bahan</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead className="text-right">Stok Saat Ini</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients?.map((item: Ingredient) => {
                const isLowStock = item.stock_qty <= item.min_stock_alert;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {item.stock_qty}
                    </TableCell>
                    <TableCell className="text-center">
                      {isLowStock ? (
                        <Badge variant="destructive" className="flex w-fit mx-auto gap-1 items-center">
                          <AlertCircle className="w-3 h-3" />
                          Kritis
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex w-fit mx-auto gap-1 items-center bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Aman
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {ingredients?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Belum ada data bahan baku.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}