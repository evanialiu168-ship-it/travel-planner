// ❌ 删掉原本的 import OpenAI from "openai";
//  换成老牌、稳固的 require 语法：
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: "https://api.deepseek.com/v1" // 告诉这辆车去 DeepSeek 的大楼
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { city, days, spots } = req.body;

  const systemPrompt = `你是一个专业的旅行规划师。
你必须为用户生成一份前往 ${city} 的 ${days} 天 ${days-1} 夜的深度旅游行程。
必去景点必须包含在行程中：${Array.isArray(spots) ? spots.join(", ") : spots}。
你必须根据地理位置合理规划每天的路线，避免倒退或绕路。
除了经典景点，还要智能推荐附近的打卡地。每一天都需要推荐当地高评分的美食。

请严格按照以下 JSON 格式输出，不要包含任何 markdown 标签（千万不要用 \`\`\`json 包裹），不要包含任何解释性文字：
{
  "days": [
    {
      "day": 1,
      "spots": ["景点A", "景点B"],
      "transport": "交通路线描述及预估费用",
      "meal": "精选餐饮店名(评分, 推荐菜单, 人均价格)",
      "budget": 50000
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "deepseek-chat", // 换上 DeepSeek 的发动机
      messages: [
        { role: "system", content: "你是一个只输出合法 JSON 数据的旅游机器人。" },
        { role: "user", content: systemPrompt }
      ],
      response_format: { type: "json_object" }
    });

    let text = response.choices[0].message.content.trim();
    
    if (text.startsWith("```")) {
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    const plan = JSON.parse(text);
    res.status(200).json({ plan: plan });

  } catch (err) {
    console.error("DeepSeek 后端捕获严重错误:", err);
    res.status(500).json({ 
      error: "AI生成失败", 
      details: err.message 
    });
  }
}