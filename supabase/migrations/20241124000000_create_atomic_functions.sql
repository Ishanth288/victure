-- Create atomic deletion function for inventory items
CREATE OR REPLACE FUNCTION delete_inventory_item_atomic(
  p_item_id bigint,
  p_user_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_bill_count integer;
BEGIN
  -- Start transaction is implicit in function
  
  -- Check if user owns the item
  IF NOT EXISTS (
    SELECT 1 FROM inventory 
    WHERE id = p_item_id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Item not found or access denied'
    );
  END IF;
  
  -- Check if item is referenced in any bills
  SELECT COUNT(*) INTO v_bill_count
  FROM bill_items 
  WHERE inventory_item_id = p_item_id;
  
  IF v_bill_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Item is referenced in ' || v_bill_count || ' bill(s) and cannot be deleted'
    );
  END IF;
  
  -- Safe to delete
  DELETE FROM inventory 
  WHERE id = p_item_id AND user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Item deleted successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error deleting item: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Create atomic deletion function for prescriptions
CREATE OR REPLACE FUNCTION delete_prescription_atomic(
  p_prescription_id bigint,
  p_user_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_bill_id bigint;
BEGIN
  -- Check if user owns the prescription
  IF NOT EXISTS (
    SELECT 1 FROM prescriptions 
    WHERE id = p_prescription_id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Prescription not found or access denied'
    );
  END IF;
  
  -- Delete all bill items for bills associated with this prescription
  DELETE FROM bill_items 
  WHERE bill_id IN (
    SELECT id FROM bills WHERE prescription_id = p_prescription_id
  );
  
  -- Delete all bills associated with this prescription
  DELETE FROM bills WHERE prescription_id = p_prescription_id;
  
  -- Delete the prescription
  DELETE FROM prescriptions 
  WHERE id = p_prescription_id AND user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Prescription and all related data deleted successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error deleting prescription: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Create atomic deletion function for bills with inventory restoration
CREATE OR REPLACE FUNCTION delete_bill_atomic(
  p_bill_id bigint,
  p_restore_inventory boolean DEFAULT true
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_bill_item record;
BEGIN
  -- Check if bill exists
  IF NOT EXISTS (SELECT 1 FROM bills WHERE id = p_bill_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Bill not found'
    );
  END IF;
  
  -- Restore inventory quantities if requested
  IF p_restore_inventory THEN
    FOR v_bill_item IN 
      SELECT inventory_item_id, quantity 
      FROM bill_items 
      WHERE bill_id = p_bill_id
    LOOP
      UPDATE inventory 
      SET quantity = quantity + v_bill_item.quantity
      WHERE id = v_bill_item.inventory_item_id;
    END LOOP;
  END IF;
  
  -- Delete bill items
  DELETE FROM bill_items WHERE bill_id = p_bill_id;
  
  -- Delete the bill
  DELETE FROM bills WHERE id = p_bill_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Bill deleted successfully' || 
      CASE WHEN p_restore_inventory THEN ' and inventory restored' ELSE '' END
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error deleting bill: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Create atomic bill generation function
CREATE OR REPLACE FUNCTION generate_bill_atomic(
  p_prescription_id bigint,
  p_user_id uuid,
  p_bill_data jsonb,
  p_bill_items jsonb[]
) RETURNS jsonb AS $$
DECLARE
  v_bill_id bigint;
  v_item jsonb;
  v_inventory_item record;
  v_bill_record record;
BEGIN
  -- Validate bill data
  IF p_bill_data->>'total_amount' IS NULL OR (p_bill_data->>'total_amount')::numeric <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid bill data: total amount must be greater than zero'
    );
  END IF;
  
  -- Check inventory availability for all items first
  FOREACH v_item IN ARRAY p_bill_items
  LOOP
    SELECT quantity, name INTO v_inventory_item
    FROM inventory 
    WHERE id = (v_item->>'inventory_item_id')::bigint 
      AND user_id = p_user_id;
      
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Inventory item not found: ' || (v_item->>'inventory_item_id')
      );
    END IF;
    
    IF v_inventory_item.quantity < (v_item->>'quantity')::integer THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Insufficient inventory for ' || v_inventory_item.name || 
          '. Available: ' || v_inventory_item.quantity || 
          ', Requested: ' || (v_item->>'quantity')::integer
      );
    END IF;
  END LOOP;
  
  -- Create the bill
  INSERT INTO bills (
    prescription_id, user_id, bill_number, subtotal, gst_amount, 
    gst_percentage, discount_amount, total_amount, status
  ) VALUES (
    p_prescription_id, p_user_id,
    p_bill_data->>'bill_number',
    (p_bill_data->>'subtotal')::numeric,
    (p_bill_data->>'gst_amount')::numeric,
    (p_bill_data->>'gst_percentage')::numeric,
    (p_bill_data->>'discount_amount')::numeric,
    (p_bill_data->>'total_amount')::numeric,
    p_bill_data->>'status'
  ) RETURNING id INTO v_bill_id;
  
  -- Add bill items and update inventory
  FOREACH v_item IN ARRAY p_bill_items
  LOOP
    -- Insert bill item
    INSERT INTO bill_items (
      bill_id, inventory_item_id, quantity, unit_price, total_price
    ) VALUES (
      v_bill_id,
      (v_item->>'inventory_item_id')::bigint,
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric,
      (v_item->>'total_price')::numeric
    );
    
    -- Update inventory quantity
    UPDATE inventory 
    SET quantity = quantity - (v_item->>'quantity')::integer
    WHERE id = (v_item->>'inventory_item_id')::bigint;
  END LOOP;
  
  -- Get the complete bill data
  SELECT * INTO v_bill_record FROM bills WHERE id = v_bill_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Bill generated successfully',
    'bill_data', row_to_json(v_bill_record)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error generating bill: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql; 