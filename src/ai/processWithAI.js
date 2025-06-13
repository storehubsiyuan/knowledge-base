require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini client
const genAI = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});

/**
 * Process extracted code with AI to generate user-friendly documentation
 * @param {Object} codeData - The extracted code data
 * @param {String} prompt - The prompt to send to the AI
 * @returns {Promise<String>} - The generated documentation
 */
async function processWithAI(codeData, prompt) {
  try {
    console.log("Sending data to Gemini for processing...");

    // Prepare the message with code context and prompt
    const codeContext = JSON.stringify(codeData, null, 2);

    // Construct the content with roles and parts
    const finalPromptText = `
You are a technical writer creating documentation for end users about how to use a tax rate module in a SaaS product called BackOffice.
I'm going to provide you with code from the tax rate module. Your task is to analyze this code and create user-friendly documentation
that explains how to use the features, not how they're implemented.

Here's the code:
\`\`\`
${codeContext}
\`\`\`

${prompt}

Format your response as Markdown. Focus only on what users need to know to accomplish their tasks.
Do not explain the code implementation details unless it's directly relevant to the user's understanding of the interface.
Include clear step-by-step instructions where appropriate.
`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: finalPromptText,
          },
        ],
      },
    ];

    // Get the Gemini model
    const model = "gemini-2.5-flash-preview-05-20";

    // Call the Gemini API with streaming
    const response = await genAI.models.generateContentStream({
      model,
      contents,
    });

    // Process streaming response
    let fullResponse = '';
    for await (const chunk of response) {
      fullResponse += chunk.text;
    }

    // Return the AI-generated documentation
    return fullResponse;
  } catch (error) {
    console.error("Error processing with Gemini:", error);

    // Handle model-not-found error specifically
    if (error.message && error.message.includes("not found for API version")) {
      console.error("Error: The specified Gemini model was not found.");
      console.error(
        "Please check available models in your Google AI Studio account."
      );
      console.error("Falling back to a more generic response...");
      return `# Error Generating Documentation\n\nThere was an issue accessing the Gemini AI model: ${error.message}\n\nPlease check your API key and the available models in your Google AI Studio account.`;
    }

    return `Error generating documentation: ${error.message}`;
  }
}

module.exports = { processWithAI };
