import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, Users } from "lucide-react";
import { format, subDays, startOfYear, isSameDay } from "date-fns";
import { id } from "date-fns/locale";

// Import Client Components
import { SalesChart } from "@/components/dashboard/sales-chart";
import { QAChart } from "@/components/dashboard/qa-chart";

// Force dynamic rendering (Agar data selalu fresh saat dibuka)
export const dynamic = "force-dynamic";

interface ChartData {
  name: string;
  total: number;
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  
  // Date Setup
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const startOfCurrentYear = startOfYear(now).toISOString();

  // ---------------------------------------------------------
  // 2. FETCH DATA (PARALLEL)
  // ---------------------------------------------------------
  const [resSalesToday, resIngredients, resStaff, resSalesHistory, resProduction] = await Promise.all([
    // A. Sales Today
    supabase
      .from('sales_logs')
      .select('qty_sold, selling_units (price)')
      .gte('created_at', `${todayStr}T00:00:00`)
      .lte('created_at', `${todayStr}T23:59:59`),

    // B. Ingredients (PERBAIKAN UTAMA DISINI)
    // Kita ambil datanya, bukan cuma count, agar bisa cek 'min_stock_alert' per item
    supabase
      .from('ingredients')
      .select('stock_qty, min_stock_alert')
      .eq('is_active', true), // Hanya cek yang aktif

    // C. Staff Count
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'staff'),

    // D. Sales History
    supabase
      .from('sales_logs')
      .select('created_at, qty_sold, selling_units (price)')
      .gte('created_at', startOfCurrentYear)
      .order('created_at', { ascending: true }),

    // E. Production Logs (Last 5 Batches for QA)
    supabase
      .from('production_logs')
      .select(`
        created_at,
        product_result_actual,
        product_result_expected,
        products (name),
        profiles (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  // ---------------------------------------------------------
  // 3. DATA PROCESSING
  // ---------------------------------------------------------

  // --- KPI 1: Total Revenue Today ---
  const totalRevenueToday = resSalesToday.data?.reduce((acc, curr: any) => {
    return acc + (curr.qty_sold * (curr.selling_units?.price || 0));
  }, 0) || 0;

  // --- KPI 2: Critical Stock Count (LOGIKA BARU) ---
  // Filter manual di sini untuk membandingkan stok vs alert masing-masing
  const criticalStockCount = resIngredients.data?.filter((item: any) => {
    const limit = item.min_stock_alert ?? 5; // Gunakan alert database, fallback ke 5 jika null
    return item.stock_qty <= limit;
  }).length || 0;

  // --- CHART 1: SALES LOGIC (Weekly & Monthly) ---
  const rawSales = resSalesHistory.data || [];

  // A. Weekly Data
  const weeklyData: ChartData[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(now, i);
    const dateLabel = format(d, "d MMM", { locale: id });
    
    const dayRevenue = rawSales
      .filter((log: any) => isSameDay(new Date(log.created_at), d))
      .reduce((acc, curr: any) => acc + (curr.qty_sold * (curr.selling_units?.price || 0)), 0);

    weeklyData.push({ name: dateLabel, total: dayRevenue });
  }

  // B. Monthly Data
  const monthlyDataMap: Record<string, number> = {};
  rawSales.forEach((log: any) => {
    const monthLabel = format(new Date(log.created_at), "MMM", { locale: id });
    const revenue = log.qty_sold * (log.selling_units?.price || 0);
    monthlyDataMap[monthLabel] = (monthlyDataMap[monthLabel] || 0) + revenue;
  });

  const monthlyData: ChartData[] = Object.entries(monthlyDataMap).map(([name, total]) => ({
    name,
    total
  }));

  // --- CHART 2: QA LOGIC ---
  const qaData = resProduction.data?.map((log: any) => ({
    productName: log.products?.name || "Unknown",
    staffName: log.profiles?.full_name?.split(' ')[0] || "Staff",
    expected: log.product_result_expected || 0,
    actual: log.product_result_actual || 0,
    date: log.created_at
  })) || [];

  // ---------------------------------------------------------
  // 4. RENDER UI
  // ---------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Overview Toko</h1>
        <p className="text-muted-foreground">
          {format(now, "EEEE, d MMMM yyyy", { locale: id })}
        </p>
      </div>
      
      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Omzet */}
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Omzet Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              Rp {totalRevenueToday.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-emerald-600/80 mt-1">Real-time update</p>
          </CardContent>
        </Card>

        {/* Stok (UPDATED) */}
        <Card className={`${criticalStockCount > 0 ? "bg-red-50 border-red-200" : "bg-white"} shadow-sm`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Bahan Kritis</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${criticalStockCount > 0 ? "text-red-600" : "text-slate-400"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${criticalStockCount > 0 ? "text-red-700" : ""}`}>
              {criticalStockCount} Item
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {criticalStockCount > 0 ? "Perlu restock segera" : "Semua stok aman"}
            </p>
          </CardContent>
        </Card>

        {/* Staff */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resStaff.count || 0} Orang</div>
            <p className="text-xs text-muted-foreground mt-1">Aktif bekerja</p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS AREA */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <SalesChart weeklyData={weeklyData} monthlyData={monthlyData} />
        </div>

        <Card className="col-span-3 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Performa Karyawan</CardTitle>
            <p className="text-xs text-muted-foreground">
              Efisiensi 5 Batch Terakhir (Target vs Aktual)
            </p>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px] pl-0">
             <QAChart data={qaData} />
          </CardContent>
        </Card>
      </div>
    </div>
  ); 
}