import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  readonly as?: "section" | "article" | "div";
  readonly children: ReactNode;
}

export function Card({
  as: Component = "section",
  className = "",
  children,
  ...rest
}: CardProps) {
  const classes = ["surface-card", className].filter(Boolean).join(" ");
  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}

export interface CardHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly badge?: ReactNode;
  readonly action?: ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  badge,
  action,
}: CardHeaderProps) {
  return (
    <div className="ui-card-header">
      <div>
        {badge ? <div style={{ marginBottom: "0.35rem" }}>{badge}</div> : null}
        <h2 className="card-title">{title}</h2>
        {subtitle ? <p className="card-copy">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export interface CardFooterProps {
  readonly children: ReactNode;
}

export function CardFooter({ children }: CardFooterProps) {
  return <div className="ui-card-footer">{children}</div>;
}
