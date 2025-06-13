const fs = require("fs-extra");
const path = require("path");

/**
 * Extract tax-related code from the settings templates and controllers
 * @param {string} basePath - Path to the BackOffice codebase
 * @returns {Promise<Object>} - Extracted code sections
 */
async function extractSettingsAccount(basePath) {
  try {
    console.log("Extracting settings account and tax code settings...");

    // Define paths to relevant files based on actual backoffice-v1-web structure
    const settingsPaths = {
      // Settings account template (contains default tax settings)
      accountTemplate: path.join(basePath, "views", "settings-account.hbs"),
      // Tax-specific template
      taxTemplate: path.join(basePath, "views", "settings-tax.hbs"),
      // Business controller handles settings operations
      controller: path.join(basePath, "controllers", "businessController.js"),
      // Tax controller for tax-specific operations
      taxController: path.join(basePath, "controllers", "taxController.js"),
      // Client-side scripts for tax and account settings
      taxScript: path.join(basePath, "public", "scripts", "settings-tax.js"),
      accountScript: path.join(
        basePath,
        "public",
        "scripts",
        "settings-account.js"
      ),
      // Main routes file
      routes: path.join(basePath, "routes.js"),
    };

    // Extract data from each file
    const accountTemplate = await extractFileData(
      settingsPaths.accountTemplate,
      "account template"
    );
    const taxTemplate = await extractFileData(
      settingsPaths.taxTemplate,
      "tax template"
    );
    const controller = await extractFileData(
      settingsPaths.controller,
      "business controller"
    );
    const taxController = await extractFileData(
      settingsPaths.taxController,
      "tax controller"
    );
    const taxScript = await extractFileData(
      settingsPaths.taxScript,
      "tax script"
    );
    const accountScript = await extractFileData(
      settingsPaths.accountScript,
      "account script"
    );
    const routes = await extractFileData(settingsPaths.routes, "routes");

    // For routes.js, extract only settings/tax-related routes if it exists
    let settingsRoutes = null;
    if (routes) {
      settingsRoutes = {
        filePath: routes.filePath,
        content: extractSettingsRoutesFromContent(routes.content),
      };
    }

    return {
      accountTemplate,
      taxTemplate,
      controller,
      taxController,
      taxScript,
      accountScript,
      routes: settingsRoutes,
    };
  } catch (error) {
    console.error("Error extracting settings account and tax code:", error);
    return {};
  }
}

/**
 * Extract data from a file with error handling
 * @param {string} filePath - Path to the file
 * @param {string} type - Type of file (template, controller, etc.)
 * @returns {Promise<Object|null>} - Extracted data or null if file doesn't exist
 */
async function extractFileData(filePath, type) {
  try {
    if (!(await fs.pathExists(filePath))) {
      console.warn(`Warning: ${type} file not found at ${filePath}`);
      return null;
    }

    const content = await fs.readFile(filePath, "utf8");
    const relativePath = filePath.split("backoffice-v1-web")[1] || filePath;

    return {
      filePath: relativePath,
      content,
    };
  } catch (error) {
    console.error(`Error extracting ${type} file at ${filePath}:`, error);
    return null;
  }
}

/**
 * Extract settings/tax-related routes from the routes.js file content
 * @param {string} content - Content of routes.js
 * @returns {string} - Extracted settings routes
 */
function extractSettingsRoutesFromContent(content) {
  if (!content) return "";

  const lines = content.split("\n");
  const settingsRelatedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.includes("/settings/account") ||
      line.includes("/settings/tax") ||
      line.includes("taxController") ||
      line.includes("getAccountSettingsWeb") ||
      line.includes("getTaxSettingsWeb") ||
      line.includes("editAccountSettingsAjaxWeb") ||
      line.includes("editTaxSettingsAjaxWeb")
    ) {
      // Get some context (2 lines before and after)
      const startIdx = Math.max(0, i - 2);
      const endIdx = Math.min(lines.length - 1, i + 2);

      for (let j = startIdx; j <= endIdx; j++) {
        if (!settingsRelatedLines.includes(lines[j])) {
          settingsRelatedLines.push(lines[j]);
        }
      }

      settingsRelatedLines.push(""); // Add an empty line for readability
    }
  }

  return settingsRelatedLines.join("\n");
}

module.exports = { extractSettingsAccount };
