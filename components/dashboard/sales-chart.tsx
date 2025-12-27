"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChartData {
  name: string;
  total: number;
}

interface SalesChartProps {
  weeklyData: ChartData[];
  monthlyData: ChartData[];
}

export function SalesChart({ weeklyData, monthlyData }: SalesChartProps) {
  const [view, setView] = useState<"weekly" | "monthly">("weekly");

  const data = view === "weekly" ? weeklyData : monthlyData;

  return (
    <Card className="col-span-4 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>
          {view === "weekly" ? "Tren Penjualan (7 Hari Terakhir)" : "Tren Penjualan (Tahun Ini)"}
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={view === "weekly" ? "default" : "outline"}
            onClick={() => setView("weekly")}
          >
            Mingguan
          </Button>
          <Button
            size="sm"
            variant={view === "monthly" ? "default" : "outline"}
            onClick={() => setView("monthly")}
          >
            Bulanan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, "Pendapatan"]}
                cursor={{ fill: 'transparent' }}
              />
              <Bar 
                dataKey="total" 
                fill={view === "weekly" ? "#10b981" : "#3b82f6"} 
                radius={[4, 4, 0, 0]} 
                barSize={view === "weekly" ? 40 : 20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}