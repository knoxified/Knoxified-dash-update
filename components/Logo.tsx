export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <img src="/logo.png" alt="Knoxified Logo" className={`${className} object-contain`} />
  );
}
