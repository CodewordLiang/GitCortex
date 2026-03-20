-- Add credential storage columns to model_config for workspace mode CLI authentication.
-- All columns nullable for backward compatibility.
ALTER TABLE model_config ADD COLUMN encrypted_api_key TEXT;
ALTER TABLE model_config ADD COLUMN base_url TEXT;
ALTER TABLE model_config ADD COLUMN api_type TEXT;
