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
function moveToCity(city){
  if(!cityCoords[city]) return;
  const coord = cityCoords[city];
  map.setView(coord, 11);
  if(currentMarker) map.removeLayer(currentMarker);
  currentMarker = L.marker(coord).addTo(map).bindPopup(city);
}

function markAttractions(city, spots){
  markersGroup.clearLayers();
  const cityData = attractionsCoords[city] || {};
  spots.forEach((spot, index)=>{
    const coord = cityData[spot];
    if(!coord) return;
    const marker = L.marker(coord).addTo(markersGroup);
    marker.bindPopup(`<b>${spot}</b><br>Day ${index+1}`);
    marker.on("click",()=>{
      const card = document.getElementById(`day-${index+1}`);
      if(card){
        card.scrollIntoView({behavior:"smooth"});
        card.classList.add("ring-4","ring-blue-400");
        setTimeout(()=>card.classList.remove("ring-4","ring-blue-400"),1500);
      }
    });
  });
}

// =====================
// 城市景点坐标
// =====================
const attractionsCoords = {
  "东京": {"浅浅草寺":[35.7148,139.7967],"东京塔":[35.6586,139.7454],"秋叶原":[35.7023,139.7745],"涩谷Sky":[35.6595,139.7004],"上野公园":[35.7156,139.7731],"东京迪士尼":[35.6329,139.8804]},
  "大阪": {"环球影城":[34.6694,135.4325],"道顿堀":[34.6687,135.5019],"大阪城":[34.6873,135.5259],"心斋桥":[34.6748,135.5012],"梅田蓝天大厦":[34.7055,135.4895]},
  "首尔": {"景福宫":[37.5796,126.9770],"明洞":[37.5638,126.9850],"南山塔":[37.5512,126.9882],"弘大":[37.5563,126.9220],"汉江公园":[37.5300,126.9200]}
};

// =====================
// AI 生成行程
// =====================
async function generatePlan(){
  const city = document.getElementById("city").value.trim();
  const days = Number(document.getElementById("days").value);
  const spots = document.getElementById("spots").value.split("\n").filter(s=>s.trim()!=="");

  if(!city){ alert("请输入城市"); return; }
  if(!days){ alert("请输入天数"); return; }

  document.getElementById("result").innerHTML = "<p class='text-blue-600 font-bold animate-pulse'>AI正在努力规划行程中，请稍候...</p>";

  try{
    // 🔥 关键修正：这里的路径必须与后端的文件名 /api/generate 严格对齐
    const res = await fetch("/api/generate", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({city, days, spots})
    });

    if (!res.ok) {
      const errorText = await res.json().catch(() => ({}));
      throw new Error(errorText.details || `服务器返回错误: ${res.status}`);
    }

    const data = await res.json();
    let plan = data.plan; 

    // 防御性清洗：防止返回数据被当成字符串
    if (typeof plan === 'string') {
      plan = JSON.parse(plan.replace(/```json/g, '').replace(/```/g, '').trim());
    }

    // =====================
    // 渲染行程 HTML
    // =====================
    let html = `<div class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-5 rounded-2xl mb-5">
                  <h2 class="text-2xl font-bold">📍 ${city}</h2>
                  <p class="mt-2">${days}天旅行</p>
                  <p class="mt-2 text-xl font-bold">💰预计预算: ¥${plan.days.reduce((a,b)=>a+(Number(b.budget)||0),0).toLocaleString()}</p>
                </div>`;

    plan.days.forEach(d=>{
      html += `<div id="day-${d.day}" class="bg-white p-5 rounded-2xl shadow-lg border mb-4 transition">
                <div class="flex justify-between">
                  <h3 class="font-bold text-lg">Day ${d.day}</h3>
                </div>
                <div class="mt-4 space-y-2">
                  <p>🕘 ${(d.spots || []).join(" → ")}</p>
                  <p>🚇 ${d.transport || '暂无交通信息'}</p>
                  <p>🍴 ${d.meal || '暂无美食推荐'}</p>
                  <p>💴 预算: ${d.budget || 0}</p>
                </div>
               </div>`;
    });

    document.getElementById("result").innerHTML = html;

    moveToCity(city);
    markAttractions(city, plan.days.flatMap(d=>d.spots || []));

  }catch(err){
    console.error(err);
    document.getElementById("result").innerHTML = `<p class='text-red-500 font-bold'>生成行程失败：${err.message}</p>`;
  }
}