
import { PreviewItem } from "@/types/dataMigration";

/**
 * Auto-detects field mappings based on historical data and column name patterns
 */
export function autoDetectFieldMappings(headers: string[]): Record<string, string> {
  const mappings: Record<string, string> = {};
  
  // Pattern dictionary for different field types
  const patternDictionary = {
    // Inventory item fields
    name: [
      /^med(icine)?[\s_-]?name$/i,
      /^product[\s_-]?name$/i,
      /^drug[\s_-]?name$/i,
      /^item[\s_-]?name$/i,
      /^prod(uct)?[\s_-]?(title|name)$/i,
      /^title$/i,
      /^med[\s_-]?title$/i,
      /^product_item$/i,
      /^item[\s_-]?descr(iption)?$/i,
      /^drug[\s_-]?descr(iption)?$/i,
      /^med[\s_-]?descr(iption)?$/i,
      /^item[\s_-]?p$/i,
      /^p[\s_-]?name$/i
    ],
    
    generic_name: [
      /^generic$/i,
      /^gen[\s_-]?name$/i,
      /^generic[\s_-]?descr(iption)?$/i,
      /^chemical[\s_-]?name$/i,
      /^molecule$/i,
      /^mol[\s_-]?name$/i,
      /^mole?[\s_-]?name$/i,
      /^cmn$/i, // common molecular name
      /^inn$/i  // international nonproprietary name
    ],
    
    manufacturer: [
      /^mfg$/i,
      /^manufacturer$/i,
      /^company$/i,
      /^maker$/i,
      /^vendor$/i,
      /^manuf$/i,
      /^comp[\s_-]?name$/i,
      /^firm$/i,
      /^producer$/i,
      /^lab$/i,
      /^laboratory$/i,
      /^brand$/i
    ],
    
    batch_number: [
      /^batch$/i,
      /^lot[\s_-]?no$/i,
      /^batch[\s_-]?number$/i,
      /^lot[\s_-]?number$/i,
      /^lot[\s_-]?id$/i,
      /^ndc$/i,
      /^batch[\s_-]?id$/i,
      /^lot$/i,
      /^batch[\s_-]?no$/i,
      /^serial[\s_-]?no$/i,
      /^serial$/i
    ],
    
    expiry_date: [
      /^exp$/i,
      /^expir[ey]$/i,
      /^expir(y|ation)[\s_-]?date$/i,
      /^valid[\s_-]?until$/i,
      /^exp[\s_-]?date$/i,
      /^use[\s_-]?by$/i,
      /^good[\s_-]?until$/i,
      /^exp[\s_-]?dt$/i,
      /^perm$/i,
      /^shelf[\s_-]?life$/i
    ],
    
    quantity: [
      /^qty$/i,
      /^quant(ity)?$/i,
      /^stock$/i,
      /^avail(able)?[\s_-]?units$/i,
      /^count$/i,
      /^units$/i,
      /^stock[\s_-]?level$/i,
      /^avail(able)?[\s_-]?count$/i,
      /^inventory$/i,
      /^inv[\s_-]?count$/i,
      /^stock[\s_-]?qty$/i,
      /^pcs$/i,
      /^in[\s_-]?stock$/i,
      /^on[\s_-]?hand$/i
    ],
    
    unit_cost: [
      /^cost$/i,
      /^buy[\s_-]?price$/i,
      /^purchase[\s_-]?price$/i,
      /^cost[\s_-]?price$/i,
      /^unit[\s_-]?cost$/i,
      /^acquisition[\s_-]?cost$/i,
      /^per[\s_-]?unit[\s_-]?cost$/i,
      /^wholesale[\s_-]?price$/i,
      /^wsp$/i,
      /^base[\s_-]?price$/i,
      /^cp$/i // cost price
    ],
    
    selling_price: [
      /^mrp$/i,
      /^sell[\s_-]?price$/i,
      /^retail[\s_-]?price$/i,
      /^price$/i,
      /^sales[\s_-]?price$/i,
      /^unit[\s_-]?price$/i,
      /^msp$/i, // maximum selling price
      /^max[\s_-]?retail[\s_-]?price$/i,
      /^sp$/i,
      /^rp$/i, // retail price
      /^rate$/i
    ],
    
    hsn_code: [
      /^hsn[\s_-]?code$/i,
      /^gst[\s_-]?code$/i,
      /^tax[\s_-]?code$/i,
      /^tax[\s_-]?class$/i,
      /^tariff$/i,
      /^tax[\s_-]?category$/i
    ],
    
    // Patient fields
    patient_name: [
      /^patient[\s_-]?name$/i,
      /^client[\s_-]?name$/i,
      /^customer[\s_-]?name$/i,
      /^cust[\s_-]?name$/i,
      /^pt[\s_-]?name$/i,
      /^person$/i,
      /^full[\s_-]?name$/i,
      /^name$/i
    ],
    
    phone_number: [
      /^phone$/i,
      /^mobile$/i,
      /^contact$/i,
      /^phone[\s_-]?number$/i,
      /^mobile[\s_-]?number$/i,
      /^tel$/i,
      /^telephone$/i,
      /^contact[\s_-]?number$/i,
      /^cell$/i,
      /^cell[\s_-]?number$/i,
      /^ph[\s_-]?no$/i,
      /^mob[\s_-]?no$/i
    ],
    
    // Prescription fields
    prescription_number: [
      /^rx[\s_-]?(no|number)$/i,
      /^prescription[\s_-]?(no|number)$/i,
      /^script[\s_-]?(no|number)$/i,
      /^presc[\s_-]?(no|number)$/i,
      /^rx[\s_-]?id$/i,
      /^script[\s_-]?id$/i,
      /^order[\s_-]?(no|number|id)$/i
    ],
    
    doctor_name: [
      /^doctor$/i,
      /^physician$/i,
      /^prescribed[\s_-]?by$/i,
      /^dr[\s_-]?name$/i,
      /^prescriber$/i,
      /^md$/i,
      /^doctor[\s_-]?name$/i,
      /^practitioner$/i,
      /^consultant$/i
    ],
    
    date: [
      /^date$/i,
      /^rx[\s_-]?date$/i,
      /^prescription[\s_-]?date$/i,
      /^prescribed[\s_-]?(on|date)$/i,
      /^issue[\s_-]?date$/i,
      /^order[\s_-]?date$/i,
      /^visit[\s_-]?date$/i,
      /^pres[\s_-]?date$/i,
      /^created[\s_-]?(on|at|date)$/i
    ]
  };
  
  // Apply pattern matching to each header
  headers.forEach(header => {
    const cleanHeader = header.trim();
    let matched = false;
    
    // Check against each pattern category
    for (const [fieldName, patterns] of Object.entries(patternDictionary)) {
      for (const pattern of patterns) {
        if (pattern.test(cleanHeader)) {
          mappings[header] = fieldName;
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    
    // Fallback to direct partial string matching if no pattern match
    if (!matched) {
      const lowerHeader = cleanHeader.toLowerCase();
      
      // Direct key matches
      const directMatches: Record<string, string[]> = {
        name: ["name", "title", "product", "medicine", "drug", "item"],
        generic_name: ["generic", "molecule", "chemical"],
        manufacturer: ["manufacturer", "company", "vendor", "maker", "producer", "lab"],
        batch_number: ["batch", "lot", "serial", "ndc"],
        expiry_date: ["expiry", "expire", "expiration", "valid until", "use by"],
        quantity: ["quantity", "qty", "stock", "count", "units", "inventory"],
        unit_cost: ["cost", "buy price", "purchase price"],
        selling_price: ["selling", "price", "mrp", "retail", "sale"],
        phone_number: ["phone", "mobile", "contact", "cell"],
        prescription_number: ["rx", "prescription", "script"],
        doctor_name: ["doctor", "physician", "dr", "prescriber"],
        date: ["date", "issued", "created", "order date"],
        patient_name: ["patient", "client", "customer", "person"]
      };
      
      for (const [fieldName, keywords] of Object.entries(directMatches)) {
        for (const keyword of keywords) {
          if (lowerHeader.includes(keyword)) {
            mappings[header] = fieldName;
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }
  });
  
  return mappings;
}

/**
 * Preview data transformation using a mapping template
 */
export function previewMappedData(data: any[], mappings: Record<string, string>): PreviewItem[] {
  return data.map(item => {
    const mappedItem: Record<string, any> = {};
    
    Object.entries(mappings).forEach(([sourceKey, targetKey]) => {
      if (item[sourceKey] !== undefined) {
        mappedItem[targetKey] = item[sourceKey];
      }
    });
    
    return mappedItem as PreviewItem;
  });
}
