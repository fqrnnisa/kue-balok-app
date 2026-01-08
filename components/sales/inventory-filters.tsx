"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TransactionFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Ambil nilai filter saat ini dari URL, default ke "ALL"
  const currentFilter = searchParams.get("type") || "ALL";

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "ALL") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    // Update URL tanpa refresh halaman penuh
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="w-[200px]">
      <Select value={currentFilter} onValueChange={handleFilterChange}>
        <SelectTrigger>
          <SelectValue placeholder="Filter Tipe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Semua Transaksi</SelectItem>
          <SelectItem value="RESTOCK">Restock (Masuk)</SelectItem>
          {/* Pastikan value "USAGE" ini sesuai dengan yang ada di database Anda untuk 'Produksi' */}
          <SelectItem value="PRODUCTION">Produksi (Keluar)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}