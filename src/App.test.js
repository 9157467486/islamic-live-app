import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Minbar Live app', () => {
  render(<App />);
  // The splash screen renders with MINBAR LIVE text
  const heading = screen.getByText(/MINBAR LIVE/i);
  expect(heading).toBeInTheDocument();
});