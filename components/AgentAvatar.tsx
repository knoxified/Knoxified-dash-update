import { Bot, Headphones, Sparkles, UserCircle, Smile, Shield, Star, Zap } from "lucide-react";
import { getAvatarOption } from "@/lib/avatar-options";

const ICONS: Record<string, React.ElementType> = {
  bot: Bot,
  headset: Headphones,
  sparkles: Sparkles,
  "user-circle": UserCircle,
  smile: Smile,
  shield: Shield,
  star: Star,
  zap: Zap,
};

export function AgentAvatar({
  avatarKey,
  size = "md",
  className = "",
}: {
  avatarKey?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const option = getAvatarOption(avatarKey);
  const Icon = ICONS[option.key] || Bot;
  const dims = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-16 h-16" : "w-12 h-12";
  const iconSize = size === "sm" ? 16 : size === "lg" ? 32 : 22;

  return (
    <div className={`rounded-full flex items-center justify-center shrink-0 ${dims} ${option.colorClass} ${className}`}>
      <Icon size={iconSize} />
    </div>
  );
}
