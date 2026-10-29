"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { KeyRound, Loader2, Palette, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { api, getErrorMessage } from "@/lib/api";
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/schemas";
import { useAuth } from "@/lib/store";

export default function SettingsPage() {
  const token = useAuth((state) => state.token);
  const user = useAuth((state) => state.user);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirmPassword: "",
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (values: ChangePasswordValues) => {
      if (!token) throw new Error("Session unavailable");
      return api.changePassword(token, values.old_password, values.new_password);
    },
    onSuccess: () => {
      form.reset();
      toast.success("Password updated", {
        description: "Use the new password the next time you sign in.",
      });
    },
    onError: (error) => {
      toast.error("We could not change the password", {
        description: getErrorMessage(error),
      });
    },
  });

  function onSubmit(values: ChangePasswordValues) {
    passwordMutation.mutate(values);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary-strong">
          Settings
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Account settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Update your password and choose how you want to see the dashboard. Personal details are
          available on the account page.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="border-b border-border/60">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary-strong">
                <KeyRound className="size-4" aria-hidden />
              </span>
              <div>
                <CardTitle className="text-lg">Change password</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  At least 6 characters. It does not affect your email or username.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <FormField
                  control={form.control}
                  name="old_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder="Your current password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="At least 6 characters"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Use a password you do not reuse on other services.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repeat the new password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="Repeat the new password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-1">
                  <Button type="submit" disabled={passwordMutation.isPending}>
                    {passwordMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <ShieldCheck className="size-4" aria-hidden />
                    )}
                    {passwordMutation.isPending ? "Updating…" : "Update password"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border/60">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-accent/15 text-amber-700 dark:text-accent">
                  <Palette className="size-4" aria-hidden />
                </span>
                <div>
                  <CardTitle className="text-lg">Appearance</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saved only in this browser.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Interface theme</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Light, dark, or synced with your system.
                  </p>
                </div>
                <ThemeToggle />
              </div>
              <Separator className="my-5" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                The theme does not change the look of the admin console, which keeps its
                own identity.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border/60">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <UserRound className="size-4" aria-hidden />
                </span>
                <div>
                  <CardTitle className="text-lg">Personal details</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Read-only</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="settings-email">Email address</Label>
                  <Input
                    id="settings-email"
                    value={user?.email ?? "—"}
                    readOnly
                    aria-readonly="true"
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-username">Username</Label>
                  <Input
                    id="settings-username"
                    value={user?.username ?? "—"}
                    readOnly
                    aria-readonly="true"
                    className="bg-muted/50"
                  />
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                They cannot be edited from the dashboard. You can see the rest of your details on your
                account.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/dashboard/account">View my account</Link>
              </Button>
            </CardContent>
          </Card>

          <Alert variant="success">
            <ShieldCheck aria-hidden />
            <AlertTitle>Account protected</AlertTitle>
            <AlertDescription>
              If you notice unusual activity, change your password and sign out from Account.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
