-- =====================================================
-- Cleanup / Idempotent Fixes
-- - Create helper function is_valid_email if missing
-- - Re-enable RLS on organizations if disabled
-- - Add constraints only if missing
-- - Ensure indexes exist
-- =====================================================

CREATE OR REPLACE FUNCTION public.__apply_cleanup()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create is_valid_email if missing
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'is_valid_email'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE $outer$
      CREATE OR REPLACE FUNCTION public.is_valid_email(email TEXT)
      RETURNS BOOLEAN AS $func$
      BEGIN
        RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
      END;
      $func$ LANGUAGE plpgsql IMMUTABLE;
    $outer$;
  END IF;

  -- Re-enable RLS on organizations if disabled
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'organizations'
      AND n.nspname = 'public'
      AND c.relrowsecurity = false
  ) THEN
    EXECUTE 'ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY';
  END IF;

  -- Constraints (idempotent)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_leave_dates') THEN
    EXECUTE 'ALTER TABLE public.leave_requests ADD CONSTRAINT check_leave_dates CHECK (start_date <= end_date)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_period_dates') THEN
    EXECUTE 'ALTER TABLE public.payroll_periods ADD CONSTRAINT check_period_dates CHECK (start_date <= end_date)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_amount') THEN
    EXECUTE 'ALTER TABLE public.subscriptions ADD CONSTRAINT check_positive_amount CHECK (amount_cents >= 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_base_salary') THEN
    EXECUTE 'ALTER TABLE public.payroll_entries ADD CONSTRAINT check_positive_base_salary CHECK (base_salary_cents >= 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_gross_pay') THEN
    EXECUTE 'ALTER TABLE public.payroll_entries ADD CONSTRAINT check_positive_gross_pay CHECK (gross_pay_cents >= 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_net_pay') THEN
    EXECUTE 'ALTER TABLE public.payroll_entries ADD CONSTRAINT check_positive_net_pay CHECK (net_pay_cents >= 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_salary') THEN
    EXECUTE 'ALTER TABLE public.profiles ADD CONSTRAINT check_positive_salary CHECK (monthly_salary_cents >= 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_hourly_rate') THEN
    EXECUTE 'ALTER TABLE public.profiles ADD CONSTRAINT check_positive_hourly_rate CHECK (hourly_rate_cents >= 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_shift_times') THEN
    EXECUTE 'ALTER TABLE public.shifts ADD CONSTRAINT check_shift_times CHECK (start_time < end_time)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_days') THEN
    EXECUTE 'ALTER TABLE public.leave_requests ADD CONSTRAINT check_positive_days CHECK (days_requested > 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_days_allowed') THEN
    EXECUTE 'ALTER TABLE public.leave_types ADD CONSTRAINT check_positive_days_allowed CHECK (days_allowed >= 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_limits') THEN
    EXECUTE 'ALTER TABLE public.organizations ADD CONSTRAINT check_positive_limits CHECK (max_locations > 0 AND max_staff > 0 AND max_admins > 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_net_pay_calculation') THEN
    EXECUTE 'ALTER TABLE public.payroll_entries ADD CONSTRAINT check_net_pay_calculation CHECK (net_pay_cents = (gross_pay_cents - deductions_total_cents) OR net_pay_cents = 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_gross_pay_calculation') THEN
    EXECUTE 'ALTER TABLE public.payroll_entries ADD CONSTRAINT check_gross_pay_calculation CHECK (gross_pay_cents = (payable_base_cents + allowances_total_cents) OR gross_pay_cents = 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_hours') THEN
    EXECUTE 'ALTER TABLE public.attendance_records ADD CONSTRAINT check_positive_hours CHECK (total_hours >= 0)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_clock_times') THEN
    EXECUTE 'ALTER TABLE public.attendance_records ADD CONSTRAINT check_clock_times CHECK ((clock_in IS NULL OR clock_out IS NULL) OR clock_out > clock_in)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_valid_email') THEN
    EXECUTE 'ALTER TABLE public.profiles ADD CONSTRAINT check_valid_email CHECK (is_valid_email(email))';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_valid_org_email') THEN
    EXECUTE 'ALTER TABLE public.organizations ADD CONSTRAINT check_valid_org_email CHECK (is_valid_email(email))';
  END IF;
END;
$$;

SELECT public.__apply_cleanup();

DROP FUNCTION IF EXISTS public.__apply_cleanup();

-- Ensure key indexes exist (idempotent)
CREATE INDEX IF NOT EXISTS idx_shift_assignments_supervisor ON public.shift_assignments(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_attendance_edited_by ON public.attendance_records(edited_by);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_paid_by ON public.payroll_entries(paid_by);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_finalized_by ON public.payroll_periods(finalized_by);
CREATE INDEX IF NOT EXISTS idx_verification_reviewed_by ON public.verification_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_leave_requests_reviewed_by ON public.leave_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_shifts_created_by ON public.shifts(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_staff ON public.documents(staff_id);
