import React from 'react';
class ErrorBoundary extends React.Component<{children?: React.ReactNode}, {hasError: boolean; error: any; errorInfo: any}> {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if ((this.state as any).hasError) {
            return (
                <div style={{ padding: '20px', color: 'red' }}>
                    <h1>Bir şeyler yanlış gitti.</h1>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {(this.state as any).error && (this.state as any).error.toString()}
                        <br />
                        {(this.state as any).errorInfo && (this.state as any).errorInfo.componentStack}
                    </details>
                </div>
            );
        }

        return (this.props as any).children;
    }
}

export default ErrorBoundary;
