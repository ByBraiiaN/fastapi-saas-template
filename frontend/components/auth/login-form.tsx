"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthHeading } from "@/components/auth/auth-heading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api, getErrorMessage } from "@/lib/api";
import { loginSchema, type LoginValues } from "@/lib/schemas";
import { useAuth } from "@/lib/store";

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuth((state) => state.setSession);
  const [serverError, setServerError] = useState("");

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setServerError("");
    try {
      const result = await api.login(values.email, values.password);
      setSession({ token: result.token, user: result.user });
      toast.success("Signed in", {
        description: "Taking you to your operations dashboard.",
      });
      router.push("/dashboard");
    } catch (error) {
      const message = getErrorMessage(error);
      setServerError(message);
      toast.error("We could not sign you in", { description: message });
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div>
      <AuthHeading
        eyebrow="Welcome back"
        title="Sign in to your account"
        description="Your dashboard, your metrics, and your team's work, just as you left them."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError ? (
            <Alert variant="destructive">
              <CircleAlert aria-hidden />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot"
                    className="rounded-sm text-xs font-medium text-primary-strong underline-offset-4 hover:underline"
                  >
                    Forgot it?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Your password"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>

      <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden />
        or
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>

      <Button asChild variant="outline" size="lg" className="mt-4 w-full">
        <Link href="/login/code">Sign in with a one-time code</Link>
      </Button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one for free
        </Link>
      </p>
    </div>
  );
}
