
/**
 * Utility functions for classifying pharmacy data
 */

// Medicine categories based on Indian pharmacy standards
const MEDICINE_CATEGORIES: Record<string, string[]> = {
  "Painkiller": ["paracetamol", "ibuprofen", "aspirin", "diclofenac", "aceclofenac", "nimesulide", "tramadol"],
  "Antibiotic": ["amoxicillin", "azithromycin", "ciprofloxacin", "ofloxacin", "cefixime", "cillin", "penicillin", "doxycycline", "clindamycin"],
  "Diabetic": ["metformin", "glimepiride", "sitagliptin", "insulin", "glipizide", "gliclazide", "linagliptin"],
  "Antihypertensive": ["amlodipine", "telmisartan", "losartan", "enalapril", "ramipril", "olmesartan", "nebivolol"],
  "Antihistamine": ["cetirizine", "fexofenadine", "loratadine", "chlorpheniramine", "levocetirizine", "desloratadine"],
  "Cardiac": ["atorvastatin", "clopidogrel", "aspirin", "rosuvastatin", "enoxaparin", "nitroglycerin", "isosorbide"],
  "Antacid": ["pantoprazole", "omeprazole", "ranitidine", "esomeprazole", "famotidine", "sucralfate"],
  "Steroid": ["prednisolone", "dexamethasone", "hydrocortisone", "methylprednisolone", "betamethasone"],
  "Anti-inflammatory": ["diclofenac", "aceclofenac", "naproxen", "etoricoxib", "celecoxib", "meloxicam"],
  "Respiratory": ["salbutamol", "montelukast", "theophylline", "ipratropium", "budesonide", "formoterol"]
};

// Controlled substances list
const CONTROLLED_SUBSTANCES = [
  "schedule h1", "schedule x", "morphine", "codeine", "fentanyl", "buprenorphine", "alprazolam", 
  "diazepam", "tramadol", "zolpidem", "methylphenidate"
];

/**
 * Classifies medicine based on generic name
 */
export function classifyMedicine(genericName: string = "", name: string = ""): string {
  const searchText = (genericName || name).toLowerCase();
  
  for (const [category, keywords] of Object.entries(MEDICINE_CATEGORIES)) {
    if (keywords.some(keyword => searchText.includes(keyword))) {
      return category;
    }
  }
  
  return "Other";
}

/**
 * Checks if a medicine is a controlled substance
 */
export function isControlledSubstance(schedule: string = "", name: string = ""): boolean {
  const searchText = (schedule + " " + name).toLowerCase();
  return CONTROLLED_SUBSTANCES.some(substance => searchText.includes(substance));
}

/**
 * Classifies a patient based on their history
 */
export function classifyPatient(patient: {
  visit_count?: number;
  chronic_diseases?: string[];
  is_first_visit?: boolean;
  recent_prescription_count?: number;
}): string {
  if (patient.visit_count && patient.visit_count > 5 && patient.chronic_diseases?.length) {
    return "Chronic";
  }
  if (patient.is_first_visit) {
    return "New";
  }
  if (patient.recent_prescription_count && patient.recent_prescription_count > 3) {
    return "Regular";
  }
  return "Occasional";
}

/**
 * Classifies a prescription based on its contents
 */
export function classifyPrescription(items: Array<{name?: string; schedule?: string;}>): {
  prescription_type: string;
  polytherapy: boolean;
} {
  // Check if any items are controlled substances
  const hasControlledSubstance = items.some(item => 
    isControlledSubstance(item.schedule, item.name || "")
  );

  // Check for polytherapy (multiple drugs from same class)
  const categoryCounts: Record<string, number> = {};
  items.forEach(item => {
    const category = classifyMedicine(item.name, item.name);
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  const hasPolytherapy = Object.values(categoryCounts).some(count => count > 1);

  return {
    prescription_type: hasControlledSubstance ? "Controlled" : "Regular",
    polytherapy: hasPolytherapy
  };
}
