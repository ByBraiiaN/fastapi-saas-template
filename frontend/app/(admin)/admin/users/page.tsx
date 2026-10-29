"use client";

import { useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  BadgeCheck,
  Copy,
  Eye,
  Loader2,
  MoreHorizontal,
  Search,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/admin/copy-button";
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import { TablePagination } from "@/components/admin/table-pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, getErrorMessage, type AdminUser } from "@/lib/api";
import { providerLabel } from "@/lib/billing";
import { formatDate, getInitials, shortId } from "@/lib/format";
import { useAuth } from "@/lib/store";
import { cn } from "@/lib/utils";

type ActionType = "status" | "role" | "verify";

type PendingAction = {
  type: ActionType;
  user: AdminUser;
};

function actionTitle(action: PendingAction): string {
  if (action.type === "status") {
    return action.user.is_active ? "Deactivate account" : "Reactivate account";
  }
  if (action.type === "role") {
    return action.user.is_admin ? "Remove admin permissions" : "Grant admin permissions";
  }
  return "Mark account as verified";
}

function actionDescription(action: PendingAction): string {
  if (action.type === "status") {
    return action.user.is_active
      ? "The user will not be able to sign in until you reactivate the account."
      : "The user will regain dashboard access with their current permissions.";
  }
  if (action.type === "role") {
    return action.user.is_admin
      ? "The user will lose access to the admin console."
      : "The user will be able to access the console, view metrics, and manage accounts.";
  }
  return "The account will be marked as verified even if it has not completed the email flow.";
}

function actionConfirmLabel(action: PendingAction): string {
  if (action.type === "status") {
    return action.user.is_active ? "Yes, deactivate" : "Yes, reactivate";
  }
  if (action.type === "role") {
    return action.user.is_admin ? "Remove admin" : "Grant admin";
  }
  return "Yes, verify";
}

function actionSuccess(action: PendingAction): string {
  if (action.type === "status") {
    return action.user.is_active ? "Account deactivated" : "Account reactivated";
  }
  if (action.type === "role") {
    return action.user.is_admin ? "Admin permissions removed" : "Admin permissions granted";
  }
  return "Account verified";
}

const filterOptions = (allLabel: string, trueLabel: string, falseLabel: string) => [
  { value: "", label: allLabel },
  { value: "true", label: trueLabel },
  { value: "false", label: falseLabel },
];

export default function AdminUsersPage() {
  const token = useAuth((state) => state.token);
  const queryClient = useQueryClient();

  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [adminFilter, setAdminFilter] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const isActive = activeFilter === "" ? undefined : activeFilter === "true";
  const isVerified = verifiedFilter === "" ? undefined : verifiedFilter === "true";
  const isAdmin = adminFilter === "" ? undefined : adminFilter === "true";

  const usersQuery = useQuery({
    queryKey: [
      "admin",
      "users",
      token,
      { limit, offset, is_active: activeFilter, is_verified: verifiedFilter, is_admin: adminFilter },
    ],
    queryFn: () => {
      if (!token) throw new Error("Session unavailable");
      return api.adminUsers(token, {
        limit,
        offset,
        is_active: isActive,
        is_verified: isVerified,
        is_admin: isAdmin,
      });
    },
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  });

  const detailQuery = useQuery({
    queryKey: ["admin", "user", token, detailUserId],
    queryFn: () => {
      if (!token || !detailUserId) throw new Error("User unavailable");
      return api.adminUser(token, detailUserId);
    },
    enabled: Boolean(token) && Boolean(detailUserId),
  });

  const actionMutation = useMutation({
    mutationFn: (action: PendingAction) => {
      if (!token) throw new Error("Session unavailable");

      if (action.type === "status") {
        return api.updateUserStatus(token, action.user.id, !action.user.is_active);
      }
      if (action.type === "role") {
        return api.updateUserRole(token, action.user.id, !action.user.is_admin);
      }
      return api.verifyUser(token, action.user.id);
    },
    onSuccess: (_data, action) => {
      toast.success(actionSuccess(action), {
        description: action.user.email,
      });
      setPendingAction(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "user"] });
    },
    onError: (error) => {
      toast.error("We could not apply the change", {
        description: getErrorMessage(error),
      });
    },
  });

  const total = usersQuery.data?.total ?? 0;

  const visibleUsers = useMemo(() => {
    const users = usersQuery.data?.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term)
    );
  }, [search, usersQuery.data?.data]);

  function resetOffset() {
    setOffset(0);
  }

  async function copyId(id: string) {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(id);
      toast.success("ID copied", { description: shortId(id) });
    } catch {
      toast.error("We could not copy the ID");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-300">
            Users
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white">
            Account management
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Review each account&apos;s status, adjust permissions, and verify users. Pagination and
            filters run on the server.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-white/10 bg-white/5 px-3 py-1 text-slate-300"
        >
          {total.toLocaleString("en-US")} accounts
        </Badge>
      </div>

      <Card className="overflow-hidden border-white/10 bg-[#0f172a]">
        <DataTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by email or username…"
          filters={[
            {
              id: "is_active",
              label: "Status",
              value: activeFilter,
              options: filterOptions("All", "Active", "Inactive"),
              onChange: (value) => {
                setActiveFilter(value);
                resetOffset();
              },
            },
            {
              id: "is_verified",
              label: "Verification",
              value: verifiedFilter,
              options: filterOptions("All", "Verified", "Unverified"),
              onChange: (value) => {
                setVerifiedFilter(value);
                resetOffset();
              },
            },
            {
              id: "is_admin",
              label: "Role",
              value: adminFilter,
              options: filterOptions("All", "Administrators", "Users"),
              onChange: (value) => {
                setAdminFilter(value);
                resetOffset();
              },
            },
          ]}
          meta={search ? `${visibleUsers.length} on this page` : `${total} total`}
          onRefresh={() => void usersQuery.refetch()}
          isRefreshing={usersQuery.isFetching}
        />

        {usersQuery.isError ? (
          <div className="p-4">
            <Alert className="border-rose-400/25 bg-rose-500/10 text-rose-200">
              <ShieldOff aria-hidden />
              <AlertTitle>We could not load the users</AlertTitle>
              <AlertDescription className="flex flex-col items-start gap-3 text-rose-200/80 sm:flex-row sm:items-center sm:justify-between">
                <span>{getErrorMessage(usersQuery.error)}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void usersQuery.refetch()}
                  className="border-rose-400/30 bg-transparent text-rose-200 hover:bg-rose-500/10"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : usersQuery.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="size-9 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-44 bg-white/10" />
                  <Skeleton className="h-3 w-60 bg-white/10" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full bg-white/10" />
                <Skeleton className="h-8 w-8 bg-white/10" />
              </div>
            ))}
          </div>
        ) : visibleUsers.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={search ? Search : Users}
              title={search ? "No matches on this page" : "No users"}
              description={
                search
                  ? "Search only scans the current page. Try another term or change page."
                  : "Adjust the filters or wait for new accounts to register."
              }
              className="border-white/10 bg-white/[0.02] py-12 [&_h3]:text-slate-200 [&_p]:text-slate-500"
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="pl-4 text-slate-500">User</TableHead>
                <TableHead className="text-slate-500">Status</TableHead>
                <TableHead className="text-slate-500">Role</TableHead>
                <TableHead className="text-slate-500">Signed up</TableHead>
                <TableHead className="pr-4 text-right text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleUsers.map((user) => (
                <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.03]">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-indigo-500/15 text-[10px] font-semibold text-indigo-200">
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">
                          {user.username}
                        </p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1.5",
                          user.is_active
                            ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                            : "border-rose-400/25 bg-rose-400/10 text-rose-300"
                        )}
                      >
                        <span className="size-1.5 rounded-full bg-current" aria-hidden />
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1.5",
                          user.is_verified
                            ? "border-indigo-400/25 bg-indigo-400/10 text-indigo-300"
                            : "border-white/10 bg-white/5 text-slate-400"
                        )}
                      >
                        {user.is_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.is_admin ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-indigo-400/25 bg-indigo-400/10 text-indigo-300"
                      >
                        <ShieldCheck className="size-3" aria-hidden />
                        Admin
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">User</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-slate-300">{formatDate(user.created_at)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {providerLabel(user.provider)}
                    </p>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-slate-400 hover:bg-white/10 hover:text-white"
                          aria-label={`Actions for ${user.email}`}
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-56 border-white/10 bg-[#0f172a] text-slate-100"
                      >
                        <DropdownMenuLabel className="text-slate-500">Account</DropdownMenuLabel>
                        <DropdownMenuItem
                          onSelect={() => setDetailUserId(user.id)}
                          className="focus:bg-white/10 focus:text-white"
                        >
                          <Eye className="size-4 text-slate-400" aria-hidden />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => void copyId(user.id)}
                          className="focus:bg-white/10 focus:text-white"
                        >
                          <Copy className="size-4 text-slate-400" aria-hidden />
                          Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                          onSelect={() => setPendingAction({ type: "status", user })}
                          className="focus:bg-white/10 focus:text-white"
                        >
                          {user.is_active ? (
                            <UserX className="size-4 text-rose-300" aria-hidden />
                          ) : (
                            <UserCheck className="size-4 text-emerald-300" aria-hidden />
                          )}
                          {user.is_active ? "Deactivate" : "Reactivate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setPendingAction({ type: "role", user })}
                          className="focus:bg-white/10 focus:text-white"
                        >
                          {user.is_admin ? (
                            <ShieldOff className="size-4 text-slate-400" aria-hidden />
                          ) : (
                            <ShieldCheck className="size-4 text-indigo-300" aria-hidden />
                          )}
                          {user.is_admin ? "Remove admin" : "Make admin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setPendingAction({ type: "verify", user })}
                          disabled={user.is_verified}
                          className="focus:bg-white/10 focus:text-white"
                        >
                          <BadgeCheck className="size-4 text-emerald-300" aria-hidden />
                          {user.is_verified ? "Already verified" : "Mark verified"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <TablePagination
          total={total}
          limit={limit}
          offset={offset}
          hasNext={usersQuery.data?.has_next ?? false}
          isFetching={usersQuery.isFetching}
          onPrevious={() => setOffset((current) => Math.max(0, current - limit))}
          onNext={() => setOffset((current) => current + limit)}
        />
      </Card>

      <Dialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open && !actionMutation.isPending) setPendingAction(null);
        }}
      >
        <DialogContent className="border-white/10 bg-[#0f172a] text-slate-100 [&>button]:text-slate-400 [&>button]:hover:bg-white/10 [&>button]:hover:text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {pendingAction ? actionTitle(pendingAction) : "Confirm action"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {pendingAction
                ? actionDescription(pendingAction)
                : "Review the change before continuing."}
            </DialogDescription>
          </DialogHeader>

          {pendingAction ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-indigo-500/15 text-[10px] font-semibold text-indigo-200">
                  {getInitials(pendingAction.user.username)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-100">
                  {pendingAction.user.username}
                </p>
                <p className="truncate text-xs text-slate-500">{pendingAction.user.email}</p>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={actionMutation.isPending}
                className="border-white/10 bg-transparent text-slate-200 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => {
                if (pendingAction) actionMutation.mutate(pendingAction);
              }}
              disabled={actionMutation.isPending}
              className={cn(
                "text-white",
                pendingAction?.type === "status" && pendingAction.user.is_active
                  ? "bg-rose-500 hover:bg-rose-400"
                  : pendingAction?.type === "role" && pendingAction.user.is_admin
                    ? "bg-rose-500 hover:bg-rose-400"
                    : "bg-indigo-500 hover:bg-indigo-400"
              )}
            >
              {actionMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {actionMutation.isPending
                ? "Applying…"
                : pendingAction
                  ? actionConfirmLabel(pendingAction)
                  : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(detailUserId)}
        onOpenChange={(open) => {
          if (!open) setDetailUserId(null);
        }}
      >
        <DialogContent className="border-white/10 bg-[#0f172a] text-slate-100 [&>button]:text-slate-400 [&>button]:hover:bg-white/10 [&>button]:hover:text-white">
          <DialogHeader>
            <DialogTitle className="text-white">User details</DialogTitle>
            <DialogDescription className="text-slate-400">
              Account information and recorded activity.
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full bg-white/10" />
              <Skeleton className="h-20 w-full bg-white/10" />
              <Skeleton className="h-16 w-full bg-white/10" />
            </div>
          ) : detailQuery.isError ? (
            <Alert className="border-rose-400/25 bg-rose-500/10 text-rose-200">
              <ShieldOff aria-hidden />
              <AlertTitle>We could not load the details</AlertTitle>
              <AlertDescription className="text-rose-200/80">
                {getErrorMessage(detailQuery.error)}
              </AlertDescription>
            </Alert>
          ) : detailQuery.data ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  <AvatarFallback className="bg-indigo-500/15 text-xs font-semibold text-indigo-200">
                    {getInitials(detailQuery.data.user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">
                    {detailQuery.data.user.username}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {detailQuery.data.user.email}
                  </p>
                </div>
                {detailQuery.data.user.is_admin ? (
                  <Badge
                    variant="outline"
                    className="ml-auto border-indigo-400/25 bg-indigo-400/10 text-indigo-300"
                  >
                    Admin
                  </Badge>
                ) : null}
              </div>

              <dl className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">ID</dt>
                  <dd className="mt-1">
                    <CopyButton value={detailQuery.data.user.id} label="User ID" />
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    Provider
                  </dt>
                  <dd className="mt-1 text-slate-200">
                    {providerLabel(detailQuery.data.user.provider)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Signed up</dt>
                  <dd className="mt-1 text-slate-200">
                    {formatDate(detailQuery.data.user.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    Updated
                  </dt>
                  <dd className="mt-1 text-slate-200">
                    {formatDate(detailQuery.data.user.updated_at)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    Paddle customer
                  </dt>
                  <dd className="mt-1">
                    <CopyButton
                      value={detailQuery.data.user.paddle_customer_id}
                      label="Paddle customer ID"
                    />
                  </dd>
                </div>
              </dl>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    Subscriptions
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold text-white">
                    {detailQuery.data.subscriptions_count}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    Transactions
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold text-white">
                    {detailQuery.data.transactions_count}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-transparent text-slate-200 hover:bg-white/10 hover:text-white"
              >
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
