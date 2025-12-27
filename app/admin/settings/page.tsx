"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      // Memanggil Function Database yang kita buat di Langkah 1
      const { error } = await supabase.rpc('reset_factory_data');
      
      if (error) throw error;
      
      toast.success("Database berhasil di-reset!", {
        description: "Semua data transaksi dan produk telah dihapus."
      });
    } catch (e: any) {
      toast.error("Gagal melakukan reset", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h1>
        <p className="text-muted-foreground">Kelola konfigurasi sensitif aplikasi.</p>
      </div>

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Zona Bahaya (Danger Zone)</CardTitle>
          </div>
          <CardDescription className="text-red-600/80">
            Tindakan di bawah ini tidak dapat dibatalkan. Harap berhati-hati.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-white border border-red-100 rounded-lg">
            <div className="space-y-1">
              <h3 className="font-medium text-red-900">Factory Reset Data</h3>
              <p className="text-sm text-muted-foreground">
                Menghapus semua Produk, Bahan, Resep, dan Riwayat Transaksi.<br/>
                Akun Admin & Staff <strong>TIDAK</strong> akan terhapus.
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                  Reset Database
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-600">APAKAH ANDA YAKIN?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus permanen semua data operasional (Produk, Stok, Laporan Penjualan, dll).
                    <br/><br/>
                    Data yang dihapus <strong>TIDAK BISA DIKEMBALIKAN</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
                    Ya, Hapus Semuanya
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}