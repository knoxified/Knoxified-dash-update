-- 1. Suppression List Table
CREATE TABLE public.suppression_list (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone_number text NOT NULL,
  reason text,
  source_automation_id uuid,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  added_by text,
  notes text,
  CONSTRAINT suppression_list_pkey PRIMARY KEY (id),
  CONSTRAINT suppression_list_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT suppression_unique UNIQUE (user_id, phone_number)
);
CREATE INDEX idx_suppression_lookup ON public.suppression_list (user_id, phone_number);

-- 4. Onboarding Compliance Acknowledgment
-- Adding compliance acknowledgment to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS compliance_acknowledged_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS compliance_agreed_version text;

-- 5. Consent Source Tracking
-- Adding consent_source to user_automations (assuming this table tracks leads/contacts mapped to automations)
ALTER TABLE public.user_automations 
ADD COLUMN IF NOT EXISTS consent_source text;

-- 7. Calling Window Enforcement
-- Adding default calling window configurations to agent_configs
ALTER TABLE public.agent_configs
ADD COLUMN IF NOT EXISTS calling_window_start time DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS calling_window_end time DEFAULT '21:00:00',
ADD COLUMN IF NOT EXISTS calling_window_timezone text DEFAULT 'local'; -- local means recipient local time

-- 2 & 3. AI Disclosure and Call Recording Disclosure Defaults
ALTER TABLE public.agent_configs
ADD COLUMN IF NOT EXISTS require_ai_disclosure boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS require_recording_disclosure boolean DEFAULT true;

-- 8. Account Suspension for Abuse
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS outbound_calling_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason text;
