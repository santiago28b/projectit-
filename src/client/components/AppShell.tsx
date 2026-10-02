"use client";

import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

import { ROLE_STYLES } from "@/client/components/RoleBadge";
import { Button } from "@/client/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import { cn } from "@/client/lib/utils";
import { useRoleSwitcherViewModel } from "@/client/viewmodels/useRoleSwitcherViewModel";
import type {
  CurrentUser,
  SwitcherAccount,
  UserRole,
} from "@/shared/models/domain";

const NAV_LINKS: Record<UserRole, { href: string; label: string }[]> = {
  candidate: [
    { href: "/candidate", label: "Dashboard" },
    { href: "/candidate/marketplace", label: "Marketplace" },
  ],
  company_admin: [
    { href: "/company", label: "Dashboard" },
    { href: "/company/projects", label: "Projects" },
    { href: "/company/review", label: "Review" },
  ],
  platform_admin: [{ href: "/admin", label: "Admin" }],
};

function accountLabel(account: SwitcherAccount) {
  return account.companyName
    ? `${account.name} · ${account.companyName}`
    : account.name;
}

export function AppShell({
  current,
  accounts,
  children,
}: {
  current: CurrentUser | null;
  accounts: SwitcherAccount[];
  children: React.ReactNode;
}) {
  const { switchTo, isPending, error } = useRoleSwitcherViewModel();
  const role = current?.user.role;
  const accent = role ? ROLE_STYLES[role] : null;

  const candidates = accounts.filter((a) => a.role === "candidate");
  const companies = accounts.filter((a) => a.role === "company_admin");

  return (
    <>
      <header
        className={cn(
          "border-b border-t-4 bg-background",
          role === "candidate" && "border-t-candidate",
          role === "company_admin" && "border-t-company",
          !role && "border-t-platform",
        )}
      >
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-6">
          <Link href="/" className="font-semibold text-platform">
            Project It
          </Link>

          <nav className="flex gap-4 text-sm font-medium text-muted-foreground">
            {role &&
              NAV_LINKS[role].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 text-sm">
            {error && <span className="text-destructive">{error}</span>}
            <span className="hidden text-muted-foreground sm:inline">
              Viewing as:
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isPending}>
                  {accent && (
                    <span className={cn("size-2 rounded-full", accent.dot)} />
                  )}
                  {current
                    ? current.company
                      ? `${current.user.name} · ${current.company.name}`
                      : current.user.name
                    : "Choose an account"}
                  <ChevronDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <AccountGroup
                  label="Candidates"
                  accounts={candidates}
                  currentId={current?.user.id}
                  onSelect={switchTo}
                />
                <DropdownMenuSeparator />
                <AccountGroup
                  label="Companies"
                  accounts={companies}
                  currentId={current?.user.id}
                  onSelect={switchTo}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      {/* Remount the page on account switch so client views refetch as the new user. */}
      <Fragment key={current?.user.id ?? "anon"}>{children}</Fragment>
    </>
  );
}

function AccountGroup({
  label,
  accounts,
  currentId,
  onSelect,
}: {
  label: string;
  accounts: SwitcherAccount[];
  currentId: string | undefined;
  onSelect: (userId: string) => void;
}) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>{label}</DropdownMenuLabel>
      {accounts.map((account) => (
        <DropdownMenuItem
          key={account.userId}
          onSelect={() => onSelect(account.userId)}
          className={cn(account.userId === currentId && "font-semibold")}
        >
          <span
            className={cn("size-2 rounded-full", ROLE_STYLES[account.role].dot)}
          />
          {accountLabel(account)}
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>
  );
}
