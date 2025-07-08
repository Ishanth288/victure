# Medicine Returns Database Schema Fix Instructions

## Problem
The `medicine_returns` table is missing the `refund_amount` column, causing 400 Bad Request errors when trying to create medicine returns.

## Solution
You need to run the SQL script manually in your Supabase dashboard to fix the database schema.

## Steps to Fix

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** tab
3. Create a new query
4. Copy and paste the contents of `fix_medicine_returns_schema.sql`
5. Click **Run** to execute the script

### Option 2: Using Local Supabase (if Docker is running)
1. Start Docker Desktop
2. Run: `npx supabase start`
3. Run: `npx supabase db reset`
4. Run: `npx supabase db push`

### Option 3: Manual Column Addition
If you prefer to add just the missing column:

```sql
ALTER TABLE medicine_returns 
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (refund_amount >= 0);
```

## Verification
After running the script, verify the fix by:
1. Testing the medicine return functionality in the app
2. Checking that no 400 errors occur
3. Confirming the `refund_amount` column exists in the table

## Files Modified
- ✅ `NewMedicineReturnDialog.tsx` - Restored `refund_amount` field
- ✅ `fix_medicine_returns_schema.sql` - Fixed SQL script (removed `created_at` reference)

## Current Status
- The application code is ready and includes `refund_amount`
- The SQL fix script is prepared and corrected
- You need to run the SQL script manually to complete the fix

## Next Steps
1. Run the SQL script in Supabase dashboard
2. Test the medicine return functionality
3. Verify no more schema errors occur