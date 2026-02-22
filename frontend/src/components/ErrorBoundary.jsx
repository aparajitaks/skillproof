import { Component } from "react";

/**
 * ErrorBoundary — catches render-time errors in the React tree.
 * Prevents a single component crash from taking down the entire app.
 * Used as a top-level wrapper in App.jsx.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="page-center">
                    <div style={{ textAlign: "center", maxWidth: "480px" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>💥</div>
                        <h2 style={{ marginBottom: "12px" }}>Something went wrong</h2>
                        <p style={{ color: "var(--text-muted)", marginBottom: "24px", lineHeight: 1.6 }}>
                            An unexpected error occurred. Please refresh the page to continue.
                        </p>
                        {process.env.NODE_ENV === "development" && (
                            <pre style={{
                                background: "rgba(239,68,68,0.08)",
                                border: "1px solid rgba(239,68,68,0.25)",
                                borderRadius: "8px",
                                padding: "12px",
                                fontSize: "0.75rem",
                                textAlign: "left",
                                color: "var(--danger)",
                                overflow: "auto",
                                marginBottom: "20px",
                            }}>
                                {this.state.error?.toString()}
                            </pre>
                        )}
                        <button
                            className="btn btn-primary"
                            onClick={() => window.location.reload()}
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
