import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorStr: string;
  errorStack: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorStr: "",
    errorStack: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorStr: error.toString(), errorStack: error.stack || "" };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: "red", background: "#f8d7da", border: "1px solid red", minHeight: '100vh', zIndex: 99999, position: 'relative' }}>
          <h2>Application Error</h2>
          <p><strong>{this.state.errorStr}</strong></p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{this.state.errorStack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
