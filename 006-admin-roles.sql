-- App settings table (stores changeable member password and future settings)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial member password (matches APP_PASSWORD env var)
INSERT INTO app_settings (key, value)
VALUES ('member_password', 'bookyap!')
ON CONFLICT (key) DO NOTHING;
