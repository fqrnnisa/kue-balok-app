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
import { Banknote, ShoppingCart, Archive } from "lucide-react";
import { DateRangeFilter } from "@/components/sales/date-range-filters";
import { PaginationControls } from "@/components/sales/paggination-controls";
import { ExportButton } from "@/components/sales/export-button"; 

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();

  // --- 1. PARSE PARAMETERS ---
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const startDate = typeof params?.startDate === "string" ? params.startDate : null;
  const endDate = typeof params?.endDate === "string" ? params.endDate : null;

  const ITEMS_PER_PAGE = 10;
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // --- 2. QUERIES ---
  const applyDateFilters = (query: any) => {
    if (startDate) query = query.gte("created_at", `${startDate}T00:00:00`);
    if (endDate) query = query.lte("created_at", `${endDate}T23:59:59`);
    return query;
  };

  // Query A: Stats (Summary)
  let statsQuery = supabase.from("sales_logs").select(`qty_sold, selling_units (price)`);
  statsQuery = applyDateFilters(statsQuery);

  // Query B: Table Data (Paginated)
  let tableQuery = supabase
    .from("sales_logs")
    .select(
      `
      id,
      created_at,
      qty_sold,
      selling_units (name, price, products (name)),
      profiles (full_name)
    `,
      { count: "exact" }
    );

  tableQuery = applyDateFilters(tableQuery);
  tableQuery = tableQuery.order("created_at", { ascending: false }).range(from, to);

  // Execute in parallel
  const [statsResult, tableResult] = await Promise.all([statsQuery, tableQuery]);

  const { data: allStatsData } = statsResult;
  const { data: sales, count, error } = tableResult;

  if (error) return <div className="p-4 text-red-500">Error loading data.</div>;

  // --- 3. CALCULATIONS ---
  const totalRevenue =
    allStatsData?.reduce((acc, curr: any) => {
      return acc + curr.qty_sold * (curr.selling_units?.price || 0);
    }, 0) || 0;
  const totalTrx = allStatsData?.length || 0;
  const totalItems =
    allStatsData?.reduce((acc, curr: any) => acc + (curr.qty_sold || 0), 0) || 0;

  return (
    <div className="space-y-6 pb-24 w-full max-w-[100vw]">
      
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Penjualan</h1>
          <p className="text-sm text-muted-foreground">
            {startDate ? `${startDate}` : "Semua Periode"} 
            {endDate ? ` — ${endDate}` : ""}
          </p>
        </div>
        
        {/* Action Group: Filter & Export 
            FIX: 'flex-row' forces them to be side-by-side (inline). 
            'items-center' aligns them vertically.
        */}
        <div className="flex flex-row items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <DateRangeFilter />
          <ExportButton startDate={startDate} endDate={endDate} />
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-emerald-900">Total Omzet</CardTitle>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-700">
              Rp {(totalRevenue / 1000).toFixed(0)}k
            </div>
            <p className="text-xs text-emerald-600/80">
              Real: Rp {totalRevenue.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium">Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{totalTrx}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium">Terjual</CardTitle>
            <Archive className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* 3. TABLE SECTION */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="px-4 py-4 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Daftar Transaksi</CardTitle>
          <div className="text-xs text-muted-foreground">
             {count} data ditemukan
          </div>
        </CardHeader>
        
        <div className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[1%] whitespace-nowrap pl-4">Waktu</TableHead>
                <TableHead className="w-full">Menu</TableHead>
                <TableHead className="hidden md:table-cell whitespace-nowrap">Kasir</TableHead>
                <TableHead className="text-center w-[1%] whitespace-nowrap">Qty</TableHead>
                <TableHead className="text-right w-[1%] whitespace-nowrap pr-4">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales?.map((trx: any) => (
                <TableRow key={trx.id} className="border-b hover:bg-slate-50">
                  
                  {/* Time */}
                  <TableCell className="pl-4 py-3 align-top whitespace-nowrap">
                    <div className="font-medium text-sm">
                      {format(new Date(trx.created_at), "d MMM", { locale: id })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(trx.created_at), "HH:mm", { locale: id })}
                    </div>
                  </TableCell>

                  {/* Menu */}
                  <TableCell className="py-3 align-top">
                    <div className="text-sm font-medium min-w-[120px]">
                      {trx.selling_units?.name || "Deleted"}
                    </div>
                    <div className="md:hidden text-[10px] text-muted-foreground mt-0.5">
                      {trx.profiles?.full_name?.split(" ")[0]}
                    </div>
                  </TableCell>

                  {/* Kasir (Desktop) */}
                  <TableCell className="hidden md:table-cell py-3 align-top whitespace-nowrap text-sm">
                    {trx.profiles?.full_name}
                  </TableCell>

                  {/* Qty */}
                  <TableCell className="text-center py-3 align-top font-bold text-sm whitespace-nowrap">
                    {trx.qty_sold}
                  </TableCell>

                  {/* Total */}
                  <TableCell className="text-right pr-4 py-3 align-top font-bold text-emerald-700 whitespace-nowrap text-sm">
                    Rp {((trx.qty_sold || 0) * (trx.selling_units?.price || 0)).toLocaleString("id-ID")}
                  </TableCell>
                </TableRow>
              ))}

              {sales?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Belum ada data penjualan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 border-t">
          <PaginationControls totalCount={count || 0} pageSize={ITEMS_PER_PAGE} />
        </div>
      </Card>
    </div>
  );
}