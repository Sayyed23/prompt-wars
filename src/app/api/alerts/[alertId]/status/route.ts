import { NextRequest, NextResponse } from 'next/server';
import { updateAlertStatus } from '@/shared/lib/alerts';
import { AlertStatus } from '@/shared/types/alerts';

/**
 * PATCH /api/alerts/[alertId]/status
 * Updates the status and staff assignments of an alert (Requirement 6.4).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const alertId = params.alertId;
    const body = await request.json();
    const { status, staffIds } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    const updatedAlert = await updateAlertStatus(
      alertId, 
      status as AlertStatus, 
      staffIds
    );

    if (!updatedAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error('Alert status update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update alert status' },
      { status: 500 }
    );
  }
}
