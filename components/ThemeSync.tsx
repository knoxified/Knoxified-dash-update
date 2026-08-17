"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { updateThemeAction, getUserThemeAction } from "@/lib/actions/user-actions";

export function ThemeSync() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    async function syncInit() {
      try {
        const userTheme = await getUserThemeAction();
        if (userTheme && userTheme !== theme) {
          setTheme(userTheme);
        }
      } catch (error) {
        // Ignored
      } finally {
        setHasSynced(true);
      }
    }
    syncInit();
    // Intentionally run once on mount only — this pulls the saved theme from
    // the database a single time. Including `theme` here caused an infinite
    // loop: this effect calls setTheme(), which changed `theme`, which
    // re-triggered this effect, which fetched and could call setTheme() again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasSynced && theme) {
      updateThemeAction(theme).catch(() => {});
    }
  }, [theme, hasSynced]);

  return null;
}
