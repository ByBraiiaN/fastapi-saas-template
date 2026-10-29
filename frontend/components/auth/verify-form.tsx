"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { verifySchema, type VerifyValues } from "@/lib/schemas";

type VerifyStatus = "idle" | "loading" | "success" | "error";

export function VerifyForm() {
  const searchParams = useSearchParams();
  const queryToken = searchParams.get("token") ?? "";
  const startedWith = useRef<string | null>(null);
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [message, setMessage] = useState("");

  const form = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { token: queryToken },
  });

  const runVerify = useCallback(async (token: string) => {
    setStatus("loading");
    setMessage("");
    try {
      const result = await api.verify(token);
      setStatus("success");
      setMessage(result.message ?? "Your email was verified successfully.");
      toast.success("Email verified", {
        description: "You can now sign in to your account.",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setStatus("error");
      setMessage(errorMessage);
      toast.error("We could not verify the email", { description: errorMessage });
    }
  }, []);

  useEffect(() => {
    if (!queryToken || startedWith.current === queryToken) return;
    startedWith.current = queryToken;
    form.setValue("token", queryToken);
    void runVerify(queryToken);
  }, [form, queryToken, runVerify]);

  function onSubmit(values: VerifyValues) {
    void runVerify(values.token);
  }

  if (status === "success") {
    return (
      <div>
        <AuthHeading
          eyebrow="All set"
          title="Email verified"
          description="Your account is active. Sign in to the dashboard and start organizing your operation."
        />
        <Alert variant="success">
          <CheckCircle2 aria-hidden />
          <AlertTitle>Verification complete</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <div className="mt-6 grid gap-2">
          <Button asChild size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AuthHeading
        eyebrow="Verification"
        title="Confirm your email"
        description="Open the link in the message or paste the token you received here. Links expire for security."
      />

      {status === "loading" ? (
        <Alert className="mb-5">
          <Loader2 className="animate-spin" aria-hidden />
          <AlertTitle>Verifying your email</AlertTitle>
          <AlertDescription>We are validating the token. It only takes a moment.</AlertDescription>
        </Alert>
      ) : null}

      {status === "error" ? (
        <Alert variant="destructive" className="mb-5">
          <CircleAlert aria-hidden />
          <AlertTitle>The token is not valid</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification token</FormLabel>
                <FormControl>
                  <Input placeholder="Paste the token from your email" autoComplete="one-time-code" {...field} />
                </FormControl>
                <FormDescription>
                  You can also open the link in the email directly.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={status === "loading" || form.formState.isSubmitting}
          >
            {status === "loading" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {status === "loading" ? "Verifying…" : "Verify email"}
          </Button>
        </form>
      </Form>

      <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/login"
          className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
        <p className="text-xs">
          Did not receive the message? Check spam or{" "}
          <Link href="/contact" className="rounded-sm underline-offset-4 hover:text-foreground hover:underline">
            write to us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
