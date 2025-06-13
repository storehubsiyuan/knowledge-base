const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");

/**
 * Extract tax code management related code and templates
 * @param {String} basePath - Path to the backoffice-v1-web directory
 * @returns {Promise<Object>} - The extracted tax code management data
 */
async function extractTaxCodeManagement(basePath) {
  try {
    // Define paths to relevant files
    const settingsTaxJsPath = path.join(
      basePath,
      "public/scripts/settings-tax.js"
    );
    const settingsTaxHbsPath = path.join(basePath, "views/settings-tax.hbs");

    // Read files
    const settingsTaxJs = await fs.readFile(settingsTaxJsPath, "utf8");
    const settingsTaxHbs = await fs.readFile(settingsTaxHbsPath, "utf8");

    // Extract relevant sections from JavaScript
    const jsData = extractFunctionsFromJS(settingsTaxJs);

    // Extract relevant sections from Handlebars template
    const templateData = extractSectionsFromTemplate(settingsTaxHbs);

    return {
      javascript: jsData,
      template: templateData,
      paths: {
        js: settingsTaxJsPath,
        template: settingsTaxHbsPath,
      },
    };
  } catch (error) {
    console.error("Error extracting tax code management:", error);
    return { error: error.message };
  }
}

/**
 * Extract relevant functions from the JavaScript file
 * @param {String} jsContent - Content of the JavaScript file
 * @returns {Object} - Object containing extracted functions
 */
function extractFunctionsFromJS(jsContent) {
  // Extract relevant functions
  const handleAddTaxCode = extractFunction(jsContent, "handleAddTaxCode");
  const handleEditTaxCode = extractFunction(jsContent, "handleEditTaxCode");
  const handleDeleteTaxCode = extractFunction(jsContent, "handleDeleteTaxCode");
  const handleSave = extractFunction(jsContent, "handleSave");
  const handleFormValidation = extractFunction(
    jsContent,
    "handleFormValidation"
  );
  const handleTaxExemptionCheckBoxes = extractFunction(
    jsContent,
    "handleTaxExemptionCheckBoxes"
  );

  return {
    handleAddTaxCode,
    handleEditTaxCode,
    handleDeleteTaxCode,
    handleSave,
    handleFormValidation,
    handleTaxExemptionCheckBoxes,
  };
}

/**
 * Extract a specific function from JavaScript content
 * @param {String} content - JavaScript content
 * @param {String} functionName - Name of the function to extract
 * @returns {String} - The extracted function
 */
function extractFunction(content, functionName) {
  const regex = new RegExp(`var ${functionName} = function[\\s\\S]*?}`, "g");
  const match = content.match(regex);
  return match ? match[0] : `Function ${functionName} not found`;
}

/**
 * Extract relevant sections from Handlebars template
 * @param {String} templateContent - Content of the Handlebars template
 * @returns {Object} - Object containing extracted sections
 */
function extractSectionsFromTemplate(templateContent) {
  const $ = cheerio.load(templateContent);

  // Extract the tax code table
  const tableHtml = $(".table-container").html();

  // Extract the tax code edit form
  const editFormHtml = $("#editTaxCode").html();

  // Extract the delete confirmation dialog
  const deleteDialogHtml = $("#deleteConfirm").html();

  return {
    table: tableHtml,
    editForm: editFormHtml,
    deleteDialog: deleteDialogHtml,
  };
}

module.exports = { extractTaxCodeManagement };
