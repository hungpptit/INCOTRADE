export interface Staff {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
}

export interface StaffQueryParameters {
  isActive?: boolean;
}

export interface CreateStaffRequest {
  fullName: string;
  email: string;
}

export interface UpdateStaffRequest {
  fullName: string;
  email: string;
  isActive: boolean;
}

export interface WorkSchedule {
  id: string;
  staffId: string;
  staffName?: string;
  workDate: string;   // yyyy-MM-dd
  startTime: string;  // HH:mm:ss
  endTime: string;    // HH:mm:ss
}

export interface CreateWorkScheduleRequest {
  workDate: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleQueryParameters {
  startDate?: string;
  endDate?: string;
}
