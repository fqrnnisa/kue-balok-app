"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/supabase";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Proses Login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error("Email atau password salah.");
      }

      if (authData.user) {
        // 2. Cek Role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        if (profileError) throw new Error("Gagal mengambil data profil.");

        // 3. Notifikasi Sukses
        toast.success("Login Berhasil!", {
          description: `Selamat datang kembali, ${profile?.role === 'admin' ? 'Juragan' : 'Kakak'}!`,
        });

        // 4. Redirect
        if (profile?.role === "admin") {
          router.push("/admin/dashboard");
        } else if (profile?.role === "staff") {
          router.push("/staff/input");
        } else {
          toast.error("Akun tidak memiliki role yang valid.");
        }
        
        router.refresh(); 
      }
    } catch (err: any) {
      // Notifikasi Error
      toast.error("Login Gagal", {
        description: err.message || "Terjadi kesalahan sistem.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-[400px] shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-800">
            Inventory Mang Iyan
          </CardTitle>
          <CardDescription>
            Masuk untuk mengelola stok dan penjualan
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@kuebalok.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white"
              />
            </div>

            <Button className="w-full mt-6" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-xs text-gray-400">
            Sistem Skripsi Rancang Bangun &copy; 2024
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}