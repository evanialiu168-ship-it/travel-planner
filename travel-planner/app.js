// =====================
// 地图初始化
// =====================
const map = L.map('map').setView([35.6895, 139.6917], 5);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { attribution: '© OpenStreetMap' }
).addTo(map);

// =====================
// 城市与景点基础坐标库
// =====================
const cityCoords = { "东京": [35.6895, 139.6917], "大阪": [34.6937, 135.5023], "首尔": [37.5665, 126.9780] };
const attractionsCoords = {
  "东京": { "浅草寺": [35.7148, 139.7967], "东京塔": [35.6586, 139.7454], "秋叶原": [35.7023, 139.7745], "涩谷Sky": [35.6595, 139.7004], "上野公园": [35.7156, 139.7731], "东京迪士尼": [35.6329, 139.8804] },
  "大阪": { "环球影城": [34.6694, 135.4325], "道顿堀": [34.6687, 135.5019], "大阪城": [34.6873, 135.5259], "心斋桥": [34.6748, 135.5012], "梅田蓝天大厦": [34.7055, 135.4895] },
  "首尔": { "景福宫": [37.5796, 126.9770], "明洞": [37.5638, 126.9850], "南山塔": [37.5512, 126.9882], "弘大": [37.5563, 126.9220], "汉江公园": [37.5300, 126.9200], "梨花女子大学": [37.5618, 126.9468], "延南洞": [37.5660, 126.9244] }
};

let currentMarker = null;
let markersGroup = L.layerGroup().addTo(map);

function moveToCity(city) {
  if (!cityCoords[city]) return;
  map.setView(cityCoords[city], 11);
  if (currentMarker) map.removeLayer(currentMarker);
  currentMarker = L.marker(cityCoords[city]).addTo(map).bindPopup(city);
}

function markAttractions(city, spots) {
  markersGroup.clearLayers();
  const cityData = attractionsCoords[city] || {};
  spots.forEach((spot, index) => {
    const coord = cityData[spot];
    if (!coord) return;
    const marker = L.marker(coord).addTo(markersGroup);
    marker.bindPopup(`<b>${spot}</b><br>Day ${index + 1}`);
  });
}

// =====================
// 🔥 核心：前端直接呼叫 DeepSeek (免去后端烦恼)
// =====================
async function generatePlan() {
  const city = document.getElementById("city").value.trim();
  const days = Number(document.getElementById("days").value);
  const spotsInput = document.getElementById("spots").value;
  const spots = spotsInput ? spotsInput.split("\n").filter(s => s.trim() !== "") : [];

  if (!city || !days) { alert("请输入城市和天数"); return; }

  // 1. 展现炫酷的加载动画
  document.getElementById("result").innerHTML = `
    <div class="flex items-center justify-center p-10 bg-white rounded-2xl shadow">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600 font-medium">AI 导游正在跨国为你踩点，请稍候...</span>
    </div>
  `;

  // ⚠️ 注意：前端代码由于安全限制，我们通过硬编码输入。之后教你用安全框。
  // 请在此处直接换上你自己在 DeepSeek 官方申请的以 sk- 开头的完整 Key！
  const TEMPORARY_DEEPSEEK_KEY = "sk-8f5847a2aa0b474f9ca2959be7d24b6d"; 

  const systemPrompt = `你是一个只输出 JSON 的旅行规划师。为 ${city} 规划 ${days} 天游玩，必去：${spots.join(",")}。顺路推荐周边热门地和高分美食。
  严格按此JSON格式回复，不要带任何markdown标签(不要用 \`\`\`json 包裹):
  {"days": [{"day": 1, "spots": ["景点"], "transport": "交通费", "meal": "美食(人均)", "budget": 10000}]}`;

  try {
    // 2. 浏览器直接对 DeepSeek 发起超级直连！
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TEMPORARY_DEEPSEEK_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful assistant that outputs JSON." },
          { role: "user", content: systemPrompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek 服务器拒绝了请求，状态码: ${response.status}。请检查你的Key余额是否充足。`);
    }

    const data = await response.json();
    let text = data.choices[0].message.content.trim();
    
    // 清洗杂质
    if (text.startsWith("```")) {
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    const plan = JSON.parse(text);

    // 3. 开始渲染精美界面
    const totalBudget = plan.days.reduce((a, b) => a + (Number(b.budget) || 0), 0);
    let html = `
      <div class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-5 rounded-2xl mb-5 shadow-lg">
        <h2 class="text-2xl font-bold">📍 ${city}</h2>
        <p class="mt-1 opacity-90">📅 ${days} 天深度游计划</p>
        <p class="mt-2 text-xl font-bold">💰 预计总花销: ¥${totalBudget.toLocaleString()}</p>
      </div>
    `;

    plan.days.forEach(d => {
      html += `
        <div class="bg-white p-5 rounded-2xl shadow-md border border-gray-50 mb-4 hover:scale-[1.01] transition-all">
          <div class="flex justify-between items-center border-b pb-2 mb-2">
            <h3 class="font-bold text-blue-600">Day ${d.day}</h3>
            <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">¥${d.budget}</span>
          </div>
          <div class="space-y-2 text-sm text-gray-600">
            <p><strong>📍 路线：</strong> ${d.spots.join(" → ")}</p>
            <p><strong>🚇 交通：</strong> ${d.transport}</p>
            <p><strong>🍴 美食：</strong> <span class="text-amber-600 font-medium">${d.meal}</span></p>
          </div>
        </div>
      `;
    });

    document.getElementById("result").innerHTML = html;
    moveToCity(city);
    markAttractions(city, plan.days.flatMap(d => d.spots || []));

  } catch (err) {
    console.error(err);
    document.getElementById("result").innerHTML = `
      <div class="bg-red-50 p-4 rounded-xl text-red-700 text-xs border border-red-200">
        <p class="font-bold">❌ 规划中断</p>
        <p class="mt-1">原因: ${err.message}</p>
      </div>
    `;
  }
}