// =====================
// 地图初始化
// =====================

const map = L.map('map').setView(
    [35.6895, 139.6917],
    5
);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '© OpenStreetMap'
    }
).addTo(map);

// =====================
// 城市坐标
// =====================

const cityCoords = {

    "东京": [35.6895, 139.6917],

    "大阪": [34.6937, 135.5023],

    "首尔": [37.5665, 126.9780]

};

// =====================
// 景点坐标
// =====================

const attractionsCoords = {

    "东京": {

        "浅草寺": [35.7148,139.7967],
        "东京塔": [35.6586,139.7454],
        "秋叶原": [35.7023,139.7745],
        "涩谷Sky": [35.6595,139.7004],
        "上野公园": [35.7156,139.7731],
        "东京迪士尼": [35.6329,139.8804]

    },

    "大阪": {

        "环球影城": [34.6694,135.4325],
        "道顿堀": [34.6687,135.5019],
        "大阪城": [34.6873,135.5259],
        "心斋桥": [34.6748,135.5012],
        "梅田蓝天大厦": [34.7055,135.4895]

    },

    "首尔": {

        "景福宫": [37.5796,126.9770],
        "明洞": [37.5638,126.9850],
        "南山塔": [37.5512,126.9882],
        "弘大": [37.5563,126.9220],
        "汉江公园": [37.5300,126.9200]

    }

};

let currentMarker = null;

let markersGroup = L.layerGroup().addTo(map);

// =====================
// 城市定位
// =====================

function moveToCity(city){

    if(!cityCoords[city]) return;

    const coord = cityCoords[city];

    map.setView(coord,11);

    if(currentMarker){

        map.removeLayer(currentMarker);

    }

    currentMarker = L.marker(coord)
        .addTo(map)
        .bindPopup(city);

}

// =====================
// 景点标记
// =====================

function markAttractions(city, attractions){

    markersGroup.clearLayers();

    const cityData =
        attractionsCoords[city];

    if(!cityData) return;

    attractions.forEach((spot,index)=>{

        const coord =
            cityData[spot];

        if(!coord) return;

        const marker =
            L.marker(coord)
            .addTo(markersGroup);

        marker.bindPopup(
            `<b>${spot}</b><br>Day ${index+1}`
        );

        marker.on("click",()=>{

            const card =
                document.getElementById(
                    `day-${index+1}`
                );

            if(card){

                card.scrollIntoView({

                    behavior:"smooth"

                });

                card.classList.add(
                    "ring-4",
                    "ring-blue-400"
                );

                setTimeout(()=>{

                    card.classList.remove(
                        "ring-4",
                        "ring-blue-400"
                    );

                },1500);

            }

        });

    });

}

// =====================
// 主功能
// =====================

function generatePlan(){

    const city =
        document
        .getElementById("city")
        .value
        .trim();

    const days =
        Number(
            document
            .getElementById("days")
            .value
        );

    const spots =
        document
        .getElementById("spots")
        .value;

    if(!city){

        alert("请输入城市");

        return;

    }

    if(!days){

        alert("请输入天数");

        return;

    }

    let userSpots = [];

    if(spots.trim() !== ""){

        userSpots =
            spots
            .split("\n")
            .filter(item =>
                item.trim() !== ""
            );

    }

    let attractions = [];

    if(city.includes("东京")){

        attractions = [

            "浅草寺",
            "东京塔",
            "秋叶原",
            "涩谷Sky",
            "上野公园"

        ];

    }

    else if(city.includes("大阪")){

        attractions = [

            "环球影城",
            "道顿堀",
            "大阪城",
            "心斋桥",
            "梅田蓝天大厦"

        ];

    }

    else if(city.includes("首尔")){

        attractions = [

            "景福宫",
            "明洞",
            "南山塔",
            "弘大",
            "汉江公园"

        ];

    }

    attractions = [

        ...userSpots,
        ...attractions

    ];

    let budget =
        days * 25000;

    let html = `

    <div
    class="
    bg-gradient-to-r
    from-blue-500
    to-indigo-600
    text-white
    p-5
    rounded-2xl
    mb-5
    ">

        <h2
        class="
        text-2xl
        font-bold
        ">

            📍 ${city}

        </h2>

        <p class="mt-2">

            ${days}天旅行

        </p>

        <p
        class="
        mt-2
        text-xl
        font-bold
        ">

            💰预算：
            ¥${budget.toLocaleString()}

        </p>

    </div>

    `;

    for(let i=1;i<=days;i++){

        const spot =
            attractions[
                (i-1)
                %
                attractions.length
            ];

        html += `

        <div

        id="day-${i}"

        class="
        bg-white
        p-5
        rounded-2xl
        shadow-lg
        border
        mb-4
        transition
        ">

            <div
            class="
            flex
            justify-between
            ">

                <h3
                class="
                font-bold
                text-lg
                ">

                    Day ${i}

                </h3>

            </div>

            <div
            class="
            mt-4
            space-y-2
            ">

                <p>

                    🕘 09:00
                    ${spot}

                </p>

                <p>

                    🚇 地铁交通

                </p>

                <p>

                    💴 交通费
                    500日元

                </p>

                <p>

                    🍜 午餐预算
                    2000日元

                </p>

            </div>

        </div>

        `;

    }

    document
        .getElementById("result")
        .innerHTML =
        html;

    moveToCity(city);

    markAttractions(
        city,
        attractions
    );

}