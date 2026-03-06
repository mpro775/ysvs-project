export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  severity: NotificationSeverity;
  createdAt: Date;
  actionUrl?: string;
  meta?: Record<string, unknown>;
}
