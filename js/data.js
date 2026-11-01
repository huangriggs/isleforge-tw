/* 造島工坊：島型、風格、功能、配色預設與範例資料 */
window.IF = window.IF || {};

IF.TYPES = {
  course: {
    name: '課程群島', icon: '📚',
    desc: '一課一座島：讀教材、填學習單、做隨堂測驗，中央島是總複習。',
    fits: '適合：國語、社會、自然、職訓課程',
    rowName: '課名', extraLabel: '學習目標', extraHolder: '例：能說出三種提示詞技巧',
    pointsHolder: '這一課要教的重點，一行一點',
    centerHint: '總複習島',
    defaultFeatures: ['search', 'list', 'progress', 'quiz', 'dayNight', 'reducedMotion']
  },
  life: {
    name: '個人品牌島', icon: '🏡',
    desc: '把你的作品、課程、服務與生活興趣，變成一個個可以逛的地點。',
    fits: '適合：老師、工作室、社團、學校處室',
    rowName: '地點名稱', extraLabel: '代表建築／物件', extraHolder: '例：大鐘樓、圖書館、咖啡車',
    pointsHolder: '要介紹的內容，一行一點',
    centerHint: '中央廣場',
    defaultFeatures: ['search', 'list', 'dayNight', 'clock', 'reducedMotion']
  },
  treasure: {
    name: '尋寶收集島', icon: '🗝️',
    desc: '點寶箱抽知識卡、收集圖鑑、每日鑰匙，搭配小測驗。',
    fits: '適合：AI 工具圖鑑、單字、知識卡收藏',
    rowName: '寶箱分類', extraLabel: '卡片數', extraHolder: '例：8',
    pointsHolder: '這個分類要放的卡片（一行一張，可加網址）',
    centerHint: '寶物總部',
    defaultFeatures: ['list', 'progress', 'quiz', 'dailyKey', 'collection', 'reducedMotion']
  },
  local: {
    name: '地方導覽島', icon: '🗺️',
    desc: '一個地區一座島：特色地標、美食、景點、人文故事，加上小嚮導問答。',
    fits: '適合：縣市行政區、校園導覽、社區走讀',
    rowName: '地區名稱', extraLabel: '特色地標', extraHolder: '例：老街、橋、廟宇、車站',
    pointsHolder: '景點、美食、人文故事，一行一則（可加來源網址）',
    centerHint: '旅客服務中心',
    defaultFeatures: ['search', 'list', 'progress', 'guide', 'dayNight', 'reducedMotion']
  },
  expo: {
    name: '展覽活動島', icon: '🎪',
    desc: '一個展區一座島：作品展示、活動時程、攤位介紹，逛完還能集章打卡。',
    fits: '適合：成果發表會、校慶園遊會、節慶活動',
    rowName: '展區名稱', extraLabel: '展出作品／攤位', extraHolder: '例：三年級 AI 繪本、科學闖關攤',
    pointsHolder: '展出內容或活動場次，一行一則（例：10:00 開幕表演）',
    centerHint: '活動服務台',
    defaultFeatures: ['search', 'list', 'progress', 'share', 'dayNight', 'reducedMotion']
  },
  science: {
    name: '現象探究島', icon: '🌏',
    desc: '一座島一個觀念步驟，中央是能拉滑桿、開關圖層的互動觀測台，一步步看懂會變化的現象。',
    fits: '適合：洋流、時區、季風、月相、板塊等自然與地理現象',
    rowName: '觀念步驟', extraLabel: '可操作的圖層／參數', extraHolder: '例：暖流／寒流圖層、時間滑桿',
    pointsHolder: '這一步要看懂的事，一行一點（可附教科書頁碼或來源網址）',
    centerHint: '互動觀測台',
    defaultFeatures: ['list', 'progress', 'quiz', 'reducedMotion']
  },
  live: {
    name: '動態儀表島', icon: '📡',
    desc: '一個頻道一座島，定時抓取公開資料（試算表、RSS、YouTube），把最新動態變成會更新的島嶼看板。',
    fits: '適合：社群、課程公告、班級或處室最新消息',
    rowName: '頻道／看板名稱', extraLabel: '資料來源網址', extraHolder: '例：Google 試算表發佈的 CSV 或 RSS 網址',
    pointsHolder: '這座島要顯示哪些資訊，重要的寫前面（一行一項）',
    centerHint: '即時總看板',
    defaultFeatures: ['list', 'search', 'people', 'dayNight', 'clock', 'reducedMotion']
  },
  runner: {
    name: '跑酷挑戰島', icon: '🏃',
    desc: '一座島一個單元，進島變成三跑道跑酷：左右換道吃對的、閃開錯的，分初、中、高三級。',
    fits: '適合：倍數、質數、單字詞性、分類判斷等快速辨識練習',
    rowName: '單元名稱', extraLabel: '判斷規則', extraHolder: '例：吃 4 的倍數、閃開其他數字',
    pointsHolder: '要吃的與要閃的例子、範圍或提示，一行一點',
    centerHint: '挑戰總部',
    defaultFeatures: ['list', 'progress', 'music', 'reducedMotion']
  },
  empathy: {
    name: '同理體驗島', icon: '🤝',
    desc: '一個情境一座島，用第一人稱走進不同學習者的一天，再開「支持模式」看看環境和身邊的人可以怎麼幫忙。',
    fits: '適合：特教宣導、融合教育、輔導課、同理心教學',
    rowName: '情境名稱', extraLabel: '支持策略', extraHolder: '例：預告流程、提供安靜角、降低音量',
    pointsHolder: '這個情境要讓人感受到什麼（一行一點，請由特教或輔導老師確認）',
    centerHint: '討論教室',
    defaultFeatures: ['list', 'progress', 'reducedMotion']
  },
  literature: {
    name: '文獻知識島', icon: '📖',
    desc: '一個主題一座島、一篇文獻一棟房子：只放書目、你的筆記和連結，把文獻回顧變成可以逛的知識城市。',
    fits: '適合：研究所、專題研究、讀書會、文獻回顧',
    rowName: '研究主題', extraLabel: 'DOI 或文獻清單', extraHolder: '例：10.1000/xyz123（多篇用；隔開），或上傳 .bib／.ris',
    pointsHolder: '這個主題收錄哪些文獻、你的筆記重點（一行一點）',
    centerHint: '中央圖書館',
    defaultFeatures: ['search', 'list', 'progress', 'reducedMotion']
  },
  portfolio: {
    name: '學習歷程島', icon: '🎓',
    desc: '一段經歷一座島，照時間用橋連起來；每棟建築是一件「我做了什麼」，點開就跳出用到的能力 +1，看見自己的成長路線。',
    fits: '適合：學習歷程檔案、升學備審、求職履歷、教師專業成長',
    rowName: '經歷名稱', extraLabel: '用到的能力', extraHolder: '例：需求訪談、團隊溝通、簡報表達',
    pointsHolder: '我在這段經歷做了什麼，一行一件（可寫成「做了什麼 → 用到的能力」）',
    centerHint: '能力總覽塔',
    defaultFeatures: ['search', 'list', 'progress', 'share', 'reducedMotion']
  },
  quest: {
    name: '闖關冒險島', icon: '⚔️',
    desc: '登島和角色對話、答題打倒觀念怪獸、集章，最後領證書。',
    fits: '適合：證照備考、員工訓練、地方導覽',
    rowName: '關卡名稱', extraLabel: '角色／觀念怪獸', extraHolder: '例：守門人小雅／迷糊怪',
    pointsHolder: '這一關要學會的觀念，一行一點',
    centerHint: '最終挑戰島',
    defaultFeatures: ['list', 'progress', 'quiz', 'certificate', 'music', 'reducedMotion']
  }
};

/* 島型圖示（原創 SVG；--c1 主色、--c2 強調色） */
IF.ICONS = {
  course: '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="40" rx="19" ry="5" fill="var(--c1)" opacity=".25"/><path d="M8 14c6-3 11-3 16 1v22c-5-4-10-4-16-1z" fill="var(--c1)"/><path d="M40 14c-6-3-11-3-16 1v22c5-4 10-4 16-1z" fill="var(--c2)"/><path d="M12 19c3-1 6-1 9 1M12 24c3-1 6-1 9 1M27 20c3-2 6-2 9-1M27 25c3-2 6-2 9-1" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>',
  life: '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="40" rx="19" ry="5" fill="var(--c1)" opacity=".25"/><path d="M9 22 22 11l13 11v16H9z" fill="var(--c2)"/><path d="M6 23 22 9l16 14" stroke="var(--c1)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" fill="none"/><rect x="18" y="27" width="8" height="11" rx="1.5" fill="#fff"/><circle cx="39" cy="24" r="6" fill="var(--c1)"/><rect x="38" y="28" width="2" height="10" fill="var(--c1)"/></svg>',
  treasure: '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="40" rx="19" ry="5" fill="var(--c1)" opacity=".25"/><path d="M8 20c0-6 7-10 16-10s16 4 16 10z" fill="var(--c2)"/><rect x="8" y="20" width="32" height="18" rx="3" fill="var(--c1)"/><rect x="8" y="20" width="32" height="4" fill="#000" opacity=".15"/><rect x="20" y="22" width="8" height="9" rx="2" fill="#f7d36b"/><circle cx="24" cy="26" r="1.6" fill="var(--c1)"/></svg>',
  local: '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="40" rx="19" ry="5" fill="var(--c1)" opacity=".25"/><path d="M6 14l11-4 14 4 11-4v26l-11 4-14-4-11 4z" fill="var(--c1)" opacity=".85"/><path d="M17 10v26M31 14v26" stroke="#fff" stroke-width="1.5" opacity=".6"/><path d="M24 31s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" fill="var(--c2)"/><circle cx="24" cy="19" r="2.6" fill="#fff"/></svg>',
  expo: '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="40" rx="19" ry="5" fill="var(--c1)" opacity=".25"/><path d="M24 9 6 22h36z" fill="var(--c2)"/><path d="M24 9v-4" stroke="var(--c1)" stroke-width="2" stroke-linecap="round"/><path d="M24 5l7 2-7 2z" fill="var(--c1)"/><rect x="9" y="22" width="30" height="16" fill="var(--c1)"/><path d="M9 22l5 5 5-5 5 5 5-5 5 5 5-5" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><rect x="20" y="29" width="8" height="9" rx="1" fill="#fff"/></svg>',
  science: '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="41" rx="19" ry="4.5" fill="var(--c1)" opacity=".25"/><circle cx="24" cy="22" r="14" fill="var(--c1)"/><path d="M15 15c4 1 5 4 3 7s1 6 4 6M30 11c-2 3 0 5 3 6s3 5 1 8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".75"/><ellipse cx="24" cy="22" rx="21" ry="6.5" fill="none" stroke="var(--c2)" stroke-width="2.6" transform="rotate(-18 24 22)"/><circle cx="42" cy="15.5" r="3" fill="var(--c2)"/></svg>',
  live: '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="41" rx="19" ry="4.5" fill="var(--c1)" opacity=".25"/><rect x="7" y="12" width="34" height="25" rx="4" fill="var(--c1)"/><path d="M12 30l6-7 5 4 6-9 7 6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="37" cy="12" r="6" fill="var(--c2)"/><circle cx="37" cy="12" r="2.2" fill="#fff"/></svg>',
  runner: '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="41" rx="19" ry="4.5" fill="var(--c1)" opacity=".25"/><path d="M18 40 22 10M30 40 26 10" stroke="var(--c1)" stroke-width="3" stroke-linecap="round"/><path d="M8 40 18 10M40 40 30 10" stroke="var(--c1)" stroke-width="3" stroke-linecap="round" opacity=".5"/><circle cx="24" cy="30" r="6" fill="var(--c2)"/><text x="24" y="33.5" font-size="9" font-weight="700" text-anchor="middle" fill="#fff">4</text><circle cx="15" cy="20" r="3.4" fill="var(--c1)"/><circle cx="33" cy="20" r="3.4" fill="var(--c1)"/></svg>',
  empathy: '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="41" rx="19" ry="4.5" fill="var(--c1)" opacity=".25"/><circle cx="16" cy="14" r="5" fill="var(--c1)"/><circle cx="32" cy="14" r="5" fill="var(--c2)"/><path d="M8 34c0-7 4-12 8-12s6 3 8 6c2-3 4-6 8-6s8 5 8 12z" fill="var(--c1)" opacity=".85"/><path d="M24 36l-6-5.5a3.6 3.6 0 0 1 6-4 3.6 3.6 0 0 1 6 4z" fill="#fff"/></svg>',
  literature: '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="41" rx="19" ry="4.5" fill="var(--c1)" opacity=".25"/><path d="M6 20 15 13l9 7v18H6z" fill="var(--c1)"/><path d="M24 20l9-9 9 9v18H24z" fill="var(--c2)"/><rect x="12" y="27" width="6" height="11" fill="#fff"/><rect x="30" y="25" width="6" height="5" fill="#fff"/><path d="M28 33h10M28 36h10" stroke="#fff" stroke-width="1.6"/></svg>',
  portfolio: '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="41" rx="19" ry="4.5" fill="var(--c1)" opacity=".25"/><circle cx="9" cy="31" r="5" fill="var(--c1)"/><circle cx="24" cy="25" r="5" fill="var(--c1)"/><circle cx="39" cy="17" r="5" fill="var(--c1)"/><path d="M13 29.5 20 26.5M28 23l7-4" stroke="var(--c2)" stroke-width="2.4" stroke-linecap="round"/><path d="M39 6v5M36.5 8.5h5" stroke="var(--c2)" stroke-width="2.4" stroke-linecap="round"/><path d="M22 25.5l1.6 1.6 3-3.4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  quest: '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="40" rx="19" ry="5" fill="var(--c1)" opacity=".25"/><path d="M24 8l13 5v10c0 8-6 13-13 16-7-3-13-8-13-16V13z" fill="var(--c1)"/><path d="M24 15l2.3 4.7 5.2.7-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1-3.8-3.6 5.2-.7z" fill="var(--c2)"/></svg>'
};

IF.AI_HOWTO = {
  claude: ['在解壓後的資料夾按右鍵 →「在終端機開啟」', '輸入 <code>claude</code> 按 Enter', '貼上下面那段指令'],
  codex: ['在解壓後的資料夾按右鍵 →「在終端機開啟」', '輸入 <code>codex</code> 按 Enter', '貼上下面那段指令'],
  gemini: ['在解壓後的資料夾按右鍵 →「在終端機開啟」', '輸入 <code>gemini</code> 按 Enter', '貼上下面那段指令'],
  antigravity: ['打開 Antigravity，選「Open Folder」', '選解壓後的資料夾', '在 Agent 對話框貼上下面那段指令'],
  cursor: ['打開 Cursor，選「Open Folder」', '選解壓後的資料夾', '開啟 Agent 模式，貼上下面那段指令'],
  other: ['用你的 AI 工具打開解壓後的資料夾', '確認 AI 讀得到資料夾裡的檔案', '貼上下面那段指令']
};

IF.STYLES = {
  lowpoly: '低多邊形微縮模型',
  illustration: '溫暖手繪插畫',
  watercolor: '清新水彩',
  toy: '積木玩具感',
  scifi: '夜光科幻',
  paper: '復古紙張',
  cartoon: '卡通童趣',
  ocean: '海洋清涼',
  cloud: '雲海仙境'
};

/* [名稱, 說明, font-family, Google Fonts 參數（開源字型）] */
IF.FONTS = {
  gothic: ['黑體', '清楚易讀，適合大量文字', '"Noto Sans TC", "Microsoft JhengHei", sans-serif', ''],
  round: ['圓體', '圓潤親切，適合國小與親子', '"Huninn", "Noto Sans TC", sans-serif', 'Huninn'],
  hand: ['手寫感', '活潑有溫度，建議只用在標題', '"LXGW WenKai TC", "Noto Sans TC", cursive', 'LXGW+WenKai+TC']
};
IF.loadFont = id => {
  const g = IF.FONTS[id] && IF.FONTS[id][3];
  if (!g || document.getElementById('font-' + id)) return;
  const l = document.createElement('link');
  l.id = 'font-' + id; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=' + g + '&display=swap';
  document.head.appendChild(l);
};

IF.FEATURES = {
  search:        ['搜尋', '用關鍵字找島嶼與內容'],
  list:          ['地點清單', '不用 3D 也能讀完所有內容'],
  progress:      ['探索進度', '記錄看過哪些島（存在瀏覽器）'],
  quiz:          ['小測驗', '每座島或中央島的測驗題'],
  certificate:   ['完成證書', '全部完成後可下載或列印'],
  dailyKey:      ['每日鑰匙', '每天可開寶箱的次數'],
  collection:    ['收集圖鑑', '已收集／未收集卡片'],
  dayNight:      ['晝夜切換', '白天、黃昏、夜晚光線'],
  clock:         ['即時時鐘', '顯示目前時間與天色'],
  music:         ['背景音樂', '使用者按下才播放，可關閉'],
  reducedMotion: ['減少動態', '暫停動畫，保護容易暈眩的人'],
  share:         ['分享卡片', '產生分享用的截圖或連結'],
  guide:         ['小嚮導問答', '從網站內容找答案並附出處，不需 API 金鑰'],
  saveCode:      ['接關碼', '換電腦或手機時，用一串代碼接著玩'],
  people:        ['小人物散步', '島上有小人物沿著道路走動，增加生活感'],
  npcTalk:       ['居民對話與交易', '點居民會停下來揮手聊天，可以用撿到的東西跟居民交換'],
  skyLife:       ['天空與海的動態', '雲朵飄移、鳥群飛過、帆船繞島、海浪起伏'],
  nightLights:   ['夜晚燈光', '天黑後路燈、窗戶、市集燈亮起，還有螢火蟲']
};

/* RPG 模式：任何島型都能疊加；打開時一併勾選的功能 */
IF.RPG_FEATURES = ['progress', 'quiz', 'certificate', 'saveCode', 'people'];
/* 生活感模式（預設開啟）：居民、交易、天空與海、日夜燈光 */
IF.LIFE_FEATURES = ['people', 'npcTalk', 'skyLife', 'dayNight', 'nightLights', 'clock'];

/* 島嶼外觀：島形、精緻度、動物、地景點綴（全部為通用概念，預覽與造島包都用原創幾何） */
IF.SHAPES = {
  sea:     ['🌊 海上群島', '島浮在起伏的海面上，沙灘、浪花、碼頭與帆船'],
  float:   ['☁️ 浮空群島', '島飄在雲海上，下方是倒錐形岩層，吊橋相連、瀑布從島邊流下'],
  atoll:   ['🐠 環礁潟湖', '淺藍色潟湖與沙洲把群島圍成一圈，棕櫚樹多、海水透亮'],
  terrace: ['⛰️ 層疊台地', '島的邊緣是一層層綠色梯田，像山城一樣有高低層次'],
  /* 2026-10-30 新增 */
  volcano: ['🌋 火山島', '中央島是冒煙的火山，黑色沙灘與岩漿微光，適合冒險、地科主題'],
  snow:    ['❄️ 冰雪群島', '雪白的島面、覆雪松樹，海上漂著小冰山，適合冬季、極地主題'],
  desert:  ['🏜️ 沙漠綠洲', '金黃色沙丘島，仙人掌與棕櫚樹，每座島有一汪綠洲水池'],
  jungle:  ['🌴 熱帶雨林', '濃密的深綠樹林、高大的棕櫚與闊葉樹，像探險叢林'],
  mushroom:['🍄 奇幻蘑菇島', '島上長滿紅底白點的大蘑菇，像童話繪本']
};
/* 精緻度：[名稱, 給使用者看的說明, 給 AI 的要求] */
IF.DETAIL = {
  1: ['簡潔', '線條乾淨、物件少，載入最快，適合舊電腦或手機為主', '每島 1 個地標＋2 棵樹＋1 棟房子即可；不開陰影；以清楚、快速為優先'],
  2: ['標準', '每座島有地標、房子、樹與花草，畫面完整', '達到 living-world.md 的精緻度底線；每島至少 1 地標、1～3 棟房子、3 棵以上兩種樹形、花草與岩石'],
  3: ['精緻', '加上小路、圍籬、花田、路燈、小道具，畫面豐富像微縮模型', '在標準之上：每島再加石板小路、圍籬或花圃、2 個以上小道具（長椅、木箱、告示牌、水井…）；邊緣加草叢與小石頭；材質分 3 層以上色階'],
  4: ['極致', '細節滿滿、動態最多（瀑布、飄動的旗子、會動的小道具），載入較久', '在精緻之上：每島至少 1 個會動的小機關（風車、水車、旗子、噴泉）、地面有色塊拼貼與陰影細節、島底岩層分層；需提供「低畫質」切換並在手機自動降級']
};
/* 動物：[圖示, 名稱, 在哪裡出現, 點了說的話] */
IF.ANIMALS = {
  squirrel: ['🐿️', '松鼠', 'land', '吱吱！我在樹下找橡實，你有看到嗎？'],
  cat:      ['🐱', '貓咪', 'land', '喵～這裡的陽光最適合睡午覺了。'],
  dog:      ['🐶', '小狗', 'land', '汪！我帶你繞島一圈好不好？'],
  rabbit:   ['🐰', '兔子', 'land', '蹦蹦！花田旁邊的紅蘿蔔最好吃。'],
  deer:     ['🦌', '小鹿', 'land', '呦～森林那邊很安靜，可以慢慢逛。'],
  sheep:    ['🐑', '綿羊', 'land', '咩～草地軟軟的，躺下來看雲最舒服。'],
  cow:      ['🐄', '乳牛', 'land', '哞～今天的牧草特別香。'],
  duck:     ['🦆', '鴨子', 'shore', '呱呱！我在岸邊排隊散步。'],
  penguin:  ['🐧', '企鵝', 'shore', '啪嗒啪嗒，海邊涼涼的真好。'],
  turtle:   ['🐢', '海龜', 'sea', '慢慢游也能繞群島一圈喔。'],
  dolphin:  ['🐬', '海豚', 'sea', '噗通！看我跳出海面！'],
  butterfly:['🦋', '蝴蝶', 'air', '我在花田上空飛來飛去。'],
  /* 2026-10-30 新增 */
  fox:      ['🦊', '狐狸', 'land', '嘿嘿，我知道島上每一條小路喔。'],
  panda:    ['🐼', '熊貓', 'land', '嚼嚼……竹子配風景，最幸福了。'],
  pig:      ['🐷', '小豬', 'land', '噗噗！泥巴地是我的游泳池。'],
  chick:    ['🐥', '小雞', 'land', '啾啾！我跟著大家排隊走。'],
  hedgehog: ['🦔', '刺蝟', 'land', '別怕，我的刺只是看起來兇啦。'],
  frog:     ['🐸', '青蛙', 'shore', '呱！下雨前我會叫得特別大聲。'],
  crab:     ['🦀', '螃蟹', 'shore', '橫著走才是最快的走法！'],
  flamingo: ['🦩', '紅鶴', 'shore', '單腳站久了，也是一種平衡練習。'],
  seal:     ['🦭', '海豹', 'shore', '曬完太陽再下水，噗通！'],
  whale:    ['🐋', '鯨魚', 'sea', '噗——你有看到我噴的水柱嗎？'],
  seagull:  ['🕊️', '海鷗', 'air', '我在港口上空巡邏，看到船就跟著飛。'],
  owl:      ['🦉', '貓頭鷹', 'air', '咕咕～晚上換我值班看守群島。']
};
/* 地景點綴 */
IF.EXTRAS = {
  waterfall: ['💧 瀑布', '從島的邊緣流下來的小瀑布'],
  balloon:   ['🎈 熱氣球', '幾顆熱氣球在群島上空慢慢飄'],
  windmill:  ['🌬️ 風車', '島上有會轉的風車'],
  flowers:   ['🌷 花田', '整片彩色花田，季節感十足'],
  bunting:   ['🎏 彩旗串', '橋上與廣場掛彩色三角旗'],
  fountain:  ['⛲ 噴泉廣場', '中央島有會噴水的噴泉'],
  /* 2026-10-30 新增 */
  lighthouse:['🗼 燈塔', '外圍島邊有紅白燈塔，晚上光束會旋轉'],
  ferris:    ['🎡 摩天輪', '一座慢慢轉動的彩色摩天輪'],
  sakura:    ['🌸 櫻花樹', '每座島都有粉紅色的櫻花樹'],
  campfire:  ['🔥 營火', '島上有圍著石頭的營火，火光會閃動'],
  treehouse: ['🌳 樹屋', '大樹上蓋著一間小木屋，有梯子可以爬'],
  hotspring: ['♨️ 溫泉', '岸邊有冒著熱氣的溫泉池'],
  rainbow:   ['🌈 彩虹', '一道彩虹橫跨在群島上空'],
  kites:     ['🪁 風箏', '幾只彩色風箏在島的上空飄']
};

/* 鏡頭運鏡：[名稱, 說明, 給 AI 的要求] */
IF.CINEMA = {
  off:    ['不要動畫', '直接顯示全景，點島直接切換（最省效能）', '不做開場運鏡；點島時鏡頭在 0.3 秒內移過去即可'],
  smooth: ['平順飛近', '開場從高空緩緩降下，點島時鏡頭平滑飛過去', '開場 2～3 秒從高空俯瞰緩降到全景；點島時用 ease-in-out 曲線 1～1.5 秒飛近並轉向該島'],
  epic:   ['電影史詩', '開場從雲端環繞俯衝、拉遠拉近，點島時繞一圈再飛近，像電影開場', '開場 4～6 秒：從遠方高空穿過雲層、環繞群島半圈、俯衝拉近再拉遠成全景（可加輕微景深模糊與標題淡入）；點島時鏡頭先拉高、沿弧線繞到島的正面再推近（1.5～2.5 秒）；任何時候點畫面或按 Esc 可以跳過'],
  /* 2026-10-30 新增 */
  orbit:  ['環繞巡航', '開場平順降下，之後鏡頭一直繞著群島慢慢轉圈，像展示台', '開場同「平順飛近」；之後沒有操作時鏡頭以每圈約 40 秒的速度繞群島轉（比預設自動旋轉快約 3 倍）；拖曳或點島時暫停，回到全景後恢復'],
  drone:  ['空拍導覽', '開場像空拍機貼著海面繞群島飛一圈，逐一掠過每座島再升到全景', '開場約 2 秒 × 島數（最多 12 秒）：鏡頭在略高於島的高度沿群島外圈飛行，經過每座島時朝向那座島並短暫放慢，最後拉高成全景；可點畫面或 Esc 跳過；點島同「平順飛近」'],
  topdown:['上帝視角', '開場從群島正上方往下看，一邊旋轉一邊斜下來成全景，像看地圖', '開場 3～4 秒：鏡頭從正上方（俯角約 85 度）高處開始，一邊旋轉半圈一邊降低俯角到預設視角；點島時先拉高到俯視再落到島的正面'],
  crane:  ['升降搖臂', '開場鏡頭貼近海面看著中央島，再像搖臂一樣慢慢升高拉遠成全景', '開場 3～4 秒：鏡頭從海面高度（俯角 5 度內）看著中央島地標，沿垂直弧線升高並拉遠到預設視角；點島時先降低高度、平移到島前再升起一點']
};

/* 配色預設：三組底色＋主色＋強調色 */
IF.PRESETS = [
  { name: '奶茶海島', themes: [['晨光', '#f6f0e4'], ['海霧', '#dcebee'], ['夜海', '#16222e']], primary: '#2f7a6b', accent: '#d9792f' },
  { name: '森林綠意', themes: [['森林', '#eef3e6'], ['苔原', '#dfe8d3'], ['深林', '#1b2a20']], primary: '#3f7d3a', accent: '#e3a33b' },
  { name: '櫻花粉嫩', themes: [['櫻花', '#fdf0f2'], ['奶霜', '#fbf6ee'], ['紫夜', '#2a1f33']], primary: '#c0567a', accent: '#f0a04b' },
  { name: '晴空藍天', themes: [['晴空', '#eaf4fb'], ['雲朵', '#f7f9fb'], ['星夜', '#121c2e']], primary: '#2c6db5', accent: '#f2b33d' },
  { name: '夕陽橘紅', themes: [['夕陽', '#fbefe3'], ['沙灘', '#f6ead2'], ['暮色', '#2b1e1a']], primary: '#c45a2c', accent: '#2f8f83' },
  { name: '薄荷文青', themes: [['薄荷', '#e7f5f0'], ['米紙', '#f8f4ea'], ['墨色', '#1e2426']], primary: '#2a8a74', accent: '#e46a5e' }
];

IF.blankIsland = () => ({ id: 'i' + Math.random().toString(36).slice(2, 9), name: '', group: '', intro: '', points: '', link: '', extra: '', file: '' });

IF.defaultState = () => ({
  version: 1,
  type: 'course',
  title: '', slug: '', author: '', contact: '', audience: '', language: 'zh-TW', tagline: '',
  mascotName: '', mascotDesc: '',
  islands: [IF.blankIsland(), IF.blankIsland(), IF.blankIsland()],
  centerName: '',
  publishMaterials: false,
  themeAuto: true,   /* 2026-10-30：底色跟著日出日落自動換 */
  themes: IF.PRESETS[0].themes.map(([name, bg]) => ({ name, bg })),
  primary: IF.PRESETS[0].primary,
  accent: IF.PRESETS[0].accent,
  style: 'lowpoly',
  font: 'gothic',
  webSources: '',
  features: IF.TYPES.course.defaultFeatures.slice(),
  rpg: false,
  life: true,
  shape: 'sea',
  detail: 3,
  animals: ['squirrel', 'rabbit', 'duck', 'butterfly'],
  extras: ['flowers', 'windmill'],
  cinema: 'epic',
  ai: 'claude',
  deploy: 'ask',
  notes: ''
});

IF.EXAMPLE = () => ({
  ...IF.defaultState(),
  type: 'course',
  title: '生成式 AI 探索群島',
  slug: 'genai-islands',
  author: '3A 科技研究社',
  contact: '',
  audience: '國中學生',
  tagline: '一座島學一件事，跟著小亮把生成式 AI 玩明白',
  mascotName: '小亮',
  mascotDesc: '戴圓眼鏡、穿綠色背心的 Q 版老師',
  centerName: 'AI 總複習大島',
  islands: [
    { name: '提示詞島', group: '基礎', intro: '學會把需求說清楚，AI 才聽得懂', points: '角色＋任務＋格式\n給例子比給形容詞有用\n一次只改一個條件', extra: '能寫出三段式提示詞' },
    { name: '圖像生成島', group: '基礎', intro: '用文字畫出想像中的畫面', points: '主體、風格、光線、構圖\n負面提示詞\n著作權與肖像權', extra: '能完成一張教材插圖' },
    { name: '查證燈塔', group: '素養', intro: 'AI 也會說錯，學會查證', points: 'AI 幻覺是什麼\n交叉比對兩個以上來源\n標示 AI 協作', extra: '能找出 AI 回答中的錯誤' },
    { name: '影音工作坊', group: '應用', intro: '做出會說話的教學短片', points: '腳本先行\n配音與字幕\n片長控制在一分鐘內', extra: '能完成 30 秒短片' },
    { name: '隱私守護站', group: '素養', intro: '哪些資料不能丟給 AI', points: '個資與帳密\n學校資料的分級\n用假資料練習', extra: '能判斷資料能不能上傳' }
  ].map(r => ({ ...IF.blankIsland(), ...r }))
});

/* 2026-10-30：底色跟著時段——回傳 [白天, 黃昏, 夜晚] 用第幾組（依亮度：最亮、中間、最暗） */
IF.themeByTime = themes => {
  const L = hex => { const n = parseInt(String(hex).slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  return themes.map((t, i) => [L(t.bg), i]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
};
