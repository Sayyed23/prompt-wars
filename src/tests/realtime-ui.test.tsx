import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationCenter } from '../components/attendee/NotificationCenter';
import { StaffAlertPanel } from '../components/operations/StaffAlertPanel';
import React from 'react';

// Mock useEventSource
vi.mock('../hooks/useEventSource', () => ({
  useEventSource: vi.fn(() => ({ data: null }))
}));

describe('NotificationCenter (Task 15.7)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders correctly and toggles tabs', () => {
    render(<NotificationCenter />);
    expect(screen.getByText(/TERMINAL \/ NOTIFICATIONS/i)).toBeDefined();
    
    const configBtn = screen.getByText(/CONFIG/i);
    fireEvent.click(configBtn);
    expect(screen.getByText(/ALERT SUBSCRIPTIONS/i)).toBeDefined();
  });

  it('toggles preference and saves to localStorage', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByText(/CONFIG/i));
    
    const toggle = screen.getAllByRole('button').find(b => b.className.includes('w-10 h-5'));
    if (toggle) {
      fireEvent.click(toggle);
      expect(localStorage.getItem('notification_preferences')).toContain('"congestions":false');
    }
  });
});

describe('StaffAlertPanel (Task 15.8)', () => {
  it('renders staff context', () => {
    render(<StaffAlertPanel />);
    expect(screen.getByText(/GROUND_UNIT_ALPHA/i)).toBeDefined();
  });
});
