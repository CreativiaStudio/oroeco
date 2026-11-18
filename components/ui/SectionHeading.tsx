import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  /** Invertito per sfondi scuri. */
  tone?: "light" | "dark";
  action?: React.ReactNode;
}

/** Intestazione editoriale di sezione, nello stile Maison. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  tone = "light",
  action,
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4",
        centered ? "items-center text-center" : "items-start text-left",
        !centered && action
          ? "md:flex-row md:items-end md:justify-between"
          : "",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3",
          centered ? "items-center" : "items-start",
        )}
      >
        {eyebrow ? (
          <span className={cn("eyebrow", tone === "dark" && "text-gold-soft")}>
            {eyebrow}
          </span>
        ) : null}
        <h2
          className={cn(
            "font-serif text-3xl leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.75rem]",
            tone === "dark" ? "text-white" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "max-w-2xl text-pretty text-sm leading-relaxed sm:text-base",
              tone === "dark" ? "text-white/70" : "text-graphite",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
