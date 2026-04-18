import { NextRequest, NextResponse } from 'next/server';
import { createAlert } from '@/lib/alerts';
import { AlertType, AlertPriority } from '@/types/alerts';

/**
 * POST /api/alerts/create
 * Creates a new alert for staff management (Requirement 6.1).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, priority, locationName, zoneId, description } = body;

    // Basic Validation (Requirement 6.2)
    if (!type || !priority || !locationName || !zoneId || !description) {
      return NextResponse.json(
        { error: 'Incomplete alert data. type, priority, locationName, zoneId, and description are required.' },
        { status: 400 }
      );
    }

    const alert = await createAlert({
      type: type as AlertType,
      priority: priority as AlertPriority,
      locationName,
      zoneId,
      description,
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Alert creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}
