import React from 'react';

/**
 * CustomerErrorBoundary
 * Catches render-time errors within any customer page/component tree and
 * displays a friendly Bootstrap-styled fallback UI instead of a blank page.
 * In development, shows the technical error message for easier debugging.
 */
class CustomerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[CustomerErrorBoundary] Caught a render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Navigate back to home as a safe recovery point
    window.location.href = '/customer/home';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-header bg-danger text-white text-center py-4 border-0">
                  <i className="bi bi-exclamation-triangle-fill fs-1 d-block mb-2"></i>
                  <h4 className="fw-bold mb-1">Something went wrong</h4>
                  <p className="small mb-0 text-white-50">
                    An unexpected error occurred on this page.
                  </p>
                </div>
                <div className="card-body p-4 text-center">
                  <p className="text-muted mb-4">
                    We're sorry for the inconvenience. You can try again or go back to the home page.
                  </p>

                  {isDev && this.state.error && (
                    <div className="alert alert-warning text-start mb-4 fs-8">
                      <strong>⚠ Dev Error Details:</strong>
                      <pre className="mt-2 mb-0 text-danger" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '12px' }}>
                        {this.state.error.toString()}
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </div>
                  )}

                  <div className="d-flex justify-content-center gap-3 flex-wrap">
                    <button
                      className="btn btn-primary fw-bold px-4"
                      onClick={this.handleRetry}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>Try Again
                    </button>
                    <button
                      className="btn btn-outline-secondary fw-bold px-4"
                      onClick={this.handleReset}
                    >
                      <i className="bi bi-house me-2"></i>Go to Home
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CustomerErrorBoundary;
