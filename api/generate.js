const OpenAI = require("openai");

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: apiKey || "dummy-key-to-prevent-crash",
  baseURL: "https://api.deepseek.com/v1"
});

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!apiKey) {
    return res.status(500).json({
      error: "AI配置错误",
      details: "服务器上没有找到 DEEPSEEK_API_KEY 或 OPENAI_API_KEY，请在 Vercel 设置环境变量并重新部署！"
    });
  }

  try {
    const { city, days, spots } = req.body;

    const systemPrompt = `你是专业旅行规划师...
      // 这里写你之前的完整 prompt
    `;

    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "你是一个只输出合法 JSON 的旅行机器人。" },
        { role: "user", content: systemPrompt }
      ],
      response_format: { type: "json_object" }
    });

    let text = response.choices[0].message.content.trim();
    if (text.startsWith("```")) text = text.replace(/```json/g,"").replace(/```/g,"").trim();

    const plan = JSON.parse(text);
    res.status(200).json({ plan });

  } catch (err) {
    console.error("DeepSeek 后端捕获错误:", err);
    res.status(500).json({ error: "AI生成失败", details: err.message });
  }
};
