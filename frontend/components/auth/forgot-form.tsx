"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthHeading } from "@/components/auth/auth-heading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { forgotSchema, type ForgotValues } from "@/lib/schemas";

export function ForgotForm() {
  const [serverError, setServerError] = useState("");
  const [sentTo, setSentTo] = useState("");

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotValues) {
    setServerError("");
    try {
      await api.forgot(values.email);
      setSentTo(values.email);
      toast.success("Check your inbox", {
        description: "If the email exists, we sent a link to reset the password.",
      });
    } catch (error) {
      const message = getErrorMessage(error);
      setServerError(message);
      toast.error("We could not send the link", { description: message });
    }
  }

  if (sentTo) {
    return (
      <div>
        <AuthHeading
          eyebrow="Link sent"
          title="Check your email"
          description="For security, we do not confirm whether an account exists. If there is an account with that email, you will receive a link in a few minutes."
        />
        <Alert variant="success">
          <CheckCircle2 aria-hidden />
          <AlertTitle>We sent the instructions</AlertTitle>
          <AlertDescription>
            Look for a message addressed to {sentTo}. Check your spam folder too.
          </AlertDescription>
        </Alert>
        <div className="mt-6 grid gap-2">
          <Button asChild size="lg">
            <Link href="/login">Back to sign in</Link>
          </Button>
          <Button variant="ghost" onClick={() => setSentTo("")}>
            Use another email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AuthHeading
        eyebrow="Recover access"
        title="Forgot your password?"
        description="Enter your account email and we will send you a link to create a new one."
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

          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {form.formState.isSubmitting ? "Sending…" : "Send link"}
          </Button>
        </form>
      </Form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/login"
          className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in again
        </Link>
      </p>
    </div>
  );
}
