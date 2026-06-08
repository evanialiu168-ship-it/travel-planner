import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req,res){
  if(req.method!=="POST"){
    return res.status(405).json({error:"Method not allowed"});
  }

  const {city, days, spots} = req.body;

  const prompt = `
你是旅行规划师。
帮我生成 ${city} ${days} 天的行程。
必去景点有：${spots.join(", ")}。
输出 JSON，每天格式：
{
  "day": 1,
  "spots": ["景点1","景点2"],
  "transport": "...",
  "meal": "...",
  "budget": ...
}
JSON 必须可解析。
`;

  try{
    const response = await openai.chat.completions.create({
      model:"gpt-4",
      messages:[{role:"user", content: prompt}],
    });

    const text = response.choices[0].message.content;

    const plan = JSON.parse(text);

    res.status(200).json({plan});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"AI生成失败"});
  }
}