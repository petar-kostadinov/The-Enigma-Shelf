export interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}
