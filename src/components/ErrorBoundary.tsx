import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[mediastack-rad] Render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center font-mono">
            <p className="text-sm text-destructive font-medium mb-1">Something went wrong</p>
            <p className="text-xs text-muted-foreground">{this.state.error?.message}</p>
            <button
              className="mt-4 text-xs underline text-muted-foreground hover:text-foreground"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
