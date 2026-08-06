import { createXtreamClient, XtreamClient } from "@/lib/xtream";
import { create } from "zustand";
import { db } from "../../db";
import { account } from "../../db/schema";

function getAccount() {
  return db.select().from(account);
}

type Account = Awaited<ReturnType<typeof getAccount>>[number];

interface AccountState {
  account: Account | null;
  client: XtreamClient | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAccount: (account: Account) => void;
  clear: () => void;
}

function buildClient(account: Account): XtreamClient {
  return createXtreamClient({
    baseUrl: account.url,
    username: account.username,
    password: account.password,
  });
}

export const useAccountStore = create<AccountState>((set) => ({
  account: null,
  client: null,
  hydrated: false,

  hydrate: async () => {
    const [account] = await getAccount();
    set({
      account: account ?? null,
      client: account ? buildClient(account) : null,
      hydrated: true,
    });
  },

  setAccount: (account) => set({ account, client: buildClient(account) }),
  clear: () => set({ account: null, client: null }),
}));
