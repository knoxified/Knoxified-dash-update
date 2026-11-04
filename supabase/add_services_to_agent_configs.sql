-- Services & prices used to estimate Revenue Influenced / Protected.
-- Shape: [{ "id": "uuid", "name": "Teeth cleaning", "price": 120 }]
ALTER TABLE public.agent_configs
  ADD COLUMN IF NOT EXISTS services jsonb NOT NULL DEFAULT '[]'::jsonb;
