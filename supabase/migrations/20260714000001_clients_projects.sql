-- Clients & Projects CRM
-- Adds internal_notes, due_date, priority to customer_orders
-- and creates the order_activity audit table with RLS.

-- ── 1. New columns on customer_orders ────────────────────────────────────────
ALTER TABLE public.customer_orders
  ADD COLUMN IF NOT EXISTS internal_notes JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS priority TEXT
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

COMMENT ON COLUMN public.customer_orders.internal_notes IS
  'Append-only JSONB array of {at, by, content} private notes from the agency';
COMMENT ON COLUMN public.customer_orders.due_date IS
  'Target delivery date set by the agency';
COMMENT ON COLUMN public.customer_orders.priority IS
  'Agency-set priority: low | medium | high | urgent';

-- ── 2. order_activity audit log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_activity (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID        NOT NULL REFERENCES public.customer_orders(id) ON DELETE CASCADE,
  agency_user_id UUID        NOT NULL REFERENCES auth.users(id)             ON DELETE CASCADE,
  event_type     TEXT        NOT NULL,
  description    TEXT        NOT NULL,
  metadata       JSONB       NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.order_activity IS
  'Immutable audit trail of status changes, payments, deliveries, and notes per order';

CREATE INDEX IF NOT EXISTS idx_order_activity_order_id
  ON public.order_activity(order_id);
CREATE INDEX IF NOT EXISTS idx_order_activity_agency_user_id
  ON public.order_activity(agency_user_id);
CREATE INDEX IF NOT EXISTS idx_order_activity_created_at
  ON public.order_activity(created_at DESC);

-- ── 3. RLS on order_activity ──────────────────────────────────────────────────
ALTER TABLE public.order_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_select_own_activities"
  ON public.order_activity
  FOR SELECT
  TO authenticated
  USING (agency_user_id = auth.uid());

CREATE POLICY "agency_insert_own_activities"
  ON public.order_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (agency_user_id = auth.uid());
