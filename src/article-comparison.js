require("dotenv").config();
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const { GoogleGenAI } = require("@google/genai");
const { processWithAI } = require("./ai/processWithAI");

// Base paths
const OUTPUT_PATH = path.resolve(__dirname, "../output");

// Define articles to compare
const ARTICLES = {
  taxCode: {
    url: "https://care.storehub.com/en/articles/5726893-backoffice-how-to-set-up-tax-codes",
    outputFile: "tax_code_comparison.html",
    generatedFiles: ["create_tax_code.md", "apply_tax_code.md", "default_tax_code.md"]
  },
  stores: {
    url: "https://care.storehub.com/en/articles/5726867-backoffice-how-to-add-store",
    outputFile: "stores_comparison.html",
    generatedFiles: ["stores_management.md"]
  }
};

/**
 * Fetches and extracts the content from a knowledge base article
 * @param {string} url - The URL of the article to crawl
 * @returns {Promise<string>} - The extracted article content
 */
async function crawlArticle(url) {
  try {
    console.log(`Fetching article from ${url}...`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Extract the main content - adjust selector based on actual HTML structure
    const title = $('h1').first().text().trim();
    let content = '';
    
    // Get the article body content
    $('.article-body, article, .main-content').find('h1, h2, h3, h4, h5, p, li, table').each((i, el) => {
      const element = $(el);
      const tagName = el.tagName.toLowerCase();
      
      if (tagName.startsWith('h')) {
        content += `\n## ${element.text().trim()}\n\n`;
      } else if (tagName === 'p') {
        content += `${element.text().trim()}\n\n`;
      } else if (tagName === 'li') {
        content += `* ${element.text().trim()}\n`;
      }
    });
    
    // Format the extracted content
    const articleContent = `# ${title}\n\n${content}`;
    console.log("Article content extracted successfully");
    
    return articleContent;
  } catch (error) {
    console.error("Error crawling article:", error);
    throw error;
  }
}

/**
 * Compares the original article with generated knowledge base content
 * @param {string} articleContent - The original article content
 * @param {string[]} generatedFileNames - Array of generated markdown file names to compare with
 * @returns {Promise<string>} - HTML content with highlighted differences
 */
async function compareWithGeneratedKnowledge(articleContent, generatedFileNames) {
  try {
    console.log("Reading generated knowledge base files...");
    // Read all the specified generated markdown files
    const generatedContents = await Promise.all(
      generatedFileNames.map(async (fileName) => {
        const filePath = path.join(OUTPUT_PATH, fileName);
        if (await fs.pathExists(filePath)) {
          return await fs.readFile(filePath, "utf8");
        }
        console.warn(`Warning: Generated file ${fileName} not found`);
        return "";
      })
    );
    
    // Combine the knowledge base content
    const generatedKnowledge = `
# Generated Knowledge Base Content

${generatedContents.join("\n\n")}
    `;
    
    // Prepare prompt for Gemini
    const prompt = `
I have an original knowledge base article about StoreHub BackOffice and newly generated knowledge base content. 
Please compare these two sources and create a comprehensive HTML page that:

1. Shows the original content
2. Highlights what information has been enhanced or corrected based on the generated knowledge
3. Adds any new information from the generated knowledge that was missing in the original
4. Uses appropriate HTML formatting, including yellow background highlighting (<span style="background-color: #FFFF99;">highlighted text</span>) for changes and additions
5. Uses a clean, modern design with CSS

Style requirements:
- Use a line height of 1.8 for better readability
- Add proper spacing between paragraphs (16px margins)
- Format important notes with special styling (boxed with left border)
- Ensure lists have proper spacing between items
- Use consistent heading styles with proper margins

Original Article:
\`\`\`
${articleContent}
\`\`\`

Generated Knowledge Base Content:
\`\`\`
${generatedKnowledge}
\`\`\`

Respond with complete HTML including CSS that I can save directly as an HTML file.
`;

    console.log("Sending to Gemini for comparison analysis...");
    // Send to Gemini for processing
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    // Get the Gemini model and initialize the client
    const model = "gemini-2.5-flash-preview-05-20";
    const genAI = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});

    // Call the Gemini API with streaming
    const response = await genAI.models.generateContentStream({
      model,
      contents,
    });

    // Process streaming response
    let htmlContent = '';
    for await (const chunk of response) {
      htmlContent += chunk.text;
    }

    console.log("Comparison completed successfully");
    return htmlContent;
  } catch (error) {
    console.error("Error comparing knowledge:", error);
    throw error;
  }
}

/**
 * Main function to run the article comparison process
 * @param {string} articleType - The type of article to compare (key from ARTICLES object)
 */
async function compareArticle(articleType) {
  try {
    if (!ARTICLES[articleType]) {
      throw new Error(`Article type "${articleType}" not defined`);
    }
    
    const article = ARTICLES[articleType];
    console.log(`Processing comparison for article type: ${articleType}`);
    
    // Step 1: Crawl the article
    const articleContent = await crawlArticle(article.url);
    
    // Step 2: Compare with generated knowledge base
    const comparisonHtml = await compareWithGeneratedKnowledge(articleContent, article.generatedFiles);
    
    // Step 3: Save the result
    const outputFilePath = path.join(OUTPUT_PATH, article.outputFile);
    await fs.writeFile(outputFilePath, comparisonHtml);
    
    console.log(`Comparison complete! Result saved to: ${outputFilePath}`);
    return {
      type: articleType,
      title: articleContent.split('\n')[0].replace('# ', ''),
      fileName: article.outputFile,
      sourceUrl: article.url
    };
  } catch (error) {
    console.error(`Error in article comparison process for ${articleType}:`, error);
    return null;
  }
}

/**
 * Main function to run all article comparisons
 */
async function main() {
  try {
    const results = [];
    
    // Process tax code article
    const taxCodeResult = await compareArticle('taxCode');
    if (taxCodeResult) results.push(taxCodeResult);
    
    // Process stores article
    const storesResult = await compareArticle('stores');
    if (storesResult) results.push(storesResult);
    
    // Save comparison results for the frontend
    const comparisonsFilePath = path.join(OUTPUT_PATH, "comparisons.json");
    await fs.writeFile(comparisonsFilePath, JSON.stringify(results, null, 2));
    
    console.log(`All comparisons complete! Results saved to output directory.`);
  } catch (error) {
    console.error("Error in article comparison process:", error);
  }
}

// Run the main function if called directly
if (require.main === module) {
  main();
}

module.exports = { crawlArticle, compareWithGeneratedKnowledge, compareArticle, main }; 