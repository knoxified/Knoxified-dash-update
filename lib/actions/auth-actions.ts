"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function login(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }
  } catch (err: any) {
    console.error("Login error:", err);
    
    // Check for network-related errors
    if (err.message?.includes('fetch') || err.message?.includes('network') || err.code === 'NETWORK_ERROR') {
      return { error: "Network connection issue. Please check your internet connection or try a different network." };
    }
    
    if (err.message?.includes('timeout')) {
      return { error: "Request timed out. Please try again or switch to a different network." };
    }
    
    return { error: "Authentication service unavailable. Please check your network or try again later." };
  }

  redirect("/");
}

export async function logout() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Logout error:", err);
  }
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  try {
    const email = formData.get("email") as string;

    if (!email) {
      return { error: "Email is required" };
    }

    const supabase = await createClient();

    // Send the reset link back to the site the request came from. The old
    // NEXT_PUBLIC_SITE_URL setting was never defined in production, so every reset
    // email pointed at localhost, which Supabase rejects and replaces with the
    // marketing site. An explicit NEXT_PUBLIC_SITE_URL still wins if one is set.
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const origin = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : 'http://localhost:3000');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/api/auth/confirm?next=/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Reset password error:", err);
    return { error: "Failed to send reset email. Please check your network or try again later." };
  }
}

export async function updatePassword(password: string) {
  try {
    if (!password) {
      return { error: "Password is required" };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { error: error.message };
    }

    // Optionally log the user out or keep them logged in
    return { success: true };
  } catch (err: any) {
    console.error("Update password error:", err);
    return { error: "Failed to update password. Please check your network or try again later." };
  }
}
