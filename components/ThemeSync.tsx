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
  }, [setTheme, theme]);

  useEffect(() => {
    if (hasSynced && theme) {
      updateThemeAction(theme).catch(() => {});
    }
  }, [theme, hasSynced]);

  return null;
}
