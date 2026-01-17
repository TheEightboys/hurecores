-- =====================================================
-- HURECORE MULTI-TENANT STAFF MANAGEMENT SYSTEM
-- Supabase Database Schema
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles within organizations
CREATE TYPE user_role AS ENUM (
    'Owner',
    'Shift Manager',
    'HR Manager',
    'Payroll Officer',
    'Staff',
    'SuperAdmin'
);

-- Organization subscription plans
CREATE TYPE subscription_plan AS ENUM (
    'Essential',
    'Professional',
    'Enterprise'
);

-- Subscription status
CREATE TYPE subscription_status AS ENUM (
    'Active',
    'Suspended',
    'Cancelled',
    'Trial'
);

-- Organization verification status
CREATE TYPE verification_status AS ENUM (
    'Verified',
    'Pending',
    'Unverified'
);

-- Account status
CREATE TYPE account_status AS ENUM (
    'Active',
    'Under Review',
    'Suspended'
);

-- Staff employment type
CREATE TYPE employment_type AS ENUM (
    'Full-Time',
    'Part-Time',
    'Contract',
    'Casual',
    'Locum'
);

-- Staff status
CREATE TYPE staff_status AS ENUM (
    'Active',
    'Inactive',
    'On Leave',
    'Terminated'
);

-- Staff pay method
CREATE TYPE pay_method AS ENUM (
    'Fixed',
    'Prorated',
    'Hourly',
    'Per Shift'
);

-- Attendance status
CREATE TYPE attendance_status AS ENUM (
    'Present',
    'Partial',
    'Absent',
    'On Leave'
);

-- Leave request status
CREATE TYPE leave_status AS ENUM (
    'Pending',
    'Approved',
    'Rejected',
    'Cancelled'
);

-- Verification type
CREATE TYPE verification_type AS ENUM (
    'ORG',
    'FACILITY'
);

-- Audit log event types
CREATE TYPE audit_event_type AS ENUM (
    'Security',
    'System',
    'Payment',
    'Verification',
    'Staff',
    'Schedule'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Organizations (Clinics/Businesses)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Kenya',
    
    -- Business registration
    business_registration_number VARCHAR(100),
    kra_pin VARCHAR(50),
    
    -- Verification
    org_status verification_status DEFAULT 'Unverified',
    account_status account_status DEFAULT 'Under Review',
    
    -- Plan limits
    plan subscription_plan DEFAULT 'Essential',
    max_locations INT DEFAULT 1,
    max_staff INT DEFAULT 10,
    max_admins INT DEFAULT 2,
    
    -- Metadata
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    plan subscription_plan NOT NULL DEFAULT 'Essential',
    status subscription_status DEFAULT 'Active',
    
    -- Billing
    amount_cents INT NOT NULL DEFAULT 0, -- Amount in cents (KES)
    currency VARCHAR(3) DEFAULT 'KES',
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    
    -- Dates
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    next_billing_date DATE,
    trial_ends_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Payment provider
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations (Branches/Facilities)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    
    is_primary BOOLEAN DEFAULT FALSE,
    status verification_status DEFAULT 'Unverified',
    
    -- Facility verification
    license_number VARCHAR(100),
    licensing_body VARCHAR(100),
    license_expiry DATE,
    license_document_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (linked to Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal info
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    avatar_url TEXT,
    
    -- Organization membership
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    role user_role DEFAULT 'Staff',
    
    -- Employment details
    job_title VARCHAR(100),
    department VARCHAR(100),
    employment_type employment_type DEFAULT 'Full-Time',
    staff_status staff_status DEFAULT 'Active',
    
    -- Pay info
    monthly_salary_cents INT DEFAULT 0,
    hourly_rate_cents INT DEFAULT 0,
    pay_method pay_method DEFAULT 'Fixed',
    
    -- Dates
    hire_date DATE,
    termination_date DATE,
    
    -- Emergency contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    
    -- SuperAdmin flag (only for platform admins)
    is_super_admin BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LEAVE MANAGEMENT
-- =====================================================

-- Leave Types (per organization)
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    days_allowed INT NOT NULL DEFAULT 0,
    is_paid BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, name)
);

-- Leave Balances (per staff per leave type per year)
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    
    year INT NOT NULL,
    total_days INT NOT NULL DEFAULT 0,
    used_days DECIMAL(5,2) DEFAULT 0,
    pending_days DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(staff_id, leave_type_id, year)
);

-- Leave Requests
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(5,2) NOT NULL,
    reason TEXT,
    
    status leave_status DEFAULT 'Pending',
    
    -- Approval tracking
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SCHEDULING
-- =====================================================

-- Shifts
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    role_required VARCHAR(100), -- e.g., "Nurse", "Receptionist"
    staff_needed INT DEFAULT 1,
    notes TEXT,
    
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shift Assignments (linking staff to shifts)
CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- For locums/external staff
    is_locum BOOLEAN DEFAULT FALSE,
    locum_rate_cents INT,
    locum_phone VARCHAR(50),
    supervisor_id UUID REFERENCES profiles(id),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(shift_id, staff_id)
);

-- =====================================================
-- ATTENDANCE
-- =====================================================

-- Attendance Records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id),
    shift_id UUID REFERENCES shifts(id),
    
    date DATE NOT NULL,
    
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    total_hours DECIMAL(5,2) DEFAULT 0,
    
    status attendance_status DEFAULT 'Absent',
    
    -- Override/manual edit
    is_manual_entry BOOLEAN DEFAULT FALSE,
    edited_by UUID REFERENCES profiles(id),
    edit_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(staff_id, date)
);

-- =====================================================
-- PAYROLL
-- =====================================================

-- Payroll Periods
CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL, -- e.g., "January 2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    total_days INT NOT NULL,
    
    is_finalized BOOLEAN DEFAULT FALSE,
    finalized_at TIMESTAMPTZ,
    finalized_by UUID REFERENCES profiles(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Entries (one per staff per period)
CREATE TABLE payroll_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Salary info snapshot
    base_salary_cents INT DEFAULT 0,
    pay_method pay_method DEFAULT 'Fixed',
    
    -- Worked units (days or shifts depending on staff type)
    worked_units DECIMAL(5,2) DEFAULT 0,
    paid_leave_units DECIMAL(5,2) DEFAULT 0,
    unpaid_leave_units DECIMAL(5,2) DEFAULT 0,
    absent_units DECIMAL(5,2) DEFAULT 0,
    
    -- Calculated amounts
    payable_base_cents INT DEFAULT 0,
    allowances_total_cents INT DEFAULT 0,
    deductions_total_cents INT DEFAULT 0,
    gross_pay_cents INT DEFAULT 0,
    net_pay_cents INT DEFAULT 0,
    
    -- Payment status
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    paid_by UUID REFERENCES profiles(id),
    payment_reference VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(payroll_period_id, staff_id)
);

-- Payroll Allowances
CREATE TABLE payroll_allowances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_entry_id UUID NOT NULL REFERENCES payroll_entries(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    amount_cents INT NOT NULL DEFAULT 0,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Deductions
CREATE TABLE payroll_deductions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_entry_id UUID NOT NULL REFERENCES payroll_entries(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    amount_cents INT NOT NULL DEFAULT 0,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- VERIFICATION REQUESTS (for SuperAdmin)
-- =====================================================

CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    type verification_type NOT NULL,
    
    -- For ORG verification
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- For FACILITY verification
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    
    -- Documents
    identifier VARCHAR(100), -- KRA PIN or License No
    authority VARCHAR(100), -- Registrar or Licensing Body
    document_url TEXT,
    
    -- Status
    status verification_status DEFAULT 'Pending',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOGS (for SuperAdmin)
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    event_type audit_event_type NOT NULL,
    
    -- Actor
    user_id UUID REFERENCES profiles(id),
    user_email VARCHAR(255),
    
    -- Target
    organization_id UUID REFERENCES organizations(id),
    target_table VARCHAR(100),
    target_id UUID,
    
    -- Event details
    description TEXT NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROLE PERMISSIONS
-- =====================================================

-- Custom Roles per Organization
CREATE TABLE custom_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Permission flags
    can_view_schedule BOOLEAN DEFAULT FALSE,
    can_manage_schedule BOOLEAN DEFAULT FALSE,
    can_view_staff BOOLEAN DEFAULT FALSE,
    can_manage_staff BOOLEAN DEFAULT FALSE,
    can_approve_leave BOOLEAN DEFAULT FALSE,
    can_view_attendance BOOLEAN DEFAULT FALSE,
    can_manage_attendance BOOLEAN DEFAULT FALSE,
    can_view_payroll BOOLEAN DEFAULT FALSE,
    can_manage_payroll BOOLEAN DEFAULT FALSE,
    can_manage_settings BOOLEAN DEFAULT FALSE,
    can_manage_locations BOOLEAN DEFAULT FALSE,
    can_manage_roles BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, name)
);

-- Staff Role Assignments (custom roles)
CREATE TABLE staff_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    custom_role_id UUID NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(staff_id, custom_role_id)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50), -- 'leave_approved', 'shift_assigned', 'payroll_ready', etc.
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Optional link
    action_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DOCUMENTS
-- =====================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- 'license', 'contract', 'policy', etc.
    file_url TEXT NOT NULL,
    file_size_bytes INT,
    mime_type VARCHAR(100),
    
    -- Optional staff association
    staff_id UUID REFERENCES profiles(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Organizations
CREATE INDEX idx_organizations_plan ON organizations(plan);
CREATE INDEX idx_organizations_status ON organizations(account_status);

-- Profiles
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_location ON profiles(location_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Locations
CREATE INDEX idx_locations_organization ON locations(organization_id);

-- Subscriptions
CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Leave Requests
CREATE INDEX idx_leave_requests_organization ON leave_requests(organization_id);
CREATE INDEX idx_leave_requests_staff ON leave_requests(staff_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Shifts
CREATE INDEX idx_shifts_organization ON shifts(organization_id);
CREATE INDEX idx_shifts_location ON shifts(location_id);
CREATE INDEX idx_shifts_date ON shifts(date);

-- Shift Assignments
CREATE INDEX idx_shift_assignments_shift ON shift_assignments(shift_id);
CREATE INDEX idx_shift_assignments_staff ON shift_assignments(staff_id);

-- Attendance
CREATE INDEX idx_attendance_organization ON attendance_records(organization_id);
CREATE INDEX idx_attendance_staff ON attendance_records(staff_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);

-- Payroll
CREATE INDEX idx_payroll_periods_organization ON payroll_periods(organization_id);
CREATE INDEX idx_payroll_entries_period ON payroll_entries(payroll_period_id);
CREATE INDEX idx_payroll_entries_staff ON payroll_entries(staff_id);

-- Audit Logs
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is SuperAdmin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND is_super_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS Policies: ORGANIZATIONS
-- =====================================================

-- SuperAdmins can see all organizations
CREATE POLICY "SuperAdmins can view all organizations"
    ON organizations FOR SELECT
    USING (is_super_admin());

-- Users can view their own organization
CREATE POLICY "Users can view own organization"
    ON organizations FOR SELECT
    USING (id = get_user_organization_id());

-- SuperAdmins can update any organization
CREATE POLICY "SuperAdmins can update organizations"
    ON organizations FOR UPDATE
    USING (is_super_admin());

-- Owners can update their organization
CREATE POLICY "Owners can update own organization"
    ON organizations FOR UPDATE
    USING (
        id = get_user_organization_id() 
        AND get_user_role() = 'Owner'
    );

-- =====================================================
-- RLS Policies: PROFILES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

-- Users can view profiles in same organization
CREATE POLICY "Users can view org profiles"
    ON profiles FOR SELECT
    USING (organization_id = get_user_organization_id());

-- SuperAdmins can view all profiles
CREATE POLICY "SuperAdmins can view all profiles"
    ON profiles FOR SELECT
    USING (is_super_admin());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- Owners/HR can update staff profiles
CREATE POLICY "Managers can update org profiles"
    ON profiles FOR UPDATE
    USING (
        organization_id = get_user_organization_id()
        AND get_user_role() IN ('Owner', 'HR Manager')
    );

-- =====================================================
-- RLS Policies: LOCATIONS
-- =====================================================

-- Users can view locations in their organization
CREATE POLICY "Users can view org locations"
    ON locations FOR SELECT
    USING (organization_id = get_user_organization_id());

-- SuperAdmins can view all locations
CREATE POLICY "SuperAdmins can view all locations"
    ON locations FOR SELECT
    USING (is_super_admin());

-- Owners can manage locations
CREATE POLICY "Owners can manage locations"
    ON locations FOR ALL
    USING (
        organization_id = get_user_organization_id()
        AND get_user_role() = 'Owner'
    );

-- =====================================================
-- RLS Policies: LEAVE REQUESTS
-- =====================================================

-- Staff can view their own leave requests
CREATE POLICY "Staff can view own leave requests"
    ON leave_requests FOR SELECT
    USING (staff_id = auth.uid());

-- Managers can view all leave requests in org
CREATE POLICY "Managers can view org leave requests"
    ON leave_requests FOR SELECT
    USING (
        organization_id = get_user_organization_id()
        AND get_user_role() IN ('Owner', 'HR Manager', 'Shift Manager')
    );

-- Staff can create their own leave requests
CREATE POLICY "Staff can create leave requests"
    ON leave_requests FOR INSERT
    WITH CHECK (staff_id = auth.uid());

-- Managers can update leave requests (approve/reject)
CREATE POLICY "Managers can update leave requests"
    ON leave_requests FOR UPDATE
    USING (
        organization_id = get_user_organization_id()
        AND get_user_role() IN ('Owner', 'HR Manager', 'Shift Manager')
    );

-- =====================================================
-- RLS Policies: SHIFTS
-- =====================================================

-- Users can view shifts in their organization
CREATE POLICY "Users can view org shifts"
    ON shifts FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Managers can manage shifts
CREATE POLICY "Managers can manage shifts"
    ON shifts FOR ALL
    USING (
        organization_id = get_user_organization_id()
        AND get_user_role() IN ('Owner', 'Shift Manager', 'HR Manager')
    );

-- =====================================================
-- RLS Policies: ATTENDANCE
-- =====================================================

-- Staff can view their own attendance
CREATE POLICY "Staff can view own attendance"
    ON attendance_records FOR SELECT
    USING (staff_id = auth.uid());

-- Managers can view all attendance in org
CREATE POLICY "Managers can view org attendance"
    ON attendance_records FOR SELECT
    USING (
        organization_id = get_user_organization_id()
        AND get_user_role() IN ('Owner', 'Shift Manager', 'HR Manager', 'Payroll Officer')
    );

-- Managers can manage attendance
CREATE POLICY "Managers can manage attendance"
    ON attendance_records FOR ALL
    USING (
        organization_id = get_user_organization_id()
        AND get_user_role() IN ('Owner', 'Shift Manager', 'HR Manager')
    );

-- =====================================================
-- RLS Policies: PAYROLL
-- =====================================================

-- Only payroll officers and owners can view payroll
CREATE POLICY "Payroll access for authorized roles"
    ON payroll_entries FOR SELECT
    USING (
        organization_id = get_user_organization_id()
        AND get_user_role() IN ('Owner', 'Payroll Officer')
    );

-- Staff can view their own payroll
CREATE POLICY "Staff can view own payroll"
    ON payroll_entries FOR SELECT
    USING (staff_id = auth.uid());

-- Payroll officers can manage payroll
CREATE POLICY "Payroll officers can manage payroll"
    ON payroll_entries FOR ALL
    USING (
        organization_id = get_user_organization_id()
        AND get_user_role() IN ('Owner', 'Payroll Officer')
    );

-- =====================================================
-- RLS Policies: AUDIT LOGS (SuperAdmin only)
-- =====================================================

CREATE POLICY "Only SuperAdmins can view audit logs"
    ON audit_logs FOR SELECT
    USING (is_super_admin());

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (TRUE);

-- =====================================================
-- RLS Policies: NOTIFICATIONS
-- =====================================================

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
    BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_periods_updated_at
    BEFORE UPDATE ON payroll_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_entries_updated_at
    BEFORE UPDATE ON payroll_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to create default leave types for new organization
CREATE OR REPLACE FUNCTION create_default_leave_types()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO leave_types (organization_id, name, days_allowed, is_paid) VALUES
        (NEW.id, 'Annual Leave', 21, TRUE),
        (NEW.id, 'Sick Leave', 7, TRUE),
        (NEW.id, 'Maternity Leave', 90, TRUE),
        (NEW.id, 'Paternity Leave', 14, TRUE),
        (NEW.id, 'Unpaid Leave', 30, FALSE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_organization_created
    AFTER INSERT ON organizations
    FOR EACH ROW EXECUTE FUNCTION create_default_leave_types();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_event_type audit_event_type,
    p_description TEXT,
    p_target_table VARCHAR DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_user_email VARCHAR;
    v_org_id UUID;
BEGIN
    SELECT email, organization_id INTO v_user_email, v_org_id
    FROM profiles WHERE id = auth.uid();
    
    INSERT INTO audit_logs (
        event_type,
        user_id,
        user_email,
        organization_id,
        target_table,
        target_id,
        description,
        metadata
    ) VALUES (
        p_event_type,
        auth.uid(),
        COALESCE(v_user_email, 'System'),
        v_org_id,
        p_target_table,
        p_target_id,
        p_description,
        p_metadata
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DATA: Default Plans (for reference)
-- =====================================================

COMMENT ON TABLE organizations IS 'Plan limits: Essential(1 loc, 10 staff, 2 admins), Professional(2 loc, 30 staff, 5 admins), Enterprise(5 loc, 75 staff, 10 admins)';

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Organization Dashboard Stats
CREATE OR REPLACE VIEW organization_stats AS
SELECT 
    o.id AS organization_id,
    o.name,
    o.plan,
    o.max_locations,
    o.max_staff,
    o.max_admins,
    COUNT(DISTINCT l.id) AS locations_count,
    COUNT(DISTINCT p.id) AS staff_count,
    COUNT(DISTINCT CASE WHEN p.role IN ('Owner', 'Shift Manager', 'HR Manager', 'Payroll Officer') THEN p.id END) AS admins_count
FROM organizations o
LEFT JOIN locations l ON l.organization_id = o.id
LEFT JOIN profiles p ON p.organization_id = o.id
GROUP BY o.id, o.name, o.plan, o.max_locations, o.max_staff, o.max_admins;

-- Today's Attendance Summary
CREATE OR REPLACE VIEW today_attendance_summary AS
SELECT 
    organization_id,
    COUNT(*) FILTER (WHERE status = 'Present') AS present_count,
    COUNT(*) FILTER (WHERE status = 'Partial') AS partial_count,
    COUNT(*) FILTER (WHERE status = 'Absent') AS absent_count,
    COUNT(*) FILTER (WHERE status = 'On Leave') AS on_leave_count,
    SUM(total_hours) AS total_hours_worked
FROM attendance_records
WHERE date = CURRENT_DATE
GROUP BY organization_id;

-- Pending Leave Requests Count
CREATE OR REPLACE VIEW pending_leave_counts AS
SELECT 
    organization_id,
    COUNT(*) AS pending_count
FROM leave_requests
WHERE status = 'Pending'
GROUP BY organization_id;
