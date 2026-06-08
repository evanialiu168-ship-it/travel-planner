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
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { city, days, spots } = body;

    if (!city || !days) {
      return res.status(400).json({
        error: "请求参数错误",
        details: "缺少 city 或 days，无法生成行程。"
      });
    }

    const normalizedSpots = Array.isArray(spots)
      ? spots.filter((spot) => typeof spot === "string" && spot.trim())
      : [];

    const systemPrompt = [
      "你是专业旅行规划师，只输出合法 JSON，不要输出 markdown。",
      `请为 ${city} 规划 ${days} 天旅行。`,
      normalizedSpots.length
        ? `用户优先想去这些地点：${normalizedSpots.join("、")}。`
        : "用户没有指定必去地点，请自行安排经典路线。",
      "返回格式必须是：",
      '{"days":[{"day":1,"spots":["景点A","景点B"],"transport":"交通建议","meal":"餐饮建议","budget":500}]}'
    ].join("\n");

    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "你是一个只输出合法 JSON 的旅行机器人。" },
        { role: "user", content: systemPrompt }
      ],
      response_format: { type: "json_object" }
    });

    let text = response.choices[0].message.content.trim();
    if (text.startsWith("```")) {
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    const plan = JSON.parse(text);
    res.status(200).json({ plan });
  } catch (err) {
    console.error("DeepSeek 后端捕获错误:", {
      message: err.message,
      status: err.status,
      code: err.code,
      type: err.type,
      request_id: err.request_id,
      headers: err.headers,
      error: err.error
    });

    if (err instanceof SyntaxError) {
      return res.status(500).json({
        error: "AI返回格式错误",
        details: "DeepSeek 返回内容不是合法 JSON。"
      });
    }

    res.status(err.status || 500).json({
      error: "AI生成失败",
      details: err.error?.message || err.message,
      status: err.status || 500
    });
  }
};
