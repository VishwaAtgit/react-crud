import React from 'react';
import { createLogger } from '../utils/logger';
import { increment } from '../utils/metrics';

const log = createLogger('ErrorBoundary');

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    log.error('Uncaught error in React tree', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    increment('react_error_boundary_total', 1, {
      error: error.message,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: 24, textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}