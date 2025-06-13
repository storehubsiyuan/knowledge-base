const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");

/**
 * Extract product tax code implementation
 * @param {String} basePath - Path to the backoffice-v1-web directory
 * @returns {Promise<Object>} - The extracted product tax code data
 */
async function extractProductTaxCode(basePath) {
  try {
    // Define paths to relevant files
    const productsEditJsPath = path.join(
      basePath,
      "public/scripts/products-edit.js"
    );
    const productsEditHbsPath = path.join(basePath, "views/products-edit.hbs");

    // Read files
    const productsEditJs = await fs.readFile(productsEditJsPath, "utf8");
    const productsEditHbs = await fs.readFile(productsEditHbsPath, "utf8");

    // Extract relevant sections from JavaScript
    const handlePrice = extractHandlePrice(productsEditJs);

    // Extract relevant sections from Handlebars template
    const taxCodeSelectors = extractTaxCodeSelectors(productsEditHbs);

    return {
      javascript: {
        handlePrice,
      },
      template: {
        taxCodeSelectors,
      },
      paths: {
        js: productsEditJsPath,
        template: productsEditHbsPath,
      },
    };
  } catch (error) {
    console.error("Error extracting product tax code:", error);
    return { error: error.message };
  }
}

/**
 * Extract the handlePrice function from products-edit.js
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
 * Extract tax code selectors from the products-edit.hbs template
 * @param {String} templateContent - Content of the Handlebars template
 * @returns {Object} - Object containing extracted tax code selectors
 */
function extractTaxCodeSelectors(templateContent) {
  const $ = cheerio.load(templateContent);

  // Find and extract the tax code select elements and their surrounding context
  const taxCodeSelects = [];

  $("select.taxCode").each((i, element) => {
    // Get the surrounding form group to capture context
    const formGroup = $(element).closest(".form-group, .price-form-group");
    taxCodeSelects.push({
      id: $(element).attr("id"),
      context: formGroup.html(),
    });
  });

  return taxCodeSelects;
}

module.exports = { extractProductTaxCode };
