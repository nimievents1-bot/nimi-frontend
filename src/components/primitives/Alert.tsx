import { type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface AlertProps {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "danger";
  className?: string;
  /** ARIA role: "alert" for errors, "status" otherwise. Defaults sensibly. */
  role?: "alert" | "status";
}

/**
 * Inline alert / banner. Reserved for system feedback only,
 * never marketing accents.
 */
export function Alert({ children, variant = "info", className, role }: AlertProps) {
  const styles = {
    info: "border-semantic-info bg-[#ECF3F8] text-semantic-info",
    success: "border-semantic-success bg-[#E5F2EC] text-[#1F5A41]",
    warning: "border-semantic-warning bg-[#FAF1DF] text-[#6F4A11]",
    danger: "border-semantic-danger bg-[#FBEBE7] text-semantic-danger",
  }[variant];

  const computedRole = role ?? (variant === "danger" ? "alert" : "status");

  return (
    <div
      role={computedRole}
      className={cn(
        "rounded-r-sm border-l-[3px] py-3.5 pl-4 pr-5",
        "font-sans text-sm leading-relaxed",
        styles,
        className,
      )}
    >
      {children}
    </div>
  );
}
