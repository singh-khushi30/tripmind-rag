"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validation/auth";

export type AuthActionState = {
  error: string | null;
  success?: string | null;
};

function getSafeRedirect(path?: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }
  return path;
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid login details.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  const next = getSafeRedirect(formData.get("next")?.toString());
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signupAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid signup details.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Email confirmation may be required depending on Supabase project settings.
  if (!data.session) {
    return {
      error: null,
      success:
        "Account created. Check your email to confirm your address, then sign in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
