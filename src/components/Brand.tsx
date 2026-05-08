type BrandProps = {
  variant?: "logo" | "icon";
  className?: string;
  showLabel?: boolean;
};

const BRAND_ASSETS = {
  logo: "/landminer_primary_logo.png",
  icon: "/landminer_primary_icon.png",
};

export function Brand({ variant = "logo", className = "", showLabel = false }: BrandProps) {
  const src = BRAND_ASSETS[variant];

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <img
        src={src}
        alt={variant === "logo" ? "LandMiner CRM" : "LandMiner CRM icon"}
        className={variant === "logo" ? "h-12 w-auto object-contain" : "h-10 w-10 rounded-xl object-contain"}
        draggable={false}
      />
      {showLabel ? (
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">LandMiner CRM</p>
        </div>
      ) : null}
    </div>
  );
}
