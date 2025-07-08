-- Priority 2 Security Implementation: Rate Limiting and Security Monitoring Tables
-- This migration creates tables for rate limiting and security event logging

-- Create rate_limits table for tracking API rate limits
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rate_limit_key TEXT NOT NULL,
  action TEXT NOT NULL,
  identifier TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security_logs table for security event monitoring
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical', 'info')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create failed_login_attempts table for tracking authentication failures
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  ip_address INET,
  user_agent TEXT,
  attempt_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create suspicious_activities table for tracking potential security threats
CREATE TABLE IF NOT EXISTS suspicious_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'escalated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_rate_limits_key_created ON rate_limits(rate_limit_key, created_at);
CREATE INDEX idx_rate_limits_action ON rate_limits(action);
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX idx_rate_limits_created_at ON rate_limits(created_at);

CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX idx_security_logs_severity ON security_logs(severity);
CREATE INDEX idx_security_logs_ip_address ON security_logs(ip_address);

CREATE INDEX idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX idx_failed_login_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX idx_failed_login_attempts_time ON failed_login_attempts(attempt_time);

CREATE INDEX idx_suspicious_activities_user_id ON suspicious_activities(user_id);
CREATE INDEX idx_suspicious_activities_type ON suspicious_activities(activity_type);
CREATE INDEX idx_suspicious_activities_risk_score ON suspicious_activities(risk_score);
CREATE INDEX idx_suspicious_activities_status ON suspicious_activities(status);
CREATE INDEX idx_suspicious_activities_created_at ON suspicious_activities(created_at);
CREATE INDEX idx_suspicious_activities_ip_address ON suspicious_activities(ip_address);

-- Enable RLS on security tables
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for rate_limits table (service role only)
CREATE POLICY "Service role can manage rate limits" ON rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for security_logs table (service role and admin users)
CREATE POLICY "Service role can manage security logs" ON security_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin users can view security logs" ON security_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS policies for failed_login_attempts table (service role only)
CREATE POLICY "Service role can manage failed login attempts" ON failed_login_attempts
  FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for suspicious_activities table (service role and admin users)
CREATE POLICY "Service role can manage suspicious activities" ON suspicious_activities
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin users can view suspicious activities" ON suspicious_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admin users can update suspicious activities" ON suspicious_activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create function to automatically clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete rate limit records older than 24 hours
  DELETE FROM rate_limits 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- Delete failed login attempts older than 30 days
  DELETE FROM failed_login_attempts 
  WHERE attempt_time < NOW() - INTERVAL '30 days';
  
  -- Log cleanup activity
  INSERT INTO security_logs (event_type, details, severity)
  VALUES (
    'CLEANUP_COMPLETED',
    jsonb_build_object(
      'table', 'rate_limits_and_failed_logins',
      'cutoff_time', NOW() - INTERVAL '24 hours'
    ),
    'info'
  );
END;
$$;

-- Create function to detect suspicious activity patterns
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  suspicious_record RECORD;
BEGIN
  -- Detect multiple failed login attempts from same IP
  FOR suspicious_record IN
    SELECT 
      ip_address,
      COUNT(*) as attempt_count,
      MAX(attempt_time) as last_attempt
    FROM failed_login_attempts 
    WHERE attempt_time > NOW() - INTERVAL '1 hour'
    GROUP BY ip_address
    HAVING COUNT(*) >= 5
  LOOP
    INSERT INTO suspicious_activities (
      activity_type,
      risk_score,
      ip_address,
      details
    ) VALUES (
      'MULTIPLE_FAILED_LOGINS',
      LEAST(100, suspicious_record.attempt_count * 10),
      suspicious_record.ip_address,
      jsonb_build_object(
        'attempt_count', suspicious_record.attempt_count,
        'last_attempt', suspicious_record.last_attempt,
        'detection_time', NOW()
      )
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Detect rapid API calls from same user
  FOR suspicious_record IN
    SELECT 
      identifier as user_id,
      action,
      COUNT(*) as call_count
    FROM rate_limits 
    WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND action IN ('patient_create', 'prescription_create', 'bill_create')
    GROUP BY identifier, action
    HAVING COUNT(*) >= 20
  LOOP
    INSERT INTO suspicious_activities (
      user_id,
      activity_type,
      risk_score,
      details
    ) VALUES (
      suspicious_record.user_id::uuid,
      'RAPID_API_CALLS',
      LEAST(100, suspicious_record.call_count * 2),
      jsonb_build_object(
        'action', suspicious_record.action,
        'call_count', suspicious_record.call_count,
        'detection_time', NOW()
      )
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Create function to get security dashboard data
CREATE OR REPLACE FUNCTION get_security_dashboard_data()
RETURNS TABLE(
  total_security_events BIGINT,
  high_risk_activities BIGINT,
  failed_logins_today BIGINT,
  rate_limit_violations_today BIGINT,
  top_suspicious_ips JSONB,
  recent_security_events JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM security_logs WHERE created_at > CURRENT_DATE) as total_security_events,
    (SELECT COUNT(*) FROM suspicious_activities WHERE risk_score >= 70 AND status = 'pending') as high_risk_activities,
    (SELECT COUNT(*) FROM failed_login_attempts WHERE attempt_time > CURRENT_DATE) as failed_logins_today,
    (SELECT COUNT(*) FROM security_logs WHERE event_type = 'RATE_LIMIT_EXCEEDED' AND created_at > CURRENT_DATE) as rate_limit_violations_today,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'ip_address', ip_address,
          'risk_score', AVG(risk_score)::INTEGER,
          'activity_count', COUNT(*)
        )
      )
      FROM suspicious_activities 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY ip_address
      ORDER BY AVG(risk_score) DESC
      LIMIT 5
    ) as top_suspicious_ips,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'event_type', event_type,
          'severity', severity,
          'created_at', created_at,
          'details', details
        )
      )
      FROM security_logs 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 10
    ) as recent_security_events;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limits TO service_role;
GRANT EXECUTE ON FUNCTION detect_suspicious_activity TO service_role;
GRANT EXECUTE ON FUNCTION get_security_dashboard_data TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE rate_limits IS 'Tracks API rate limiting attempts for security monitoring';
COMMENT ON TABLE security_logs IS 'Comprehensive security event logging for monitoring and auditing';
COMMENT ON TABLE failed_login_attempts IS 'Tracks failed authentication attempts for security analysis';
COMMENT ON TABLE suspicious_activities IS 'Identifies and tracks potentially malicious activities';

COMMENT ON FUNCTION cleanup_old_rate_limits IS 'Automatically cleans up old rate limiting and security records';
COMMENT ON FUNCTION detect_suspicious_activity IS 'Analyzes patterns to detect potential security threats';
COMMENT ON FUNCTION get_security_dashboard_data IS 'Provides aggregated security metrics for admin dashboard';

-- Create a view for security monitoring dashboard
CREATE OR REPLACE VIEW security_monitoring_dashboard AS
SELECT 
  'security_events' as metric_type,
  COUNT(*) as count,
  DATE_TRUNC('hour', created_at) as time_bucket
FROM security_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)

UNION ALL

SELECT 
  'failed_logins' as metric_type,
  COUNT(*) as count,
  DATE_TRUNC('hour', attempt_time) as time_bucket
FROM failed_login_attempts 
WHERE attempt_time > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', attempt_time)

UNION ALL

SELECT 
  'suspicious_activities' as metric_type,
  COUNT(*) as count,
  DATE_TRUNC('hour', created_at) as time_bucket
FROM suspicious_activities 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)

ORDER BY time_bucket DESC;

-- Grant access to the view
GRANT SELECT ON security_monitoring_dashboard TO authenticated;

-- Add RLS policy for the view
CREATE POLICY "Admin users can view security monitoring dashboard" ON security_monitoring_dashboard
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );