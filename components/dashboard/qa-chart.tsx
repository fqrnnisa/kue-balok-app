"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts";

interface QAData {
  productName: string;
  staffName: string;
  expected: number; // Target Resep
  actual: number;   // Hasil Staff
  date: string;
}

export function QAChart({ data }: { data: QAData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed rounded-md bg-slate-50">
        Belum ada data produksi hari ini
      </div>
    );
  }

  // Tooltip Khusus
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload; 
      
      // Hitung selisih
      const difference = dataItem.actual - dataItem.expected;
      const isMismatch = difference !== 0; // Merah jika tidak sama persis (0)
      
      // Tentukan teks status
      let statusText = "";
      if (difference < 0) statusText = `Kurang ${Math.abs(difference)}`;
      if (difference > 0) statusText = `Lebih ${difference}`;

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg text-sm z-50">
          <p className="font-bold mb-1 text-slate-800">{dataItem.productName}</p>
          <p className="text-xs text-slate-500 mb-2">Oleh: {dataItem.staffName}</p>
          
          <div className="space-y-1">
            <p className="text-slate-500">Target Resep: <span className="font-medium">{dataItem.expected} pcs</span></p>
            <p className={`${isMismatch ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}`}>
              Hasil Aktual: {dataItem.actual} pcs
            </p>
          </div>

          {isMismatch && (
            <div className="mt-2 text-xs font-bold text-red-500 border-t pt-1 border-red-100 flex items-center gap-1">
              ⚠ TIDAK SESUAI ({statusText})
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey="staffName" 
            width={70} 
            tick={{fontSize: 12}} 
            interval={0}
          />
          <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
          <Legend />
          
          {/* BAR 1: Target (Abu-abu) */}
          <Bar dataKey="expected" name="Target Resep" barSize={20} fill="#e2e8f0" radius={[0, 4, 4, 0]} />

          {/* BAR 2: Aktual (Warna Warni) */}
          <Bar dataKey="actual" name="Hasil Produksi" barSize={20} radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => {
              // LOGIKA WARNA BARU:
              // Merah (#ef4444) jika Actual TIDAK SAMA DENGAN Expected (Kurang atau Lebih)
              // Hijau (#10b981) jika SAMA PERSIS
              const isMismatch = entry.actual !== entry.expected;
              
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={isMismatch ? "#ef4444" : "#10b981"} 
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}