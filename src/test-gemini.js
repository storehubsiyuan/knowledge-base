require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini client
const genAI = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});

async function testGemini() {
  try {
    console.log("测试 Gemini AI 集成...");

    // Get the Gemini model
    const model = "gemini-2.5-flash-preview-05-20";
    
    // Structure the content with roles and parts
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: "用 Markdown 格式简要解释什么是商业应用程序中的税码。",
          },
        ],
      },
    ];

    // Call the Gemini API with streaming
    console.log("\n发送请求到 Gemini API...");
    const response = await genAI.models.generateContentStream({
      model,
      contents,
    });

    // Process and print the streaming response
    console.log("\nGemini 响应:");
    console.log("=================");
    for await (const chunk of response) {
      console.log(chunk.text);
    }
    console.log("=================");
    console.log("\nGemini 集成测试成功完成!");
  } catch (error) {
    console.error("测试 Gemini 集成时出错:", error);
    console.error("请检查您的 API 密钥和网络连接。");

    // Try to provide more helpful error information
    if (error.message && error.message.includes("not found for API version")) {
      console.log("\n建议的修复:");
      console.log("1. 检查您的 API 密钥是否有权限访问您尝试使用的模型");
      console.log('2. 尝试使用不同的模型，例如 "gemini-2.0-flash-001"');
      console.log("3. 确保您的 API 密钥正确设置在 .env 文件中");
    }
  }
}

// Run the test
testGemini();
