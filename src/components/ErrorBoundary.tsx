import { Component, ErrorInfo, ReactNode } from 'react';
import { Logo } from './ui/Logo';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <Logo variant="icon" className="w-16 h-16" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-slate-600 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            {this.state.error && (
              <div className="bg-slate-100 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-mono text-slate-700 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <Button onClick={this.handleReload} className="w-full">
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
