import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            padding: '2rem 1rem',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
              boxShadow: '0 20px 45px -10px rgba(15, 76, 129, 0.12)',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: '#fef2f2',
                color: '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                marginBottom: '1.25rem',
              }}
            >
              ⚠️
            </div>

            <h1
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 0.5rem 0',
              }}
            >
              Something Went Wrong
            </h1>

            <p
              style={{
                fontSize: '0.9rem',
                color: '#64748b',
                lineHeight: 1.5,
                margin: '0 0 1.75rem 0',
              }}
            >
              The application encountered an unexpected display error. Please try reloading the page or returning to the home screen.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: '1.5rem',
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: '#0F4C81',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.4rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15, 76, 129, 0.25)',
                }}
              >
                ↻ Reload Application
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '0.75rem 1.4rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Go to Homepage
              </button>
            </div>

            {this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.75rem',
                  color: '#64748b',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Technical Details</summary>
                <pre
                  style={{
                    marginTop: '0.5rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    color: '#dc2626',
                    maxHeight: '160px',
                    overflowY: 'auto',
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
