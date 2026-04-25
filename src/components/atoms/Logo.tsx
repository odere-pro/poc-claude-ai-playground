import Image from "next/image";

interface LogoProps {
  readonly size: "sm" | "md";
}

export function Logo({ size }: LogoProps) {
  const px = size === "sm" ? 24 : 32;
  return (
    <span className="inline-flex items-center gap-2">
      <Image
        src="/icons/shield.svg"
        alt=""
        width={px}
        height={px}
        aria-hidden="true"
        style={{ color: "var(--color-primary)" }}
      />
      {size === "md" ? (
        <span
          className="font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}
        >
          Clauseguard
        </span>
      ) : null}
    </span>
  );
}
