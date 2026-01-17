// Leave Service - Firebase/Firestore Implementation
import {
  collections,
  docs,
  getDocument,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  addAuditLog
} from '../firestore';
import { auth } from '../firebase';
import type { LeaveRequest, LeaveType, LeaveBalance, LeaveStatus, Profile } from '../../types';
import { staffService } from './staff.service';

// =====================================================
// LEAVE SERVICE
// =====================================================

export const leaveService = {
  // ==================== LEAVE TYPES ====================

  /**
   * Get all leave types for an organization
   */
  async getLeaveTypes(organizationId: string): Promise<LeaveType[]> {
    const q = query(
      collections.leaveTypes(organizationId),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveType));
  },

  /**
   * Create leave type
   */
  async createLeaveType(organizationId: string, input: {
    name: string;
    daysAllowed: number;
    isPaid: boolean;
    requiresApproval: boolean;
  }): Promise<LeaveType> {
    const docRef = await addDoc(collections.leaveTypes(organizationId), {
      organizationId,
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return (await getDocument<LeaveType>(docRef))!;
  },

  /**
   * Create default leave types for new organization
   */
  async createDefaultLeaveTypes(organizationId: string): Promise<void> {
    const defaults = [
      { name: 'Annual Leave', daysAllowed: 21, isPaid: true, requiresApproval: true },
      { name: 'Sick Leave', daysAllowed: 10, isPaid: true, requiresApproval: true },
      { name: 'Maternity Leave', daysAllowed: 90, isPaid: true, requiresApproval: true },
      { name: 'Paternity Leave', daysAllowed: 14, isPaid: true, requiresApproval: true },
      { name: 'Unpaid Leave', daysAllowed: 30, isPaid: false, requiresApproval: true },
      { name: 'Compassionate Leave', daysAllowed: 5, isPaid: true, requiresApproval: true }
    ];

    for (const type of defaults) {
      await addDoc(collections.leaveTypes(organizationId), {
        organizationId,
        ...type,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  },

  // ==================== LEAVE REQUESTS ====================

  /**
   * Get all leave requests for an organization
   */
  async getLeaveRequests(organizationId: string, filters?: {
    status?: LeaveStatus;
    staffId?: string;
    leaveTypeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<LeaveRequest[]> {
    const q = query(
      collections.leaveRequests(organizationId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    let requests: LeaveRequest[] = await Promise.all(
      snapshot.docs.map(async doc => {
        const data = doc.data();
        const request: LeaveRequest = { id: doc.id, ...data } as LeaveRequest;

        // Fetch staff details
        if (data.staffId) {
          request.staff = await staffService.getById(data.staffId) || undefined;
        }

        // Fetch leave type
        const leaveTypes = await this.getLeaveTypes(organizationId);
        request.leaveType = leaveTypes.find(t => t.id === data.leaveTypeId);

        return request;
      })
    );

    // Apply filters
    if (filters?.status) {
      requests = requests.filter(r => r.status === filters.status);
    }
    if (filters?.staffId) {
      requests = requests.filter(r => r.staffId === filters.staffId);
    }
    if (filters?.leaveTypeId) {
      requests = requests.filter(r => r.leaveTypeId === filters.leaveTypeId);
    }
    if (filters?.startDate) {
      requests = requests.filter(r => r.startDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      requests = requests.filter(r => r.endDate <= filters.endDate!);
    }

    return requests;
  },

  /**
   * Get pending leave requests
   */
  async getPendingRequests(organizationId: string): Promise<LeaveRequest[]> {
    return this.getLeaveRequests(organizationId, { status: 'Pending' });
  },

  /**
   * Get leave request by ID
   */
  async getRequestById(organizationId: string, requestId: string): Promise<LeaveRequest | null> {
    return getDocument<LeaveRequest>(docs.leaveRequest(organizationId, requestId));
  },

  /**
   * Create leave request
   */
  async createRequest(organizationId: string, input: {
    staffId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }): Promise<{ success: boolean; error?: string; request?: LeaveRequest }> {
    // Validate dates
    if (new Date(input.endDate) < new Date(input.startDate)) {
      return { success: false, error: 'End date must be on or after start date' };
    }

    // Calculate days requested
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysRequested = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const docRef = await addDoc(collections.leaveRequests(organizationId), {
      organizationId,
      staffId: input.staffId,
      leaveTypeId: input.leaveTypeId,
      startDate: input.startDate,
      endDate: input.endDate,
      daysRequested,
      reason: input.reason || null,
      status: 'Pending' as LeaveStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const request = await this.getRequestById(organizationId, docRef.id);
    return { success: true, request: request! };
  },

  /**
   * Approve leave request
   */
  async approveRequest(organizationId: string, requestId: string, comment?: string): Promise<{ success: boolean; error?: string }> {
    const request = await this.getRequestById(organizationId, requestId);
    if (!request) {
      return { success: false, error: 'Leave request not found' };
    }

    if (request.status !== 'Pending') {
      return { success: false, error: 'Request is not pending' };
    }

    const now = new Date().toISOString();
    const reviewerId = auth.currentUser?.uid;

    await updateDoc(docs.leaveRequest(organizationId, requestId), {
      status: 'Approved',
      reviewedBy: reviewerId,
      reviewedAt: now,
      approvedBy: reviewerId,
      approvedAt: now,
      approvalComment: comment || null,
      updatedAt: serverTimestamp()
    });

    // Add audit log
    await addAuditLog(
      'Staff',
      `Approved leave request for ${request.staff?.fullName || 'staff'}`,
      reviewerId,
      auth.currentUser?.email || undefined,
      organizationId,
      { requestId, staffId: request.staffId }
    );

    return { success: true };
  },

  /**
   * Reject leave request
   */
  async rejectRequest(organizationId: string, requestId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const request = await this.getRequestById(organizationId, requestId);
    if (!request) {
      return { success: false, error: 'Leave request not found' };
    }

    if (request.status !== 'Pending') {
      return { success: false, error: 'Request is not pending' };
    }

    const now = new Date().toISOString();
    const reviewerId = auth.currentUser?.uid;

    await updateDoc(docs.leaveRequest(organizationId, requestId), {
      status: 'Rejected',
      reviewedBy: reviewerId,
      reviewedAt: now,
      rejectionReason: reason || null,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  },

  /**
   * Cancel leave request (by staff)
   */
  async cancelRequest(organizationId: string, requestId: string): Promise<{ success: boolean; error?: string }> {
    const request = await this.getRequestById(organizationId, requestId);
    if (!request) {
      return { success: false, error: 'Leave request not found' };
    }

    if (request.status !== 'Pending') {
      return { success: false, error: 'Can only cancel pending requests' };
    }

    await updateDoc(docs.leaveRequest(organizationId, requestId), {
      status: 'Cancelled',
      updatedAt: serverTimestamp()
    });

    return { success: true };
  },

  /**
   * Check if staff is on approved leave for a date
   */
  async isStaffOnLeave(organizationId: string, staffId: string, date: string): Promise<boolean> {
    const requests = await this.getLeaveRequests(organizationId, {
      staffId,
      status: 'Approved'
    });

    return requests.some(request => {
      return date >= request.startDate && date <= request.endDate;
    });
  },

  /**
   * Get current user's leave requests
   */
  async getMyLeaveRequests(organizationId: string): Promise<LeaveRequest[]> {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    return this.getLeaveRequests(organizationId, { staffId: userId });
  },

  // ==================== LEAVE BALANCES ====================

  /**
   * Get leave balances for a staff member
   */
  async getStaffBalances(organizationId: string, staffId: string, year?: number): Promise<LeaveBalance[]> {
    const currentYear = year || new Date().getFullYear();

    const q = query(
      collections.leaveBalances(organizationId),
      where('staffId', '==', staffId),
      where('year', '==', currentYear)
    );

    const snapshot = await getDocs(q);
    const balances = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveBalance));

    // Fetch leave type details
    const leaveTypes = await this.getLeaveTypes(organizationId);
    return balances.map(balance => ({
      ...balance,
      leaveType: leaveTypes.find(t => t.id === balance.leaveTypeId)
    }));
  },

  /**
   * Initialize leave balances for new staff
   */
  async initializeStaffBalances(organizationId: string, staffId: string): Promise<void> {
    const leaveTypes = await this.getLeaveTypes(organizationId);
    const currentYear = new Date().getFullYear();

    for (const type of leaveTypes) {
      await addDoc(collections.leaveBalances(organizationId), {
        staffId,
        leaveTypeId: type.id,
        year: currentYear,
        totalDays: type.daysAllowed,
        usedDays: 0,
        pendingDays: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  },
  /**
   * Get current user's balances
   */
  async getMyBalances(organizationId: string, staffId: string): Promise<LeaveBalance[]> {
    return this.getStaffBalances(organizationId, staffId);
  },

  /**
   * Submit a leave request (alias for createRequest)
   */
  async submitRequest(organizationId: string, input: {
    staffId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }): Promise<{ success: boolean; error?: string; request?: LeaveRequest }> {
    return this.createRequest(organizationId, input);
  }
};
