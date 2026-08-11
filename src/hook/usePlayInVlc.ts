import { useToastStore } from "@/store/toast";
import { playInVlc } from "@/utils/vlc";
import { useCallback } from "react";

export function usePlayInVlc() {
  const toastShow = useToastStore((s) => s.show);
  return useCallback(
    (url: string, title: string) => {
      if (!url) {
        toastShow("Stream indisponível", "error");
        return;
      }
      playInVlc(url, title);
    },
    [toastShow],
  );
}
