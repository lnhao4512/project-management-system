export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || SOCKET_URL;
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Quản Lý Công Việc';

export const ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  EMPLOYEE: 'employee',
};

export const TASK_STATUS = {
  TODO: 'todo',
  DOING: 'doing',
  REVIEW: 'review',
  DONE: 'done',
};

export const TASK_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const STATUS_LABELS = {
  todo: 'Cần làm',
  doing: 'Đang làm',
  review: 'Chờ duyệt',
  done: 'Hoàn thành',
};

export const PRIORITY_LABELS = {
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

export const PROJECT_STATUS_LABELS = {
  planning: 'Lập kế hoạch',
  active: 'Đang hoạt động',
  on_hold: 'Tạm dừng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export const ROLE_LABELS = {
  admin: 'Quản trị viên',
  project_manager: 'Quản lý dự án',
  employee: 'Nhân viên',
};

export const COLORS = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-gray-400',
};
