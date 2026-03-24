import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// ...existing code...

test('renders without crashing (smoke)', () => {
  render(<App />);
});

test('renders a heading or identifiable text node', () => {
  render(<App />);
  // getByRole will throw immediately if no heading exists — deterministic pass/fail
  const heading = screen.getByRole('heading', { level: 1 });
  expect(heading).toBeInTheDocument();
});