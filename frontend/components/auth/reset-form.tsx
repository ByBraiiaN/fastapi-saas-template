"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { resetSchema, type ResetValues } from "@/lib/schemas";

export function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryToken = searchParams.get("token") ?? "";
  const [serverError, setServerError] = useState("");

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token: queryToken, password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (queryToken) form.setValue("token", queryToken);
  }, [form, queryToken]);

  async function onSubmit(values: ResetValues) {
    setServerError("");
    try {
      await api.newPassword(values.token, values.password);
      toast.success("Password updated", {
        description: "You can now sign in with your new password.",
      });
      router.push("/login");
    } catch (error) {
      const message = getErrorMessage(error);
      setServerError(message);
      toast.error("We could not update the password", { description: message });
    }
  }

  return (
    <div>
      <AuthHeading
        eyebrow="New password"
        title="Choose a strong password"
        description="Use at least 6 characters. If the link expired, request a new one from the sign-in screen."
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
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recovery token</FormLabel>
                <FormControl>
                  <Input placeholder="Paste the token from your email" autoComplete="one-time-code" {...field} />
                </FormControl>
                <FormDescription>
                  {queryToken
                    ? "We detected the token from the link automatically."
                    : "Copy the token from the recovery email."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
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

          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {form.formState.isSubmitting ? "Saving…" : "Save password"}
          </Button>
        </form>
      </Form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
