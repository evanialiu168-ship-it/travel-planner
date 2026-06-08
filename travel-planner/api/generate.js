export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { city, days, spots } = req.body;

    const prompt = `
你是一个专业旅行规划助手。

请根据以下信息生成旅行计划：
城市：${city}
天数：${days}
用户想去的地点：${spots.join(", ")}

请严格只输出 JSON，不要任何解释，格式如下：

{
  "days": [
    {
      "day": 1,
      "spots": ["景点1", "景点2"],
      "transport": "地铁/步行",
      "meal": "午餐预算2000日元",
      "budget": 5000
    }
  ]
}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    const text = data.choices?.[0]?.message?.content;

    // 防止 AI 输出乱格式
    const plan = JSON.parse(text);

    return res.status(200).json({ plan });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "AI生成失败",
      detail: err.message
    });
  }
}