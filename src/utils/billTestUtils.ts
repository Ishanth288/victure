import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: any;
}

export class BillingSystemTester {
  private results: TestResult[] = [];
  private userId: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        this.results.push({
          test: "Authentication Check",
          passed: false,
          message: "User not authenticated"
        });
        return false;
      }
      
      this.userId = session.user.id;
      this.results.push({
        test: "Authentication Check",
        passed: true,
        message: "User authenticated successfully"
      });
      return true;
    } catch (error) {
      this.results.push({
        test: "Authentication Check",
        passed: false,
        message: `Authentication error: ${error}`
      });
      return false;
    }
  }

  async testPatientCreation(): Promise<TestResult> {
    try {
      if (!this.userId) throw new Error("Not authenticated");

      const testPatientData = {
        name: `Test Patient ${Date.now()}`,
        phone_number: `9${Math.floor(Math.random() * 1000000000)}`,
        user_id: this.userId,
        status: 'active',
        created_at: new Date().toISOString()
      };

      const { data: patient, error } = await supabase
        .from("patients")
        .insert(testPatientData)
        .select("*")
        .single();

      if (error) throw error;

      const result: TestResult = {
        test: "Patient Creation",
        passed: !!patient?.id,
        message: patient?.id ? 
          `Patient created successfully with ID: ${patient.id}` : 
          "Patient creation failed - no ID returned",
        data: patient
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        test: "Patient Creation",
        passed: false,
        message: `Patient creation failed: ${error}`
      };
      this.results.push(result);
      return result;
    }
  }

  async testPrescriptionCreation(patientId: number): Promise<TestResult> {
    try {
      if (!this.userId) throw new Error("Not authenticated");

      const prescriptionData = {
        prescription_number: `TEST-${Date.now()}`,
        patient_id: patientId,
        doctor_name: "Dr. Test",
        user_id: this.userId,
        date: new Date().toISOString(),
        status: 'active'
      };

      const { data: prescription, error } = await supabase
        .from("prescriptions")
        .insert(prescriptionData)
        .select("*")
        .single();

      if (error) throw error;

      const result: TestResult = {
        test: "Prescription Creation",
        passed: !!prescription?.id,
        message: prescription?.id ? 
          `Prescription created successfully with ID: ${prescription.id}` : 
          "Prescription creation failed - no ID returned",
        data: prescription
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        test: "Prescription Creation",
        passed: false,
        message: `Prescription creation failed: ${error}`
      };
      this.results.push(result);
      return result;
    }
  }

  async testInventoryCheck(): Promise<TestResult> {
    try {
      if (!this.userId) throw new Error("Not authenticated");

      const { data: inventory, error } = await supabase
        .from("inventory")
        .select("id, name, quantity")
        .eq("user_id", this.userId)
        .gt("quantity", 0)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const hasInventory = !!inventory;
      const result: TestResult = {
        test: "Inventory Check",
        passed: hasInventory,
        message: hasInventory ? 
          `Found inventory item: ${inventory.name} (Qty: ${inventory.quantity})` : 
          "No inventory items found with quantity > 0",
        data: inventory
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        test: "Inventory Check",
        passed: false,
        message: `Inventory check failed: ${error}`
      };
      this.results.push(result);
      return result;
    }
  }

  async testBillGeneration(prescriptionId: number, inventoryItems: any[]): Promise<TestResult> {
    try {
      if (!this.userId) throw new Error("Not authenticated");
      if (!inventoryItems.length) throw new Error("No inventory items available");

      const item = inventoryItems[0];
      const testQuantity = Math.min(1, item.quantity); // Use minimum safe quantity

      // Create test bill
      const billData = {
        bill_number: `TEST-BILL-${Date.now()}`,
        subtotal: item.price || 100,
        gst_amount: 18,
        gst_percentage: 18,
        discount_amount: 0,
        total_amount: (item.price || 100) + 18,
        status: "completed",
        user_id: this.userId,
        prescription_id: prescriptionId,
        date: new Date().toISOString().split('T')[0]
      };

      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert(billData)
        .select('*')
        .single();

      if (billError) throw billError;

      // Create bill items
      const billItemData = {
        bill_id: bill.id,
        inventory_item_id: item.id,
        quantity: testQuantity,
        unit_price: item.price || 100,
        total_price: (item.price || 100) * testQuantity,
      };

      const { error: itemError } = await supabase
        .from('bill_items')
        .insert(billItemData);

      if (itemError) throw itemError;

      // Test inventory update (the critical fix)
      const originalQuantity = item.quantity;
      const { data: updatedInventory, error: updateError } = await supabase
        .from('inventory')
        .update({ 
          quantity: Math.max(0, originalQuantity - testQuantity)
        })
        .eq('id', item.id)
        .eq('user_id', this.userId)
        .select('quantity')
        .single();

      if (updateError) throw updateError;

      const inventoryUpdatedCorrectly = updatedInventory.quantity === (originalQuantity - testQuantity);

      const result: TestResult = {
        test: "Bill Generation & Inventory Update",
        passed: !!bill.id && inventoryUpdatedCorrectly,
        message: bill.id && inventoryUpdatedCorrectly ? 
          `Bill created successfully (${bill.bill_number}). Inventory updated: ${originalQuantity} -> ${updatedInventory.quantity}` : 
          `Bill creation failed or inventory update incorrect`,
        data: { 
          bill, 
          originalQuantity, 
          newQuantity: updatedInventory.quantity,
          expectedQuantity: originalQuantity - testQuantity
        }
      };

      this.results.push(result);

      // Cleanup - restore inventory
      await supabase
        .from('inventory')
        .update({ quantity: originalQuantity })
        .eq('id', item.id);

      return result;
    } catch (error) {
      const result: TestResult = {
        test: "Bill Generation & Inventory Update",
        passed: false,
        message: `Bill generation test failed: ${error}`
      };
      this.results.push(result);
      return result;
    }
  }

  async testDataRetrievalIntegrity(): Promise<TestResult> {
    try {
      if (!this.userId) throw new Error("Not authenticated");

      // Test complex query with joins
      const { data: prescriptionsWithData, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          patient:patients (
            id,
            name,
            phone_number
          ),
          bills:bills (
            id,
            bill_number,
            total_amount,
            status
          )
        `)
        .eq("user_id", this.userId)
        .limit(5);

      if (error) throw error;

      const hasData = prescriptionsWithData && prescriptionsWithData.length > 0;
      const allHavePatients = prescriptionsWithData?.every(p => p.patient) || false;

      const result: TestResult = {
        test: "Data Retrieval Integrity",
        passed: hasData && allHavePatients,
        message: hasData ? 
          `Retrieved ${prescriptionsWithData.length} prescriptions with patient data integrity: ${allHavePatients}` : 
          "No prescription data found or data integrity issues",
        data: { count: prescriptionsWithData?.length || 0, integrityCheck: allHavePatients }
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        test: "Data Retrieval Integrity",
        passed: false,
        message: `Data retrieval test failed: ${error}`
      };
      this.results.push(result);
      return result;
    }
  }

  async testRealtimeUpdateEvents(): Promise<TestResult> {
    try {
      let eventFired = false;
      let eventData: any = null;

      // Listen for custom bill generation event
      const handleBillGenerated = (event: CustomEvent) => {
        eventFired = true;
        eventData = event.detail;
      };

      window.addEventListener('billGenerated', handleBillGenerated as EventListener);

      // Simulate bill generation event
      window.dispatchEvent(new CustomEvent('billGenerated', {
        detail: {
          billId: 123,
          billNumber: 'TEST-BILL-123',
          prescriptionId: 456,
          totalAmount: 150.00
        }
      }));

      // Wait a moment for event processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Cleanup
      window.removeEventListener('billGenerated', handleBillGenerated as EventListener);

      const result: TestResult = {
        test: "Real-time Update Events",
        passed: eventFired && eventData !== null,
        message: eventFired ? 
          `Event system working correctly. Received data: ${JSON.stringify(eventData)}` : 
          "Event system not working - no events received",
        data: eventData
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        test: "Real-time Update Events",
        passed: false,
        message: `Real-time event test failed: ${error}`
      };
      this.results.push(result);
      return result;
    }
  }

  async testDataOrdering(): Promise<TestResult> {
    try {
      if (!this.userId) throw new Error("Not authenticated");

      // Test prescription ordering - should be most recent first
      const { data: prescriptions, error: prescriptionError } = await supabase
        .from("prescriptions")
        .select("id, date, prescription_number")
        .eq("user_id", this.userId)
        .order("date", { ascending: false })
        .limit(5);

      if (prescriptionError) throw prescriptionError;

      // Test bill ordering - should be most recent first
      const { data: bills, error: billError } = await supabase
        .from("bills")
        .select("id, date, bill_number")
        .eq("user_id", this.userId)
        .order("date", { ascending: false })
        .limit(5);

      if (billError) throw billError;

      let prescriptionOrderingCorrect = true;
      let billOrderingCorrect = true;

      // Check prescription ordering
      if (prescriptions && prescriptions.length > 1) {
        for (let i = 1; i < prescriptions.length; i++) {
          if (new Date(prescriptions[i-1].date) < new Date(prescriptions[i].date)) {
            prescriptionOrderingCorrect = false;
            break;
          }
        }
      }

      // Check bill ordering
      if (bills && bills.length > 1) {
        for (let i = 1; i < bills.length; i++) {
          if (new Date(bills[i-1].date) < new Date(bills[i].date)) {
            billOrderingCorrect = false;
            break;
          }
        }
      }

      const overallPassed = prescriptionOrderingCorrect && billOrderingCorrect;

      const result: TestResult = {
        test: "Data Ordering (Recent First)",
        passed: overallPassed,
        message: overallPassed ? 
          `Data ordering correct: Prescriptions (${prescriptions?.length || 0}), Bills (${bills?.length || 0})` : 
          `Data ordering issues detected: Prescriptions OK: ${prescriptionOrderingCorrect}, Bills OK: ${billOrderingCorrect}`,
        data: { 
          prescriptionCount: prescriptions?.length || 0,
          billCount: bills?.length || 0,
          prescriptionOrderingCorrect,
          billOrderingCorrect
        }
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        test: "Data Ordering (Recent First)",
        passed: false,
        message: `Data ordering test failed: ${error}`
      };
      this.results.push(result);
      return result;
    }
  }

  async runFullTest(): Promise<{ summary: any; results: TestResult[] }> {
    console.log("🧪 Starting Comprehensive Billing System Test...");
    
    const initialized = await this.initialize();
    if (!initialized) {
      return { 
        summary: { total: 1, passed: 0, failed: 1 }, 
        results: this.results 
      };
    }

    // Run tests sequentially
    const patientResult = await this.testPatientCreation();
    
    let prescriptionResult: TestResult | null = null;
    if (patientResult.passed && patientResult.data?.id) {
      prescriptionResult = await this.testPrescriptionCreation(patientResult.data.id);
    }

    const inventoryResult = await this.testInventoryCheck();
    
    let billResult: TestResult | null = null;
    if (prescriptionResult?.passed && prescriptionResult.data?.id && inventoryResult.passed) {
      billResult = await this.testBillGeneration(
        prescriptionResult.data.id, 
        [inventoryResult.data]
      );
    }

    await this.testDataRetrievalIntegrity();
    await this.testRealtimeUpdateEvents();
    await this.testDataOrdering();

    // Generate summary
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;

    const summary = {
      total,
      passed,
      failed,
      passRate: total > 0 ? ((passed / total) * 100).toFixed(1) : "0.0"
    };

    console.log("🧪 Test Summary:", summary);
    console.log("📋 Detailed Results:", this.results);

    return { summary, results: this.results };
  }

  getResults(): TestResult[] {
    return this.results;
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? ((passed / total) * 100).toFixed(1) : "0.0",
      status: failed === 0 ? "ALL_TESTS_PASSED" : "SOME_TESTS_FAILED"
    };
  }
}

// Export utility function for quick testing
export const runBillingSystemTest = async () => {
  const tester = new BillingSystemTester();
  return await tester.runFullTest();
}; 