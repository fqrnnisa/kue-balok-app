"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner"; // Assuming you use Sonner or similar for toasts
import { getSalesForExport } from "@/app/admin/sales/actions";

interface ExportButtonProps {
  startDate: string | null;
  endDate: string | null;
}

export function ExportButton({ startDate, endDate }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);

      // 1. Fetch data from server
      const data = await getSalesForExport(startDate, endDate);

      if (!data || data.length === 0) {
        toast.error("Tidak ada data untuk diexport pada periode ini.");
        return;
      }

      // 2. Create Excel Worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");

      // 3. Auto-adjust column width (Optional visual tweak)
      const max_width = data.reduce((w, r) => Math.max(w, r["Menu"].length), 10);
      worksheet["!cols"] = [
        { wch: 10 }, // ID
        { wch: 12 }, // Tanggal
        { wch: 10 }, // Jam
        { wch: max_width + 5 }, // Menu
        { wch: 12 }, // Harga
        { wch: 5 },  // Qty
        { wch: 15 }, // Total
        { wch: 15 }, // Produk Asli
        { wch: 15 }, // Kasir
      ];

      // 4. Download File
      const fileName = `Laporan_Penjualan_${startDate || "Awal"}_sd_${endDate || "Akhir"}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success("Laporan berhasil didownload");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mendownload laporan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={loading}
      className="gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      Export Excel
    </Button>
  );
}