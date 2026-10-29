"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, Loader2, ShieldAlert, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api, getErrorMessage } from "@/lib/api";
import { providerLabel } from "@/lib/billing";
import { useAuth } from "@/lib/store";

type ReadOnlyFieldProps = {
  id: string;
  label: string;
  value: string;
  mono?: boolean;
};

function ReadOnlyField({ id, label, value, mono = false }: ReadOnlyFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        readOnly
        aria-readonly="true"
        className={mono ? "bg-muted/50 font-mono text-xs" : "bg-muted/50"}
      />
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [username, setUsername] = useState("");

  const user = useAuth((state) => state.user);
  const token = useAuth((state) => state.token);
  const clear = useAuth((state) => state.clear);
  const setUser = useAuth((state) => state.setUser);

  useEffect(() => {
    if (user?.username) setUsername(user.username);
  }, [user?.username]);

  const updateProfileMutation = useMutation({
    mutationFn: () => {
      if (!token) throw new Error("Session unavailable");
      return api.updateProfile(token, username.trim());
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toast.success("Username updated");
    },
    onError: (error) => {
      toast.error("We could not update your profile", {
        description: getErrorMessage(error),
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => {
      if (!token) throw new Error("Session unavailable");
      return api.deactivate(token);
    },
    onSuccess: (result) => {
      setDeactivateOpen(false);
      clear();
      queryClient.clear();
      toast.success("Account deactivated", {
        description: result.message ?? "Your account has been deactivated successfully.",
      });
      router.replace("/login");
    },
    onError: (error) => {
      toast.error("We could not deactivate the account", {
        description: getErrorMessage(error),
      });
    },
  });

  function handleLogout() {
    if (token) {
      void api.logout(token).catch(() => undefined);
    }
    clear();
    queryClient.clear();
    toast.success("Signed out");
    router.replace("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary-strong">
          Account
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Your account
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Review the details associated with your session. You can update your username here;
          your email address stays read-only.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60">
            <CardTitle className="text-lg">Account details</CardTitle>
            <Badge variant="outline">{providerLabel(user?.provider ?? "local")}</Badge>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <ReadOnlyField
                id="account-email"
                label="Email address"
                value={user?.email ?? "—"}
              />
              <div className="space-y-1.5">
                <Label htmlFor="account-username">Username</Label>
                <div className="flex gap-2">
                  <Input
                    id="account-username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    minLength={3}
                    maxLength={50}
                  />
                  <Button
                    type="button"
                    onClick={() => updateProfileMutation.mutate()}
                    disabled={
                      updateProfileMutation.isPending ||
                      username.trim().length < 3 ||
                      username.trim() === user?.username
                    }
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : null}
                    Save
                  </Button>
                </div>
              </div>
              <ReadOnlyField
                id="account-id"
                label="User ID"
                value={user?.id ?? "—"}
                mono
              />
              <ReadOnlyField
                id="account-provider"
                label="Sign-in provider"
                value={providerLabel(user?.provider ?? "local")}
              />
            </div>

            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              Your username is editable. Change your password in Settings.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-lg">Session</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                You are signed in with {providerLabel(user?.provider ?? "local")}. Signing out
                removes access from this browser.
              </p>
              <Button type="button" variant="outline" className="mt-4 w-full" onClick={handleLogout}>
                <LogOut className="size-4" aria-hidden />
                Sign out
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader className="border-b border-destructive/20">
              <div className="flex items-center gap-2">
                <TriangleAlert className="size-4 text-destructive" aria-hidden />
                <CardTitle className="text-lg text-destructive">Danger zone</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Alert variant="destructive">
                <ShieldAlert aria-hidden />
                <AlertTitle>Deactivate account</AlertTitle>
                <AlertDescription>
                  You will lose access to the dashboard and renewals will stop. This action cannot
                  be undone from the interface.
                </AlertDescription>
              </Alert>

              <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="destructive" className="mt-4 w-full">
                    Deactivate my account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Deactivate your account?</DialogTitle>
                    <DialogDescription>
                      Your account will no longer be active and this session will end. If you have a
                      subscription, check its status in Billing first.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
                    <p className="font-medium text-destructive">Before you continue</p>
                    <ul className="mt-2 space-y-1.5 text-muted-foreground">
                      <li>You will not be able to sign in with this account.</li>
                      <li>Your plan renewals will stop.</li>
                      <li>To regain access you will have to contact support.</li>
                    </ul>
                  </div>

                  <Separator />

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => deactivateMutation.mutate()}
                      disabled={deactivateMutation.isPending}
                    >
                      {deactivateMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : null}
                      {deactivateMutation.isPending ? "Deactivating…" : "Deactivate account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
