import React from "react";
import { captureException } from "@sentry/nextjs";
import { ErrorInfo } from "react";

type Props = {
  fallback: React.ReactNode;
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
    captureException(error);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback;
    }

    return this.props.children;
  }
}
