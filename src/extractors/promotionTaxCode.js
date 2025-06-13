const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");

/**
 * Extract promotion tax code implementation
 * @param {String} basePath - Path to the backoffice-v1-web directory
 * @returns {Promise<Object>} - The extracted promotion tax code data
 */
async function extractPromotionTaxCode(basePath) {
  try {
    // Define paths to relevant files
    const promotionsEditJsPath = path.join(
      basePath,
      "public/scripts/promotions-edit.js"
    );
    const promotionsEditHbsPath = path.join(
      basePath,
      "views/promotions-edit.hbs"
    );

    // Read files
    const promotionsEditJs = await fs.readFile(promotionsEditJsPath, "utf8");
    const promotionsEditHbs = await fs.readFile(promotionsEditHbsPath, "utf8");

    // Extract relevant sections from JavaScript
    const handlePrice = extractHandlePrice(promotionsEditJs);

    // Extract relevant sections from Handlebars template
    const taxCodeSelectors = extractTaxCodeSelectors(promotionsEditHbs);

    return {
      javascript: {
        handlePrice,
      },
      template: {
        taxCodeSelectors,
      },
      paths: {
        js: promotionsEditJsPath,
        template: promotionsEditHbsPath,
      },
    };
  } catch (error) {
    console.error("Error extracting promotion tax code:", error);
    return { error: error.message };
  }
}

/**
 * Extract the handlePrice function from promotions-edit.js
 * @param {String} jsContent - Content of the JavaScript file
 * @returns {String} - The extracted handlePrice function
 */
function extractHandlePrice(jsContent) {
  // The handlePrice function contains the tax code selection and pricing calculation logic
  const regex = /var handlePrice = function\([^)]*\) {[\s\S]*?}\s*\}/g;
  const match = jsContent.match(regex);
  return match ? match[0] : "handlePrice function not found";
}

/**
 * Extract tax code selectors from the promotions-edit.hbs template
 * @param {String} templateContent - Content of the Handlebars template
 * @returns {Array} - Array of tax code selector contexts
 */
function extractTaxCodeSelectors(templateContent) {
  const $ = cheerio.load(templateContent);

  // Find and extract the tax code select elements and their surrounding context
  const taxCodeSelects = [];

  $("select.taxCode").each((i, element) => {
    // Get the surrounding row to capture context
    const row = $(element).closest(".row.two-column-group");
    taxCodeSelects.push({
      id: $(element).attr("id"),
      context: row.html(),
    });
  });

  return taxCodeSelects;
}

module.exports = { extractPromotionTaxCode };
