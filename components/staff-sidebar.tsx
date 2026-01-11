"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutGrid, ShoppingBag, ClipboardList, 
  Package, UtensilsCrossed, LogOut, Menu,
  ChefHat, ArrowDownToLine
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"; 
import { createClient } from "@/lib/supabase/supabase"; 
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Kasir", href: "/staff/sales", icon: ShoppingBag },
  { title: "Input Produksi", href: "/staff/input", icon: ChefHat },
  { title: "Stok Masuk", href: "/staff/restock", icon: ArrowDownToLine },
  { type: "separator", title: "Master Data" },
  { title: "Produk", href: "/staff/products", icon: Package },
  { title: "Bahan Baku", href: "/staff/ingredients", icon: LayoutGrid },
  { title: "Resep", href: "/staff/recipes", icon: UtensilsCrossed },
];

export function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sampai jumpa!");
    router.push("/");
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-background text-sm font-medium">
      <div className="h-16 flex items-center px-6 border-b">
        <span className="text-lg font-bold tracking-tight">Mang Iyan Staff</span>
      </div>
      <div className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item, index) => {
          if (item.type === "separator") {
            return <div key={index} className="px-3 pt-4 pb-2 text-xs text-muted-foreground uppercase tracking-wider">{item.title}</div>
          }
          const Icon = item.icon as any;
          const isActive = pathname === item.href;
          return (
            <Link key={index} href={item.href || "#"}>
              <span className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <Icon className="w-4 h-4" />
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
        <span className="font-bold">Mang Iyan Staff</span>
        <Sheet>
          <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu className="w-5 h-5"/></Button></SheetTrigger>
          <SheetContent side="left" className="p-0 w-72"><NavContent /></SheetContent>
        </Sheet>
      </div>
      {/* Desktop */}
      <div className="hidden md:flex h-screen w-64 flex-col border-r bg-background sticky top-0"><NavContent /></div>
    </>
  );
}