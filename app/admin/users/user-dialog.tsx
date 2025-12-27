"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { createUser, updateUser } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil } from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

export function UserDialog({ user }: { user?: UserProfile | null }) {
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 1. State untuk menampung input agar bisa dideteksi perubahannya
  const [formData, setFormData] = useState({
    fullName: "",
    role: "staff",
    password: "",
  });

  const isEdit = !!user;

  // 2. Reset form saat dialog dibuka atau user berubah
  useEffect(() => {
    if (open) {
      setFormData({
        fullName: user?.full_name || "",
        role: user?.role || "staff",
        password: "", // Password selalu kosong saat awal edit
      });
    }
  }, [open, user]);

  // 3. Logika pengecekan perubahan
  // Tombol simpan aktif jika:
  // - Mode Create (bukan edit)
  // - Ada password yang diketik
  // - Nama berbeda dari data asli
  // - Role berbeda dari data asli
  const hasChanges = !isEdit || 
    formData.password.length > 0 ||
    formData.fullName !== user?.full_name ||
    formData.role !== user?.role;

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double check logic (opsional, untuk keamanan)
    if (isEdit && !hasChanges) {
      toast.info("Tidak ada perubahan data yang perlu disimpan.");
      return;
    }

    if (isEdit) {
      setShowConfirm(true);
    } else {
      executeSubmit();
    }
  };

  const executeSubmit = async () => {
    setLoading(true);
    setShowConfirm(false);

    // Kita buat FormData manual dari state karena sekarang pakai Controlled Input
    const payload = new FormData();
    payload.append("email", user?.email || (document.getElementById("email") as HTMLInputElement)?.value || "");
    payload.append("fullName", formData.fullName);
    payload.append("role", formData.role);
    payload.append("password", formData.password);

    let result;

    if (isEdit && user) {
      result = await updateUser(user.id, payload);
    } else {
      result = await createUser(payload);
    }

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isEdit ? "User berhasil diupdate!" : "User baru berhasil dibuat!");
      setOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {isEdit ? (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          ) : (
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Tambah Staff
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Pengguna" : "Tambah Staff Baru"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handlePreSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user?.email || ""}
                required
                disabled={isEdit} // Email biasanya tidak boleh diedit untuk menjaga konsistensi ID
                placeholder="staff@kuebalok.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                name="fullName"
                // Ganti defaultValue dengan value & onChange
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                placeholder="Ujang Saepudin"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">
                Password {isEdit && <span className="text-xs text-muted-foreground">(Kosongkan jika tidak diganti)</span>}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                // Ganti defaultValue dengan value & onChange
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!isEdit}
                placeholder="******"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role / Jabatan</Label>
              <Select 
                name="role" 
                value={formData.role} 
                onValueChange={(val) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff (Karyawan)</SelectItem>
                  <SelectItem value="admin">Admin (Owner)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              {/* Button didisabled jika loading ATAU (sedang edit TAPI tidak ada perubahan) */}
              <Button type="submit" disabled={loading || (isEdit && !hasChanges)}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Simpan Perubahan" : "Buat User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Simpan Perubahan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pastikan data <strong>{formData.fullName}</strong> sudah benar sebelum disimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={executeSubmit}>
              Ya, Simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}