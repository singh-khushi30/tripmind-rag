"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import { loginAction, type AuthActionState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { error: null };

type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath = "/dashboard" }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={nextPath} />

      {state.error ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-2xl border px-4 py-3 text-sm"
        >
          {state.error}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="h-11"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          placeholder="••••••••"
          className="h-11"
          disabled={isPending}
        />
      </div>

      <Button
        type="submit"
        className="h-12 w-full text-base"
        size="lg"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? (
          <LoaderCircle data-icon="inline-start" className="animate-spin" />
        ) : null}
        {isPending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
