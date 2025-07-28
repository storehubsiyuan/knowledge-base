const fs = require("fs-extra");
const path = require("path");
const { extractTaxCodeManagement } = require("./extractors/taxCodeManagement");
const { extractProductTaxCode } = require("./extractors/productTaxCode");
const { extractPromotionTaxCode } = require("./extractors/promotionTaxCode");
const { extractTaxSchema } = require("./extractors/taxSchema");
const { extractSettingsAccount } = require("./extractors/settingsAccount");
const { extractStoresManagement } = require("./extractors/storesManagement");
const { processWithAI } = require("./ai/processWithAI");

// Base paths
const BACKOFFICE_PATH = path.resolve(__dirname, "../../backoffice-v1-web");
const OUTPUT_PATH = path.resolve(__dirname, "../output");

async function generateKnowledgeBase() {
  console.log("Generating Knowledge Base...");

  // Create output directory if it doesn't exist
  await fs.ensureDir(OUTPUT_PATH);

  try {
    // Step 1: Extract code from various modules
    console.log("Extracting tax code management code...");
    const taxCodeManagement = await extractTaxCodeManagement(BACKOFFICE_PATH);

    console.log("Extracting product tax code implementation...");
    const productTaxCode = await extractProductTaxCode(BACKOFFICE_PATH);

    console.log("Extracting promotion tax code implementation...");
    const promotionTaxCode = await extractPromotionTaxCode(BACKOFFICE_PATH);

    console.log("Extracting tax schema and data model...");
    const taxSchema = await extractTaxSchema(BACKOFFICE_PATH);

    console.log("Extracting settings account template...");
    const settingsAccount = await extractSettingsAccount(BACKOFFICE_PATH);

    console.log("Extracting stores management code...");
    const storesManagement = await extractStoresManagement(BACKOFFICE_PATH);

    // Step 2: Save raw extracted code
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
    await fs.writeJson(
      path.join(OUTPUT_PATH, "raw_settings_account.json"),
      settingsAccount,
      { spaces: 2 }
    );
    await fs.writeJson(
      path.join(OUTPUT_PATH, "raw_stores_management.json"),
      storesManagement,
      { spaces: 2 }
    );

    // Step 3: Process with Gemini and generate knowledge base sections
    console.log("Processing extracted code with Gemini...");

    // Load prompts
    const prompts = {
      createTaxCode: await fs.readFile(
        path.join(__dirname, "prompts/createTaxCode.txt"),
        "utf8"
      ),
      applyTaxCode: await fs.readFile(
        path.join(__dirname, "prompts/applyTaxCode.txt"),
        "utf8"
      ),
      taxCalculations: await fs.readFile(
        path.join(__dirname, "prompts/taxCalculations.txt"),
        "utf8"
      ),
      modifyTaxCode: await fs.readFile(
        path.join(__dirname, "prompts/modifyTaxCode.txt"),
        "utf8"
      ),
      defaultTaxCode: await fs.readFile(
        path.join(__dirname, "prompts/defaultTaxCode.txt"),
        "utf8"
      ),
      storesManagement: await fs.readFile(
        path.join(__dirname, "prompts/storesManagement.txt"),
        "utf8"
      ),
    };

    // Process each topic with AI
    const createTaxCodeDocs = await processWithAI(
      taxCodeManagement,
      prompts.createTaxCode
    );
    const applyTaxCodeDocs = await processWithAI(
      { product: productTaxCode, promotion: promotionTaxCode },
      prompts.applyTaxCode
    );
    const taxCalculationsDocs = await processWithAI(
      { product: productTaxCode, promotion: promotionTaxCode },
      prompts.taxCalculations
    );
    const modifyTaxCodeDocs = await processWithAI(
      taxCodeManagement,
      prompts.modifyTaxCode
    );
    const defaultTaxCodeDocs = await processWithAI(
      { management: settingsAccount, product: productTaxCode },
      prompts.defaultTaxCode
    );
    const storesManagementDocs = await processWithAI(
      storesManagement,
      prompts.storesManagement
    );

    // Step 4: Save processed knowledge base sections
    console.log("Saving knowledge base documentation...");
    await fs.writeFile(
      path.join(OUTPUT_PATH, "create_tax_code.md"),
      createTaxCodeDocs
    );
    await fs.writeFile(
      path.join(OUTPUT_PATH, "apply_tax_code.md"),
      applyTaxCodeDocs
    );
    await fs.writeFile(
      path.join(OUTPUT_PATH, "tax_calculations.md"),
      taxCalculationsDocs
    );
    await fs.writeFile(
      path.join(OUTPUT_PATH, "modify_tax_code.md"),
      modifyTaxCodeDocs
    );
    await fs.writeFile(
      path.join(OUTPUT_PATH, "default_tax_code.md"),
      defaultTaxCodeDocs
    );
    await fs.writeFile(
      path.join(OUTPUT_PATH, "stores_management.md"),
      storesManagementDocs
    );

    // Step 5: Generate index file
    console.log("Generating knowledge base index...");
    const indexContent = `# StoreHub BackOffice Knowledge Base

## Tax Code Module

1. [Creating a Tax Code](create_tax_code.md)
2. [Applying Tax Codes to Products and Promotions](apply_tax_code.md)
3. [Understanding Tax Calculations](tax_calculations.md)
4. [Modifying Existing Tax Codes](modify_tax_code.md)
5. [Setting Default Tax Codes](default_tax_code.md)

## Stores Module

1. [Managing Stores](stores_management.md)

This knowledge base provides comprehensive documentation on how to use various modules in StoreHub BackOffice.
    `;

    await fs.writeFile(path.join(OUTPUT_PATH, "index.md"), indexContent);

    console.log("Knowledge base generated successfully!");
    console.log(`Output is available in: ${OUTPUT_PATH}`);

    const userInput = "<script>alert('this is a test!')</script>";
    console.log("Unsafe HTML output: " + userInput);
  } catch (error) {
    console.error("Error generating knowledge base:", error);
  }
}

// Run the main function
generateKnowledgeBase();
