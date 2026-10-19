"use client";

import { Component, type ReactNode } from "react";


export interface ErrorBoundaryProps {
  readonly fallbackTitle?: string;
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly message: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "Unexpected rendering error.",
    };
  }

  public override render(): ReactNode {

    if (this.state.hasError) {
      return (
        <section className="surface-card" role="alert">
          <h2 className="card-title">
            {this.props.fallbackTitle ?? "Component Unavailable"}
          </h2>
          <p className="card-copy">{this.state.message}</p>
        </section>
      );
    }
    return this.props.children;
  }
}
