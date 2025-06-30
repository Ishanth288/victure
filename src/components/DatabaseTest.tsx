import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const DatabaseTest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const testDatabaseConnection = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Test 1: Check if we can query prescriptions table
      console.log('Testing prescriptions query...');
      const { data: prescriptions, error: prescError, count } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      console.log('Prescriptions query result:', { prescriptions, prescError, count });

      // Test 2: Check if we can query patients table
      console.log('Testing patients query...');
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id);

      console.log('Patients query result:', { patients, patientsError });

      // Test 3: Check if we can query bills table
      console.log('Testing bills query...');
      const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id);

      console.log('Bills query result:', { bills, billsError });

      // Test 4: Try to create a test patient
      console.log('Testing patient creation...');
      const { data: newPatient, error: createPatientError } = await supabase
        .from('patients')
        .insert({
          name: 'Test Patient',
          phone_number: '1234567890',
          user_id: user.id
        })
        .select()
        .single();

      console.log('Patient creation result:', { newPatient, createPatientError });

      if (newPatient && !createPatientError) {
        // Test 5: Try to create a test prescription
        console.log('Testing prescription creation...');
        const { data: newPrescription, error: createPrescError } = await supabase
          .from('prescriptions')
          .insert({
            prescription_number: 'TEST-001',
            patient_id: newPatient.id,
            doctor_name: 'Dr. Test',
            user_id: user.id
          })
          .select()
          .single();

        console.log('Prescription creation result:', { newPrescription, createPrescError });

        setTestResults({
          prescriptions: { data: prescriptions, error: prescError, count },
          patients: { data: patients, error: patientsError },
          bills: { data: bills, error: billsError },
          newPatient: { data: newPatient, error: createPatientError },
          newPrescription: { data: newPrescription, error: createPrescError }
        });
      } else {
        setTestResults({
          prescriptions: { data: prescriptions, error: prescError, count },
          patients: { data: patients, error: patientsError },
          bills: { data: bills, error: billsError },
          newPatient: { data: newPatient, error: createPatientError }
        });
      }

      toast({
        title: "Database Test Complete",
        description: "Check console for detailed results"
      });

    } catch (error) {
      console.error('Database test error:', error);
      toast({
        title: "Database Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Database Connection Test</h3>
      <Button 
        onClick={testDatabaseConnection} 
        disabled={loading || !user?.id}
        className="mb-4"
      >
        {loading ? 'Testing...' : 'Test Database Connection'}
      </Button>
      
      {testResults && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Test Results:</h4>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};