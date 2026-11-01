/* 造島工坊：產生造島包（zip）裡的各份文件 */
(function () {
  const T = () => IF.TYPES;
  const AI_NAMES = { claude: 'Claude Code', codex: 'Codex', gemini: 'Gemini CLI', antigravity: 'Antigravity', cursor: 'Cursor', other: '你的 AI 工具' };
  const DEPLOY_NAMES = { ask: '做完再問使用者', netlify: 'Netlify', github: 'GitHub Pages', cloudflare: 'Cloudflare Pages', vercel: 'Vercel', local: '先不上架（只在本機）' };

  function today() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  const CENTER_ROLE = {
    course: '總複習島：從各課題庫輪流抽題做跨課測驗，並顯示全部課程的學習進度。',
    life: '中央廣場：網站主人的自我介紹、聯絡方式，以及前往各地點的總覽。',
    treasure: '寶物總部：圖鑑總覽、收集進度與每日鑰匙領取處。',
    local: '旅客服務中心：整個地區的總覽、探索護照與小嚮導入口。',
    expo: '活動服務台：活動總覽、時程表、展區地圖與集章進度。',
    science: '互動觀測台：可操作的現象模擬（滑桿、圖層開關、播放／暫停），並依序導覽各座島的觀念步驟。',
    live: '即時總看板：各島最重要的幾個數字與最新一則動態，並標示每個資料來源的更新時間。',
    runner: '挑戰總部：選單元與難度（初級／中級／高級），顯示各單元最佳成績與已通過的難度。',
    empathy: '討論教室：給老師的帶領流程（約 45 分鐘）、討論題、支持策略總整理與「這只是部分經驗的模擬」聲明。',
    literature: '中央圖書館：全部文獻的總目錄（可依作者、年份、標籤搜尋）、主題樹與引用格式匯出。',
    portfolio: '能力總覽塔：依時間排列的成長路線圖、全部能力的累計次數（每項能力可點開看是哪幾棟建築用到），以及「我的反思」整理頁。',
    quest: '最終挑戰島：所有關卡通過後解鎖，及格可領取證書。'
  };
  /* RPG 模式：各島型的 NPC 與挑戰怎麼轉譯 */
  const RPG_ROLE = {
    course: ['課程導師', '隨堂三題，題目只出自該課內容重點'],
    life: ['島民嚮導', '「認識島主」三題，答案都在該地點介紹裡'],
    treasure: ['寶箱守衛', '鑑定三題，過關多得一把鑰匙（每日上限不變）'],
    local: ['在地導覽員', '在地知識三題，只用有來源的內容出題'],
    expo: ['攤位解說員', '看展三題，答案都在展區介紹裡'],
    science: ['實驗助手', '觀察與推論三題，可搭配操作模擬後作答'],
    live: ['資料觀測員', '讀數據三題，題目要註明資料時間，數字更新後題目跟著換'],
    runner: ['挑戰教練', '沿用跑酷關卡：通過初級即算過關，不另外出選擇題'],
    empathy: ['故事主角', '改成三個情境選擇與反思，不評對錯，完成即得章'],
    literature: ['圖書館員', '文獻三題：作者、核心主張、研究方法'],
    portfolio: ['回憶嚮導', '改成「反思三問」，寫完即得章，不評分'],
    quest: ['關卡守門人', '原本的觀念怪獸三題；RPG 模式再加上角色走動與等級']
  };
  function rpgDoc(s) {
    const t = T()[s.type];
    const [npc, challenge] = RPG_ROLE[s.type];
    const n = s.islands.filter(i => i.name.trim()).length;
    const need = Math.ceil(n / 2);
    return `# RPG 模式（疊加在「${t.name}」上）

使用者在造島工坊打開了 **RPG 模式**：保留 ${t.name} 原本的內容與玩法，再加上一層「小島冒險遊戲」。以下是 RPG 層的規格；跟 \`island-type.md\` 衝突時，**內容以 island-type.md 為準，遊戲規則以本檔為準**。

## 冒險循環

建立冒險者 → 走到一座島 → 和 NPC 對話 → 接受挑戰 → 拿 EXP、蓋島章 → 集滿島章解鎖中央島 → 最終挑戰 → 領證書 → 用接關碼換裝置接著玩

## 1. 冒險者（玩家角色）

- 第一次進站顯示「建立冒險者」：輸入冒險者代號（2～12 字，不要求真實姓名）＋從 3 款原創低多邊形造型擇一（用 Three.js 幾何組成，只換顏色與配件即可）。也提供「先逛逛，不玩」按鈕，直接進入一般瀏覽模式。
- 角色會在群島上移動：**點島嶼標籤或清單 → 角色沿著橋／航道走到那座島**（不要瞬移、不要穿過建築）；桌機另可用方向鍵／WASD 自由走動，手機點地面移動即可，不要做虛擬搖桿。
- 鏡頭預設跟著角色，可切回「全景」。開啟減少動態時改為直接切換位置，不播走路動畫。

## 2. NPC（每座島一位）

- 這個島型的 NPC 角色定位：**${npc}**。每座島一位，名字與外型依島名、「${t.extraLabel}」與內容重點原創設計；站在地標旁，會揮手或轉頭看冒險者。
- 對話框三個選項：**聽故事**（2～4 句，改寫自該島一句介紹與內容重點）、**給提示**（挑戰的學習重點）、**接受挑戰**。
- 對話文字全部寫在 \`data/content.json\`，**不接任何 AI API**；吉祥物${s.mascotName ? `「${s.mascotName}」` : ''}可擔任開場與中央島的引導角色。

## 3. 挑戰與計分

- 挑戰方式：**${challenge}**。
- 選擇題：一次一題，作答後鎖定選項、顯示對錯與詳解，再按「下一題」；選項順序要打亂，但判分用選項 ID，不可用按鈕位置。三題答對兩題以上算過關，可以重玩。
- EXP（寫成 \`content.json\` 裡的 \`rpgRules\`，方便老師調整）：
  | 事件 | EXP |
  | --- | --- |
  | 第一次登上某座島 | +5 |
  | 某題第一次答對 | +10 |
  | 已答對過的題目再答對 | +2 |
  | 某座島第一次過關 | +10 |
- 等級：Lv1＝0、Lv2＝30、Lv3＝80、Lv4＝150、Lv5＝250 EXP，之後每級 +120。升級時跳出一句鼓勵與小動畫（減少動態時只顯示文字）。EXP 與等級一律由「作答紀錄」推算，不另外存一個可以亂改的總分。
- 不評分的挑戰（反思、情境選擇）：完成即得 +10 與島章，不顯示對錯。

## 4. 島章護照與中央島

- 每座島過關得 **1 枚島章**（共 ${n} 枚），重玩不會重複蓋章。護照頁顯示已得／未得（未得顯示灰色剪影）。
- 島章達 **${need} 枚**（總數一半，無條件進位）解鎖中央島「${s.centerName || s.title}」的**最終挑戰**：從已過關的島抽 5 題，答對 4 題以上通過。
- 通過後可輸入要印在證書上的名字（預設帶冒險者代號），用 Canvas 產生**冒險證書**（網站名稱、名字、等級、島章數、日期），可下載 PNG、可列印。證書右下角固定加註「本證書為學習紀錄，非官方認證」。

## 5. 存檔與接關

- 以冒險者代號區分存檔，存在 localStorage（同一台電腦可以多人輪流玩）。存檔只放：已登島、已答對題目 ID、各島最佳成績、島章、目前所在島、造型；**不存答題到一半的狀態**。
- 接關碼：存檔 → JSON → base64，前面加網站專屬前綴（例如 \`${slugOf(s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'ISLE'}1.\`）與簡單校驗碼；貼錯、格式不符或內容被改壞時要顯示清楚的錯誤，不可讓頁面壞掉。也提供「匯出／匯入 JSON 檔」。
- 頁面上誠實說明：接關碼只是方便換裝置，**不是防作弊**；清除瀏覽器資料會刪掉本機存檔。

## 6. 不玩也能看

- 一般瀏覽模式（不建立角色、不開 3D、用文字清單）都能讀完全部內容；NPC 對話與挑戰也要能從清單直接打開。
- 鍵盤可完成整個冒險循環；對話框與挑戰面板可用 Esc 關閉。

## 7. 原創與著作權

- 冒險者、NPC、怪物、音效、介面全部自行原創（程式繪製或使用者提供的素材）；**不可使用任何遊戲、動漫的角色、名稱、音樂或畫面**，也不要做成某款現有遊戲的翻版。
- 參考其他島嶼網站時只取概念，不複製其程式碼、文字、圖片或角色設定。
`;
  }

  /* 生活感模式：讓島活起來（居民、交易、天空與海、日夜燈光）＋精緻度底線 */
  function lifeDoc(s) {
    const t = T()[s.type];
    const n = s.islands.filter(i => i.name.trim()).length;
    return `# 生活感模式＋精緻度規格（疊加在「${t.name}」上）

使用者在造島工坊打開了 **生活感模式**。訪客的回饋是：「島做得出來，但太簡略、太空、沒有互動」。這份規格的目標是讓群島**一打開就像一座有人住的小世界**：有人在走、有人在搬貨、可以點人聊天交易、天上有雲和鳥、時間會從白天走到晚上、晚上燈會亮。

跟 \`island-type.md\` 衝突時，**內容與玩法以 island-type.md 為準，畫面與生活感以本檔為準**。${s.rpg ? 'RPG 模式也開著：RPG 的 NPC（每島一位）就是本檔的「島民」之一，對話選項合併（聽故事／給提示／接受挑戰＋交易）。' : ''}

## 0. 先看造島工坊的示範

造島工坊網站右側的「即時預覽」就是本檔的最小示範（居民散步、點居民聊天與交易、撿貝殼、鳥群、雲、帆船、四個時段、夜燈、螢火蟲）。你要做的版本**必須比預覽更精緻**，不能更陽春。

## 1. 精緻度底線（沒做到就不算完成）

| 項目 | 要求 |
| --- | --- |
| 光影 | 開啟陰影（DirectionalLight castShadow＋PCFSoftShadowMap，手機降成 1024 貼圖）、半球光補色；色調映射用 ACESFilmic，輸出用 sRGB |
| 天空 | 天空穹頂漸層（不要只有單色背景）＋太陽與月亮光暈＋夜晚星星；霧色跟著天色變 |
| 海 | 有起伏的低多邊形海面（頂點著色器或每幀位移），島的海岸有白色浪花圈 |
| 島的形狀 | 不要正六角柱：海岸線要有起伏（用角度噪聲推擠頂點），分沙灘／岩壁／草地三層 |
| 細節密度 | 每座島至少：1 個獨特地標、1～3 棟小房子（窗戶晚上會亮）、3 棵以上的樹（至少兩種樹形）、花草、岩石、碼頭或小船；中央島再加市集攤位與路燈 |
| 遠景 | 外海一圈遠山或森林剪影，讓畫面有框，不要無限延伸的空海 |
| 材質 | 統一一種風格（低多邊形 flatShading 或黏土感圓角），不要混用寫實貼圖；顏色用 \`references/theme.md\` 的主色、強調色再調出 6～8 個輔助色 |
| 文字標籤 | HTML 標籤跟著島移動、不互相重疊，對話泡泡開啟時其他標籤淡出 |

## 2. 居民（NPC）

- 數量：每座島 2 位島民＋往來中央島的 ${Math.ceil(n / 2)} 位送貨員＋中央市集 1 位商人＋中央島 2 位路人（手機自動減半；${n} 座島時總數約 ${n * 2 + Math.ceil(n / 2) + 3} 人）。用 **InstancedMesh 或共用幾何／材質**，人多也不能卡。
- 外型：原創 Q 版低多邊形小人（頭、眼睛、帽子或頭髮、身體、兩手兩腳），膚色、衣服、帽子隨機組合；走路時手腳擺動，停下會揮手。
- 行為（簡單狀態機即可）：
  - **島民**：在自己的島上找下一個點散步 → 停留 1～4 秒 → 偶爾揮手；不可穿過地標或房子（用環狀區域或預設路點）。
  - **送貨員**：扛著貨箱沿橋從中央市集走到某座島，交給島民（雙方揮手），空手走回去，再換下一座島。
  - **商人**：站在攤位前左右張望。
- 夜晚（22:00～05:00）居民數量減少一半、走回房子附近；早上再出來。
- **點居民**：居民停下、轉向鏡頭、揮手，頭上出現對話泡泡：名字與職業、所在島名、一句話（輪流顯示 3～4 句），按鈕「💬 再聊聊」「🔁 交易」「✕」。手機的點擊判定範圍要放大（用螢幕距離找最近的居民）。Esc 或點空白處關閉。
- 對話內容寫在 \`data/content.json\` 的 \`residents\`，**全部取自該島的介紹與內容重點**改寫；不接 AI API，不捏造真實人物。

## 3. 交易與小收集（純前端、不涉及金錢）

- 訪客有一個「🎒 背包」，起始 3 個 🐚 貝殼。沙灘上每座島 1 顆可點的貝殼，撿了 +1，20 秒後重生。
- 每位居民有一筆交換：給 A 換 B（例如 🐚→🍎、🍎→🌸、🐟→📜），形成一條可以換到最後稀有物（例如 💎 或「島主的明信片」）的交換鏈；交易表放 \`content.json\` 的 \`trades\`。
- 交易成功時背包有彈跳動畫、居民揮手說謝謝；物品不夠時按鈕停用並提示去哪裡換。
- 背包存在 localStorage，可「清空背包」。**這只是小遊戲，不是真實貨幣，也不連到任何付款。**${s.rpg ? '\n- RPG 模式：交易可得少量 EXP（每位居民第一次交易 +2），但不能取代答題過關。' : ''}

## 4. 天空與海的動態

- 雲：8～12 朵由 3～5 顆低多邊形球組成，繞著外圈慢慢飄，**不可擋在鏡頭與島之間**。
- 鳥群：2～3 群、每群 5～7 隻 V 字隊形，翅膀拍動，繞群島飛；夜晚隱藏（可改成螢火蟲）。
- 帆船：1～2 艘繞外海航行並隨浪搖擺；碼頭旁停小船。
- 地標小動畫：風車轉、旗子飄、水車轉、燈塔燈光掃射等，依島型挑 1～2 種。

## 5. 日夜循環與燈光

- 四個時段＋自動：☀️白天、🌇黃昏、🌙夜晚、⏱自動流動（約 2～3 分鐘一天）；另提供「跟現在時間同步」選項（用訪客電腦的時鐘）。畫面角落顯示時間（例如「黃昏 18:10」）。
- 天色、陽光顏色與方向、半球光、霧色、海色、雲色都依時段漸變，切換時平滑過渡（不要瞬間跳）。
- 夜晚：路燈、房子窗戶、市集燈泡亮起（MeshBasicMaterial 變暖黃色＋加法混合的光暈 Sprite），中央廣場加一盞 PointLight；星星出現、螢火蟲在島上飄。PointLight 最多 4 盞，其餘用光暈 Sprite 假光，避免手機卡頓。

## 6. 效能與無障礙

- 目標：中階手機 30fps 以上、桌機 60fps。分「高／低」畫質：低畫質關陰影、居民減半、海面降段數；FPS 連續低於 24 就自動降級。分頁看不到或捲出畫面時暫停渲染。
- \`prefers-reduced-motion\` 或網站的「減少動態」：居民、鳥、雲、海浪停止，時段改為直接切換；所有對話與交易仍可用。
- 不開 3D 的清單版也要能看到「居民名單與對話」，交易可以略過。

## 7. 原創與著作權

- 居民、房子、船、鳥全部用程式幾何原創；不可使用任何遊戲、動漫或其他島嶼網站的角色、名稱、模型、圖片、音效，也不要做成某款現有遊戲的翻版。
- 參考其他島嶼網站時只取「有居民、有日夜」這類概念，不複製其程式碼、文字或美術。
`;
  }


  /* 島嶼外觀：島形、精緻度、動物、地景點綴 */
  function lookOf(s) {
    return {
      shape: IF.SHAPES[s.shape] ? s.shape : 'sea',
      detail: IF.DETAIL[s.detail] ? +s.detail : 3,
      animals: (s.animals || []).filter(k => IF.ANIMALS[k]),
      extras: (s.extras || []).filter(k => IF.EXTRAS[k]),
      cinema: IF.CINEMA[s.cinema] ? s.cinema : 'smooth'
    };
  }
  const SHAPE_SPEC = {
    sea: `- 島放在會起伏的低多邊形海面上（y≈0），島底是沙灘 → 岩壁 → 草地三層，海岸線用角度噪聲推擠成不規則形。
- 每座島外圍有白色浪花圈；島與島之間用木橋連接；外海有帆船、遠景山林剪影。`,
    float: `- 島**飄在雲海上**：沒有海面，改成下方一層緩慢流動的雲海（多顆扁平低多邊形球體或半透明平面＋霧），往下看不到底。
- 每座島的底部是**倒錐形岩層**（往下收尖、分 2～3 層色階的土石，加幾顆掉落的小碎石慢慢上下浮動），頂部是草地。
- 島與島之間用**吊橋**（有下垂弧度的木板＋繩索欄杆）連接；島可以非常緩慢地上下浮動（振幅 0.1 以內，不要讓橋斷開）。
- 「瀑布」點綴在這個島形特別重要：水從島邊流下，消失在雲海裡（半透明、向下流動的貼圖或頂點動畫）。`,
    volcano: `- **中央島是一座火山**：低多邊形錐形山，山頂有凹陷的火山口，口內有橘紅色岩漿微光（自發光材質＋輕微閃爍），上方緩慢冒出灰白色煙霧（幾顆半透明球體往上飄、變大、淡出）。
- 島的岩壁用深灰、黑褐色（玄武岩感），沙灘是**黑色沙灘**；草地顏色略暗，點綴紅褐色岩石。外圍島嶼也有小塊冷卻熔岩紋路。
- 夜晚岩漿光更明顯，可以照亮火山口附近。`,
    snow: `- **冰雪群島**：島面是雪白色（有淡藍色陰影色階），岩壁是灰藍色，沙灘換成淺色冰岸。
- 樹以**覆雪松樹**為主（綠色錐形上面加白色雪蓋）；房子屋頂有積雪。
- 海面上漂著 6～10 座大小不一的**小冰山**（白色＋淡藍色多面體，緩慢上下浮動）；可加飄落的雪花粒子（減少動態時停止）。`,
    desert: `- **沙漠綠洲**：島面是金黃色沙丘（2～3 個沙色色階，表面有起伏），岩壁是橘褐色砂岩，沙灘是淺米色。
- 植被以**仙人掌**（柱狀＋分枝）與**棕櫚樹**為主，草很少。
- 每座島有一汪小小的**綠洲水池**（藍綠色、周圍一圈綠草與 1～2 棵棕櫚）。`,
    jungle: `- **熱帶雨林**：島上樹木明顯比其他島形**密 2 倍以上**，以高大的棕櫚與圓冠闊葉樹混合，綠色分 3～4 個深淺。
- 加上藤蔓、蕨類、大葉片植物等地被；岩壁可以有青苔色塊。
- 留出島中央空地給地標與標籤，不要讓樹擋住島名。`,
    mushroom: `- **奇幻蘑菇島**：每座島長著 3～6 朵**大蘑菇**取代大部分的樹（白色粗柄＋紅底白點的半球形菌傘，也可混搭橘色、紫色），大小高低錯落。
- 草地顏色偏鮮綠，可點綴發光的小蘑菇（夜晚微微發光）。整體是童話繪本感，不要寫實。`,
    atoll: `- 中央島與外圍島嶼被一圈**淺藍綠色潟湖**與**白色沙洲**包圍，潟湖水色明顯比外海淺、看得到底下的沙。
- 島的植被以棕櫚樹、灌木、花為主；沙洲上可以有小木屋、救生圈、海星、貝殼等小道具。
- 外海顏色較深，潟湖邊緣有浪花線。`,
    terrace: `- 每座島邊緣做成**一層層梯田／台地**（2～3 階，每階外緣是土石、上緣是綠色草地），像山城一樣有高低層次。
- 階梯或坡道連接不同高度；最高層放地標，下層放房子、田地與小路。
- 注意標籤、居民路徑與點擊判定都要跟著高度走，不要讓人物浮在空中或陷進地面。`
  };
  function lookDoc(s) {
    const L = lookOf(s);
    const [shapeName, shapeDesc] = IF.SHAPES[L.shape];
    const lv = L.detail;
    const detailRows = Object.entries(IF.DETAIL).map(([k, [name, , req]]) => `| ${+k === lv ? '**▶ ' + name + '（本次選擇）**' : name} | ${req} |`).join('\n');
    const where = { land: '在島上草地散步', shore: '在沙灘／岸邊排隊走', sea: '在海面（浮空島為雲海）游動、偶爾跳出水面', air: '在島的上空或花田與樹之間飛（貓頭鷹在夜晚出現）' };
    const animals = L.animals.map(k => { const [icon, name, w, line] = IF.ANIMALS[k]; return `| ${icon} ${name} | ${where[w]} | 「${line}」 |`; }).join('\n');
    const extras = L.extras.map(k => `- ${IF.EXTRAS[k][0]}：${IF.EXTRAS[k][1]}`).join('\n');
    return `# 島嶼外觀規格：島形・精緻度・動物・點綴

使用者在造島工坊選了下面這些外觀。**畫面美感以本檔為準**；內容與玩法仍以 \`island-type.md\` 為準。${s.life ? '生活感模式的居民、日夜與精緻度底線（`living-world.md`）照常適用，本檔是在它之上的「長相」設定。' : ''}

## 1. 島形：${shapeName}

${shapeDesc}。

${SHAPE_SPEC[L.shape]}

## 2. 精緻度：第 ${lv} 級「${IF.DETAIL[lv][0]}」

使用者想要的漂亮程度是 **${IF.DETAIL[lv][0]}**（${IF.DETAIL[lv][1]}）。低於這一級的做法不算完成。

| 等級 | 要求（每一級都包含前一級） |
| --- | --- |
${detailRows}

讓畫面「好看」的共同做法（各級都要）：

- **一致的比例**：房子、樹、人、動物的大小關係要合理，人物約房子門高的 2/3。
- **柔和的配色**：以 \`theme.md\` 的主色、強調色為基礎，調出 6～8 個彩度略低的輔助色；草地、土石、屋頂、水各有 2～3 個深淺色階，不要整片單色。
- **層次與陰影**：開陰影；島底與物件底部顏色稍暗（假環境光遮蔽）；遠景加霧，前景清楚。
- **圓潤的造型**：低多邊形但不尖銳，樹冠、雲、石頭用幾顆球或多面體堆疊，像微縮黏土模型。
- **留白**：每座島的中心留一塊空地給地標與標籤，不要把物件塞滿到看不出主題。
- **鏡頭**：預設視角約 35～45 度俯瞰，看得到全部島；點島後平滑飛近。

## 3. 島上的動物

${L.animals.length ? `| 動物 | 出現位置與動作 | 點了會說（可依島的內容改寫） |
| --- | --- | --- |
${animals}

- 每種動物 1～3 隻，分散在不同島上；用**原創**的低多邊形造型（身體、頭、耳朵、尾巴用基本幾何組成），不要使用任何卡通、遊戲角色的造型或名字。
- 動作：走路有身體上下晃動，停下來會東張西望或坐下；海裡的動物沿航道游、偶爾跳起；蝴蝶繞著花田飛。
- **點動物**：停下、轉向鏡頭、跳一下，頭上出現短短一句話泡泡（點空白處或 Esc 關閉）。${s.life ? '可以和居民共用同一套對話泡泡元件。' : ''}
- 夜晚：陸地動物回到樹下或房子旁「睡覺」（停止走動），螢火蟲出現；早上再出來。
- 減少動態時：動物停在原地，但仍可點擊。
- 動物數量要跟著畫質調整：低畫質時每種只留 1 隻。` : '（使用者沒有選動物，島上不放動物；生活感模式的居民照常。）'}

## 4. 地景點綴

${extras || '（使用者沒有選額外點綴。）'}

- 點綴是錦上添花，不可擋住島名標籤、地標或點擊目標。
- 有動畫的點綴（瀑布、熱氣球、風車、噴泉、彩旗、燈塔光束、摩天輪、營火、溫泉蒸氣、風箏）在「減少動態」時要停止。
- 燈塔、營火、摩天輪的燈在夜晚要亮起；彩虹只在白天顯示（夜晚淡出）。

## 5. 鏡頭運鏡：「${IF.CINEMA[L.cinema][0]}」

${IF.CINEMA[L.cinema][1]}。

- 要求：${IF.CINEMA[L.cinema][2]}。
${L.cinema === 'off' ? '' : `- 做法：鏡頭位置與注視點都用補間（例如 \`t → t*t*(3-2*t)\` 或 easeInOutCubic）沿曲線移動，不要直線瞬移；運鏡中暫停自動旋轉與拖曳，結束後把控制權還給訪客（OrbitControls 的 target 同步到終點）。
- 點島運鏡結束後才打開內容面板；面板關閉時鏡頭平滑退回全景。
- 第一次進站播放完整開場；同一個訪客之後再來可縮短或略過（用 localStorage 記住），並提供「🎬 重播開場」按鈕。
- **一定要能跳過**：點畫面、按 Esc 或任何按鍵就直接到全景。\`prefers-reduced-motion\` 或「減少動態」開啟時，不播運鏡，直接切換畫面。
- 手機上運鏡時間縮短約 30%，避免等太久。
`}
## 6. 驗收重點

- 截圖比對：全景（白天）、拉近一座島、手機直式各一張，放 \`_shots/look-*.png\`。
- 回報時用一句話說明「這次的島形、精緻度、動物、點綴各做了什麼」，並附截圖路徑。

## 7. 原創與著作權

- 使用者可能看過別人做的島嶼網站（浮空島、吊橋、熱氣球、松鼠等都是常見的通用元素），**只能取概念**：不可複製他人的程式碼、模型、圖片、文字、介面配置、角色、名稱或商標，也不要做成某個現有網站或遊戲的翻版。
- 所有模型用程式幾何原創；需要圖示時用 emoji、SVG 或 CSS 自己畫。
`;
  }

  /* ---------- 第 N 版更新包 ---------- */
  function release(s) {
    const up = s.update && s.update.on ? s.update : null;
    const version = up ? up.version : 1;
    const history = up ? (up.history || []).concat([{ version, date: today(), summary: (up.notes || '').trim().split(/\n/)[0].slice(0, 80) || '更新' }])
      : [{ version: 1, date: today(), summary: '第一版' }];
    return { version, basedOn: up ? up.baseVersion : null, updatedAt: today(), history };
  }
  const nameOf = (o, k) => (o && o[k]) || '';
  /* 比對上一版 project.json 與這一版，列出看得懂的變更 */
  function diff(oldP, newP) {
    const out = [];
    const S = (a, b, label) => { if (String(a || '') !== String(b || '')) out.push(`${label}：「${a || '（空白）'}」→「${b || '（空白）'}」`); };
    const os = oldP.site || {}, ns = newP.site || {};
    S(os.title, ns.title, '網站名稱'); S(os.tagline, ns.tagline, '一句話介紹'); S(os.author, ns.author, '作者');
    S(os.audience, ns.audience, '對象'); S(nameOf(os.mascot, 'name'), nameOf(ns.mascot, 'name'), '吉祥物');
    S(nameOf(oldP.islandType, 'name'), nameOf(newP.islandType, 'name'), '島型');
    S(nameOf(oldP.centerIsland, 'name'), nameOf(newP.centerIsland, 'name'), '中央島');
    const oi = oldP.islands || [], ni = newP.islands || [];
    const oMap = new Map(oi.map(i => [i.name, i]));
    const nNames = new Set(ni.map(i => i.name));
    ni.forEach(i => {
      const o = oMap.get(i.name);
      if (!o) { out.push(`新增島嶼：「${i.name}」${i.intro ? '——' + i.intro : ''}`); return; }
      const ch = [];
      if ((o.intro || '') !== (i.intro || '')) ch.push('一句介紹');
      if ((o.points || []).join('\n') !== (i.points || []).join('\n')) ch.push('內容重點');
      if ((o.extra || '') !== (i.extra || '')) ch.push(newP.extraLabel || '補充欄位');
      if ((o.group || '') !== (i.group || '')) ch.push('分類');
      if ((o.link || '') !== (i.link || '')) ch.push('連結');
      if ((o.material || '') !== (i.material || '')) ch.push('對應檔案');
      if (ch.length) out.push(`修改島嶼「${i.name}」：${ch.join('、')}`);
    });
    oi.forEach(o => { if (!nNames.has(o.name)) out.push(`移除島嶼：「${o.name}」`); });
    const kept = ni.filter(i => oMap.has(i.name)).map(i => i.name), was = oi.filter(o => nNames.has(o.name)).map(o => o.name);
    if (kept.join('|') !== was.join('|')) out.push('島嶼順序調整為：' + kept.join(' → '));
    const ot = oldP.theme || {}, nt = newP.theme || {};
    S(ot.style, nt.style, '視覺風格'); S(ot.font, nt.font, '字體'); S(ot.primary, nt.primary, '主色'); S(ot.accent, nt.accent, '強調色');
    const bg = t => (t.backgrounds || []).map(b => b.name + b.background).join('|');
    if (bg(ot) !== bg(nt)) out.push('三組底色：' + (nt.backgrounds || []).map(b => `${b.name} ${b.background}`).join('／'));
    const of = new Set((oldP.features || []).map(f => f.id)), nf = new Set((newP.features || []).map(f => f.id));
    const addF = (newP.features || []).filter(f => !of.has(f.id)).map(f => f.name), delF = (oldP.features || []).filter(f => !nf.has(f.id)).map(f => f.name);
    if (addF.length) out.push('新增功能：' + addF.join('、'));
    if (delF.length) out.push('拿掉功能：' + delF.join('、'));
    const on = o => !!(o && o.enabled);
    if (on(oldP.rpgMode) !== on(newP.rpgMode)) out.push(on(newP.rpgMode) ? '開啟 RPG 模式' : '關閉 RPG 模式');
    if (on(oldP.livingWorld) !== on(newP.livingWorld)) out.push(on(newP.livingWorld) ? '開啟生活感模式' : '關閉生活感模式');
    const ol = oldP.look || null, nl = newP.look || {};
    if (!ol) out.push(`補上島嶼外觀設定（上一版的造島包還沒有這個欄位，以下是造島工坊的預設或你這次選的；不想改外觀的話，請在更新說明寫「外觀維持原樣」）：${nl.shape && nl.shape.name}、精緻度「${nl.detail && nl.detail.name}」` + (nl.animals && nl.animals.length ? '、動物 ' + nl.animals.map(a => a.icon + a.name).join('、') : '') + (nl.extras && nl.extras.length ? '、點綴 ' + nl.extras.map(a => a.name).join('、') : ''));
    else {
      S(ol.shape && ol.shape.name, nl.shape && nl.shape.name, '島形');
      S(ol.detail && ol.detail.name, nl.detail && nl.detail.name, '精緻度');
      S(ol.cinema && ol.cinema.name, nl.cinema && nl.cinema.name, '鏡頭運鏡');
      const ids = l => new Set((l || []).map(a => a.id));
      const oa = ids(ol.animals), na = ids(nl.animals);
      const addA = (nl.animals || []).filter(a => !oa.has(a.id)), delA = (ol.animals || []).filter(a => !na.has(a.id));
      if (addA.length) out.push('新增動物：' + addA.map(a => a.icon + a.name).join('、'));
      if (delA.length) out.push('拿掉動物：' + delA.map(a => a.icon + a.name).join('、'));
      const oe = ids(ol.extras), ne = ids(nl.extras);
      const addE = (nl.extras || []).filter(a => !oe.has(a.id)), delE = (ol.extras || []).filter(a => !ne.has(a.id));
      if (addE.length) out.push('新增點綴：' + addE.map(a => a.name).join('、'));
      if (delE.length) out.push('拿掉點綴：' + delE.map(a => a.name).join('、'));
    }
    const om = new Set((oldP.materials || []).map(m => m.file));
    const addM = (newP.materials || []).filter(m => !om.has(m.file)).map(m => m.file.replace(/^materials\//, ''));
    if (addM.length) out.push('新增資料檔案：' + addM.join('、'));
    S(oldP.notes, newP.notes, '給 AI 的額外要求');
    return out;
  }
  const UPDATE_KINDS = { add: '➕ 新增島嶼', edit: '✏️ 修改內容', look: '🐾 外觀／動物', theme: '🎨 配色風格', feature: '🧩 新增功能', fix: '🛠️ 修正問題', other: '📝 其他' };
  function updateDoc(s, changes) {
    const up = s.update;
    const kinds = (up.kinds || []).map(k => UPDATE_KINDS[k]).filter(Boolean);
    return `# 第 ${up.version} 版更新需求（上一版：第 ${up.baseVersion} 版）

> 由造島工坊 IsleForge 於 ${today()} 產生。網站：**${s.title}**。
> 上一版的規格備份在 \`updates/v${up.baseVersion}/project.json\`，這一版的完整規格在最上層的 \`project.json\`。

## 使用者這次想更新的部分

${kinds.length ? '類型：' + kinds.join('、') + '\n\n' : ''}${(up.notes || '').trim() || '（使用者沒有另外寫說明，請依下方「自動比對出的變更」更新。）'}

## 造島工坊自動比對出的變更（第 ${up.baseVersion} 版 → 第 ${up.version} 版）

${changes.length ? changes.map((c, n) => `${n + 1}. ${c}`).join('\n') : '（表單資料沒有變動，只依上面的文字說明更新。）'}

## 給 AI 的更新規則

1. **這是更新，不是重做**：沿用第 ${up.baseVersion} 版已經做好的 \`site/\`，只改上面列出的部分；其他頁面、存檔格式（localStorage 鍵名）、網址結構保持不變，訪客原本的進度不能因為更新而消失。
2. **先找到上一版網站**：${up.hasSite ? '這個資料夾已經有 `site/`，就在這裡改。' : '這個資料夾裡**沒有** `site/`。請先問使用者：第 ' + up.baseVersion + ' 版網站的資料夾在哪裡？請使用者把這個更新包解壓後的檔案**覆蓋到原本的資料夾**（或把原本的 `site/`、`部署紀錄.md` 複製過來），再開始改。找不到也不要從頭重做，先問使用者。'}
3. 動手前先用一張表列出「要改的地方 → 改哪個檔案 → 怎麼驗證」給使用者看；使用者回「可以」或「直接做」再改。
4. 新增的島嶼也要達到 \`references/\` 裡的規格（島型玩法、${s.life ? '生活感、' : ''}外觀與精緻度），風格要跟舊的島一致，不能看起來像另一個網站。
5. 有改到的部分照 \`references/checklist.md\` 對應項目重測；沒改的部分至少做一次回歸檢查（首頁打得開、每座島都能點開、主題切換、手機 375px、console 沒有錯誤）。
6. **部署到原本同一個網址**：讀 \`部署紀錄.md\`，用同一個平台、同一個專案更新，不要建立新網站；找不到部署紀錄就問使用者原本的網址與平台。部署前先問使用者同意，部署後打開正式網址確認新內容已出現。
7. 完成後在 \`CHANGELOG.md\` 與 \`部署紀錄.md\` 記下「第 ${up.version} 版」的日期與變更摘要。
`;
  }
  function updatePrompt(s) {
    const up = s.update || {};
    const v = up.version || 2, b = up.baseVersion || 1;
    return `這是「${s.title || '我的島嶼'}」的第 ${v} 版更新包（上一版是第 ${b} 版），請幫我更新已經做好的網站，不要從頭重做。
1. 先讀 updates/v${v}_更新需求.md（這次要改什麼），再讀 START_HERE.md、SKILL.md、project.json（已是新版規格）和 references/ 裡跟這次變更有關的檔案；上一版規格在 updates/v${b}/project.json，可以比對差異。
2. ${up.hasSite ? '上一版網站就在這個資料夾的 site/，部署資訊在「部署紀錄.md」。' : '如果這個資料夾裡沒有 site/ 和「部署紀錄.md」，請先問我第 ' + b + ' 版網站的資料夾在哪裡，請我把這包覆蓋到原本的資料夾後再開始，不要從頭重做。'}
3. 先用一張表列出「要改的地方、改哪些檔案、怎麼測」給我看，我回「可以」或「直接做」再動手；只改更新需求列出的部分，其他保持原樣，訪客原本的進度不能消失。
4. 改完照 references/checklist.md 測有改到的部分，沒改的部分也做一次回歸檢查（每座島都能點開、手機 375px、console 沒有錯誤），沒有實際測過的不能說通過。
5. 用繁體中文回報改了什麼、測試結果，再問我要不要更新上線；我同意後**更新到原本同一個網址**（看部署紀錄.md，不要建立新網站），打開正式網址確認，最後在 CHANGELOG.md 和部署紀錄.md 記下第 ${v} 版。`;
  }
  /* 讀上一版：zip（造島包或整個資料夾）或 project.json */
  async function readBase(file) {
    if (/\.json$/i.test(file.name)) {
      const p = JSON.parse((await file.text()).replace(/^﻿/, ''));
      if (!p.site || !Array.isArray(p.islands)) throw new Error('這不是造島包的 project.json');
      return { project: p, zip: null, prefix: '', rootName: '', count: 1, hasSite: false, hasDeployLog: false, siteFiles: 0, changelog: '' };
    }
    const zip = await JSZip.loadAsync(file);
    const names = Object.keys(zip.files).filter(n => !zip.files[n].dir);
    const pj = names.filter(n => /(^|\/)project\.json$/.test(n) && !/(^|\/)(site|updates|node_modules|_shots)\//.test(n)).sort((a, b) => a.split('/').length - b.split('/').length)[0];
    if (!pj) throw new Error('壓縮檔裡找不到 project.json，請選造島工坊產生的造島包');
    const prefix = pj.slice(0, -'project.json'.length);
    const p = JSON.parse((await zip.file(pj).async('string')).replace(/^﻿/, ''));
    if (!p.site || !Array.isArray(p.islands)) throw new Error('project.json 格式不符');
    const inside = names.filter(n => n.startsWith(prefix) && !/(^|\/)(node_modules|\.git)\//.test(n.slice(prefix.length)));
    const siteFiles = inside.filter(n => n.slice(prefix.length).startsWith('site/')).length;
    const cl = zip.file(prefix + 'CHANGELOG.md');
    return {
      project: p, zip, prefix, rootName: prefix.replace(/\/$/, '').split('/').pop() || '',
      count: inside.length, siteFiles, hasSite: siteFiles > 0,
      hasDeployLog: !!zip.file(prefix + '部署紀錄.md'), changelog: cl ? await cl.async('string') : ''
    };
  }
  function matsFrom(baseProject, files, version) {
    const newNames = new Set(files.map(f => safePath(f.name)));
    const old = (baseProject.materials || []).map(m => ({ name: m.file.replace(/^materials\//, ''), size: (m.sizeKB || 1) * 1024, note: m.note || '' }));
    return old.filter(m => !newNames.has(m.name)).concat(files.map(f => ({ name: f.name, size: f.size, folder: f.folder, note: (f.note ? f.note + '；' : '') + `第 ${version} 版新增` })));
  }
  function changesFor(s, files, baseProject) {
    return diff(baseProject, projectJson(s, matsFrom(baseProject, files, (s.update || {}).version || 2)));
  }
  /* 疊合：上一版全部檔案 → 覆蓋新規格文件 → 加上更新需求與變更紀錄 */
  async function buildUpdate(s, files, base) {
    const up = s.update;
    const mats = matsFrom(base.project, files, up.version);
    const changes = diff(base.project, projectJson(s, mats));
    const zip = new JSZip();
    const root = zip.folder(base.rootName || (slugOf(s) + '-islekit'));
    if (base.zip) {
      const names = Object.keys(base.zip.files).filter(n => !base.zip.files[n].dir && n.startsWith(base.prefix));
      for (const n of names) {
        const rel = n.slice(base.prefix.length);
        if (!rel || /(^|\/)(node_modules|\.git)\//.test(rel)) continue;
        root.file(rel, await base.zip.file(n).async('uint8array'), { date: base.zip.files[n].date });
      }
    }
    root.folder('updates').folder('v' + up.baseVersion).file('project.json', JSON.stringify(base.project, null, 2));
    writeSpec(root, s, mats);
    files.forEach(f => root.folder('materials').file(safePath(f.name), f.file));
    root.folder('updates').file(`v${up.version}_更新需求.md`, updateDoc(s, changes));
    const entry = `## 第 ${up.version} 版（${today()}）\n\n${(up.notes || '').trim() ? up.notes.trim() + '\n\n' : ''}${changes.map(c => '- ' + c).join('\n') || '- （表單資料沒有變動）'}\n`;
    const oldLog = (base.changelog || '').replace(/^# .*\n+/, '');
    root.file('CHANGELOG.md', `# 變更紀錄｜${s.title}\n\n${entry}\n${oldLog || `## 第 ${up.baseVersion} 版\n\n- 上一版（由造島工坊產生的原始規格）\n`}`);
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    return { blob, changes };
  }

  function webList(s) {
    return [...new Set(String(s.webSources || '').split(/\n+/).map(x => x.trim()).filter(x => /^https?:\/\/\S+$/i.test(x)))].slice(0, 30);
  }
  function slugOf(s) { return (s.slug || '').trim() || 'my-island'; }
  function safeName(name) { return name.replace(/[\\/:*?"<>|]/g, '_'); }
  function safePath(name) { return String(name).split('/').filter(Boolean).map(safeName).join('/'); }   /* 2026-10-30：保留「島名/檔案」資料夾 */
  /* 資料夾名稱 → 島名：去掉前面的編號（01_、1.、01-），忽略空白與大小寫；「共用」資料夾給全站用 */
  function normIsle(x) { return String(x || '').replace(/^\d+\s*[._、\-－)）]?\s*/, '').replace(/\s+/g, '').toLowerCase(); }
  function isleFor(s, f) {
    if (!f || !f.folder) return '';
    const n = normIsle(f.folder);
    const hit = s.islands.find(i => i.name.trim() && normIsle(i.name) === n);
    if (hit) return hit.name.trim();
    return /^(共用|全站|shared|common)$/.test(n) ? '共用' : '';
  }
  function isleFiles(s, files, i) {
    const out = files.filter(f => isleFor(s, f) === i.name.trim()).map(f => 'materials/' + safePath(f.name));
    if (i.file && !out.includes('materials/' + safePath(i.file))) out.unshift('materials/' + safePath(i.file));
    return out;
  }
  function csvCell(v) {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function lines(text) { return String(text || '').split(/\n+/).map(x => x.trim()).filter(Boolean); }

  function lookLine(s) {
    const L = lookOf(s);
    return `${IF.SHAPES[L.shape][0].replace(/^\S+\s/, '')}、精緻度「${IF.DETAIL[L.detail][0]}」、運鏡「${IF.CINEMA[L.cinema][0]}」` + (L.animals.length ? '、動物 ' + L.animals.map(k => IF.ANIMALS[k][1]).join('、') : '');
  }
  /* 給 AI 的指令（貼到 AI 對話框） */
  function prompt(s) {
    return `請用這個資料夾幫我蓋好「${s.title || '我的島嶼'}」3D 島嶼網站${s.rpg ? '（開啟 RPG 模式：小島＋RPG 冒險，規格在 references/rpg-mode.md）' : ''}${s.life ? '（開啟生活感模式：居民、交易、雲與鳥、日夜燈光，精緻度底線在 references/living-world.md）' : ''}（島嶼外觀：${lookLine(s)}，規格在 references/look-and-feel.md），品質要能直接給別人使用。
1. 先讀 START_HERE.md，再把 SKILL.md、project.json、references/ 和 materials/ 的檔案全部讀完；規格以 project.json 為準，SKILL.md「不可以違反」的規則一定要遵守。
2. 讀完先檢查資料夠不夠：哪些島缺內容、哪些地方看不懂或互相矛盾，一次整理成編號問題問我（附上你建議的預設答案），等我回答；我回「你決定」就用預設並標示「示意」。
3. 用一張表列出每座島的規劃給我看；我回覆「可以」或「直接做」之後，就照 SKILL.md 的建置步驟一路做完，不要只做骨架或留 TODO。
4. 做完照 references/checklist.md 逐項實際測試（桌機與手機尺寸都要，能用 Playwright 就截圖），有問題先自己修好；沒有實際測過的項目不能說通過。做的過程中如果卡住或需要我決定，直接問我，不要放棄或自己亂猜。
5. 用繁體中文回報完成內容、哪些是示意內容、測試結果，再問我要部署到哪個網站；我同意後才部署，部署後打開正式網址確認正常。
如果需要安裝套件、開網路或執行指令的權限，請先用一句話告訴我原因，不要因為權限不夠就跳過測試。`;
  }

  function projectJson(s, files) {
    const t = T()[s.type];
    return {
      generator: { name: '造島工坊 IsleForge', version: 1, createdAt: today() },
      site: {
        title: s.title, slug: slugOf(s), tagline: s.tagline, author: s.author, contact: s.contact,
        audience: s.audience, language: s.language, mascot: { name: s.mascotName, description: s.mascotDesc }
      },
      islandType: { id: s.type, name: t.name, description: t.desc },
      centerIsland: {
        name: s.centerName || s.title, role: t.centerHint,
        description: CENTER_ROLE[s.type]
      },
      extraLabel: t.extraLabel,
      islands: s.islands.filter(i => i.name.trim()).map((i, n) => ({
        order: n + 1, id: 'island-' + String(n + 1).padStart(2, '0'),
        name: i.name.trim(), group: i.group.trim(), intro: i.intro.trim(),
        points: lines(i.points), extra: i.extra.trim(), link: i.link.trim(),
        material: isleFiles(s, files, i)[0] || '',
        materials: isleFiles(s, files, i)
      })),
      theme: {
        style: IF.STYLES[s.style], font: IF.FONTS[s.font][0], primary: s.primary, accent: s.accent,
        backgrounds: s.themes.map((x, n) => ({ name: x.name, background: x.bg, default: n === 0 })),
        autoByTime: s.themeAuto ? (([d, k, n]) => ({ enabled: true, day: s.themes[d].name, dusk: s.themes[k].name, night: s.themes[n].name, spec: 'references/theme.md' }))(IF.themeByTime(s.themes)) : { enabled: false }
      },
      features: s.features.map(k => ({ id: k, name: IF.FEATURES[k][0], description: IF.FEATURES[k][1] })),
      rpgMode: s.rpg
        ? { enabled: true, spec: 'references/rpg-mode.md', npcRole: RPG_ROLE[s.type][0], challenge: RPG_ROLE[s.type][1],
            rules: { firstVisit: 5, firstCorrect: 10, repeatCorrect: 2, firstClear: 10, passPerIsland: '2/3', centerUnlockStamps: Math.ceil(s.islands.filter(i => i.name.trim()).length / 2) } }
        : { enabled: false },
      livingWorld: s.life
        ? { enabled: true, spec: 'references/living-world.md', residentsPerIsland: 2, trade: true, dayNight: ['day', 'dusk', 'night', 'auto', 'realtime'], sky: ['clouds', 'birds', 'boats'], nightLights: true }
        : { enabled: false },
      look: (() => {
        const L = lookOf(s);
        return {
          spec: 'references/look-and-feel.md',
          shape: { id: L.shape, name: IF.SHAPES[L.shape][0].replace(/^\S+\s/, '') },
          detail: { level: L.detail, name: IF.DETAIL[L.detail][0], requirement: IF.DETAIL[L.detail][2] },
          animals: L.animals.map(k => ({ id: k, icon: IF.ANIMALS[k][0], name: IF.ANIMALS[k][1], where: IF.ANIMALS[k][2] })),
          extras: L.extras.map(k => ({ id: k, name: IF.EXTRAS[k][0].replace(/^\S+\s/, '') })),
          cinema: { id: L.cinema, name: IF.CINEMA[L.cinema][0], requirement: IF.CINEMA[L.cinema][2] }
        };
      })(),
      release: release(s),
      materials: files.map(f => ({ file: 'materials/' + safePath(f.name), sizeKB: Math.max(1, Math.ceil(f.size / 1024)), note: f.note || '', island: isleFor(s, f) })),
      webSources: webList(s),
      publishMaterials: !!s.publishMaterials,
      ai: AI_NAMES[s.ai],
      deploy: { preferred: s.deploy, label: DEPLOY_NAMES[s.deploy] },
      notes: s.notes
    };
  }

  function islandsCsv(s, files = []) {
    const t = T()[s.type];
    const head = ['順序', t.rowName, '分類', '一句介紹', '內容重點', t.extraLabel, '連結', '對應檔案'];
    const rows = s.islands.filter(i => i.name.trim()).map((i, n) =>
      [n + 1, i.name, i.group, i.intro, lines(i.points).join('；'), i.extra, i.link, isleFiles(s, files, i).join('；')].map(csvCell).join(','));
    return '﻿' + [head.map(csvCell).join(','), ...rows].join('\r\n') + '\r\n';
  }

  function startHere(s) {
    return `# START HERE（給 AI 讀的入口）

你好，這是由「造島工坊 IsleForge」產生的**造島包**。使用者想請你做一個 3D 島嶼網站：**${s.title}**。

請依序：

1. 讀 \`SKILL.md\`（完整建置流程，這是你的工作說明書）。
2. 讀 \`project.json\`（唯一的規格來源：名稱、島嶼、配色、功能、部署偏好）。${s.rpg ? '\n   - 這次有開啟 **RPG 模式**（`project.json` 的 `rpgMode.enabled` 為 true），也要讀 `references/rpg-mode.md`。' : ''}${s.life ? '\n   - 這次有開啟 **生活感模式**（`livingWorld.enabled` 為 true），必讀 `references/living-world.md`（居民、交易、日夜燈光與精緻度底線）。' : ''}
   - **島嶼外觀**（島形、精緻度、動物、點綴）必讀 \`references/look-and-feel.md\`：這次是「${lookLine(s)}」。
3. 讀 \`materials/_index.md\` 和 \`materials/\` 裡的檔案（使用者提供的資料）。
4. **資料盤點**：檢查每座島的資料夠不夠、有沒有看不懂或矛盾的地方；有缺漏就一次用編號問題問使用者（附建議預設答案），使用者回「你決定」才用預設並標「示意」。規則詳見 CLAUDE.md／AGENTS.md／GEMINI.md 的「資料不夠時要問使用者」。
5. 依 SKILL.md 開工：先給規劃表，使用者同意後一路做完，再照 \`references/checklist.md\` 逐項實際測試。
6. 本機測試通過後，**先問使用者要部署到哪裡**，得到同意才部署；部署後打開正式網址驗證。

> 完成標準：每座島都有獨特地標與完整內容、島型玩法能實際操作、手機與桌機都好用、console 沒有錯誤。沒有實際測過的項目不能說通過。

> 請用繁體中文（臺灣用語）跟使用者溝通。使用者可能不是工程師，請用簡單的話說明你在做什麼。
`;
  }

  function skill(s, files) {
    const t = T()[s.type];
    const isles = s.islands.filter(i => i.name.trim());
    const feats = s.features.map(k => `- ${IF.FEATURES[k][0]}：${IF.FEATURES[k][1]}`).join('\n') || '- （使用者沒有勾選額外功能）';
    const c = v => String(v || '—').replace(/\|/g, '／').replace(/\s*\n\s*/g, ' ');
    const table = isles.map((i, n) => `| ${n + 1} | ${c(i.name)} | ${c(i.group)} | ${c(i.intro)} | ${c(i.file)} |`).join('\n');
    const lang = { 'zh-TW': '繁體中文（臺灣用語）', 'zh-TW+en': '繁體中文為主，標題附英文', en: 'English' }[s.language];
    return `---
name: build-${slugOf(s)}
description: 依 project.json 與 materials/ 建立「${s.title}」3D 島嶼網站（${t.name}），在本機測試後詢問使用者部署位置並完成上架驗證。使用者說「蓋島」「做島嶼網站」「依造島包建站」時使用。
---

# ${s.title}｜3D 島嶼網站建置技能

> 由造島工坊 IsleForge 於 ${today()} 產生。島型：**${t.name}**。

## 你的任務

把 \`project.json\` 描述的島嶼做成一個**可以實際操作的靜態網站**：訪客打開就看到 3D 群島，可以旋轉、縮放、點島進去看內容；手機也好用；沒有 WebGL 時仍可讀到全部內容。完成後在本機測試，再問使用者要部署到哪裡。

## 0. 先讀

| 檔案 | 用途 |
| --- | --- |
| \`project.json\` | 規格來源（以它為準） |
| \`islands.csv\` | 同一份島嶼清單的表格版，方便人看 |
| \`materials/_index.md\` | 使用者上傳的資料清單與說明 |
| \`references/island-type.md\` | 這個島型要有的玩法與畫面 |
${s.rpg ? '| `references/rpg-mode.md` | **RPG 模式**：冒險者、NPC、EXP 與等級、島章、證書、接關碼（這次有開啟，必讀） |\n' : ''}${s.life ? '| `references/living-world.md` | **生活感模式＋精緻度底線**：居民散步與對話、交易背包、雲鳥帆船、日夜燈光（這次有開啟，必讀） |\n' : ''}| \`references/look-and-feel.md\` | **島嶼外觀**：島形（${IF.SHAPES[lookOf(s).shape][0].replace(/^\S+\s/, '')}）、精緻度（${IF.DETAIL[lookOf(s).detail][0]}）、動物與點綴（必讀） |
| \`references/theme.md\` | 三組底色與視覺風格 |
| \`references/checklist.md\` | 驗收清單（做完逐項打勾） |
| \`references/deploy.md\` | 部署方式（測試通過後才讀） |
| \`references/data-collection.md\` | 上網找資料、爬取網頁的規範（${webList(s).length ? '**這次有指定 ' + webList(s).length + ' 個網址，開工前必讀**' : '要上網找資料時才讀'}） |

## 1. 不可以違反

1. 網站名稱、島嶼名稱、島嶼數量與順序、作者、連結一律照 \`project.json\`，不自行增刪島嶼。
2. 內容優先取自 \`materials/\`；資料不足時**先依建置步驟 0 詢問使用者**，使用者回「你決定」或明確說不補資料時，才撰寫示意內容，頁面上要標「示意」，並在回報中列出哪些是你補寫的。
3. 不捏造真實人物、機構、官方背書、統計數字或網址。外部連結只用使用者給的。
   - **資料衝突時**：網站名稱、島嶼名稱與順序以 \`project.json\` 為準；知識內容（定義、步驟、數字）以 \`materials/\` 為準。兩者不一致時採用 materials 的說法，並在回報中列出差異讓使用者決定。
   - **沒有教材的島**：可以依該島的「內容重點」撰寫教材與題目，標「示意」或「自編練習題」，但不可超出內容重點的範圍。
4. 純靜態網站（HTML／CSS／JavaScript），不需要任何 API 金鑰。Three.js 請用 \`https://cdn.jsdelivr.net/npm/three@0.160.0/\`（ES module，含 examples/jsm 的 OrbitControls、CSS2DRenderer）這類固定版本，或下載到專案內；cdnjs 上的 three.js 只到 r128，舊版也可以但不要混用。
5. 介面語言：${lang}。
6. \`publishMaterials\` 為 \`${!!s.publishMaterials}\`：${s.publishMaterials ? '可以把 materials 檔案放上網站供下載。' : '**不可以**把 materials 的原始檔放上網站，只能把內容改寫進頁面。'}
7. 不把任何帳號密碼、金鑰、token 寫進檔案。部署需要登入時，請使用者自己在終端機登入。
8. 尊重著作權：使用者上傳的圖片可以用；不要抓網路上來源不明的圖片。需要圖像時用程式繪製（Three.js 幾何、SVG、CSS）。
9. 不可複製其他人已發表的島嶼網站或付費技能包的程式碼、素材、文字、名稱與商標；即使使用者提到某個網站當參考，也只能參考「概念」，自己原創實作。
10. **RWD 自適應版面是必備**：桌機（1440px）、平板（768px）、手機（375px）都要好用；手機改成底部抽屜面板、按鈕至少 44px、不可橫向捲動，3D 畫面隨視窗大小重新計算。
11. **不要做 PWA**：不加 manifest.json、不註冊 service worker、不做「安裝到桌面」或離線快取，維持一般網頁。
12. **上網找資料**：任何從網路蒐集資料的動作（包含使用者事後要求），都要遵守 \`references/data-collection.md\`。

## 2. 島嶼一覽

中央島：**${s.centerName || s.title}**——${CENTER_ROLE[s.type]}
${s.mascotName ? `\n吉祥物：**${s.mascotName}**${s.mascotDesc ? `（${s.mascotDesc}）` : ''}。用在歡迎畫面、操作提示與面板上的導覽對話（用 SVG／CSS 或 Three.js 幾何畫出 Q 版造型）。\n` : ''}

| # | ${t.rowName} | 分類 | 一句介紹 | 對應資料 |
| --- | --- | --- | --- | --- |
${table}

## 3. 建置步驟

0. **資料盤點與提問**：先檢查每座島的內容重點、教材、${t.extraLabel}是否足夠，以及資料有沒有矛盾。有缺漏就把問題一次用編號列給使用者（最多 8 題，每題附建議的預設答案），等使用者回答；使用者回「你決定」才用預設答案，並在頁面標「示意」。資料足夠就直接進下一步。
1. **規劃**：在對話中用一張表列出每座島的地標建築、內容區塊與互動，請使用者看一眼；使用者說「直接做」就跳過確認。
2. **建立專案**：在這個資料夾裡建立 \`site/\`（只有它會被部署），網站根目錄放 \`index.html\`。結構：\`index.html\`、\`styles.css\`、\`js/\`、\`data/content.json\`（從 project.json 與 materials 整理出的全部文字內容，方便使用者日後自己改）。測試截圖放 \`_shots/\`（在 site 外面，不會被部署）。
3. **3D 群島**：用 Three.js 做低多邊形島嶼。每座島有獨特地標（依島名與「${t.extraLabel}」設計），島與島之間有橋或航道，中央島最大。支援拖曳旋轉、滾輪／雙指縮放、點島飛近、「回到全景」按鈕。島名標籤用 HTML 疊在畫面上，跟著島移動，不可互相重疊到看不清。**島形、精緻度、動物與點綴照 \`references/look-and-feel.md\`**，精緻度不可低於使用者選的等級。
4. **內容面板**：點島或從清單點選，開啟側邊面板（手機為底部抽屜），顯示一句介紹、內容重點、${t.extraLabel}、連結。面板可用 Esc 關閉，關閉後回到群島。**資訊分兩層**：3D 畫面上只放最重要的（島名、一個狀態或數字），完整內容放進面板，不要把所有文字都堆在 3D 畫面上。
5. **三組底色切換**：依 \`references/theme.md\` 做主題切換按鈕，三組底色都要能切換，記住訪客的選擇。
6. **島型玩法**：依 \`references/island-type.md\` 實作 ${t.name} 的專屬功能。${s.rpg ? '\n   **RPG 模式（已開啟）**：島型玩法完成後，依 `references/rpg-mode.md` 疊加冒險者角色、每島 NPC、挑戰計分、EXP 與等級、島章護照、中央島最終挑戰、證書與接關碼；這是「小島＋RPG」，不是另做一個遊戲。' : ''}${s.life ? '\n   **生活感模式（已開啟）**：依 `references/living-world.md` 加上居民、送貨員、市集商人、對話泡泡、交易背包、雲與鳥群、帆船、日夜循環與夜燈，並達到第 1 節的精緻度底線；不要只放幾個會滑動的小方塊。' : ''}
7. **功能**（只做下面列出的；沒列的不要做）：
${feats}
8. **好用與無障礙**：所有按鈕可用鍵盤操作；文字對比足夠；手機寬度 375px 不可出現橫向捲動；觸控目標至少 44px；支援 \`prefers-reduced-motion\`；WebGL 失敗時自動顯示文字清單版。
9. **測試**：依 \`references/checklist.md\` 逐項驗證。用瀏覽器實際操作（有 Playwright 就用 Playwright 截圖），確認 console 沒有錯誤。
10. **回報並詢問部署**：列出完成內容、示意內容、測試結果、截圖位置，然後問使用者：「要部署到哪裡？${'Netlify／GitHub Pages／Cloudflare Pages／Vercel／先不要'}」。使用者在造島工坊選的是：**${DEPLOY_NAMES[s.deploy]}**，請把它當成建議選項，仍要使用者確認。
11. **部署與驗證**：依 \`references/deploy.md\` 部署，部署後實際開啟正式網址，確認首頁與主要檔案都回應 200、3D 畫面與點島功能正常，再把網址交給使用者。
12. **留下部署紀錄**：在資料夾最上層建立 \`部署紀錄.md\`（格式見 deploy.md），並告訴使用者「之後要更新，用同一個資料夾請 AI 更新到同一個網址」。使用者之後要求更新時，依 deploy.md「之後要更新」用同一個專案重新部署，不要建立新網站。

## 4. 使用者的額外要求

${s.notes ? s.notes : '（無）'}

## 5. 交付時要告訴使用者

- 網站在哪個資料夾、怎麼在本機打開（例如 \`npx serve site\` 或 \`python -m http.server\`）。
- 正式網址（有部署的話）。
- 哪些內容是示意、需要使用者再補。
- 之後要改內容時，改 \`site/data/content.json\` 哪幾個欄位。
`;
  }

  function islandType(s) {
    const t = T()[s.type];
    const common = `# 島型說明：${t.name}

${t.desc}

## 共同畫面

- 首頁：3D 群島全景＋網站名稱＋一句話介紹（${s.tagline || '見 project.json'}）。
- 上方或下方工具列：主題切換、地點清單、回到全景、說明「?」。
- 島嶼標籤：編號＋名稱，點了會飛近並打開內容面板。
- 地點清單：列出全部島嶼（可依分類篩選），是 3D 以外的平等入口。

## 功能做法（只有 project.json 的 features 有列出的才做）

- 小嚮導問答：純前端關鍵字比對網站內容，回答附「出自哪座島」的連結；不出題目答案；不接任何 AI API，除非使用者另外要求。
- 接關碼：把進度存檔轉成一串可複製的代碼（例如 JSON → base64），在另一台裝置貼上即可還原；代碼不含姓名以外的個資，貼錯要有清楚提示。
- 背景音樂：用 Web Audio 自己合成或使用者提供的音檔，不可抓網路上的音樂。
- 小人物散步：低多邊形小人物沿著道路與橋慢慢走（不要穿過建築），數量依裝置調整（手機減半）；開啟減少動態時停在原地。小人物只是裝飾，不代表真實人數。
`;
    const specific = {
      course: `
## 課程群島的專屬功能

- **分類海域**：依島嶼的「分類」欄把島排成不同海域，清單可依海域篩選。
- **每課三分頁**：教材（內容重點與 materials 改寫）、學習單（每課 2～4 題開放題，可在瀏覽器存草稿、匯出 Markdown）、隨堂測驗（每課 3～5 題選擇題，有解析）。
- **總複習島**：中央島從各課題庫輪流抽題，題數不超過題庫總數；選項打亂後仍以 ID 判分；顯示缺答與每題解析。
- **學習進度**：記錄已讀、學習單已存、測驗分數，存在 localStorage，可一鍵清除。
- 題目由你依教材撰寫時，頁面標「自編練習題」；教材沒提到的知識不要出題。
`,
      life: `
## 個人品牌島的專屬功能

- **地標建築**：每個地點依「代表建築／物件」做出辨識度高的小建築（例如鐘樓、書店、實驗室），島上有小樹、路燈、走動的小人物等生活感細節。
- **地點介紹卡**：名稱、介紹、重點清單、外部連結按鈕（新分頁開啟，加 rel="noopener"）。
- **分類頁籤**：例如「工作與創作」「日常與休息」，數量由資料計算。
- **時鐘與天色**（有勾選時）：依訪客當地時間顯示白天／黃昏／夜晚，可手動切換。
- 不要放假的訪客計數器；沒有後端就不顯示人數。
`,
      treasure: `
## 尋寶收集島的專屬功能

- **寶箱**：每個分類一個寶箱，點開會從該分類抽一張知識卡（卡片內容來自「內容重點」，一行一張）。
- **每日鑰匙**（有勾選時）：每天固定次數（建議 3 把），用台北時區判斷日期，同一天重新整理不可重複領取。
- **圖鑑**：顯示已收集／未收集（未收集只顯示剪影與分類），收集進度由資料計算。
- **小測驗**：從已收集的卡片出題，答對可多得一把鑰匙（每天上限明確）。
- 抽卡、扣鑰匙、存檔是同一筆動作；動畫只是呈現結果。存檔放 localStorage，提供重置。
`,
      local: `
## 地方導覽島的專屬功能

- **地區島**：每個地區一座島，依「特色地標」做出辨識度高的小建築；島的排列可以大致依照真實方位，但頁面要標示「示意配置，非實際比例」。
- **地區介紹面板**：分頁呈現「概覽／景點／美食／人文」（依內容重點分類；沒有的分頁就不顯示）。
- **資料來源**：每則景點或故事若有網址就附上來源連結與查核日期；沒有來源的內容標「待查核」。不可自行編造店家、地址、電話或營業時間。
- **小嚮導**（有勾選時）：輸入問題，從網站內容用關鍵字比對找出最相關的 3 則並附出處；找不到就說找不到，不可瞎編。
- **探索護照**：登島蓋章、記錄已探索數量，存在 localStorage。
`,
      expo: `
## 展覽活動島的專屬功能

- **展區島**：每個展區一座島，依「展出作品／攤位」做出辨識度高的展台、帳篷或舞台，島上有旗幟、燈串等活動氣氛細節。
- **展區介紹面板**：展區介紹、展出作品清單（使用者有上傳圖片時做成作品牆，點圖放大）、攤位說明與外部連結。
- **活動時程**：內容重點中寫有時間（例如「10:00 開幕表演」）的項目，整理成中央服務台的時程表，依時間排序；沒有時間的就不放進時程表。
- **集章打卡**（有勾選探索進度時）：逛過一個展區得一枚章，集滿顯示完成畫面；存在 localStorage，可重置。
- 活動日期、地點、報名方式只用使用者提供的資料；沒有提供就不寫，不可自行編造。
`,
      science: `
## 現象探究島的專屬功能

- **觀念步驟島**：島嶼順序就是學習順序（1 → N）。每座島一個觀念，面板上有「上一步／下一步」，可以照順序走完，也可以直接點島跳讀。
- **互動觀測台（中央島）**：用 Three.js 或 Canvas 做一個可操作的簡化模型（例如地球儀、地圖、太陽與地球），依各島的「可操作的圖層／參數」提供：圖層開關（checkbox）、時間或參數滑桿、播放／暫停。切到某一步時，自動開啟該步驟相關的圖層並加上說明。
- **點擊看說明**：模型上的重點物件（例如一條洋流、一條時區線）可以點，跳出名稱與一句說明。
- **科學正確性最優先**：數值、方向、規則只能來自 materials 或可查證的教科書知識；不確定的不要畫上去，在回報中列為「待老師確認」。模型是簡化示意，頁面要標「示意圖，非實際比例」。
- **地圖圖資**：需要世界或地區輪廓時，只能用公有領域資料（例如 Natural Earth）並在頁面標示來源，或用自繪的簡化形狀；不可抓取來源不明的地圖或衛星影像。
- 減少動態開啟時，自動播放改成暫停，滑桿仍可手動操作。
`,
      live: `
## 動態儀表島的專屬功能

- **頻道島**：每座島對應一個頻道、課程或看板。島上的看板、旗子、窗戶燈光等，可以跟著資料變化（例如有新動態時亮起）。
- **資料來源**：只能用每座島「資料來源網址」裡使用者提供的**公開**來源，例如 Google 試算表「發佈到網路」的 CSV、RSS／Atom（YouTube 頻道也有 RSS）、公開 JSON。前端定時抓取，預設每 5 分鐘一次，可以調整。
- **誠實呈現**：每個數字旁邊都標示資料時間與最後更新時間。抓取失敗或資料過期就顯示「暫時無法更新」與上次成功的時間；**不可顯示假數字、隨機數或寫死的示範數據**冒充即時資料。沒有提供來源網址的島，標「尚未接上資料」。
- **兩層資訊**：第一層（3D 島上與中央看板）只放最重要的 1～3 個數字或最新一則標題；完整列表、歷史、連結放在第二層（點島後的面板）。
- **跨網域問題**：若資料來源不允許跨網域讀取（CORS），先告訴使用者，再建議用部署平台的 Functions 做簡單代理；需要使用者同意才做。
- **帳號與隱私**：需要 token 的來源（例如 Discord Bot、私人 API）只能放在後端環境變數，絕不寫進前端或 zip。不顯示個人姓名、帳號等個資，只呈現統計或公開標題。
`,
      runner: `
## 跑酷挑戰島的專屬功能

- **單元島**：每座島是一個單元，點島進入該單元的三跑道跑酷（Three.js 第三人稱視角，角色用幾何體自繪）。
- **玩法**：前方會出現寫有數字、詞語或圖案的物件，依「判斷規則」決定吃或閃。左右換道吃正確的、閃開錯誤的；吃錯或漏吃要扣愛心，並在畫面上簡短提示原因。
- **題目產生**：依判斷規則與內容重點，在 \`content.json\` 中寫明範圍與規則（例如 1～30 的質數），由程式產生題目並**自動驗算**正確性；不能用程式驗證的規則（例如詞性），就把正誤清單寫死在資料裡，標「自編練習題」。
- **三階段鷹架**：初級（慢速、一次一個，看清楚再決定）、中級（加速、二選一）、高級（高速、三選一）。通過初級才解鎖中級，以此類推。
- **操作**：鍵盤 ←／→（或 A／D）、手機左右滑動、畫面上的左右按鈕三種都要支援；可以暫停；開啟減少動態時自動降速、關閉閃光特效。
- **結算**：顯示答對數、吃錯與漏掉的項目清單與解析，可以「再挑戰一次」；最佳成績存在 localStorage。不做排行榜，除非使用者要求。
`,
      empathy: `
## 同理體驗島的專屬功能

> 這是特教／輔導議題，**專業審閱優先於好玩**。下列規則都是必做。

- **專業把關**：情境內容以使用者提供的資料為準；你補寫的情境、台詞、支持策略一律標「草稿，待特教或輔導專業人員確認」，並在回報中逐條列出，請使用者找專業人員看過再公開。
- **不貼標籤**：學生遊玩的畫面不出現任何診斷名稱（例如自閉症、ADHD、學習障礙），只呈現情境與感受；對應的議題只寫在中央「討論教室」的老師帶領頁。
- **尊重與正確**：不誇大、不恐懼化、不嘲笑、不可憐化，不把單一特質當成全部；結尾一定要有「這只是部分經驗的模擬，每個人的感受都不一樣」。
- **第一人稱體驗**：每座島一個情境（例如一間教室的早自習），用第一人稱視角或簡單的 2D／3D 互動呈現；聲音、畫面干擾等效果用來表達感受。
- **感官安全**：音量、畫面晃動、干擾程度都有開關與強度滑桿，**預設溫和**；畫面上隨時有「暫停／離開」按鈕；不使用快速閃爍（每秒超過 3 次的閃光不可出現）；開啟減少動態時關閉所有晃動。
- **支持模式**：每個情境玩完後，可以套用該島的「支持策略」再玩一次，畫面並排或前後對照差異。
- **帶領流程**：討論教室提供 45 分鐘帶領流程（暖身 5 分、體驗 15 分、支持模式 10 分、討論 10 分、總結 5 分）與討論題（環境可以怎麼調整？身邊的人可以怎麼幫忙？），可列印。
- **不收集資料**：不記錄學生姓名與作答內容，不做評分排名。
`,
      literature: `
## 文獻知識島的專屬功能

> 這是學術資料，**著作權與正確性優先**。下列規則都是必做。

- **城市對應**：每座島是一個研究主題，島上的街道是子主題，每篇文獻是一棟房子。請在說明頁寫清楚對應規則，例如：屋頂顏色是期刊或來源類型、房子形狀是文獻類型（實證研究、回顧、指引等）、窗戶數量是作者人數。
- **只放可以放的**：每棟房子只放書目資訊（標題、作者、期刊、年份、DOI 連結）、使用者自己寫的筆記與標籤。**不放全文、不放 PDF、不轉貼摘要原文**；只有文獻本身是 CC 等開放授權時，才可以附上原文連結並標示授權。
- **書目來源**：優先用使用者上傳的 BibTeX／RIS／CSV（Zotero、EndNote 匯出）；只有 DOI 時，用 Crossref REST API（api.crossref.org）或 OpenAlex（api.openalex.org）這類開放書目資料查詢，標示查詢日期，並把查到的結果存進 \`data/content.json\`，網站不要每次開啟都重新查詢。查不到的標「待確認」，**不可自行補作者、年份或期刊**。
- **撤回文獻**：查詢時一併檢查撤回（retraction）狀態；被撤回的文獻在城市中要明顯標示（例如貼封條、變灰），並註明資料來源與日期。
- **好用功能**：依作者、年份、期刊、標籤搜尋與篩選；每篇可以一鍵複製 APA 第 7 版引用格式；中央圖書館可以匯出所有文獻的引用清單。
- **公開前提醒**：網站要公開時，提醒使用者再確認一次，筆記裡沒有未發表資料或個人資料。
`,
      portfolio: `
## 學習歷程島的專屬功能

> 這是個人經歷，**真實與隱私優先**。下列規則都是必做。

- **時間群島**：島嶼順序就是時間順序（1 → N），相鄰的島用橋連起來，橋上可標年份或學期（取自「一句介紹」或「分類」；沒有寫就不標）。「分類」欄（例如社團、課程、志工、競賽、工作）決定島的顏色與清單篩選。
- **建築＝一件事**：每座島的「內容重點」一行一棟建築，代表「我做了什麼」。建築做成開放式小房間（牆面切開或屋頂可掀），點進去看到一個低多邊形小人在做那件事（講電話、開會、寫企劃、上台、做實驗等，依文字挑最接近的動作；挑不出來就用「在桌前工作」）。
- **能力 +1**：每一行若寫成「做了什麼 → 能力A、能力B」，箭頭後面就是這棟建築用到的能力；沒有箭頭時用該島的「用到的能力」欄。點開建築時跳出「能力A +1」浮動標籤，同一棟建築重複點不重複加分。能力只能來自使用者寫的文字，**不可自行替使用者加能力**。
- **反思三問**：每棟建築的面板下方有三題可以填寫並存在瀏覽器：「這件事讓我學到什麼？」「這個能力解決了現場什麼問題？」「如果面試官問這段經歷，我會怎麼回答？」。可一鍵匯出全部反思為 Markdown，方便貼進學習歷程或備審資料。
- **能力總覽塔（中央島）**：時間軸成長路線圖、每項能力的累計次數（長條或雷達圖，數字由資料計算，不顯示假的等級或分數），點能力可列出用到它的建築並飛過去。
- **真實與隱私**：經歷、成果、獎項、單位名稱只用使用者提供的資料，不可編造或美化；你補寫的示範內容一律標「示意」。網站公開前提醒使用者確認：沒有身分證字號、生日、住址、電話、學號，沒有未經同意的他人姓名或照片；學生作品建議只放化名或姓氏。
- **分享**（有勾選時）：產生一張成長路線摘要圖（Canvas 繪製、可下載 PNG），只含網站上已公開的內容。
`,
      quest: `
## 闖關冒險島的專屬功能

- **登島對話**：每關有一位角色（看「角色／觀念怪獸」欄），用對話框介紹這一關的觀念。
- **觀念怪獸**：每關 3～6 題選擇題，答對讓怪獸「被修好」；答錯給提示，不直接公布答案。
- **集章護照**：通過一關得一枚章，進度存在 localStorage。
- **最終挑戰**：中央島在所有關卡通過後解鎖，從各關抽題；及格可輸入姓名產生證書（Canvas 繪製、可下載 PNG、可列印），證書加註「本證書為學習紀錄，非官方認證」。
- 背景音樂（有勾選時）：使用者按下才播放，可隨時關閉，不自動播放。
`
    };
    return common + specific[s.type];
  }

  function theme(s) {
    const rows = s.themes.map((x, n) => `| ${n + 1}${n === 0 ? '（預設）' : ''} | ${x.name} | \`${x.bg}\` |`).join('\n');
    return `# 配色與風格

- 視覺風格：**${IF.STYLES[s.style]}**
- 字體：**${IF.FONTS[s.font][0]}**（${IF.FONTS[s.font][1]}）。建議 font-family：\`${IF.FONTS[s.font][2]}\`${IF.FONTS[s.font][3] ? `，從 Google Fonts 載入（\`https://fonts.googleapis.com/css2?family=${IF.FONTS[s.font][3]}&display=swap\`，開源字型）` : '，從 Google Fonts 載入 Noto Sans TC 並加 `display=swap`'}；手寫感字體只用在標題與島名，內文仍用易讀的黑體。
- 主色：\`${s.primary}\`（按鈕、選取狀態）
- 強調色：\`${s.accent}\`（標籤、重點、進度）

## 三組底色（訪客可以切換）

| 順序 | 名稱 | 底色 |
| --- | --- | --- |
${rows}

## 實作要求

1. 用 CSS 變數（custom properties）定義 \`--bg\`、\`--surface\`、\`--ink\`、\`--muted\`、\`--line\`、\`--primary\`、\`--accent\`，三組主題各自一套，用 \`<html data-theme="...">\` 切換。
2. 依底色亮度自動決定文字顏色：淺底用深色字，深底用淺色字；所有文字對比至少 4.5:1。
3. 3D 場景的天空、海水、霧也要跟著主題變（深色主題就是夜晚海面，可加燈光）。
4. 畫面上放一組三顆的底色切換按鈕（顯示色塊＋名稱），目前選中的要有明顯標示；選擇存在 localStorage。
5. 第一次進站用第 1 組（預設）。不要預設成黑色，除非第 1 組本身就是深色。
6. **底色主題和晝夜光線是兩件事**：底色主題決定介面、海面與天空的色調；晝夜切換（有勾選時）只改變 3D 場景的光線強弱與方向、窗戶燈光。兩者可以任意組合；切到深色底色時，預設把光線調成夜晚，但使用者仍可再切回白天光線。
${s.themeAuto ? (([d, k, n]) => `7. **底色跟著日出日落自動換（使用者有勾，預設就是這個模式）**：白天用「${s.themes[d].name}」、黃昏（含清晨）用「${s.themes[k].name}」、夜晚用「${s.themes[n].name}」。
   - 網站有晝夜循環（生活感模式或晝夜功能）時，跟著場景的時段換；沒有的話依訪客電腦時間：06–16 白天、16–19 與 05–06 黃昏、19–05 夜晚。
   - 換色用 1.5 秒以上的漸變（CSS 變數 transition＋3D 天空、海面、霧一起漸變），不要閃一下。
   - 底色切換按鈕多一顆「🌅 自動」，第一次進站就選它；訪客手動選某一組後固定那組並存 localStorage，按「🌅 自動」才恢復。這一條優先於第 5、6 條的「預設用第 1 組」。
   - 驗收：把時段切到白天、黃昏、夜晚各截一張圖，確認底色分別是上面三組，文字對比都至少 4.5:1。
`)(IF.themeByTime(s.themes)) : ''}`;
  }

  function checklist(s) {
    const t = T()[s.type];
    return `# 驗收清單

完成後逐項確認，回報時附上結果（✅／❌＋原因）。沒有實際測過的不能寫成通過。

## 內容
- [ ] 網站名稱、一句話介紹、作者與 project.json 一致
- [ ] 島嶼數量、名稱、順序與 project.json 一致（共 ${s.islands.filter(i => i.name.trim()).length} 座＋中央島）
- [ ] 每座島都有內容；示意內容有標示
- [ ] 有上網整理資料時：每則附來源網址與查詢日期，頁尾有「資料來源」區與非官方聲明（沒有就標「不適用」）
- [ ] 有填連結的島：連結可以開啟，並在新分頁開啟（沒有連結就標「不適用」）

## 3D 與操作
- [ ] 群島可以拖曳旋轉、縮放，「回到全景」有效
- [ ] 點島標籤與點清單會打開同一座島的內容
- [ ] 標籤沒有互相重疊到看不清
- [ ] Esc 可以關閉面板；鍵盤可以操作清單與按鈕

## ${t.name}
- [ ] 依 references/island-type.md 的專屬功能都能實際操作
- [ ] 重新整理後進度仍在；重置功能有效

${s.rpg ? `## RPG 模式
- [ ] 建立冒險者（代號＋造型）後角色出現在群島上；「先逛逛，不玩」可直接瀏覽
- [ ] 點島標籤或清單，角色沿著橋／航道走過去（沒有瞬移、沒有穿過建築）；桌機方向鍵可走動
- [ ] 每座島都有 NPC，「聽故事／給提示／接受挑戰」三個選項都能用
- [ ] 實測一輪計分：第一次登島 +5、第一次答對 +10、再答對 +2、第一次過關 +10，數字與畫面一致
- [ ] 作答後選項鎖定並顯示詳解；選項順序打亂後判分仍正確
- [ ] 重玩過關不會重複蓋章；等級依 EXP 正確升級
- [ ] 島章達門檻才解鎖中央島最終挑戰；通過後證書可下載 PNG、可列印，且有「非官方認證」字樣
- [ ] 兩個不同冒險者代號的存檔互不影響；重新整理後可接著玩
- [ ] 接關碼複製到無痕視窗可還原；貼錯或改壞的接關碼會顯示錯誤、頁面不會壞
- [ ] 不開 3D 也能從清單完成 NPC 對話與挑戰；減少動態時角色不播走路動畫

` : ''}${s.life ? `## 生活感模式與精緻度
- [ ] 精緻度底線逐項達成：陰影、天空漸層、起伏海面＋浪花、不規則海岸、每島房子／樹／花／岩石／碼頭、遠景
- [ ] 居民會走路（手腳擺動）、會停、會揮手；送貨員扛貨箱過橋、交貨後空手回程；沒有人穿過建築
- [ ] 點居民：停下、轉向鏡頭、出現對話泡泡；再聊聊會換句話；Esc 與點空白處可關閉；手機點得到
- [ ] 對話內容都出自該島的介紹與內容重點（逐島抽查 3 位）
- [ ] 撿貝殼 +1、交易成功背包更新、物品不夠時按鈕停用；重新整理後背包仍在
- [ ] 雲、鳥群、帆船都在動，雲沒有擋住鏡頭；夜晚鳥群隱藏
- [ ] 白天／黃昏／夜晚／自動四個時段都能切換且平滑過渡；夜晚路燈、窗戶、市集燈亮起，有星星
- [ ] 截圖存證：白天、黃昏、夜晚各一張＋點居民對話一張（桌機與手機）
- [ ] 效能：手機尺寸操作不卡頓，低畫質會關陰影；減少動態時居民與雲鳥都停止

` : ''}## 島嶼外觀（references/look-and-feel.md）
- [ ] 島形是「${IF.SHAPES[lookOf(s).shape][0].replace(/^\S+\s/, '')}」，特徵都做到（見該檔第 1 節）
- [ ] 精緻度達到「${IF.DETAIL[lookOf(s).detail][0]}」等級的要求（逐項對照第 2 節表格）
${lookOf(s).animals.length ? `- [ ] 動物都出現：${lookOf(s).animals.map(k => IF.ANIMALS[k][0] + IF.ANIMALS[k][1]).join('、')}；會動、點了會說話、夜晚休息、減少動態時停止
` : ''}${lookOf(s).extras.length ? `- [ ] 點綴都出現：${lookOf(s).extras.map(k => IF.EXTRAS[k][0]).join('、')}，沒有擋住標籤或點擊目標
` : ''}${lookOf(s).cinema !== 'off' ? `- [ ] 鏡頭運鏡「${IF.CINEMA[lookOf(s).cinema][0]}」：開場運鏡會播、可點畫面或 Esc 跳過；點島會平滑飛近再開面板；減少動態時不播
` : ''}- [ ] 截圖：全景、拉近一座島、手機直式（_shots/look-*.png）

## 主題
- [ ] 三組底色都能切換，3D 場景跟著變
- [ ] 重新整理後記得上次選的主題

## 裝置與品質
- [ ] RWD：桌機 1440×900、平板 768×1024、手機 375×812 都正常，手機沒有橫向捲動，旋轉螢幕後 3D 畫面重新符合尺寸
- [ ] 沒有 PWA：沒有 manifest.json、沒有註冊 service worker
- [ ] WebGL 關閉或失敗時，仍能從文字清單讀到全部內容
- [ ] 開啟「減少動態」時動畫會停止
- [ ] 瀏覽器 console 沒有錯誤
- [ ] 沒有任何金鑰或密碼寫在檔案裡

## 部署（使用者同意部署時）
- [ ] 正式網址首頁回應 200
- [ ] index.html 引用的 CSS、JS 與 data/content.json 都回應 200
- [ ] 正式網址實際操作：點一座島能打開內容
- [ ] 已在造島包資料夾最上層建立 \`部署紀錄.md\`（網址、平台、專案名稱、更新指令，不含密碼）
`;
  }

  function dataCollection(s) {
    const urls = webList(s);
    return `# 網路資料蒐集規範

${urls.length ? `使用者希望你從下列 ${urls.length} 個公開網址整理資料：\n\n${urls.map(u => '- ' + u).join('\n')}\n` : '使用者沒有指定網址。只有在使用者之後明確要求上網找資料時，才依本規範進行。\n'}
## 開始前
1. 先檢查網站的 \`robots.txt\` 與使用條款；有禁止自動抓取的路徑就不要抓，改請使用者手動提供資料。
2. 有官方 API、開放資料平台（例如政府資料開放平臺）或可下載的 CSV／RSS 時，**優先用這些**，不要爬網頁。
3. 只讀公開頁面。需要登入、付費、驗證碼的頁面一律不抓，也不要嘗試繞過。

## 抓取時
- 放慢速度：同一個網站每次請求間隔至少 1 秒，總頁數控制在完成任務所需的最少量（一般 50 頁內）；遇到 429 或 403 就停下並告訴使用者。
- User-Agent 誠實標示用途，不偽裝成其他瀏覽器或搜尋引擎。
- 只取事實性資料：名稱、分類、連結、日期、簡短描述。**不複製整段文章、不下載圖片與影片、不抓電話、Email 以外的個人資料**（公開的單位聯絡信箱可以保留）。

## 寫進網站時
- 內容用自己的話改寫成摘要（每則 100 字內），每則附「來源網址」與「查詢日期」。
- 數字（人數、日期、金額）照原文，不可推測或四捨五入成新數字；查不到的標「待確認」。
- 在網站頁尾加「資料來源」區，列出所有來源網站與查詢日期，並註明「本站為非官方整理，正確資訊以原網站為準」。
- 把整理好的原始資料存成 \`data/content.json\`（網站讀這個檔），**網站上線後不要在訪客瀏覽時即時爬取別人的網站**。

## 回報
完成後列出：抓了哪些網址、跳過哪些（原因）、哪些資料標了待確認。
`;
  }

  function deploy(s) {
    return `# 部署說明

> 只有在使用者明確同意後才部署。使用者在造島工坊選的偏好：**${DEPLOY_NAMES[s.deploy]}**。
> 部署前先問：「要放到哪裡？Netlify／GitHub Pages／Cloudflare Pages／Vercel／先不要」，並說明各自需要的帳號。
> 需要登入時，請使用者自己在終端機執行登入指令，不要索取或保存密碼、token。

網站根目錄是 \`site/\`（裡面直接有 index.html），沒有建置步驟。專案名稱建議用 \`${slugOf(s)}\`。

## Netlify
- 最簡單：打開 https://app.netlify.com/drop ，把 \`site\` 資料夾拖進去。
- 指令：\`npx netlify-cli login\`（使用者自己登入）→ \`npx netlify-cli deploy --dir site --prod\`，第一次會詢問建立新網站。
- 免費方案的新網站右下角預設會出現「Powered by Netlify」徽章，可能蓋到網站按鈕。先問使用者要不要關；要關就到 Netlify 後台 Project configuration → General → Powered by Netlify badge 關閉（不需重新部署）。

## GitHub Pages
1. 使用者先登入：\`gh auth login\`。
2. 在 site 資料夾建立 repo 並推上去：
   \`\`\`
   cd site
   git init && git add . && git commit -m "first island"
   gh repo create ${slugOf(s)} --public --source . --push
   \`\`\`
3. 開啟 Pages：\`gh api -X POST repos/{owner}/${slugOf(s)}/pages -f "source[branch]=main" -f "source[path]=/"\`（或到 repo 的 Settings → Pages 選 main）。
4. 網址：\`https://<帳號>.github.io/${slugOf(s)}/\`，第一次約需 1～2 分鐘。注意網站在子路徑下，所有資源要用相對路徑。

## Cloudflare Pages
- \`npx wrangler login\`（使用者自己登入）→ \`npx wrangler pages deploy site --project-name ${slugOf(s)} --branch main\`。
- 新版 wrangler 第一次建立專案若失敗，依錯誤訊息先建立 Pages 專案再部署。

## Vercel
- \`npx vercel login\` → \`npx vercel deploy site --prod\`。

## 部署後必做驗證
1. 用瀏覽器或 \`curl -I\` 確認正式網址首頁回應 200。
2. 確認 index.html 引用的 CSS、JS 與 \`data/content.json\` 都回應 200（逐一檢查實際引用的檔名）。
3. 實際打開網址，點一座島，內容面板要出現；console 沒有錯誤。
4. 把正式網址、驗證結果交給使用者。

## 部署後一定要留下「部署紀錄.md」

第一次部署成功後，在**造島包資料夾最上層**（和 START_HERE.md 同一層，不是 site/ 裡面）建立 \`部署紀錄.md\`，讓使用者下次（或換一個 AI、換一台電腦）也能更新到同一個網址：

\`\`\`
# 部署紀錄
- 正式網址：https://……
- 平台：Netlify／GitHub Pages／Cloudflare Pages／Vercel
- 專案名稱（或 Repo）：……　專案 ID：……（平台有提供才寫）
- 登入的帳號：（只寫 Email 或帳號名稱，絕對不寫密碼、token）
- 更新指令：……（下面「之後要更新」對應平台的那一行，填好實際名稱）
- 最後更新：YYYY-MM-DD
\`\`\`

同時**不要刪除**平台自動產生的連結資料：\`site/.netlify/\`、\`site/.vercel/\`、\`site/.git/\`、\`site/.wrangler/\`。

## 之後要更新（重新上架到同一個網址）

使用者改內容後請你更新時：先讀 \`部署紀錄.md\`，修改並在本機測試，再用**同一個專案**重新部署，**不要建立新網站**（新網站會變成新網址，舊網址還是舊內容）。沒有部署紀錄時，先問使用者正式網址與平台。

| 平台 | 更新方法 |
| --- | --- |
| Netlify | \`npx netlify-cli deploy --dir site --prod --site <專案名稱或 ID>\`；用拖曳上架的人：Netlify 後台 → 該專案 → Deploys → 把 site 資料夾拖進頁面下方的上傳區（不要回 app.netlify.com/drop，那會開新網站） |
| GitHub Pages | \`cd site\` → \`git add .\` → \`git commit -m "更新內容"\` → \`git push\`，約 1～2 分鐘生效 |
| Cloudflare Pages | \`npx wrangler pages deploy site --project-name <同一個專案名稱> --branch main\` |
| Vercel | 在同一個資料夾執行 \`npx vercel deploy site --prod\`（會沿用 site/.vercel 的連結） |

更新後同樣做「部署後必做驗證」，並把 \`部署紀錄.md\` 的「最後更新」改成今天。提醒使用者看不到新內容時按 **Ctrl + F5** 強制重新整理（手機可關掉分頁重開）。
`;
  }

  function materialsIndex(s, files) {
    if (!files.length) return '# 使用者上傳的資料\n\n（使用者沒有上傳檔案。' + (webList(s).length ? '使用者指定了公開網址，請依 references/data-collection.md 整理資料；' : '') + '其餘請依 project.json 的內容重點撰寫內容，並把補寫的部分標示為「示意」。）\n';
    const used = {};
    s.islands.forEach(i => { if (i.file) (used[safePath(i.file)] = used[safePath(i.file)] || []).push(i.name); });
    files.forEach(f => { const k = isleFor(s, f); if (k) { const u = used[safePath(f.name)] = used[safePath(f.name)] || []; const v = k === '共用' ? '全站共用' : k; if (!u.includes(v)) u.push(v); } });
    const byFolder = files.some(f => f.folder);
    return '# 使用者上傳的資料\n\n| 檔案 | 大小 | 說明 | 對應島嶼 |\n| --- | --- | --- | --- |\n' +
      files.map(f => `| ${safePath(f.name)} | ${Math.ceil(f.size / 1024)} KB | ${(f.note || '—').replace(/\|/g, '／')} | ${(used[safePath(f.name)] || []).join('、') || '—'} |`).join('\n') +
      (byFolder ? '\n\n> 資料夾規則：`materials/` 底下以島名命名的資料夾（前面可能有編號，例如 `01_島名`）裡的檔案只屬於那一座島，對應見上表與 project.json 每座島的 `materials`；`共用`（例如 `00_共用`）是全站共用。寫某座島的內容時，以它自己資料夾裡的檔案為準，不要把別座島的資料混進來。' : '') +
      `\n\n> 公開下載：${s.publishMaterials ? '允許放上網站' : '不允許，只能改寫內容後使用'}。\n`;
  }

  function readmeHuman(s) {
    return `# ${s.title}｜造島包使用說明（給人看）

這包是用「造島工坊」產生的。裡面不是網站本身，而是**給 AI 看的施工說明＋你的資料**。

## 怎麼用

1. 把這個資料夾放在好找的位置（例如桌面）。
2. 用你的 AI 打開這個資料夾：
   - Claude Code：在資料夾裡開終端機，輸入 \`claude\`。
   - Codex／Gemini CLI：同樣在資料夾裡啟動。
   - Antigravity／Cursor：用「開啟資料夾」選這個資料夾。
3. 把下面這段指令整段貼給 AI（造島工坊的「複製給 AI 的指令」按鈕複製的就是這段）：

\`\`\`
${prompt(s)}
\`\`\`

4. AI 讀完資料後，如果發現資料不夠或看不懂，會一次列出幾個問題問你（每題附建議答案）。照著回答就好；不知道怎麼答可以回「你決定」，AI 會用建議答案並標「示意」，之後再補也可以。
5. AI 接著列出規劃表，你回「可以」或「直接做」，它就會動手做、測試，最後問你要放到哪個網站。回答它就好。
6. AI 要求「允許執行指令／安裝套件」時，按允許即可；但**不要把密碼或 token 告訴 AI**，登入請自己在終端機操作。

## 資料夾內容

| 檔案 | 是什麼 |
| --- | --- |
| START_HERE.md | AI 的入口 |
| SKILL.md | 完整建置流程 |
| project.json | 你在造島工坊填的所有資料 |
| islands.csv | 島嶼清單（可以用 Excel 開） |
| references/ | 島型、配色、驗收、部署說明 |
| references/look-and-feel.md | 島嶼外觀：島形、精緻度、動物、點綴 |
| CHANGELOG.md | 版本紀錄（第 1 版、第 2 版……） |${s.rpg ? '\n| references/rpg-mode.md | RPG 模式規格：冒險者、NPC、EXP 與等級、島章、證書、接關碼 |' : ''}${s.life ? '\n| references/living-world.md | 生活感模式：居民、交易、雲與鳥、日夜燈光、精緻度底線 |' : ''}
| materials/ | 你上傳的檔案 |
| references/data-collection.md | AI 上網找資料時要遵守的規範 |

## 上架後想更新內容？

AI 第一次幫你上架後，會在這個資料夾留下 \`部署紀錄.md\`（記錄網址、平台、更新指令）。**請保留整個資料夾**，換電腦就整包帶走。

1. 用 AI 打開**同一個資料夾**（不要重新下載造島包另開資料夾）。
2. 貼上這段，把「要改什麼」換成你的需求：

\`\`\`
請先讀這個資料夾的「部署紀錄.md」和 SKILL.md。幫我把網站改成：（寫下要改什麼）。改好後在本機測試，再更新到原本同一個網址，不要建立新網站；最後打開正式網址確認，並更新部署紀錄的日期。
\`\`\`

3. 打開網址看不到新內容時，按 **Ctrl + F5** 強制重新整理（手機可以關掉分頁重開）。

- 只改幾個字：也可以自己改 \`site/data/content.json\`，再請 AI「更新到同一個網址」。
- 想加島、加動物、換外觀或配色（**做第 2 版**）：
  1. 把這整個資料夾（AI 做好後，裡面會有 \`site/\` 和 \`部署紀錄.md\`）壓縮成 zip。
  2. 回到造島工坊按「🔄 更新已做好的島」，選這個 zip，在表單裡修改，並寫下「這次要更新什麼」。
  3. 下載「第 2 版更新包」，解壓後用 AI 打開，貼上造島工坊給的「第 2 版更新指令」。AI 會只改你要的部分，並更新到原本同一個網址。
- 找不到部署紀錄：告訴 AI 你的正式網址和平台（例如 Netlify），它就能接著更新。
`;
  }

  /* CLAUDE.md／AGENTS.md／GEMINI.md：各家 AI 每次對話都會自動載入的專案規則 */
  const TOOL_NOTES = {
    CLAUDE: `這份檔案給 **Claude Code** 讀（每次對話自動載入）。

- 開工後先建立待辦清單（Todo），把 SKILL.md 的建置步驟與 checklist.md 的項目放進去，逐項完成。
- 要執行指令、安裝套件時會跳出權限詢問；請先用一句話告訴使用者為什麼要按「允許」。
- 測試優先用 Playwright（Playwright MCP 或 \`npx playwright\`）實際開網頁、截圖到 \`_shots/\`。`,
    AGENTS: `這份檔案給 **Codex** 讀（每次對話自動載入）；Cursor、Antigravity 等支援 AGENTS.md 的工具也適用。

- Codex 的沙盒預設可能**不允許網路或安裝套件**。需要 \`npx\`、\`npm install\`、下載 Playwright 瀏覽器或部署時，請申請提高權限（escalate），並用一句話告訴使用者原因；**不可因為沙盒限制就略過測試或部署，也不可把沒跑成功的測試寫成通過。**
- Windows 上指令請用 PowerShell 語法；起本機伺服器可用 \`npx serve site\` 或 \`python -m http.server --directory site\`。
- 請一路做到驗收清單全部完成才回報，不要每做一小步就停下來等指示（需要使用者決定的事除外）。
- Cursor／Antigravity：請在 Agent 模式執行，才能建立檔案與執行指令。`,
    GEMINI: `這份檔案給 **Gemini CLI** 讀（每次對話自動載入）；Antigravity 也適用。

- 執行指令、寫入檔案前會詢問使用者；請先用一句話說明用途。
- 用 \`read_many_files\` 一次讀完 references/ 與 materials/ 的文字檔，不要只讀開頭。
- 測試請實際用瀏覽器（有 Playwright 就用）開網頁、截圖到 \`_shots/\`，確認 console 沒有錯誤。`
  };
  const pointer = name => `# ${name}｜造島包專案規則

這個資料夾是「造島工坊 IsleForge」產生的**造島包**，不是網站本身。你的任務是依照裡面的規格，蓋出 3D 島嶼網站並在本機測試，使用者同意後再部署。

## 開工順序（全部讀完再動手）

1. \`START_HERE.md\` → \`SKILL.md\`（工作說明書）→ \`project.json\`（唯一規格來源）。
2. \`references/\` 全部：island-type.md、theme.md、checklist.md；有網址時讀 data-collection.md；部署前讀 deploy.md。
3. \`materials/_index.md\` 和 \`materials/\` 裡的檔案（使用者提供的內容）。

## 一定要遵守

- 網站名稱、島嶼名稱、數量、順序照 \`project.json\`，不自行增刪；SKILL.md「不可以違反」的規則優先於你的習慣做法。
- 不捏造人物、機構、數字、網址；補寫的內容標「示意」，回報時列出來。
- 網站只放在 \`site/\`（純靜態，不用 API 金鑰）；測試截圖放 \`_shots/\`。
- 不把任何密碼、token 寫進檔案；需要登入時請使用者自己在終端機登入。
- **沒有實際測過的項目不能說通過**；部署一定要先得到使用者同意，部署後打開正式網址驗證。

## 資料不夠時要問使用者（很重要）

使用者通常不是工程師，表單可能填得很少。**不要默默用一堆示意內容把網站填滿，也不要因為資料少就做不下去。**

1. 讀完所有檔案後，先做「資料盤點」：列出每座島有沒有內容重點、有沒有對應教材、哪些欄位空白、哪些地方互相矛盾或看不懂。
2. 有缺漏時，把問題**一次整理好**問使用者：用編號列出（最多 8 題，先問最影響成品的），每題附上「你建議的預設答案」，讓使用者可以只回「1 同意、2 改成…」。
3. 告訴使用者三種回法：直接回答／貼上或放進資料到 \`materials/\`／回「你決定」。回「你決定」時才用預設答案，並在頁面標「示意」。
4. 使用者回答後再給規劃表；資料都夠時不用硬問，直接給規劃表。
5. 做的過程中遇到需要使用者決定的事（資料衝突、檔案打不開、需要登入或權限），**停下來問**，不要自己猜、也不要直接放棄。

## 怎樣才算做好

- 資料盤點與提問完成後給規劃表，使用者同意（或說「直接做」）後一路做完，不要只做骨架、留 TODO 或假資料。
- 每座島的地標都不一樣、看得出是哪座島；島型專屬玩法都能實際操作。
- 桌機 1440px、平板 768px、手機 375px 都好用，console 沒有錯誤，\`references/checklist.md\` 逐項打勾。
- 遇到錯誤先自己找原因修好；只有資料衝突、要不要部署這類需要使用者決定的事才問。

## 這個工具的注意事項

${TOOL_NOTES[name]}

## 溝通

所有回覆使用繁體中文（臺灣用語）。使用者可能不是工程師，請用簡單的話說明你在做什麼、需要使用者按什麼。
`;

  /* 打包：規格文件（第 1 版與更新包共用） */
  function writeSpec(root, s, files) {
    root.file('START_HERE.md', startHere(s));
    root.file('README_使用說明.md', readmeHuman(s));
    root.file('SKILL.md', skill(s, files));
    root.file('project.json', JSON.stringify(projectJson(s, files), null, 2));
    root.file('islands.csv', islandsCsv(s, files));
    root.file('AGENTS.md', pointer('AGENTS'));
    root.file('CLAUDE.md', pointer('CLAUDE'));
    root.file('GEMINI.md', pointer('GEMINI'));
    const ref = root.folder('references');
    ref.file('island-type.md', islandType(s));
    if (s.rpg) ref.file('rpg-mode.md', rpgDoc(s)); else root.remove('references/rpg-mode.md');
    if (s.life) ref.file('living-world.md', lifeDoc(s)); else root.remove('references/living-world.md');
    ref.file('look-and-feel.md', lookDoc(s));
    ref.file('theme.md', theme(s));
    ref.file('checklist.md', checklist(s));
    ref.file('deploy.md', deploy(s));
    ref.file('data-collection.md', dataCollection(s));
    root.folder('materials').file('_index.md', materialsIndex(s, files));
  }
  async function build(s, files) {
    const zip = new JSZip();
    const root = zip.folder(slugOf(s) + '-islekit');
    writeSpec(root, s, files);
    root.file('CHANGELOG.md', `# 變更紀錄｜${s.title}\n\n## 第 1 版（${today()}）\n\n- 由造島工坊產生的第一版造島包。之後要更新，請到造島工坊按「🔄 更新已做好的島」做第 2 版。\n`);
    const mat = root.folder('materials');
    files.forEach(f => mat.file(safePath(f.name), f.file));
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  }

  IF.kit = { build, prompt, slugOf, webList, readBase, buildUpdate, updatePrompt, changesFor, UPDATE_KINDS, isleFor, normIsle, safePath };
})();
