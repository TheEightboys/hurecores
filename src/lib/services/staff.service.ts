// Staff Service - Firebase/Firestore Implementation
import {
  collections,
  docs,
  getDocument,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  addAuditLog
} from '../firestore';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { emailService } from './email.service';
import type {
  Profile,
  CreateStaffInput,
  SystemRole,
  EmploymentType,
  PayMethod,
  StaffStatus,
  StaffPermissions,
  DEFAULT_PERMISSIONS,
  PLAN_LIMITS
} from '../../types';
import { organizationService } from './organization.service';

// =====================================================
// STAFF SERVICE
// =====================================================

export const staffService = {
  /**
   * Get all staff in an organization
   */
  async getAll(organizationId: string): Promise<Profile[]> {
    const q = query(
      collections.users(),
      where('organizationId', '==', organizationId),
      orderBy('fullName')
    );
    const snapshot = await getDocs(q);

    const staff = await Promise.all(
      snapshot.docs.map(async doc => {
        const data = doc.data() as Profile;
        const profile: Profile = { id: doc.id, ...data };

        // Fetch location name if locationId exists
        if (data.locationId && organizationId) {
          const location = await organizationService.getLocation(organizationId, data.locationId);
          if (location) {
            (profile as any).location = location;
          }
        }

        return profile;
      })
    );

    return staff;
  },

  /**
   * Get staff by ID
   */
  async getById(userId: string): Promise<Profile | null> {
    return getDocument<Profile>(docs.user(userId));
  },

  /**
   * Get current user's profile
   */
  async getCurrentProfile(): Promise<Profile | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return this.getById(user.uid);
  },

  /**
   * Check admin seat availability
   */
  async checkAdminSeatAvailability(organizationId: string): Promise<{ available: boolean; used: number; max: number }> {
    const stats = await organizationService.getStats(organizationId);
    if (!stats) {
      return { available: false, used: 0, max: 0 };
    }

    return {
      available: stats.adminsCount < stats.maxAdmins,
      used: stats.adminsCount,
      max: stats.maxAdmins
    };
  },

  /**
   * Create a new staff member (without Firebase Auth - invitation only)
   */
  async createStaffInvitation(input: CreateStaffInput, organizationId: string): Promise<{ success: boolean; error?: string; staffId?: string }> {
    try {
      // Validate admin seat if assigning ADMIN role
      if (input.systemRole === 'ADMIN') {
        const seatCheck = await this.checkAdminSeatAvailability(organizationId);
        if (!seatCheck.available) {
          return {
            success: false,
            error: `Admin limit reached for your plan (${seatCheck.used}/${seatCheck.max}). Upgrade to add more admin seats.`
          };
        }

        // Validate permissions are provided for ADMIN
        if (!input.permissions || Object.values(input.permissions).every(v => !v)) {
          return {
            success: false,
            error: 'At least one permission must be selected for Admin role.'
          };
        }
      }

      // Check staff limit
      const stats = await organizationService.getStats(organizationId);
      if (stats && stats.staffCount >= stats.maxStaff) {
        return {
          success: false,
          error: `Staff limit reached for your plan (${stats.staffCount}/${stats.maxStaff}). Upgrade to add more staff.`
        };
      }

      // Create a pending staff record (will be linked when they accept invite)
      const staffId = `invited_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await setDoc(docs.user(staffId), {
        id: staffId,
        email: input.email,
        fullName: `${input.firstName} ${input.lastName}`,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || null,
        organizationId,
        locationId: input.locationId || null,
        systemRole: input.systemRole,
        jobTitle: input.jobTitle || null,
        department: input.department || null,
        employmentType: input.employmentType,
        staffStatus: 'Invited' as StaffStatus,
        monthlySalaryCents: input.monthlySalaryCents || 0,
        dailyRateCents: input.dailyRateCents || 0,
        shiftRateCents: input.shiftRateCents || 0,
        hourlyRateCents: input.hourlyRateCents || 0,
        payMethod: input.payMethod || 'Fixed',
        hireDate: input.hireDate || null,
        isSuperAdmin: false,
        permissions: input.systemRole === 'ADMIN' ? input.permissions : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Get organization name for email
      const org = await organizationService.getById(organizationId);
      const orgName = org?.name || 'Your Organization';

      // Send invitation email
      const inviteLink = `${window.location.origin}/#/signup?invite=${staffId}&org=${organizationId}`;

      try {
        await emailService.sendStaffInvitation(
          input.email,
          `${input.firstName} ${input.lastName}`,
          orgName,
          inviteLink
        );
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Continue - staff record is created
      }

      // Add audit log
      await addAuditLog(
        'Staff',
        `Invited ${input.firstName} ${input.lastName} as ${input.systemRole}`,
        auth.currentUser?.uid,
        auth.currentUser?.email || undefined,
        organizationId,
        { staffId, email: input.email, role: input.systemRole }
      );

      return { success: true, staffId };
    } catch (error: any) {
      console.error('Create staff error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create staff member'
      };
    }
  },

  /**
   * Update a staff member's profile
   */
  async update(userId: string, updates: Partial<Profile>, organizationId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentProfile = await this.getById(userId);
      if (!currentProfile) {
        return { success: false, error: 'Staff member not found' };
      }

      // If changing to ADMIN, validate seat availability
      if (updates.systemRole === 'ADMIN' && currentProfile.systemRole !== 'ADMIN') {
        const orgId = organizationId || currentProfile.organizationId;
        if (orgId) {
          const seatCheck = await this.checkAdminSeatAvailability(orgId);
          if (!seatCheck.available) {
            return {
              success: false,
              error: `Admin limit reached for your plan (${seatCheck.used}/${seatCheck.max}). Upgrade to add more admin seats.`
            };
          }
        }
      }

      // If downgrading from ADMIN to EMPLOYEE, remove permissions
      if (updates.systemRole === 'EMPLOYEE' && currentProfile.systemRole === 'ADMIN') {
        updates.permissions = null as any;
      }

      // If setting as ADMIN without permissions, reject
      if (updates.systemRole === 'ADMIN') {
        if (!updates.permissions || Object.values(updates.permissions).every(v => !v)) {
          if (!currentProfile.permissions || Object.values(currentProfile.permissions).every(v => !v)) {
            return {
              success: false,
              error: 'At least one permission must be selected for Admin role.'
            };
          }
        }
      }

      await updateDoc(docs.user(userId), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error: any) {
      console.error('Update staff error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update staff member'
      };
    }
  },

  /**
   * Deactivate a staff member (soft delete)
   */
  async deactivate(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.update(userId, { staffStatus: 'Inactive' as StaffStatus });
  },

  /**
   * Reactivate a staff member
   */
  async reactivate(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.update(userId, { staffStatus: 'Active' as StaffStatus });
  },

  /**
   * Archive a staff member
   */
  async archive(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.update(userId, { staffStatus: 'Archived' as StaffStatus });
  },

  /**
   * Get staff count for an organization
   */
  async getCount(organizationId: string): Promise<number> {
    const q = query(
      collections.users(),
      where('organizationId', '==', organizationId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  /**
   * Get active staff count
   */
  async getActiveCount(organizationId: string): Promise<number> {
    const q = query(
      collections.users(),
      where('organizationId', '==', organizationId),
      where('staffStatus', '==', 'Active')
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  /**
   * Search staff by name or email
   */
  async search(organizationId: string, searchQuery: string): Promise<Profile[]> {
    const allStaff = await this.getAll(organizationId);
    const query = searchQuery.toLowerCase();

    return allStaff.filter(staff =>
      staff.fullName.toLowerCase().includes(query) ||
      staff.email.toLowerCase().includes(query)
    );
  },

  /**
   * Get staff by location
   */
  async getByLocation(organizationId: string, locationId: string): Promise<Profile[]> {
    const q = query(
      collections.users(),
      where('organizationId', '==', organizationId),
      where('locationId', '==', locationId),
      orderBy('fullName')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
  },

  /**
   * Get staff by system role
   */
  async getByRole(organizationId: string, role: SystemRole): Promise<Profile[]> {
    const q = query(
      collections.users(),
      where('organizationId', '==', organizationId),
      where('systemRole', '==', role),
      orderBy('fullName')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
  },

  /**
   * Get all admins
   */
  async getAdmins(organizationId: string): Promise<Profile[]> {
    const allStaff = await this.getAll(organizationId);
    return allStaff.filter(staff =>
      staff.systemRole === 'OWNER' || staff.systemRole === 'ADMIN'
    );
  },

  /**
   * Update staff permissions
   */
  async updatePermissions(userId: string, permissions: StaffPermissions): Promise<{ success: boolean; error?: string }> {
    const profile = await this.getById(userId);
    if (!profile) {
      return { success: false, error: 'Staff member not found' };
    }

    if (profile.systemRole !== 'ADMIN') {
      return { success: false, error: 'Only Admin users can have permissions' };
    }

    // Validate at least one permission
    if (Object.values(permissions).every(v => !v)) {
      return { success: false, error: 'At least one permission must be selected' };
    }

    await updateDoc(docs.user(userId), {
      permissions,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  }
};
