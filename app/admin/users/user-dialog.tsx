"use client";

import { useState, useRef } from "react";
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
  const [showConfirm, setShowConfirm] = useState(false); // State untuk popup konfirmasi
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null); // Ref untuk mengakses data form

  const isEdit = !!user;

  // 1. Function yang dijalankan saat tombol "Simpan/Buat" diklik
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      // Jika Edit, munculkan Konfirmasi dulu
      setShowConfirm(true);
    } else {
      // Jika Tambah Baru, langsung gas
      executeSubmit();
    }
  };

  // 2. Eksekusi submit sebenarnya ke Server
  const executeSubmit = async () => {
    if (!formRef.current) return;
    setLoading(true);
    setShowConfirm(false); // Tutup konfirmasi jika ada

    const formData = new FormData(formRef.current);
    let result;

    if (isEdit && user) {
      result = await updateUser(user.id, formData);
    } else {
      result = await createUser(formData);
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
          
          <form ref={formRef} onSubmit={handlePreSubmit} className="grid gap-4 py-4">
            {/* Form Input sama seperti sebelumnya */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user?.email || ""}
                required
                disabled={isEdit}
                placeholder="staff@kuebalok.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={user?.full_name || ""}
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
                required={!isEdit}
                placeholder="******"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role / Jabatan</Label>
              <Select name="role" defaultValue={user?.role || "staff"}>
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
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Simpan Perubahan" : "Buat User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG KHUSUS EDIT (Nested) */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Simpan Perubahan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pastikan data <strong>{user?.full_name}</strong> sudah benar sebelum disimpan.
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