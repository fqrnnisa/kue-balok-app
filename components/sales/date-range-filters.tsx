"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL or defaults
  const [start, setStart] = useState(searchParams.get("startDate") || "");
  const [end, setEnd] = useState(searchParams.get("endDate") || "");

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (start) params.set("startDate", start);
    else params.delete("startDate");
    
    if (end) params.set("endDate", end);
    else params.delete("endDate");

    // Reset to page 1 when filtering
    params.set("page", "1");

    router.push(`?${params.toString()}`);
  };

  const handleReset = () => {
    setStart("");
    setEnd("");
    router.push("?"); // Clear all params
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="grid gap-1">
        <label className="text-xs font-medium text-muted-foreground">Start Date</label>
        <Input 
          type="date" 
          value={start} 
          onChange={(e) => setStart(e.target.value)} 
          className="w-[150px] bg-background"
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-medium text-muted-foreground">End Date</label>
        <Input 
          type="date" 
          value={end} 
          onChange={(e) => setEnd(e.target.value)} 
          className="w-[150px] bg-background"
        />
      </div>
      <Button variant="secondary" onClick={handleFilter}>Filter</Button>
      {(start || end) && (
        <Button variant="ghost" onClick={handleReset} className="text-red-500 hover:text-red-600">
          Reset
        </Button>
      )}
    </div>
  );
}