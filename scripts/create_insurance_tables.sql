-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_no VARCHAR(20) UNIQUE NOT NULL,
  birth_date VARCHAR(20) NOT NULL,
  reg_id VARCHAR(100) NOT NULL,
  reg_pw VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  telecom VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create insurance_records table
CREATE TABLE IF NOT EXISTS insurance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insurance_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_insurance_records_user_id ON insurance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_records_created_at ON insurance_records(created_at DESC);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, since we're using service role key from backend)
CREATE POLICY "Allow service role" ON users USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role" ON insurance_records USING (true) WITH CHECK (true);
