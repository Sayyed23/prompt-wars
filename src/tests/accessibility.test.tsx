import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CrowdHeatmap from '@/components/attendee/CrowdHeatmap';
import QueueDisplay from '@/components/attendee/QueueDisplay';
import AIAssistantChat from '@/components/attendee/AIAssistantChat';
import WayfindingPane from '@/components/attendee/WayfindingPane';
import AlertCenter from '@/components/operations/AlertCenter';

// Mocking useEventSource
vi.mock('@/hooks/useEventSource', () => ({
  useEventSource: () => ({ data: null, status: 'connected' })
}));

// Mocking lib/venue
vi.mock('@/lib/venue', () => ({
  getAllZones: () => [
    { id: 'z1', name: 'Zone 1', coordinates: [[0,0], [10,0], [10,10], [0,10]], capacity: 100 }
  ],
  getAllFacilities: () => [
    { id: 'f1', name: 'Facility 1', type: 'FOOD_STALL', zoneId: 'z1' }
  ]
}));

// Mocking fetch
global.fetch = vi.fn((url) => {
  let data: any = [];
  if (url.includes('/api/crowd/density')) data = { zones: {}, lastUpdated: new Date().toISOString() };
  if (url.includes('/api/queues/predictions')) data = [{ facilityId: 'f1', waitTimeMinutes: 5, confidence: 'HIGH' }];
  if (url.includes('/api/alerts/active')) data = [];
  
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response);
});

describe('Accessibility Compliance Audit (Requirement 8)', () => {
  it('CrowdHeatmap should have descriptive SVG metadata and accessible zones', () => {
    render(<CrowdHeatmap />);
    const map = screen.getByRole('img');
    expect(map).toBeDefined();
    
    // Check for focusable zones
    const zones = screen.getAllByRole('button');
    expect(zones.length).toBeGreaterThan(0);
  });

  it('QueueDisplay should have a live region and accessible list roles', async () => {
    render(<QueueDisplay />);
    // Wait for loading to finish and list to appear
    const list = await screen.findByRole('list');
    expect(list.getAttribute('aria-live')).toBe('polite');
  });

  it('AIAssistantChat should have a live region and input labels', () => {
    render(<AIAssistantChat />);
    const log = screen.getByRole('log');
    expect(log.getAttribute('aria-live')).toBe('polite');
    
    const input = screen.getByLabelText(/Ask/i);
    expect(input).toBeDefined();
  });

  it('WayfindingPane should have accessible selects and route live regions', () => {
    render(<WayfindingPane />);
    expect(screen.getByLabelText(/Select start location/i)).toBeDefined();
    expect(screen.getByLabelText(/Select destination/i)).toBeDefined();
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('AlertCenter should announce new alerts via assertive live region', async () => {
    render(<AlertCenter />);
    const log = await screen.findByRole('log');
    expect(log.getAttribute('aria-live')).toBe('assertive');
  });
});
