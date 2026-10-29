"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api, getErrorMessage } from "@/lib/api";
import { codeSchema, type CodeValues } from "@/lib/schemas";
import { useAuth } from "@/lib/store";

export function CodeForm() {
  const router = useRouter();
  const setSession = useAuth((state) => state.setSession);
  const [serverError, setServerError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const form = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { email: "", code: "" },
  });

  async function sendCode() {
    setServerError("");
    const emailValid = await form.trigger("email");
    if (!emailValid) return;

    setIsSending(true);
    try {
      const email = form.getValues("email");
      await api.requestCode(email);
      setCodeSent(true);
      toast.success("Code sent", {
        description: "Check your email. The code expires in 15 minutes.",
      });
    } catch (error) {
      const message = getErrorMessage(error);
      setServerError(message);
      toast.error("We could not send the code", { description: message });
    } finally {
      setIsSending(false);
    }
  }

  async function onSubmit(values: CodeValues) {
    setServerError("");
    try {
      const result = await api.loginCode(values.email, values.code);
      setSession({ token: result.token, user: result.user });
      toast.success("Signed in", {
        description: "Taking you to your operations dashboard.",
      });
      router.push("/dashboard");
    } catch (error) {
      const message = getErrorMessage(error);
      setServerError(message);
      toast.error("The code is not valid", { description: message });
    }
  }

  return (
    <div>
      <AuthHeading
        eyebrow="Passwordless access"
        title="Sign in with a code"
        description="We send a 6-digit code to your email. Use it once; it expires in 15 minutes."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError ? (
            <Alert variant="destructive">
              <CircleAlert aria-hidden />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          {codeSent ? (
            <Alert variant="success">
              <CheckCircle2 aria-hidden />
              <AlertTitle>Code sent</AlertTitle>
              <AlertDescription>
                If the email is registered, you will receive a code in a few minutes. Check spam
                too.
              </AlertDescription>
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

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => void sendCode()}
            disabled={isSending}
          >
            {isSending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {isSending ? "Sending code…" : codeSent ? "Send another code" : "Send code"}
          </Button>

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>6-digit code</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    className="font-mono text-base tracking-[0.35em]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>The code is single-use.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {form.formState.isSubmitting ? "Signing in…" : "Sign in with the code"}
          </Button>
        </form>
      </Form>

      <div className="mt-8 flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in with password
        </Link>
        <p className="text-xs">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create one for free
          </Link>
        </p>
      </div>
    </div>
  );
}
