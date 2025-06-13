const fs = require("fs-extra");
const path = require("path");

/**
 * Extract tax schema and data model information
 * @param {String} basePath - Path to the backoffice-v1-web directory
 * @returns {Promise<Object>} - The extracted tax schema data
 */
async function extractTaxSchema(basePath) {
  try {
    // Define paths to relevant files
    const businessDtsPath = path.join(basePath, "models/business.d.ts");
    const businessJsPath = path.join(basePath, "models/business.js");
    const itemDtsPath = path.join(basePath, "models/item.d.ts");

    // Read files
    const businessDts = await fs.readFile(businessDtsPath, "utf8");
    const businessJs = await fs.readFile(businessJsPath, "utf8");
    const itemDts = await fs.readFile(itemDtsPath, "utf8");

    // Extract tax code schema from business.d.ts
    const taxCodeSchema = extractTaxCodeSchema(businessDts);

    // Extract tax code implementation from business.js
    const taxCodeImplementation = extractTaxCodeImplementation(businessJs);

    // Extract item tax code references from item.d.ts
    const itemTaxCodeReferences = extractItemTaxCodeReferences(itemDts);

    return {
      taxCodeSchema,
      taxCodeImplementation,
      itemTaxCodeReferences,
      paths: {
        businessDts: businessDtsPath,
        businessJs: businessJsPath,
        itemDts: itemDtsPath,
      },
    };
  } catch (error) {
    console.error("Error extracting tax schema:", error);
    return { error: error.message };
  }
}

/**
 * Extract tax code schema from business.d.ts
 * @param {String} dtsContent - Content of business.d.ts
 * @returns {String} - The extracted tax code schema
 */
function extractTaxCodeSchema(dtsContent) {
  // Extract the TaxCodeSchema interface definition
  const regex = /export interface TaxCodeSchema {[\s\S]*?}/g;
  const match = dtsContent.match(regex);
  return match ? match[0] : "TaxCodeSchema not found";
}

/**
 * Extract tax code implementation from business.js
 * @param {String} jsContent - Content of business.js
 * @returns {Object} - Object containing extracted tax code implementation
 */
function extractTaxCodeImplementation(jsContent) {
  // Extract the tax code schema from the Mongoose model
  const schemaRegex = /taxCodes: \[{[\s\S]*?}\]/g;
  const schemaMatch = jsContent.match(schemaRegex);

  // Extract methods that work with tax codes
  const methodRegex = /methods: {[\s\S]*?}/g;
  const methodMatch = jsContent.match(methodRegex);

  return {
    schema: schemaMatch ? schemaMatch[0] : "Tax code schema not found",
    methods: methodMatch ? methodMatch[0] : "Tax code methods not found",
  };
}

/**
 * Extract item tax code references from item.d.ts
 * @param {String} dtsContent - Content of item.d.ts
 * @returns {Array} - Array of tax code references
 */
function extractItemTaxCodeReferences(dtsContent) {
  // Find all references to taxCode or taxRate in the item.d.ts file
  const references = [];
  const lines = dtsContent.split("\n");

  lines.forEach((line, index) => {
    if (line.includes("taxCode") || line.includes("taxRate")) {
      // Get some context by including a few lines before and after
      const start = Math.max(0, index - 3);
      const end = Math.min(lines.length - 1, index + 3);
      const context = lines.slice(start, end + 1).join("\n");

      references.push({
        line: index + 1,
        content: line.trim(),
        context,
      });
    }
  });

  return references;
}

module.exports = { extractTaxSchema };
