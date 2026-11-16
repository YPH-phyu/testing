# HKDSE 物理科無限 MC 練習機 — 獨立模組開發規範 (`README.md`)

本文件定義了 **HKDSE 物理科綜合題庫系統** 的標準模組介面（Module Interface）。任何遵循本規範編寫的獨立 `.js` 檔案（基於 `_template.js`），皆可直接透過 `<script>` 引入主系統 `index.html`，無需修改核心引擎（`core.js`）即可無縫運作。

---

## 1. 檔案結構與引入方式

所有獨立題庫模組應放置於 `js/modules/` 目錄下，並以 **IIFE（立即執行函式表達式）** 包裹，以避免全域變數或輔助函式命名衝突。

```text
HKDSE-Physics-Hub/
├── index.html                  # 主入口外殼
├── README.md                   # 本開發規範說明書
└── js/
    ├── core.js                 # 核心渲染、批改與計分引擎
    └── modules/
        ├── _template.js        # 空白標準模組樣板
        ├── gas_laws.js         # 模組 1：氣體圖像轉換與分子數目
        └── your_new_module.js  # 你的新模組
```

### 在 `index.html` 中註冊新模組
只需在 `core.js` 之後加入一行 `<script>` 即可完成掛載：

```html
<script src="js/core.js"></script>
<script src="js/modules/gas_laws.js"></script>
<script src="js/modules/your_new_module.js"></script>
```

---

## 2. 模組註冊介面 (`window.registerPhysicsModule`)

每個模組檔案的底部必須呼叫 `window.registerPhysicsModule(config)`，傳入符合以下結構的設定物件：

```javascript
(function() {
    // 1. 模組私有常數與輔助函式寫在這裡（不會污染全域環境）
    const { randChoice, formatSciHtml, formatSciLatex } = window.PhysicsUtils;

    // 2. 題目生成函式...
    function createTopicAQuestion(preset = null) { /* ... */ }

    // 3. 向核心引擎註冊本模組
    window.registerPhysicsModule({
        id: 'unique_module_id',                         // [必填] 唯一識別碼（英文小寫與底線）
        category: '力學與運動 (Force and Motion)',       // [必填] HKDSE 大課題分類名稱
        title: '拋體運動與平拋軌跡分析',                 // [必填] 頂部導覽列顯示的主標題
        subtitle: '專題：水平射程、最大高度與速度矢量分解', // [必填] 副標題簡介
        constantsHint: 'g = 9.81 m s⁻²（不計空氣阻力）',   // [必填] 控制列顯示的物理常數提示

        // [必填] 題型篩選下拉選單（建議第一個選項固定為 'all' 綜合隨機）
        subTopics: [
            { value: 'all', label: '綜合隨機（全部題型）' },
            { value: 'topic_a', label: '1. 題型 A 名稱' },
            { value: 'topic_b', label: '2. 題型 B 名稱' }
        ],

        // [選填] 歷屆真題庫陣列（若無歷屆原題可設為空陣列 []，系統會自動隱藏按鈕）
        pastPapers: [
            () => createTopicAQuestion({ source: '< HKDSE 2018 Paper 1A - 12 >' })
        ],

        // [必填] 核心出題接口：根據下拉選單的 subTopic 回傳標準化「題目物件」
        generateQuestion: function(subTopic) {
            if (subTopic === 'topic_a') return createTopicAQuestion();
            if (subTopic === 'topic_b') return createTopicBQuestion();
            return randChoice([createTopicAQuestion, createTopicBQuestion])();
        },

        // [必填] 主附圖繪製接口：負責繪製題目上方的 SVG 圖表或隱藏圖表框
        drawMainDiagram: function(q, svgElement, captionElement, containerBox) {
            // 若該題不需要附圖，可加上 containerBox.classList.add('hidden')
            containerBox.classList.remove('hidden');
            captionElement.textContent = q.diagramCaption || '附圖';
            svgElement.innerHTML = q.mainSvgContent;
        }
    });
})();
```

---

## 3. 標準「題目物件 (Question Object)」資料格式

`generateQuestion(subTopic)` 必須回傳一個包含以下欄位的 JavaScript 物件。系統支援兩種選項模式：**純文字/數學公式選項** 與 **SVG 圖像選項**。

### 通用必填欄位

| 欄位名稱 | 型別 | 說明 |
| :--- | :--- | :--- |
| `source` | `String` | 題目來源標籤，例如 `'< HKDSE 2021 Paper 1A - 8 >'` 或 `'< HKDSE 進階變體題 >'` |
| `conceptBadge` | `String` | 詳解面板右上角的物理概念標籤，例如 `'動量守恆與彈性碰撞'` |
| `textZh` | `String` | 繁體中文題目敘述（支援 HTML 標籤與 `$ ... $` KaTeX 行內公式） |
| `isGraphOptions` | `Boolean` | `false` 代表文字/數值選項；`true` 代表 4 個選項皆為 SVG 圖像 |
| `correctIndex` | `Number` | 正確答案的索引值（`0` = A, `1` = B, `2` = C, `3` = D） |
| `principle` | `String` | 詳解面板「核心物理原理」區塊內容（支援 HTML 與 KaTeX） |
| `steps` | `String` | 詳解面板「逐步計算與推導」區塊內容（支援 HTML 與 `$$ ... $$` 獨立行公式） |

### 模式 A：文字 / 數值選項 (`isGraphOptions: false`)

```javascript
return {
    source: '< HKDSE 變體題 >',
    conceptBadge: '功能原理與機械能守恆',
    textZh: '一質量為 $2.0\\text{ kg}$ 的物體從高 $5.0\\text{ m}$ 處靜止滑下...',
    isGraphOptions: false,
    options: [
        '4.90 m s⁻¹',
        '7.00 m s⁻¹',
        '9.90 m s⁻¹',
        '14.0 m s⁻¹'
    ], // 必須剛好 4 個字串元素
    correctIndex: 2,
    // 對應每個錯誤選項的「DSE 常見陷阱剖析」（Key 必須與 options 中的字串完全一致）
    trapReasons: {
        '4.90 m s⁻¹': '<strong>忘記開平方根：</strong>直接計算 $gh$ 而忘記取 $\\sqrt{2gh}$。',
        '7.00 m s⁻¹': '<strong>漏乘係數 2：</strong>誤用公式 $v = \\sqrt{gh}$ 計算。',
        '14.0 m s⁻¹': '<strong>錯誤乘入質量：</strong>把質量 $m = 2.0\\text{ kg}$ 代入速度公式。'
    },
    principle: '在不計摩擦力的情況下，重力勢能完全轉化為動能：$$mgh = \\frac{1}{2}mv^2$$',
    steps: '<p>代入 $g = 9.81\\text{ m s}^{-2}$ 及 $h = 5.0\\text{ m}$：</p>$$v = \\sqrt{2 \\times 9.81 \\times 5.0} \\approx 9.90\\text{ m s}^{-1}$$'
};
```

### 模式 B：SVG 圖像選項 (`isGraphOptions: true`)

```javascript
return {
    source: '< HKDSE 圖像分析題 >',
    conceptBadge: 'v-t 圖像與加速度斜率',
    textZh: '下列哪一幅速度—時間（$v - t$）圖像最能表示物體的運動？',
    isGraphOptions: true,
    // 必須剛好 4 個物件，核心引擎會將 svgContent 放入 <svg viewBox="0 0 240 165"> 中
    optionConfigs: [
        {
            isCorrect: false,
            svgContent: '<line x1="45" y1="135" x2="195" y2="35" stroke="#0f172a" stroke-width="2"/>',
            trap: '<strong>誤判為勻加速直線：</strong>題目中合力隨時間減小，斜率應逐漸變平。'
        },
        {
            isCorrect: true,
            svgContent: '<path d="M 45 135 Q 90 50 195 35" fill="none" stroke="#0f172a" stroke-width="2"/>',
            trap: '' // 正確選項留空即可
        },
        // ...其餘 2 個選項
    ],
    correctIndex: 1,
    principle: '...',
    steps: '...'
};
```

---

## 4. 數學公式與繪圖規範（避免渲染錯誤）

1. **KaTeX 公式書寫規範**：
   * 行內公式請使用單錢號 `$ ... $`（例如 `$E_k = \frac{1}{2}mv^2$`），獨立成行的推導公式請使用雙錢號 `$$ ... $$`。
   * **JavaScript 字串跳脫字元注意**：在 JS 普通字串（`'...'` 或 `` `...` ``）中撰寫 LaTeX 指令時，反斜線必須雙寫（例如 `\\frac{1}{2}`、`\\times`、`\\theta`、`\\text{ m s}^{-1}`），否則 `\f` 或 `\t` 會被 JS 解析為換頁符或 Tab 鍵！
   * 貨幣金額（若題目偶爾出現）請避免使用 `$` 符號，改寫為「港元」或「元」，以免誤觸 KaTeX 公式解析器。
2. **SVG 尺寸與配色標準**：
   * **主附圖 (`#main-physics-svg`)**：建議統一使用 `viewBox="0 0 380 230"`，網格線使用 `#cbd5e1`，坐標軸與主線條使用 `#0f172a`，強調色使用 Tailwind 的 Indigo (`#4f46e5`) 或 Emerald (`#059669`)。
   * **選項附圖 (`optionConfigs[i].svgContent`)**：核心引擎固定外層容器為 `viewBox="0 0 240 165"`，繪製坐標軸時請預留邊距（建議繪圖區落在 `x: [45, 215]`, `y: [18, 135]`）。
3. **共用工具函式 (`window.PhysicsUtils`)**：
   * `randChoice(arr)`：從陣列中隨機抽取一個元素。
   * `randInt(min, max)`：產生 `[min, max]` 之間的隨機整數。
   * `formatSciHtml(val)`：將數字轉為標準 HTML 科學記數法（如 `1.38 × 10<sup>-23</sup>`）。
   * `formatSciLatex(val)`：將數字轉為 LaTeX 科學記數法（如 `1.38 \times 10^{-23}`）。

---

## 5. 給 AI 的快速生成提示詞（Prompt Template）

日後當你需要請 AI 為你編寫新的物理專題模組時，只需附上本 `README.md` 並發送以下指令即可：

> 「請嚴格按照 `README.md` 中的 `window.registerPhysicsModule` 規範，為我編寫一個名為 `js/modules/optics_lens.js` 的獨立物理題庫模組，專題為**『薄透鏡成像與放大率計算』**，包含 3 個子題型（凸透鏡實像計算、虛像與放大鏡分析、成像光線圖判斷），並內建 2 道 HKDSE 歷屆經典變體題，所有選項需具備針對 DSE 考生的『常見陷阱剖析』。」