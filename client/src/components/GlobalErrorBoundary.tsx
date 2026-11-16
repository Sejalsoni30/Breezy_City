import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('[GlobalErrorBoundary] Caught unhandled React error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
        >
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-red-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {this.props.fallbackTitle || 'Something went wrong'}
                </h1>
                <p className="text-sm text-slate-600 mt-0.5">
                  The application encountered an unexpected runtime error.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 leading-relaxed">
              {this.props.fallbackMessage ||
                'Your session state is protected. You can safely try re-rendering the component or refreshing the application.'}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Try re-rendering the component"
              >
                <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-300 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                aria-label="Reload current web page"
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.toggleDetails}
                aria-expanded={this.state.showDetails}
                className="text-xs text-slate-600 hover:text-slate-800 underline ml-auto py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {this.state.showDetails ? 'Hide technical details' : 'Show technical details'}
              </button>
            </div>

            {this.state.showDetails && (
              <div className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-48 space-y-2">
                <p className="font-bold text-red-400">
                  {this.state.error?.name}: {this.state.error?.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[11px] text-slate-300 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
