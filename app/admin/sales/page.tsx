import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Banknote, ShoppingCart, CalendarDays, Archive, Filter } from "lucide-react";
import { DateRangeFilter } from "@/components/sales/date-range-filters"; // Import created component
import { PaginationControls } from "@/components/sales/paggination-controls"; // Import created component

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Type definition for URL params (Next.js 15+ convention, works in 14 too)
type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();

  // 1. Parse Parameters
  const params = await searchParams; // Await required in newer Next.js versions
  const page = Number(params?.page) || 1;
  const startDate = typeof params?.startDate === "string" ? params.startDate : null;
  const endDate = typeof params?.endDate === "string" ? params.endDate : null;
  
  const ITEMS_PER_PAGE = 10;
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // 2. Base Query Builder (Helper to apply date filters consistently)
  const applyDateFilters = (query: any) => {
    if (startDate) query = query.gte("created_at", `${startDate}T00:00:00`);
    if (endDate) query = query.lte("created_at", `${endDate}T23:59:59`);
    return query;
  };

  // 3. QUERY A: Fetch Summary Stats (Full Range, Unpaginated)
  // We only fetch needed columns to keep it light
  let statsQuery = supabase
    .from("sales_logs")
    .select(`
      qty_sold,
      selling_units (price)
    `);
  
  statsQuery = applyDateFilters(statsQuery);
  
  // 4. QUERY B: Fetch Table Data (Paginated)
  let tableQuery = supabase
    .from("sales_logs")
    .select(`
      id,
      created_at,
      qty_sold,
      selling_units (
        name,
        price,
        products (name)
      ),
      profiles (
        full_name,
        email
      )
    `, { count: "exact" }); // Get total count for pagination

  tableQuery = applyDateFilters(tableQuery);
  tableQuery = tableQuery
    .order("created_at", { ascending: false })
    .range(from, to);

  // Execute both queries in parallel for performance
  const [statsResult, tableResult] = await Promise.all([statsQuery, tableQuery]);

  const { data: allStatsData, error: statsError } = statsResult;
  const { data: sales, count, error: tableError } = tableResult;

  if (tableError || statsError) {
    console.error("Supabase Error:", tableError || statsError);
    return <div className="p-8 text-red-500">Gagal mengambil data database.</div>;
  }

  // 5. Calculate Summaries (using the Full Range data)
  const totalTrx = allStatsData?.length || 0;
  
  const totalRevenue = allStatsData?.reduce((acc, curr: any) => {
    const price = curr.selling_units?.price || 0;
    return acc + (curr.qty_sold * price);
  }, 0) || 0;
  
  const totalItems = allStatsData?.reduce((acc, curr: any) => acc + (curr.qty_sold || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Penjualan</h1>
          <p className="text-muted-foreground">
            Monitoring transaksi {startDate ? `dari ${startDate}` : ""} {endDate ? `sampai ${endDate}` : ""}.
          </p>
        </div>
        
        {/* Insert Filter Component */}
        <DateRangeFilter />
      </div>

      {/* Kartu Ringkasan (Values reflect the filtered date range) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Total Pendapatan</CardTitle>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">Rp {totalRevenue.toLocaleString('id-ID')}</div>
            <p className="text-xs text-emerald-600/80 mt-1">
               {startDate || endDate ? "Omzet periode terpilih" : "Total omzet keseluruhan"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrx}</div>
            <p className="text-xs text-muted-foreground mt-1">Kali checkout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Item Terjual</CardTitle>
            <Archive className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems} Unit</div>
            <p className="text-xs text-muted-foreground mt-1">Total produk keluar</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Detail */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Riwayat Transaksi</CardTitle>
          <div className="text-sm text-muted-foreground">
             Menampilkan {sales?.length} dari {count} data
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Menu Jual</TableHead>
                <TableHead>Produk Asli</TableHead>
                <TableHead>Kasir</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales?.map((trx: any) => (
                <TableRow key={trx.id}>
                  <TableCell className="text-sm">
                    <div className="font-medium">{format(new Date(trx.created_at), "d MMM yyyy", { locale: id })}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(trx.created_at), "HH:mm 'WIB'", { locale: id })}</div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-medium">{trx.selling_units?.name || <span className="text-red-500 italic">Menu Dihapus</span>}</div>
                    <div className="text-xs text-muted-foreground">
                      @ {trx.selling_units?.price ? `Rp ${trx.selling_units.price.toLocaleString('id-ID')}` : '-'}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-sm text-muted-foreground">
                    {trx.selling_units?.products?.name || "-"}
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    {trx.profiles?.full_name || "Unknown"}
                  </TableCell>
                  
                  <TableCell className="text-center font-bold">
                    {trx.qty_sold}
                  </TableCell>
                  
                  <TableCell className="text-right font-bold text-emerald-700">
                    Rp {((trx.qty_sold || 0) * (trx.selling_units?.price || 0)).toLocaleString('id-ID')}
                  </TableCell>
                </TableRow>
              ))}

              {sales?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Tidak ada data penjualan pada periode ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Insert Pagination Controls */}
          <PaginationControls totalCount={count || 0} pageSize={ITEMS_PER_PAGE} />
          
        </CardContent>
      </Card>
    </div>
  );
}