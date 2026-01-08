'use server'

import { createClient } from "@/lib/supabase/server"; // Ensure this path matches your project
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// --- ACTION 1: RESTOCK ---
export async function submitRestock(formData: FormData) {
  const supabase = await createClient(); // This was already correct in your snippet
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const ingredientId = formData.get("ingredient_id") as string;
  const qty = parseFloat(formData.get("qty") as string);
  const notes = formData.get("notes") as string;

  if (!ingredientId || !qty) return { error: "Data tidak lengkap" };

  const { error } = await supabase.from("ingredient_logs").insert({
    ingredient_id: ingredientId,
    change_qty: qty,
    action_type: "RESTOCK",
    notes: notes || "Restock manual",
    created_by: user.id
  });

  if (error) return { error: error.message };

  revalidatePath("/staff/report/inventory");
  revalidatePath("/staff/restock");
  return { success: true };
}

// --- ACTION 2: PRODUCTION ---
export async function submitProduction(formData: FormData) {
  // ERROR FIX 1: Added 'await' here
  const supabase = await createClient(); 
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const productId = formData.get("product_id") as string;
  const batchQty = parseFloat(formData.get("batch_qty") as string);
  const actualResult = parseFloat(formData.get("actual_result") as string);
  const notes = formData.get("notes") as string;

  if (!productId || !batchQty) return { error: "Data produksi tidak lengkap" };

  const { data: recipes, error: recipeError } = await supabase
    .from("product_recipes")
    .select("ingredient_id, quantity_per_batch")
    .eq("product_id", productId);

  if (recipeError || !recipes?.length) {
    return { error: "Resep tidak ditemukan untuk produk ini." };
  }

  const { error: prodError } = await supabase.from("production_logs").insert({
    product_id: productId,
    batch_qty: batchQty,
    product_result_actual: actualResult,
    created_by: user.id,
    notes: notes
  });
  
  if (prodError) return { error: prodError.message };

  // ERROR FIX 2: Explicitly typed 'r' so TypeScript knows what it contains
  const inventoryPayload = recipes.map((r: { ingredient_id: any; quantity_per_batch: number }) => ({
    ingredient_id: r.ingredient_id,
    change_qty: -(r.quantity_per_batch * batchQty),
    action_type: "PRODUCTION",
    created_by: user.id,
    notes: `Auto-deduct: Produksi ${batchQty} Batch`
  }));

  const { error: logError } = await supabase.from("ingredient_logs").insert(inventoryPayload);

  if (logError) return { error: logError.message };

  revalidatePath("/staff/report/inventory");
  redirect("/staff/report/inventory");
}