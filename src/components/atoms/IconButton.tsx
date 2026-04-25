"use client";

import Image from "next/image";
import type { ButtonHTMLAttributes } from "react";

type IconName = "mic" | "wave" | "close" | "speak" | "download";
type IconButtonSize = "sm" | "md" | "lg";
type IconButtonVariant = "default" | "active" | "listening" | "speaking";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly icon: IconName;
  readonly ariaLabel: string;
  readonly size?: IconButtonSize;
  readonly variant?: IconButtonVariant;
}

const SIZE_PX: Record<IconButtonSize, number> = { sm: 32, md: 40, lg: 48 };

const ICON_PATH: Record<IconName, string> = {
  mic: "/icons/mic.svg",
  wave: "/icons/wave.svg",
  speak: "/icons/speak.svg",
  download: "/icons/download.svg",
  close: "/icons/close.svg",
};

const VARIANT_BG: Record<IconButtonVariant, string> = {
  default: "var(--color-bg-inset)",
  active: "var(--color-primary)",
  listening: "var(--color-status-illegal-bg)",
  speaking: "var(--color-status-compliant-bg)",
};

const VARIANT_FG: Record<IconButtonVariant, string> = {
  default: "var(--color-foreground)",
  active: "var(--color-primary-foreground)",
  listening: "var(--color-status-illegal)",
  speaking: "var(--color-status-compliant)",
};

export function IconButton({
  icon,
  ariaLabel,
  size = "md",
  variant = "default",
  className = "",
  ...rest
}: IconButtonProps) {
  const px = SIZE_PX[size];
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={[
        "inline-flex items-center justify-center rounded-full transition-opacity",
        "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: px,
        height: px,
        backgroundColor: VARIANT_BG[variant],
        color: VARIANT_FG[variant],
      }}
      data-variant={variant}
      {...rest}
    >
      <Image
        src={ICON_PATH[icon]}
        alt=""
        width={Math.round(px * 0.5)}
        height={Math.round(px * 0.5)}
        aria-hidden="true"
      />
    </button>
  );
}
