"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const role = formData.get("role") as string;

  // 1. Buat User di Supabase Auth (Tanpa login otomatis)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Langsung verifikasi email
    user_metadata: { full_name: fullName }
  });

  if (authError) {
    return { error: authError.message };
  }

  // 2. Update Role di tabel Profiles (Override default 'staff')
  if (authData.user && role === 'admin') {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', authData.user.id);
    
    if (profileError) return { error: "User dibuat, tapi gagal set admin." };
  }

  revalidatePath("/admin/users"); // Refresh halaman list user
  return { success: true };
}

export async function updateUser(userId: string, formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;

  // 1. Update Profile (Nama & Role)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ full_name: fullName, role })
    .eq('id', userId);

  if (profileError) return { error: profileError.message };

  // 2. Update Password (Jika diisi)
  if (password && password.trim() !== "") {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId, 
      { password: password }
    );
    if (authError) return { error: "Gagal update password." };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  // Menghapus user dari Auth (otomatis cascade delete ke profiles jika disetup database benar)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}