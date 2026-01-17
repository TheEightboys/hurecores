// =====================================================
// ENUMS - Application Enums
// =====================================================

// System role determines access level (NOT job title)
export type SystemRole = 'OWNER' | 'ADMIN' | 'EMPLOYEE';

// Legacy role for backward compatibility (maps to job titles)
export type UserRole = 'Owner' | 'Shift Manager' | 'HR Manager' | 'Payroll Officer' | 'Staff' | 'SuperAdmin';

export type SubscriptionPlan = 'Essential' | 'Professional' | 'Enterprise';

export type SubscriptionStatus = 'Active' | 'Suspended' | 'Cancelled' | 'Trial';

export type VerificationStatus = 'Verified' | 'Pending' | 'Unverified' | 'Rejected';

export type AccountStatus = 'Active' | 'Under Review' | 'Suspended';

export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Casual' | 'Locum' | 'Salary' | 'Daily' | 'Shift';

export type StaffStatus = 'Invited' | 'Active' | 'Inactive' | 'Archived' | 'On Leave' | 'Terminated';

export type PayMethod = 'Fixed' | 'Prorated' | 'Hourly' | 'Per Shift';

export type AttendanceStatus = 'Present' | 'Partial' | 'Absent' | 'On Leave' | 'Worked' | 'No-show';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export type VerificationType = 'ORG' | 'FACILITY';

export type AuditEventType = 'Security' | 'System' | 'Payment' | 'Verification' | 'Staff' | 'Schedule';

// =====================================================
// PERMISSIONS
// =====================================================

export interface StaffPermissions {
  staffManagement: boolean;
  scheduling: boolean;
  attendance: boolean;
  leave: boolean;
  documentsAndPolicies: boolean;
  payroll: boolean;
  settingsAdmin: boolean;
}

export const DEFAULT_PERMISSIONS: StaffPermissions = {
  staffManagement: false,
  scheduling: false,
  attendance: false,
  leave: false,
  documentsAndPolicies: false,
  payroll: false,
  settingsAdmin: false
};

// =====================================================
// DATABASE TYPES - Match Firestore documents
// =====================================================

export interface Organization {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  businessRegistrationNumber?: string;
  businessRegistrationDocUrl?: string;
  kraPin?: string;
  orgStatus: VerificationStatus;
  accountStatus: AccountStatus;
  plan: SubscriptionPlan;
  maxLocations: number;
  maxStaff: number;
  maxAdmins: number;
  logoUrl?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  organizationId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  amountCents: number;
  currency: string;
  billingCycle: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  nextBillingDate?: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  organizationId: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  isPrimary: boolean;
  status: VerificationStatus;
  licenseNumber?: string;
  licensingBody?: string;
  licenseExpiry?: string;
  licenseDocumentUrl?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  organizationId?: string;
  locationId?: string;
  // System role for access control
  systemRole: SystemRole;
  // Job title for display
  jobTitle?: string;
  department?: string;
  employmentType: EmploymentType;
  staffStatus: StaffStatus;
  monthlySalaryCents: number;
  hourlyRateCents: number;
  dailyRateCents?: number;
  shiftRateCents?: number;
  payMethod: PayMethod;
  hireDate?: string;
  terminationDate?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isSuperAdmin: boolean;
  // Permissions (only for ADMIN role)
  permissions?: StaffPermissions;
  createdAt: string;
  updatedAt: string;
}

// Simplified User type for auth context
export interface User {
  id: string;
  name: string;
  email: string;
  systemRole: SystemRole;
  jobTitle?: string;
  avatar?: string;
  organizationId?: string;
  locationId?: string;
  isSuperAdmin?: boolean;
  permissions?: StaffPermissions;
  // Legacy field for backward compatibility
  role?: UserRole;
}

// =====================================================
// LEAVE MANAGEMENT
// =====================================================

export interface LeaveType {
  id: string;
  organizationId: string;
  name: string;
  daysAllowed: number;
  isPaid: boolean;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  staffId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  createdAt: string;
  updatedAt: string;
  // Joined
  leaveType?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  organizationId: string;
  staffId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason?: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalComment?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  // Joined
  leaveType?: LeaveType;
  staff?: Profile;
  reviewer?: Profile;
}

// =====================================================
// SCHEDULING
// =====================================================

export interface Shift {
  id: string;
  organizationId: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  roleRequired?: string;
  staffNeeded: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // Joined
  location?: Location;
  assignments?: ShiftAssignment[];
}

export interface ShiftAssignment {
  id: string;
  shiftId: string;
  staffId: string;
  isLocum: boolean;
  locumName?: string;
  locumRateCents?: number;
  locumPhone?: string;
  supervisorId?: string;
  notes?: string;
  createdAt: string;
  // Joined
  staff?: Profile;
  supervisor?: Profile;
}

// =====================================================
// ATTENDANCE
// =====================================================

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  staffId?: string;
  locationId?: string;
  shiftId?: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours: number;
  status: AttendanceStatus;
  isManualEntry: boolean;
  isExternal: boolean;
  externalLocumName?: string;
  externalLocumRole?: string;
  editedBy?: string;
  editReason?: string;
  createdAt: string;
  updatedAt: string;
  // Joined
  staff?: Profile;
  location?: Location;
}

export interface ExternalLocum {
  id: string;
  organizationId: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

// =====================================================
// PAYROLL
// =====================================================

export interface PayrollPeriod {
  id: string;
  organizationId: string;
  name: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  isFinalized: boolean;
  finalizedAt?: string;
  finalizedBy?: string;
  createdAt: string;
  updatedAt: string;
  // Joined
  entries?: PayrollEntry[];
}

export interface PayrollEntry {
  id: string;
  payrollPeriodId: string;
  staffId: string;
  organizationId: string;
  baseSalaryCents: number;
  payMethod: PayMethod;
  workedUnits: number;
  paidLeaveUnits: number;
  unpaidLeaveUnits: number;
  absentUnits: number;
  payableBaseCents: number;
  allowancesTotalCents: number;
  deductionsTotalCents: number;
  grossPayCents: number;
  netPayCents: number;
  isPaid: boolean;
  paidAt?: string;
  paidBy?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
  // Joined
  staff?: Profile;
  allowances?: PayrollAllowance[];
  deductions?: PayrollDeduction[];
}

export interface PayrollAllowance {
  id: string;
  payrollEntryId: string;
  name: string;
  amountCents: number;
  notes?: string;
  createdAt: string;
}

export interface PayrollDeduction {
  id: string;
  payrollEntryId: string;
  name: string;
  amountCents: number;
  notes?: string;
  createdAt: string;
}

// =====================================================
// VERIFICATION & ADMIN
// =====================================================

export interface VerificationRequest {
  id: string;
  type: VerificationType;
  organizationId?: string;
  locationId?: string;
  identifier?: string;
  authority?: string;
  documentUrl?: string;
  status: VerificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  // Joined
  organization?: Organization;
  location?: Location;
}

export interface AuditLog {
  id: string;
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  organizationId?: string;
  targetTable?: string;
  targetId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// =====================================================
// ROLES & PERMISSIONS
// =====================================================

export interface CustomRole {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  canViewSchedule: boolean;
  canManageSchedule: boolean;
  canViewStaff: boolean;
  canManageStaff: boolean;
  canApproveLeave: boolean;
  canViewAttendance: boolean;
  canManageAttendance: boolean;
  canViewPayroll: boolean;
  canManagePayroll: boolean;
  canManageSettings: boolean;
  canManageLocations: boolean;
  canManageRoles: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffRoleAssignment {
  id: string;
  staffId: string;
  customRoleId: string;
  createdAt: string;
  // Joined
  customRole?: CustomRole;
}

// =====================================================
// NOTIFICATIONS & DOCUMENTS
// =====================================================

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message?: string;
  type?: string;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  organizationId: string;
  uploadedBy: string;
  name: string;
  type?: string;
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType?: string;
  staffId?: string;
  createdAt: string;
}

// =====================================================
// VIEW TYPES
// =====================================================

export interface OrganizationStats {
  organizationId: string;
  name: string;
  plan: SubscriptionPlan;
  maxLocations: number;
  maxStaff: number;
  maxAdmins: number;
  locationsCount: number;
  staffCount: number;
  adminsCount: number;
}

export interface TodayAttendanceSummary {
  organizationId: string;
  presentCount: number;
  partialCount: number;
  absentCount: number;
  onLeaveCount: number;
  totalHoursWorked: number;
}

// =====================================================
// ADMIN & STATS
// =====================================================

export interface PlatformStats {
  totalOrganizations: number;
  activeSubscriptions: number;
  totalStaff: number;
  pendingVerifications: number;
  verifiedOrganizations: number;
  totalUsers: number;
  planDistribution?: Record<string, number>;
  mrrCents?: number;
}

export interface AuditLogEntry extends AuditLog {
  // Extended type if needed, or just alias
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// =====================================================
// FORM INPUT TYPES
// =====================================================

export interface CreateStaffInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  systemRole: SystemRole;
  jobTitle?: string;
  department?: string;
  employmentType: EmploymentType;
  locationId?: string;
  monthlySalaryCents?: number;
  dailyRateCents?: number;
  shiftRateCents?: number;
  hourlyRateCents?: number;
  payMethod?: PayMethod;
  hireDate?: string;
  permissions?: StaffPermissions;
}

export interface CreateShiftInput {
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  roleRequired?: string;
  staffNeeded: number;
  notes?: string;
}

export interface CreateLeaveRequestInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface UpdateAttendanceInput {
  clockIn?: string;
  clockOut?: string;
  status?: AttendanceStatus;
  editReason?: string;
}

// =====================================================
// PLAN LIMITS
// =====================================================

export const PLAN_LIMITS = {
  Essential: { maxLocations: 1, maxStaff: 10, maxAdmins: 2, amountCents: 800000 },
  Professional: { maxLocations: 2, maxStaff: 30, maxAdmins: 5, amountCents: 1500000 },
  Enterprise: { maxLocations: 5, maxStaff: 75, maxAdmins: 10, amountCents: 2500000 },
} as const;

// =====================================================
// ROLE HELPERS
// =====================================================

export function getSystemRoleFromLegacy(role: UserRole): SystemRole {
  if (role === 'Owner') return 'OWNER';
  if (role === 'HR Manager' || role === 'Shift Manager' || role === 'Payroll Officer') return 'ADMIN';
  return 'EMPLOYEE';
}

export function canHavePermissions(systemRole: SystemRole): boolean {
  return systemRole === 'ADMIN';
}

export function isOwnerRole(systemRole: SystemRole): boolean {
  return systemRole === 'OWNER';
}
