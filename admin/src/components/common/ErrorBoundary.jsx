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
    console.error('Admin ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/admin/';
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
            background: '#0f172a',
            padding: '2rem 1rem',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#1e293b',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.5)',
              border: '1px solid #334155',
              textAlign: 'center',
              color: '#ffffff',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: '#450a0a',
                color: '#ef4444',
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
                color: '#ffffff',
                margin: '0 0 0.5rem 0',
              }}
            >
              Administrator Portal Notice
            </h1>

            <p
              style={{
                fontSize: '0.9rem',
                color: '#94a3b8',
                lineHeight: 1.5,
                margin: '0 0 1.75rem 0',
              }}
            >
              A rendering issue was intercepted in the Admin Panel. Please reload or return to dashboard.
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
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.4rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                }}
              >
                ↻ Reload Admin
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  background: '#334155',
                  color: '#e2e8f0',
                  border: '1px solid #475569',
                  padding: '0.75rem 1.4rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Admin Home
              </button>
            </div>

            {this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Diagnostics</summary>
                <pre
                  style={{
                    marginTop: '0.5rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    color: '#f87171',
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
