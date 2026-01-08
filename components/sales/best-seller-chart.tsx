"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface BestSellerData {
  name: string;
  total: number;
}

interface BestSellerChartProps {
  data: BestSellerData[];
}

export function BestSellerChart({ data }: BestSellerChartProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Top 10 Menu Terlaris</CardTitle>
        <CardDescription>
          Produk dengan penjualan (qty) tertinggi pada periode ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" fontSize={12} stroke="#888888" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120} // Space for menu names
                  fontSize={12}
                  stroke="#888888"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  formatter={(value: number) => [`${value} Pcs`, "Terjual"]}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20}>
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index < 3 ? "#10b981" : "#3b82f6"} // Top 3 green, others blue
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Belum ada data penjualan.
          </div>
        )}
      </CardContent>
    </Card>
  );
}