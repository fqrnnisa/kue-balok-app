"use server";

import { createClient } from "@/lib/supabase/server";

export async function getSalesForExport(startDate: string | null, endDate: string | null) {
  const supabase = await createClient();

  // Base Query
  // UPDATED: Added 'price_at_sale' to the select statement
  let query = supabase
    .from("sales_logs")
    .select(`
      id,
      created_at,
      qty_sold,
      price_at_sale,
      selling_units (
        name,
        price,
        products (name)
      ),
      profiles (
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  // Apply Filters (Same logic as your page)
  if (startDate) query = query.gte("created_at", `${startDate}T00:00:00`);
  if (endDate) query = query.lte("created_at", `${endDate}T23:59:59`);

  const { data, error } = await query;

  if (error) {
    console.error("Export Error:", error);
    throw new Error("Failed to fetch data for export");
  }

  // Flatten the data for Excel
  const flattenedData = data.map((item: any) => {
    // NEW LOGIC: Use snapshot price if available, fallback to current master price
    const effectivePrice = item.price_at_sale ?? item.selling_units?.price ?? 0;

    return {
      "ID Transaksi": item.id,
      "Tanggal": new Date(item.created_at).toLocaleDateString("id-ID"),
      "Jam": new Date(item.created_at).toLocaleTimeString("id-ID"),
      "Menu": item.selling_units?.name || "Menu Dihapus",
      "Harga Satuan": effectivePrice, // Uses snapshot price
      "Qty": item.qty_sold,
      "Total Omzet": (item.qty_sold || 0) * effectivePrice, // Uses snapshot price
      "Produk Asli": item.selling_units?.products?.name || "-",
      "Kasir": item.profiles?.full_name || "Unknown",
    };
  });

  return flattenedData;
}