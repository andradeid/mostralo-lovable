-- Add column to control subscription plans visibility on booking page
ALTER TABLE booking_settings 
ADD COLUMN IF NOT EXISTS show_subscription_plans BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN booking_settings.show_subscription_plans IS 'Controls if subscription plans banner is shown on public booking page';