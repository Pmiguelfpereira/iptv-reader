import { useAccountStore } from "@/store/account";

export const useExternalPlayer = () =>
  useAccountStore((s) => s.account?.externalPlayer ?? null);
