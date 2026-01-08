"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  LogOut,
  ChefHat,
  Menu,
  ClipboardList // Added icon for the report
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader,
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet"; 
import { createClient } from "@/lib/supabase/supabase"; // Client version untuk logout
import { toast } from "sonner"; // Notifikasi

// Konfigurasi Menu Sidebar
const menuItems = [
  { 
    title: "Dashboard", 
    href: "/admin/dashboard", 
    icon: LayoutDashboard 
  },
  { 
    title: "Stok Bahan (Gudang)", 
    href: "/admin/inventory", 
    icon: Package 
  },
  { 
    title: "Laporan Mutasi Stok", 
    href: "/admin/report/inventory", 
    icon: ClipboardList 
  },
  { 
    title: "Produk & Resep", 
    href: "/admin/products", 
    icon: ChefHat 
  },
  { 
    title: "Laporan Penjualan", 
    href: "/admin/sales", 
    icon: ShoppingCart 
  },
  { 
    title: "Manajemen Staff", 
    href: "/admin/users", 
    icon: Users 
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Fungsi Logout dengan Animasi Loading (Sonner)
  const handleLogout = () => {
    // Kita bungkus proses logout dalam Promise agar bisa ditrack oleh toast.promise
    const logoutPromise = new Promise(async (resolve, reject) => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            reject(error);
        } else {
            resolve(true);
        }
    });

    toast.promise(logoutPromise, {
      loading: 'Sedang keluar sistem...',
      success: () => {
        router.push("/");
        router.refresh(); // Refresh agar middleware mengenali sesi sudah habis
        return 'Sampai jumpa lagi, Juragan! 👋';
      },
      error: 'Gagal keluar, silakan coba lagi.',
    });
  };

  // Komponen Menu List (Dibuat Reusable untuk Mobile & Desktop)
  const MenuList = () => (
    <div className="flex flex-col h-full bg-background">
      {/* Header Sidebar */}
      <div className="flex h-16 items-center border-b px-6 bg-slate-950 text-white">
        <span className="text-lg font-bold tracking-tight flex items-center gap-2">
           📦 Mang Iyan Admin
        </span>
      </div>

      {/* Daftar Menu Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-slate-900 text-white shadow-md" 
                    : "text-muted-foreground hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Sidebar / Tombol Logout */}
      <div className="border-t p-4 bg-slate-50">
        <Button 
          variant="destructive" 
          className="w-full justify-start gap-2 shadow-sm"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Keluar Sistem
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* === 1. TAMPILAN MOBILE (Sheet / Drawer) === */}
      {/* Muncul hanya di layar kecil (md:hidden) */}
      <div className="md:hidden flex items-center p-4 border-b bg-background sticky top-0 z-50 shadow-sm">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            {/* Accessibility Header (Wajib untuk shadcn) */}
            <SheetHeader className="sr-only">
              <SheetTitle>Menu Admin</SheetTitle>
              <SheetDescription>Navigasi utama dashboard admin</SheetDescription>
            </SheetHeader>
            
            {/* Render Menu */}
            <MenuList />
          </SheetContent>
        </Sheet>
        <span className="ml-4 font-bold text-lg text-slate-800">Inventory System</span>
      </div>

      {/* === 2. TAMPILAN DESKTOP (Static Sidebar) === */}
      {/* Muncul hanya di layar sedang ke atas (hidden md:flex) */}
      <div className="hidden md:flex h-screen w-64 flex-col border-r bg-background sticky top-0 shadow-lg z-40">
        <MenuList />
      </div>
    </>
  );
}