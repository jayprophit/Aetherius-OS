import type { EventLedger } from "./ledger.ts";
import { newId, nowIso } from "./ids.ts";
import type { Repository } from "./store.ts";

export interface Account {
  id: string;
  handle: string;
  displayName: string;
  email: string | null;
  roles: string[];
  status: "active" | "suspended";
  createdAt: string;
}

export interface Profile {
  id: string;
  accountId: string;
  bio: string;
  avatar: string | null;
  visibility: "public" | "private";
  updatedAt: string;
}

export const DEFAULT_ROLE = "member";

export interface CreateAccountInput {
  handle: string;
  displayName: string;
  email?: string;
  roles?: string[];
}

/**
 * Accounts, profiles and identity.
 *
 * This is the one account system the application families share. It is
 * deliberately local-first: a caller passes the authenticated account id to
 * the service, exactly as the host would pass it from its session. Nothing
 * here invents a second login or stores a password.
 */
export class AccountService {
  private readonly accounts: Repository<Account>;
  private readonly profiles: Repository<Profile>;
  private readonly ledger?: EventLedger;
  private readonly clock: () => Date;

  constructor(
    accounts: Repository<Account>,
    profiles: Repository<Profile>,
    options: { ledger?: EventLedger; clock?: () => Date } = {},
  ) {
    this.accounts = accounts;
    this.profiles = profiles;
    this.ledger = options.ledger;
    this.clock = options.clock ?? (() => new Date());
  }

  create(input: CreateAccountInput): Account {
    const handle = input.handle.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_.-]{2,31}$/.test(handle)) {
      throw new Error(`invalid handle: ${input.handle}`);
    }
    if (this.findByHandle(handle)) throw new Error(`handle is already taken: ${handle}`);
    if (!input.displayName.trim()) throw new Error("display name is empty");
    const account: Account = {
      id: newId("acc"),
      handle,
      displayName: input.displayName.trim(),
      email: input.email?.trim().toLowerCase() || null,
      roles: [...new Set([DEFAULT_ROLE, ...(input.roles ?? [])])],
      status: "active",
      createdAt: nowIso(this.clock),
    };
    this.accounts.put(account);
    this.profiles.put({
      id: newId("prf"),
      accountId: account.id,
      bio: "",
      avatar: null,
      visibility: "public",
      updatedAt: account.createdAt,
    });
    this.ledger?.append({
      type: "account.created",
      actor: account.id,
      subject: account.id,
      data: { handle: account.handle, roles: account.roles },
    });
    return structuredClone(account);
  }

  get(id: string): Account | undefined {
    const account = this.accounts.get(id);
    return account ? structuredClone(account) : undefined;
  }

  findByHandle(handle: string): Account | undefined {
    const wanted = handle.trim().toLowerCase();
    const account = this.accounts.all().find((candidate) => candidate.handle === wanted);
    return account ? structuredClone(account) : undefined;
  }

  requireActive(id: string): Account {
    const account = this.accounts.get(id);
    if (!account || account.status !== "active") throw new Error(`no active account: ${id}`);
    return structuredClone(account);
  }

  suspend(id: string, actor: string, reason: string): Account {
    const account = this.requireActive(id);
    const operator = this.requireActive(actor);
    if (!operator.roles.includes("admin")) throw new Error("only an admin may suspend an account");
    if (!reason.trim()) throw new Error("a suspension needs a reason");
    const suspended: Account = { ...account, status: "suspended" };
    this.accounts.put(suspended);
    this.ledger?.append({
      type: "account.suspended",
      actor,
      subject: id,
      data: { reason },
    });
    return structuredClone(suspended);
  }

  profile(accountId: string): Profile | undefined {
    const profile = this.profiles.all().find((candidate) => candidate.accountId === accountId);
    return profile ? structuredClone(profile) : undefined;
  }

  updateProfile(actor: string, accountId: string, patch: Partial<Pick<Profile, "bio" | "avatar" | "visibility">>): Profile {
    const operator = this.requireActive(actor);
    if (actor !== accountId && !operator.roles.includes("admin")) {
      throw new Error("an account may only edit its own profile");
    }
    const current = this.profiles.all().find((candidate) => candidate.accountId === accountId);
    if (!current) throw new Error(`no profile for account: ${accountId}`);
    const updated: Profile = {
      ...current,
      ...patch,
      updatedAt: nowIso(this.clock),
    };
    this.profiles.put(updated);
    this.ledger?.append({
      type: "profile.updated",
      actor,
      subject: accountId,
      data: { fields: Object.keys(patch).sort() },
    });
    return structuredClone(updated);
  }
}
