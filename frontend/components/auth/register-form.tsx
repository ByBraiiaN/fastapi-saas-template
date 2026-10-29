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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api, getErrorMessage } from "@/lib/api";
import { registerSchema, type RegisterValues } from "@/lib/schemas";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterValues) {
    setServerError("");
    try {
      await api.register(values.email, values.username, values.password);
      toast.success("Account created", {
        description: "Check your email to verify your account.",
      });
      router.push("/verify");
    } catch (error) {
      const message = getErrorMessage(error);
      setServerError(message);
      toast.error("We could not create your account", { description: message });
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div>
      <AuthHeading
        eyebrow="Start for free"
        title="Create your account"
        description="No card and no endless setup. The Free plan is yours to try the full flow."
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
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="valeria.ops" autoComplete="username" {...field} />
                </FormControl>
                <FormDescription>This is how the rest of your team will see you.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work email</FormLabel>
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

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repeat password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Once more"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {isSubmitting ? "Creating account…" : "Create free account"}
          </Button>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By creating an account you accept our{" "}
            <Link href="/terms" className="rounded-sm underline-offset-4 hover:text-foreground hover:underline">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="rounded-sm underline-offset-4 hover:text-foreground hover:underline">
              privacy policy
            </Link>
            .
          </p>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
