import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#333', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#ff4d4d' }}>Something went wrong.</h1>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left', background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e9ecef', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Error Details:</h3>
            <pre style={{ color: '#d63384', whiteSpace: 'pre-wrap' }}>
              {this.state.error && this.state.error.toString()}
            </pre>
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>Component Stack Trace</summary>
              <pre style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}
          >
            Back to Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
