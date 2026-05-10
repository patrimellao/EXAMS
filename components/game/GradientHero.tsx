import { cn } from "@/lib/utils";

type Variant = "trust" | "warm" | "brand";

const variantBg: Record<Variant, string> = {
  trust: "bg-grad-trust",
  warm: "bg-grad-warm",
  brand: "bg-grad-brand",
};

export function GradientHero({
  variant = "trust",
  className,
  children,
  decorative = true,
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  decorative?: boolean;
}) {
  return (
    <header
      className={cn(
        "relative overflow-hidden text-white",
        variantBg[variant],
        className,
      )}
    >
      {decorative && (
        <>
          <div
            className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
        </>
      )}
      <div className="relative">{children}</div>
    </header>
  );
}
