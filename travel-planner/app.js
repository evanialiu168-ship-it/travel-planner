// =====================
// 地图初始化
// =====================
const map = L.map('map').setView([35.6895, 139.6917], 5);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { attribution: '© OpenStreetMap' }
).addTo(map);

// =====================
// 城市坐标
// =====================
const cityCoords = {
  "东京": [35.6895, 139.6917],
  "大阪": [34.6937, 135.5023],
  "首尔": [37.5665, 126.9780]
};

let currentMarker = null;
let markersGroup = L.layerGroup().addTo(map);

// =====================
// 地图跳转 & 标记
// =====================
function moveToCity(city) {
  if (!cityCoords[city]) return;
  const coord = cityCoords[city];
  map.setView(coord, 11);
  if (currentMarker) map.removeLayer(currentMarker);
  currentMarker = L.marker(coord).addTo(map).bindPopup(city);
}

function markAttractions(city, spots) {
  markersGroup.clearLayers();
  const cityData = attractionsCoords[city] || {};
  
  spots.forEach((spot, index) => {
    const coord = cityData[spot];
    if (!coord) return; // 如果找不到坐标则跳过
    
    const marker = L.marker(coord).addTo(markersGroup);
    marker.bindPopup(`<b>${spot}</b><br>Day ${index + 1}`);
    
    marker.on("click", () => {
      const card = document.getElementById(`day-${index + 1}`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth" });
        card.classList.add("ring-4", "ring-blue-400");
        setTimeout(() => card.classList.remove("ring-4", "ring-blue-400"), 1500);
      }
    });
  });
}

// =====================
// 城市景点坐标（内置基础坐标库）
// =====================
const attractionsCoords = {
  "东京": { "浅草寺": [35.7148, 139.7967], "东京塔": [35.6586, 139.7454], "秋叶原": [35.7023, 139.7745], "涩谷Sky": [35.6595, 139.7004], "上野公园": [35.7156, 139.7731], "东京迪士尼": [35.6329, 139.8804] },
  "大阪": { "环球影城": [34.6694, 135.4325], "道顿堀": [34.6687, 135.5019], "大阪城": [34.6873, 135.5259], "心斋桥": [34.6748, 135.5012], "梅田蓝天大厦": [34.7055, 135.4895] },
  "首尔": { "景福宫": [37.5796, 126.9770], "明洞": [37.5638, 126.9850], "南山塔": [37.5512, 126.9882], "弘大": [37.5563, 126.9220], "汉江公园": [37.5300, 126.9200], "梨花女子大学": [37.5618, 126.9468], "延南洞": [37.5660, 126.9244] }
};

// =====================
// AI 生成行程主函数
// =====================
async function generatePlan() {
  const city = document.getElementById("city").value.trim();
  const days = Number(document.getElementById("days").value);
  const spotsInput = document.getElementById("spots").value;
  
  // 安全处理输入的景点，防止由于逗号/换行切出空数组
  const spots = spotsInput ? spotsInput.split("\n").filter(s => s.trim() !== "") : [];

  if (!city) { alert("请输入城市"); return; }
  if (!days) { alert("请输入天数"); return; }

  // 提示用户正在生成，优化体验
  document.getElementById("result").innerHTML = `
    <div class="flex items-center justify-center p-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      <span class="ml-3 text-gray-600 font-medium">AI 导游正在疯狂规划中，请稍候...</span>
    </div>
  `;

  try {
    // 调用 Vercel Serverless 后端 API
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, days, spots })
    });

    // 如果状态码不正常（如 500、404），直接抛出错误进 catch
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.details || `服务器响应失败，状态码: ${res.status}`);
    }

    const data = await res.json();
    console.log("后端返回的原始数据:", data);

    // =====================
    // 安全解析与兼容性清洗
    // =====================
    let plan = data.plan;
    
    // 如果后端不小心以“字符串”形式传回了 plan，将其解析为 JSON 对象
    if (typeof plan === 'string') {
      const cleanJson = plan.replace(/```json/g, '').replace(/```/g, '').trim();
      plan = JSON.parse(cleanJson);
    }

    // 核心字段校验，如果为空则报错
    if (!plan || !plan.days || !Array.isArray(plan.days)) {
      throw new Error("AI 返回的数据格式不正确，未能成功解析出每日日程。");
    }

    // =====================
    // 渲染行程 HTML 看板
    // =====================
    // 安全计算总预算：防止大模型返回的 budget 是字符串，导致计算结果变成 NaN
    const totalBudget = plan.days.reduce((total, dayObj) => {
      const dayBudget = Number(dayObj.budget) || 0;
      return total + dayBudget;
    }, 0);

    let html = `
      <div class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-5 rounded-2xl mb-5 shadow-md">
        <h2 class="text-2xl font-bold">📍 目的地：${city}</h2>
        <p class="mt-1 opacity-90">📅 游玩天数：${days} 天</p>
        <p class="mt-2 text-xl font-bold">💰 预估总花费: ¥${totalBudget.toLocaleString()}</p>
      </div>
    `;

    plan.days.forEach(d => {
      // 确保 spots 是数组
      const spotList = Array.isArray(d.spots) ? d.spots.join(" → ") : "自定义漫游";
      
      html += `
        <div id="day-${d.day}" class="bg-white p-5 rounded-2xl shadow-md border border-gray-100 mb-4 hover:shadow-lg transition-all duration-300">
          <div class="flex justify-between items-center border-b pb-2 mb-3">
            <h3 class="font-bold text-lg text-blue-600">Day ${d.day}</h3>
            <span class="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">💴 预算: ¥${d.budget || 0}</span>
          </div>
          <div class="mt-2 space-y-3 text-gray-700">
            <p class="flex items-start"><span class="mr-2">🗺️</span><strong>路线：</strong> <span class="text-gray-900">${spotList}</span></p>
            <p class="flex items-start"><span class="mr-2">🚇</span><strong>交通：</strong> <span class="text-sm text-gray-600">${d.transport || '暂无详细交通路线'}</span></p>
            <p class="flex items-start"><span class="mr-2">🍴</span><strong>美食推荐：</strong> <span class="text-sm text-gray-600 font-medium text-amber-600">${d.meal || '暂无特色美食推荐'}</span></p>
          </div>
        </div>
      `;
    });

    document.getElementById("result").innerHTML = html;

    // =====================
    // 联动更新地图
    // =====================
    moveToCity(city);
    
    // 抽取所有天数的景点，合并成一个数组打点到地图上
    const allSpots = plan.days.flatMap(d => d.spots || []);
    markAttractions(city, allSpots);

  } catch (err) {
    console.error("前端捕获到详细错误:", err);
    // 将错误原因直观地展示给网页用户
    document.getElementById("result").innerHTML = `
      <div class="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700 text-sm">
        <p class="font-bold">❌ 生成行程失败</p>
        <p class="mt-1 text-xs opacity-90">具体原因: ${err.message}</p>
        <p class="mt-3 text-xs text-gray-500">排查建议：请在 Vercel 检查是否有添加环境变量，或至浏览器 F12 Console 页面查看原始返回数据。</p>
      </div>
    `;
  }
}