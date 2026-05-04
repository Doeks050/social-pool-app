import Link from "next/link";

type AppButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type BaseButtonProps = {
  children: React.ReactNode;
  variant?: AppButtonVariant;
  className?: string;
};

type ButtonAsButton = BaseButtonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type ButtonAsLink = BaseButtonProps & {
  href: string;
};

type AppButtonProps = ButtonAsButton | ButtonAsLink;

function getVariantClasses(variant: AppButtonVariant) {
  switch (variant) {
    case "primary":
      return "bg-white text-zinc-950 hover:bg-zinc-200 border border-white";
    case "danger":
      return "border border-red-500/40 bg-red-500/10 text-red-200 hover:border-red-400 hover:bg-red-500/20";
    case "ghost":
      return "border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900";
    case "secondary":
    default:
      return "border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800";
  }
}

export default function AppButton(props: AppButtonProps) {
  const {
    children,
    variant = "secondary",
    className = "",
    ...rest
  } = props;

  const classes = `inline-flex min-h-10 w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${getVariantClasses(
    variant
  )} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as ButtonAsButton)}>
      {children}
    </button>
  );
}