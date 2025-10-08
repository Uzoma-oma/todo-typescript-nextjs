'use client';

import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-red-600">Something went wrong.</h1>
          <p className="text-gray-600 mt-2 text-base md:text-lg">
            Try refreshing the page or contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}