export enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  UNASSIGNED = 'unassigned',
  ASSIGNED = 'assigned',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
}

export enum AlertType {
  CONGESTION = 'congestion',
  MEDICAL = 'medical',
  SECURITY = 'security',
  FACILITY_ISSUE = 'facility_issue',
  OTHER = 'other',
}

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  locationName: string;
  zoneId: string;
  description: string;
  assignedStaffIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  congestions: boolean;
  announcements: boolean;
  waitTimes: boolean;
}
