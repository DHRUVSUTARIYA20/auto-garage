import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-4 text-center rounded-lg bg-destructive/10 text-destructive h-full min-h-[200px] w-full">
                    <AlertCircle className="w-10 h-10 mb-2" />
                    <h3 className="text-lg font-semibold">Something went wrong</h3>
                    <p className="text-sm opacity-80">Failed to load content</p>
                </div>
            );
        }

        return this.props.children;
    }
}
