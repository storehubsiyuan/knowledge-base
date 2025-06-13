# Tax Rate Module Knowledge Base Generator

本工具从 BackOffice 代码库中提取与税率模块相关的代码，并使用 Google 的 Gemini AI 生成用户友好的文档。

## 结构

- `src/extractors/` - 从代码库中提取相关税码功能的代码
- `src/prompts/` - AI 生成文档的提示模板
- `src/ai/` - 与 Gemini AI API 交互的代码
- `output/` - 生成的文档和提取的原始数据

## 设置

1. 克隆此仓库
2. 安装依赖:
   ```
   npm install
   ```
3. 创建一个包含 Google Gemini API 密钥的 `.env` 文件:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## 使用方法

### 列出可用的 Gemini 模型

要查看您的 API 密钥可以使用哪些 Gemini 模型:

```
npm run list-models
```

此命令将列出所有可用模型并推荐适合此应用程序的模型。

### 测试 Gemini 集成

要测试您的 Gemini API 密钥是否正常工作:

```
npm run test-gemini
```

这将运行一个简单的测试，生成关于什么是税码的简要解释。

### 比较现有知识库文章与生成的内容

要爬取现有的知识库文章并与生成的文档进行比较:

```
npm run compare-article
```

这将:
1. 爬取指定的文章 (默认为 StoreHub 的税码设置指南)
2. 将其与生成的税码知识库内容进行比较
3. 创建一个突出显示差异和补充信息的 HTML 页面
4. 将结果保存到 `output/tax_code_comparison.html`

### 使用 React 前端查看比较结果

项目包含一个 React 前端，用于查看和比较知识库文章:

1. 构建 React 应用:
   ```
   npm run build
   ```

2. 启动服务器:
   ```
   npm run serve
   ```

3. 在浏览器中打开 http://localhost:3000 查看界面

如果要在开发模式下运行 React 前端:
```
npm run dev
```

这将启动带有热重载的开发服务器。

### 仅提取代码

要从代码库中提取代码而不生成文档:

```
npm run extract
```

这将提取与税率相关的代码并将其保存到 `output/` 目录中。

### 生成知识库

要提取代码并生成完整的知识库:

```
npm start
```

这将:
1. 从代码库中提取代码
2. 使用提示通过 Gemini 处理代码
3. 生成用户友好的文档
4. 为知识库创建索引页面

完整的知识库将在 `output/` 目录中可用。

## 输出

知识库包括关于以下内容的文档:

1. 创建税码
2. 将税码应用到产品和促销
3. 理解税款计算
4. 修改现有税码
5. 设置默认税码

## 故障排除

如果您遇到与找不到 Gemini 模型相关的错误:

1. 运行 `npm run list-models` 查看您的 API 密钥可用的模型
2. 使用可用模型更新 `src/ai/processWithAI.js` 和 `src/test-gemini.js` 中的模型名称
3. 确保您的 API 密钥有权访问 Gemini API 和您尝试使用的模型
4. 确保您使用正确的模型名称，例如 `gemini-2.0-flash-001`

## 自定义

您可以修改 `src/prompts/` 目录中的提示，以更改 AI 生成文档的方式。主要的提取逻辑在 `src/extractors/` 中。

## 参考文档

- [Google Gen AI SDK 文档](https://googleapis.github.io/js-genai/release_docs) 