import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock import.meta for this test file
declare global {
  namespace NodeJS {
    interface Global {
      import: {
        meta: {
          env: Record<string, string>;
        };
      };
    }
  }
}

describe('Frontend Unit Tests', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should render a simple component', () => {
    const TestComponent = () => <div>Test Component</div>;
    render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should have access to Vite environment variables', () => {
    // Access the mocked import.meta.env from global
    const env = (global as any).import?.meta?.env;
    expect(env?.VITE_API_URL).toBeDefined();
    expect(env?.VITE_APP_ENVIRONMENT).toBe('test');
  });

  it('should handle CSS modules', () => {
    // This tests that CSS modules are properly mocked
    const styles = require('../../styles/App.module.css');
    expect(typeof styles).toBe('object');
  });
}); 