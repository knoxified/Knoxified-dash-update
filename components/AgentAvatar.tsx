"use client";

import { useMemo } from "react";
import { renderAvatarSvg } from "@/lib/avatar-options";

export function AgentAvatar({
  avatarKey,
  size = "md",
  className = "",
}: {
  avatarKey?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = size === "sm" ? 32 : size === "lg" ? 96 : 48;
  const svg = useMemo(() => renderAvatarSvg(avatarKey, dims), [avatarKey, dims]);

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 bg-slate-100 dark:bg-white/5 ${className}`}
      style={{ width: dims, height: dims }}
      // Self-generated SVG (DiceBear), never user-supplied markup -- safe.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
