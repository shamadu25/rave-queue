export type Department = 'Consultation' | 'Lab' | 'Pharmacy' | 'Billing';
export type Priority = 'Normal' | 'Emergency';
export type Status = 'Waiting' | 'Called' | 'Served' | 'In Progress' | 'Completed' | 'Skipped';

export interface QueueEntry {
  id: string;
  token: string;
  fullName: string;
  phoneNumber?: string;
  department: Department;
  priority: Priority;
  status: Status;
  timestamp: Date;
}

export interface QueueFilters {
  department?: Department;
  status?: Status;
}