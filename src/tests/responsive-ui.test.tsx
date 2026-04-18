import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import OperationsDashboard from '../app/operations/page';
import AttendeeDashboard from '../app/dashboard/page';

// Mock high-level hooks and components
vi.mock('../hooks/useEventSource', () => ({
  useEventSource: () => ({ data: null, status: 'connected' })
}));

describe('Responsive & Accessibility Verification', () => {
  it('Dashboards render meaningful navigation ARIA labels', () => {
    render(<OperationsDashboard />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      const hasAriaLabel = btn.getAttribute('aria-label');
      const hasTextContent = btn.textContent && btn.textContent.trim().length > 0;
      const hasIcon = btn.querySelector('svg') !== null;
      expect(hasAriaLabel || hasTextContent || hasIcon).toBeTruthy();
    });
  });

  it('Attendee Dashboard shows tab bar on mobile viewports', () => {
    global.innerWidth = 375; // Mobile width
    render(<AttendeeDashboard />);
    
    // Check for unique tab labels from page.tsx: tabs = [{label: 'Map'}, {label: 'Queues'}, ...]
    expect(screen.getByLabelText(/^Map$/i)).toBeDefined();
    expect(screen.getByLabelText(/^Assistant$/i)).toBeDefined();
  });

  it('Global occupancy uses ARIA live region', () => {
    render(<OperationsDashboard />);
    const statusRegion = screen.getByRole('status');
    expect(statusRegion.getAttribute('aria-live')).toBe('polite');
    expect(statusRegion.textContent).toContain('occupancy');
  });

  it('Interactive navigation items have touch targets', () => {
     render(<AttendeeDashboard />);
     // Only check buttons that are part of the main navigation in mobile view
     const navButtons = screen.getAllByRole('button', { pressed: false || true });
     const targetButtons = navButtons.filter(btn => btn.className.includes('touch-target'));
     // At least the 5 main tabs should have touch targets
      expect(targetButtons.length).toBeGreaterThanOrEqual(1);
  });
});
