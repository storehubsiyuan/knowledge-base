const fs = require("fs-extra");
const path = require("path");

/**
 * Extract stores management code from the BackOffice codebase
 * @param {string} basePath - Path to the BackOffice codebase
 * @returns {Promise<Object>} - Extracted code sections
 */
async function extractStoresManagement(basePath) {
  try {
    console.log("Extracting stores management code...");

    // Define paths to relevant files based on actual backoffice-v1-web structure
    const storesPaths = {
      // Main business controller handles store operations
      controller: path.join(basePath, "controllers", "businessController.js"),
      // Store model
      model: path.join(basePath, "models", "store.js"),
      // Main routes file where store routes are defined
      routes: path.join(basePath, "routes.js"),
      // Store-related templates
      templates: [
        path.join(basePath, "views", "settings-stores.hbs"),
        path.join(basePath, "views", "settings-stores-edit.hbs"),
        path.join(basePath, "views", "settings-stores-tableLayout-edit.hbs"),
      ],
      // Store-related client-side scripts
      scripts: [
        path.join(basePath, "public", "scripts", "settings-stores-edit.js"),
      ],
    };

    // Extract data from each file
    const controller = await extractFileData(
      storesPaths.controller,
      "business controller"
    );
    const model = await extractFileData(storesPaths.model, "store model");
    const routes = await extractFileData(storesPaths.routes, "routes");

    // Extract templates
    const templates = [];
    for (const templatePath of storesPaths.templates) {
      const fileName = path.basename(templatePath);
      const result = await extractFileData(templatePath, "template");
      if (result) {
        templates.push({
          fileName,
          ...result,
        });
      }
    }

    // Extract client-side scripts
    const scripts = [];
    for (const scriptPath of storesPaths.scripts) {
      const fileName = path.basename(scriptPath);
      const result = await extractFileData(scriptPath, "script");
      if (result) {
        scripts.push({
          fileName,
          ...result,
        });
      }
    }

    return {
      controller,
      model,
      routes,
      templates,
      scripts,
    };
  } catch (error) {
    console.error("Error extracting stores management code:", error);
    return {};
  }
}

/**
 * Extract data from a file with error handling
 * @param {string} filePath - Path to the file
 * @param {string} type - Type of file (controller, model, etc.)
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

    // For routes.js, extract only store-related routes
    if (type === "routes") {
      const storeRoutes = extractStoreRoutesFromContent(content);
      return {
        filePath: relativePath,
        content: storeRoutes,
      };
    }

    // For business controller, extract only store-related functions
    if (type === "business controller") {
      const storeFunctions = extractStoreFunctionsFromController(content);
      return {
        filePath: relativePath,
        content: storeFunctions,
      };
    }

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
 * Extract store-related routes from the routes.js file content
 * @param {string} content - Content of routes.js
 * @returns {string} - Extracted store routes
 */
function extractStoreRoutesFromContent(content) {
  if (!content) return "";

  const lines = content.split("\n");
  const storeRelatedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.includes("/settings/stores") ||
      line.includes("getStoresWeb") ||
      line.includes("getEditStoreWeb") ||
      line.includes("editStoreAjaxWeb") ||
      line.includes("deleteStoreAjaxWeb") ||
      line.includes("tableLayout")
    ) {
      // Get some context (2 lines before and after)
      const startIdx = Math.max(0, i - 2);
      const endIdx = Math.min(lines.length - 1, i + 2);

      for (let j = startIdx; j <= endIdx; j++) {
        if (!storeRelatedLines.includes(lines[j])) {
          storeRelatedLines.push(lines[j]);
        }
      }

      storeRelatedLines.push(""); // Add an empty line for readability
    }
  }

  return storeRelatedLines.join("\n");
}

/**
 * Extract store-related functions from the business controller
 * @param {string} content - Content of businessController.js
 * @returns {string} - Extracted store functions
 */
function extractStoreFunctionsFromController(content) {
  if (!content) return "";

  const lines = content.split("\n");
  const storeFunctionLines = [];
  let insideStoreFunction = false;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for store-related function definitions
    if (
      line.includes("getStoresWeb") ||
      line.includes("getEditStoreWeb") ||
      line.includes("editStoreAjaxWeb") ||
      line.includes("deleteStoreAjaxWeb") ||
      line.includes("syncStoreInfo") ||
      line.includes("syncAllStoresApi")
    ) {
      insideStoreFunction = true;
      braceCount = 0;

      // Add some context before the function
      const startIdx = Math.max(0, i - 3);
      for (let j = startIdx; j < i; j++) {
        if (!storeFunctionLines.includes(lines[j])) {
          storeFunctionLines.push(lines[j]);
        }
      }
    }

    if (insideStoreFunction) {
      storeFunctionLines.push(line);

      // Count braces to determine when function ends
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceCount += openBraces - closeBraces;

      // Function ends when braces are balanced and we hit a closing brace
      if (braceCount <= 0 && closeBraces > 0) {
        insideStoreFunction = false;
        storeFunctionLines.push(""); // Add separator
      }
    }
  }

  return storeFunctionLines.join("\n");
}

module.exports = { extractStoresManagement };
