import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionFilter } from "@/components/sales/inventory-filters"; 

// Tipe props harus didefinisikan sebagai Promise untuk searchParams di Next.js 15
interface InventoryPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function InventoryReportPage(props: InventoryPageProps) {
  // 1. AWAIT searchParams terlebih dahulu
  const searchParams = await props.searchParams;
  
  const supabase = await createClient();

  // 2. Ambil nilai filter (sekarang aman karena sudah di-await)
  const filterType = typeof searchParams.type === 'string' ? searchParams.type : null;

  // Debugging: Cek di terminal server apakah value masuk
  console.log("Filter yang diterima:", filterType); 

  // 3. Bangun query dasar
  let query = supabase
    .from("ingredient_logs")
    .select(`
      *,
      ingredients (name, unit),
      profiles (full_name)
    `)
    .order("created_at", { ascending: false });

  // 4. Terapkan filter
  // Pastikan logic ini benar. Cek apakah di database nilainya persis "RESTOCK" atau "USAGE"
  if (filterType && filterType !== 'ALL') {
    query = query.eq('action_type', filterType);
  }

  const { data: logs, error } = await query;

  if (error) {
    console.error("Supabase Error:", error);
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Laporan Mutasi Stok</h1>
          <p className="text-muted-foreground">Riwayat pergerakan bahan baku (Masuk/Keluar).</p>
        </div>
        
        <TransactionFilter />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
          <CardDescription>Semua aktivitas stok tercatat di sini.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Waktu</TableHead>
                <TableHead>Bahan Baku</TableHead>
                <TableHead>Tipe Transaksi</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => {
                const isRestock = log.action_type === 'RESTOCK';
                
                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium text-slate-600">
                      {format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: id })}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-900">{log.ingredients?.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isRestock ? "default" : "secondary"} className={isRestock ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-100 text-amber-800 hover:bg-amber-200"}>
                        {isRestock ? "RESTOCK" : "PRODUKSI"}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-mono font-bold ${
                      isRestock ? "text-emerald-600" : "text-amber-600"
                    }`}>
                      {log.change_qty > 0 ? "+" : ""}{log.change_qty} {log.ingredients?.unit}
                    </TableCell>
                    <TableCell>
                      {log.profiles?.full_name || "System"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs italic">
                      {log.notes}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {(!logs || logs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {filterType 
                      ? `Tidak ada data untuk filter "${filterType}".` 
                      : "Belum ada data transaksi."}
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