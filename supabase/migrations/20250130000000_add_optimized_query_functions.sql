-- QUERY OPTIMIZATION MIGRATION FOR PATIENTS AND PRESCRIPTIONS
-- =====================================================

-- Create composite indexes for faster joins and filtering
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_patient ON public.prescriptions(user_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_bills_prescription_user ON public.bills(prescription_id, user_id);
CREATE INDEX IF NOT EXISTS idx_bills_date_user ON public.bills(user_id, date DESC);

-- Create a view for efficient patient data retrieval
CREATE OR REPLACE VIEW patient_details_view AS
SELECT 
    p.id,
    p.name,
    p.phone_number,
    p.address,
    p.date_of_birth,
    p.gender,
    p.user_id,
    p.created_at,
    p.updated_at,
    json_agg(DISTINCT jsonb_build_object(
        'id', pr.id,
        'prescription_number', pr.prescription_number,
        'doctor_name', pr.doctor_name,
        'date', pr.date,
        'status', pr.status,
        'bills', (
            SELECT json_agg(jsonb_build_object(
                'id', b.id,
                'total_amount', b.total_amount,
                'bill_number', b.bill_number,
                'date', b.date
            ))
            FROM bills b
            WHERE b.prescription_id = pr.id
            AND b.user_id = p.user_id
        )
    )) FILTER (WHERE pr.id IS NOT NULL) as prescriptions
FROM patients p
LEFT JOIN prescriptions pr ON pr.patient_id = p.id AND pr.user_id = p.user_id
GROUP BY p.id, p.user_id;

-- Create a view for efficient prescription data retrieval
CREATE OR REPLACE VIEW prescription_details_view AS
SELECT 
    pr.id,
    pr.prescription_number,
    pr.doctor_name,
    pr.date,
    pr.status,
    pr.patient_id,
    pr.user_id,
    pr.created_at,
    pr.updated_at,
    jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'phone_number', p.phone_number
    ) as patients,
    EXISTS (
        SELECT 1 
        FROM bills b 
        WHERE b.prescription_id = pr.id 
        AND b.user_id = pr.user_id
    ) as has_bill
FROM prescriptions pr
LEFT JOIN patients p ON p.id = pr.patient_id AND p.user_id = pr.user_id;

-- Create functions for optimized data retrieval
CREATE OR REPLACE FUNCTION get_patient_details(p_user_id uuid)
RETURNS TABLE (
    id int,
    name text,
    phone_number text,
    address text,
    date_of_birth text,
    gender text,
    user_id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    prescriptions json
) AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM patient_details_view
    WHERE user_id = p_user_id
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_prescription_details(p_user_id uuid)
RETURNS TABLE (
    id int,
    prescription_number text,
    doctor_name text,
    date text,
    status text,
    patient_id int,
    user_id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    patients jsonb,
    has_bill boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM prescription_details_view
    WHERE user_id = p_user_id
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_patient_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_prescription_details(uuid) TO authenticated;

-- Grant select permissions on views to authenticated users
GRANT SELECT ON patient_details_view TO authenticated;
GRANT SELECT ON prescription_details_view TO authenticated;