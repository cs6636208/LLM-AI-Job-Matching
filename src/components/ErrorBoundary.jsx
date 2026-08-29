import React from 'react';

/**
 * React Error Boundary โ€” catches JavaScript errors in child components
 * during rendering, lifecycle methods, and constructors.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    // errorTracker.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-root">
          <div className="bg-grid"></div>
          <div className="bg-orb orb-1"></div>
          <div className="bg-orb orb-2"></div>
          <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: '480px', textAlign: 'center' }}>
              <div className="auth-brand">
                <div className="auth-brand-icon" style={{ fontSize: '3rem' }}>๐’ฅ</div>
                <h2 className="text-gradient">เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”</h2>
                <p className="text-secondary" style={{ marginTop: '0.75rem', lineHeight: '1.6' }}>
                  เธฃเธฐเธเธเธเธเธเธฑเธเธซเธฒเธ—เธตเนเนเธกเนเธเธฒเธ”เธเธดเธ” เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเนเธญเธตเธเธเธฃเธฑเนเธ
                </p>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <details
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    maxHeight: '200px',
                    overflow: 'auto',
                  }}
                >
                  <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                    เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ” (Dev Mode)
                  </summary>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <button
                className="btn btn-glow w-full mt-4"
                style={{ justifyContent: 'center' }}
                onClick={this.handleReset}
              >
                เธฅเธญเธเนเธซเธกเน
              </button>

              <button
                className="btn btn-secondary w-full mt-3"
                style={{ justifyContent: 'center' }}
                onClick={() => window.location.reload()}
              >
                เธฃเธตเน€เธเธฃเธเธซเธเนเธฒ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
