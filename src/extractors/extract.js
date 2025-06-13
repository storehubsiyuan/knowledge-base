const fs = require("fs-extra");
const path = require("path");
const { extractTaxCodeManagement } = require("./taxCodeManagement");
const { extractProductTaxCode } = require("./productTaxCode");
const { extractPromotionTaxCode } = require("./promotionTaxCode");
const { extractTaxSchema } = require("./taxSchema");

// Base paths
const BACKOFFICE_PATH = path.resolve(__dirname, "../../../backoffice-v1-web");
const OUTPUT_PATH = path.resolve(__dirname, "../../output");

/**
 * Run all extractors and save results to output directory
 */
async function extractAll() {
  console.log("Starting extraction process...");

  // Create output directory if it doesn't exist
  await fs.ensureDir(OUTPUT_PATH);

  try {
    // Run all extractors
    console.log("Extracting tax code management code...");
    const taxCodeManagement = await extractTaxCodeManagement(BACKOFFICE_PATH);

    console.log("Extracting product tax code implementation...");
    const productTaxCode = await extractProductTaxCode(BACKOFFICE_PATH);

    console.log("Extracting promotion tax code implementation...");
    const promotionTaxCode = await extractPromotionTaxCode(BACKOFFICE_PATH);

    console.log("Extracting tax schema and data model...");
    const taxSchema = await extractTaxSchema(BACKOFFICE_PATH);

    // Save raw extracted code
    console.log("Saving extracted data...");
    await fs.writeJson(
      path.join(OUTPUT_PATH, "raw_tax_code_management.json"),
      taxCodeManagement,
      { spaces: 2 }
    );
    await fs.writeJson(
      path.join(OUTPUT_PATH, "raw_product_tax_code.json"),
      productTaxCode,
      { spaces: 2 }
    );
    await fs.writeJson(
      path.join(OUTPUT_PATH, "raw_promotion_tax_code.json"),
      promotionTaxCode,
      { spaces: 2 }
    );
    await fs.writeJson(
      path.join(OUTPUT_PATH, "raw_tax_schema.json"),
      taxSchema,
      { spaces: 2 }
    );

    console.log("Extraction complete! Raw data saved to:", OUTPUT_PATH);
  } catch (error) {
    console.error("Error during extraction:", error);
  }
}

// Run extraction if this file is executed directly
if (require.main === module) {
  extractAll();
}

module.exports = { extractAll };
