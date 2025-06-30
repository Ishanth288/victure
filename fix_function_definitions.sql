-- Fix function definitions to work with actual database tables
-- Run this in Supabase SQL Editor

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_patient_details(uuid);
DROP FUNCTION IF EXISTS get_prescription_details(uuid);
DROP FUNCTION IF EXISTS get_patient_details(text);
DROP FUNCTION IF EXISTS get_prescription_details(text);

-- Create function to get patient details with prescriptions and bills
CREATE OR REPLACE FUNCTION get_patient_details(p_user_id text)
RETURNS TABLE (
    id int,
    name text,
    phone_number text,
    address text,
    date_of_birth text,
    gender text,
    user_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    prescriptions json
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name::text,
        p.phone_number::text,
        ''::text as address,  -- Not in current schema
        ''::text as date_of_birth,  -- Not in current schema
        ''::text as gender,  -- Not in current schema
        p.user_id::text,
        p.created_at,
        p.created_at as updated_at,  -- Use created_at as fallback
        COALESCE(
            json_agg(
                json_build_object(
                    'id', pr.id,
                    'prescription_number', pr.prescription_number,
                    'doctor_name', pr.doctor_name,
                    'date', pr.date,
                    'status', pr.status,
                    'bills', COALESCE(
                        (
                            SELECT json_agg(
                                json_build_object(
                                    'id', b.id::int,
                                    'bill_number', b.bill_number,
                                    'total_amount', b.total_amount,
                                    'date', b.date,
                                    'status', b.status,
                                    'payment_method', b.payment_method,
                                    'original_amount', b.total_amount,
                                    'effective_amount', b.total_amount,
                                    'return_value', 0
                                )
                            )
                            FROM bills b 
                            WHERE b.prescription_id = pr.id::bigint
                        ),
                        '[]'::json
                    )
                )
            ) FILTER (WHERE pr.id IS NOT NULL),
            '[]'::json
        ) as prescriptions
    FROM patients p
    LEFT JOIN prescriptions pr ON p.id = pr.patient_id AND pr.user_id = p_user_id::uuid
    WHERE p.user_id = p_user_id::uuid
    GROUP BY p.id, p.name, p.phone_number, p.user_id::text, p.created_at
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get prescription details with patient info and bill details
CREATE OR REPLACE FUNCTION get_prescription_details(p_user_id text)
RETURNS TABLE (
    id int,
    prescription_number text,
    doctor_name text,
    date text,
    status text,
    patient_id int,
    user_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    patients jsonb,
    has_bill boolean,
    bill_id int,
    bill_number text,
    bill_total_amount numeric,
    bill_date text,
    bills jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.prescription_number::text,
        pr.doctor_name::text,
        pr.date::text,
        pr.status::text,
        pr.patient_id,
        pr.user_id::text,
        pr.date as created_at,  -- Use date as created_at
        pr.date as updated_at,  -- Use date as updated_at
        jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'phone_number', p.phone_number
        ) as patients,
        (b.id IS NOT NULL) as has_bill,
        b.id::int as bill_id,
        b.bill_number::text as bill_number,
        b.total_amount as bill_total_amount,
        b.date::text as bill_date,
        CASE 
            WHEN b.id IS NOT NULL THEN
                jsonb_build_array(
                    jsonb_build_object(
                        'id', b.id::int,
                        'bill_number', b.bill_number,
                        'total_amount', b.total_amount,
                        'date', b.date,
                        'status', b.status,
                        'payment_method', b.payment_method
                    )
                )
            ELSE '[]'::jsonb
        END as bills
    FROM prescriptions pr
    LEFT JOIN patients p ON pr.patient_id = p.id
    LEFT JOIN bills b ON b.prescription_id = pr.id::bigint AND b.user_id = p_user_id::uuid
    WHERE pr.user_id = p_user_id::uuid
    ORDER BY pr.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_patient_details(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_prescription_details(text) TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';