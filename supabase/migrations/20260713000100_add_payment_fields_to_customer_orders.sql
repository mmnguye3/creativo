-- Add Stripe payment tracking fields to customer_orders
-- price_cents: agency-confirmed price in integer cents
-- stripe_session_id: Stripe Checkout Session ID (cs_test_...)
-- payment_status: unpaid | awaiting_payment | paid
--
-- Also extends the allowed order status values to support the payment flow:
-- existing: pending, in_progress, completed, cancelled
-- new: quoted, awaiting_payment, paid

ALTER TABLE public.customer_orders
  ADD COLUMN IF NOT EXISTS price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';

COMMENT ON COLUMN public.customer_orders.price_cents IS 'Agency-set price in integer cents; null until the agency quotes the order';
COMMENT ON COLUMN public.customer_orders.stripe_session_id IS 'Stripe Checkout Session ID once a payment link has been created';
COMMENT ON COLUMN public.customer_orders.payment_status IS 'unpaid | awaiting_payment | paid';
