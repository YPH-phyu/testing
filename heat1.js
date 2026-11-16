// js/modules/specific_heat_capacity_graphs.js
(function() {
    const { randChoice, randInt } = window.PhysicsUtils;

    /**
     * 輔助函式：計算最大公因數與最簡整數比
     */
    function gcd(a, b) {
        return b === 0 ? a : gcd(b, a % b);
    }

    function simplifyRatio(a, b) {
        const divisor = gcd(a, b);
        return [a / divisor, b / divisor];
    }

    /**
     * 輔助函式：繪製標準化 θ-t 加熱線圖 SVG (viewBox="0 0 380 230")
     * 兩條直線分別從 (0, T0_X) 和 (0, T0_Y) 出發，於 (t_int, T_int) 相交
     */
    function buildHeatingGraphSVG({ T0_X, T0_Y, T_int, maxTemp, labelX = 'X', labelY = 'Y' }) {
        // 繪圖坐標系設定
        const originX = 65;
        const originY = 190;
        const axisTopY = 28;
        const axisRightX = 335;

        const plotHeight = originY - axisTopY; // 162 px
        const tIntSvgX = 165; // 交點的固定水平 SVG 位置，使幾何比例清晰

        // 溫度轉 Y 坐標
        const tempToY = (T) => originY - (T / maxTemp) * plotHeight;

        const y0_X = tempToY(T0_X);
        const y0_Y = tempToY(T0_Y);
        const y_int = tempToY(T_int);

        // 計算兩條直線在右側延伸的終點 (限制在圖表框內)
        const slopeX = (y_int - y0_X) / (tIntSvgX - originX);
        const slopeY = (y_int - y0_Y) / (tIntSvgX - originX);

        const getEndPoint = (y0, slope) => {
            const targetY = axisTopY + 10;
            const maxX = axisRightX - 25;
            let endX = originX + (targetY - y0) / slope;
            let endY = targetY;
            if (endX > maxX) {
                endX = maxX;
                endY = y0 + slope * (endX - originX);
            }
            return { x: endX, y: endY };
        };

        const endX = getEndPoint(y0_X, slopeX);
        const endY = getEndPoint(y0_Y, slopeY);

        // Y 軸刻度每 20°C 一格
        let yTicksHtml = '';
        for (let t = 0; t <= maxTemp - 20; t += 20) {
            const yPos = tempToY(t);
            yTicksHtml += `
                <line x1="${originX - 5}" y1="${yPos}" x2="${originX}" y2="${yPos}" stroke="#0f172a" stroke-width="1.5"/>
                <text x="${originX - 10}" y="${yPos + 4}" text-anchor="end" font-size="12" fill="#0f172a" font-family="sans-serif">${t}</text>
            `;
        }

        return `
            <defs>
                <marker id="arrow-shc" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a"/>
                </marker>
            </defs>

            <!-- 水平參考虛線 (交點溫度) -->
            <line x1="${originX}" y1="${y_int}" x2="${axisRightX - 35}" y2="${y_int}" stroke="#64748b" stroke-width="1.3" stroke-dasharray="5,4"/>

            <!-- 坐標軸 -->
            <line x1="${originX}" y1="${originY}" x2="${originX}" y2="${axisTopY}" stroke="#0f172a" stroke-width="1.8" marker-end="url(#arrow-shc)"/>
            <line x1="${originX}" y1="${originY}" x2="${axisRightX}" y2="${originY}" stroke="#0f172a" stroke-width="1.8" marker-end="url(#arrow-shc)"/>

            <!-- 坐標軸標籤 -->
            <text x="${originX - 10}" y="${axisTopY - 6}" text-anchor="end" font-size="13" font-style="italic" fill="#0f172a" font-family="serif">θ / °C</text>
            <text x="${axisRightX + 8}" y="${originY + 4}" text-anchor="start" font-size="13" font-style="italic" fill="#0f172a" font-family="serif">t / s</text>

            <!-- Y 軸刻度 -->
            ${yTicksHtml}

            <!-- 物體 X 加熱線 (斜率較陡，細實線) -->
            <line x1="${originX}" y1="${y0_X}" x2="${endX.x}" y2="${endX.y}" stroke="#0f172a" stroke-width="1.5"/>
            <text x="${endX.x + 5}" y="${endX.y - 3}" font-size="13" font-style="italic" font-weight="bold" fill="#0f172a" font-family="serif">${labelX}</text>

            <!-- 物體 Y 加熱線 (斜率較緩，粗實線/強調色) -->
            <line x1="${originX}" y1="${y0_Y}" x2="${endY.x}" y2="${endY.y}" stroke="#4f46e5" stroke-width="2.4"/>
            <text x="${endY.x + 6}" y="${endY.y + 2}" font-size="13" font-style="italic" font-weight="bold" fill="#4f46e5" font-family="serif">${labelY}</text>

            <!-- 交點標記 -->
            <circle cx="${tIntSvgX}" cy="${y_int}" r="3.2" fill="#059669"/>
        `;
    }

    /**
     * 題型 1：相同物料、相同加熱器功率 -> 求質量比 m_X : m_Y
     * (包含原題 preset：T0_X = 20°C, T0_Y = 40°C, T_int = 60°C)
     */
    function createSameMaterialMassRatioQuestion(preset = null) {
        const scenarios = [
            { T0_X: 20, T0_Y: 40, T_int: 60, maxTemp: 100 }, // 原題數據：ΔT_X = 40, ΔT_Y = 20 => m_X : m_Y = 1 : 2
            { T0_X: 20, T0_Y: 60, T_int: 80, maxTemp: 120 }, // ΔT_X = 60, ΔT_Y = 20 => m_X : m_Y = 1 : 3
            { T0_X: 20, T0_Y: 50, T_int: 80, maxTemp: 120 }, // ΔT_X = 60, ΔT_Y = 30 => m_X : m_Y = 1 : 2
            { T0_X: 10, T0_Y: 40, T_int: 60, maxTemp: 100 }, // ΔT_X = 50, ΔT_Y = 20 => m_X : m_Y = 2 : 5
            { T0_X: 20, T0_Y: 40, T_int: 80, maxTemp: 120 }  // ΔT_X = 60, ΔT_Y = 40 => m_X : m_Y = 2 : 3
        ];

        const data = preset && preset.T0_X !== undefined ? preset : randChoice(scenarios);
        const { T0_X, T0_Y, T_int, maxTemp } = data;

        const dT_X = T_int - T0_X;
        const dT_Y = T_int - T0_Y;

        // 因為 P 與 c 相同，m ∝ 1 / Δθ => m_X : m_Y = Δθ_Y : Δθ_X
        const [mX, mY] = simplifyRatio(dT_Y, dT_X);

        const correctStr = `${mX} : ${mY}`;
        const invStr = `${mY} : ${mX}`;

        // 誤用末溫比或初溫比作為干擾項
        const [tIntRatioA, tIntRatioB] = simplifyRatio(T0_Y, T0_X);
        const initRatioStr = `${tIntRatioA} : ${tIntRatioB}`;
        const invInitRatioStr = `${tIntRatioB} : ${tIntRatioA}`;

        // 確保 4 個選項互不相同
        const pool = [
            invStr,
            correctStr,
            initRatioStr,
            invInitRatioStr,
            `${mX + 1} : ${mY}`,
            `${mY + 1} : ${mX}`
        ];
        const uniqueWrong = [...new Set(pool)].filter(opt => opt !== correctStr);
        const selectedWrong = uniqueWrong.slice(0, 3);

        // 將選項依固定邏輯排序（如原題般將倒反比放前面作為高頻陷阱）
        const options = [selectedWrong[0], selectedWrong[1], correctStr, selectedWrong[2]];
        // 若是原題參數，精準還原 A. 3:1, B. 2:1, C. 1:2, D. 2:3 的經典選項排列
        let finalOptions = options;
        if (T0_X === 20 && T0_Y === 40 && T_int === 60) {
            finalOptions = ['3 : 1', '2 : 1', '1 : 2', '2 : 3'];
        }

        const correctIndex = finalOptions.indexOf(correctStr);

        const trapReasons = {};
        finalOptions.forEach(opt => {
            if (opt === correctStr) return;
            if (opt === invStr) {
                trapReasons[opt] = `<strong>倒反了正反比關係（最高頻陷阱）：</strong>誤以為溫升越大質量越大，直接取 $\\Delta\\theta_X : \\Delta\\theta_Y = ${dT_X} : ${dT_Y} = ${invStr}$。實際上在相同功率與相同物料下，質量越小的物體升溫越快，故 $m \\propto \\frac{1}{\\Delta\\theta}$。`;
            } else if (opt === invInitRatioStr || opt === initRatioStr) {
                trapReasons[opt] = `<strong>誤用初溫代替溫度變化 $\\Delta\\theta$：</strong>直接以 $t = 0$ 時的初始溫度 ${T0_X}\\text{ }^\\circ\\text{C}$ 與 ${T0_Y}\\text{ }^\\circ\\text{C}$ 作比，忽略了熱容量公式中使用的是溫差 $\\Delta\\theta = \\theta_{\\text{交點}} - \\theta_0$。`;
            } else {
                trapReasons[opt] = `<strong>錯讀坐標軸溫差：</strong>錯誤計算兩線在交點處的溫度變化（正確溫差應為 $\\Delta\\theta_X = ${T_int} - ${T0_X} = ${dT_X}\\text{ }^\\circ\\text{C}$ 及 $\\Delta\\theta_Y = ${T_int} - ${T0_Y} = ${dT_Y}\\text{ }^\\circ\\text{C}$）。`;
            }
        });

        return {
            source: (preset && preset.source) ? preset.source : '< HKDSE 經典題型變體 >',
            conceptBadge: '比熱容量與 θ-t 加熱線圖斜率',
            textZh: `兩個物體 $X$ 和 $Y$ 以相同物料造成。兩者分別以功率相同的電熱器加熱。線圖顯示 $X$ 和 $Y$ 的溫度 $\\theta$ 隨時間 $t$ 的變化。$X$ 的質量與 $Y$ 的質量之比是多少？`,
            isGraphOptions: false,
            options: finalOptions,
            correctIndex,
            trapReasons,
            diagramCaption: '物體 X 與 Y 的溫度—時間（θ - t）加熱線圖',
            mainSvgContent: buildHeatingGraphSVG({ T0_X, T0_Y, T_int, maxTemp }),
            principle: `根據熱傳遞與比熱容量公式，電熱器在時間 $t$ 內提供的能量 $E = Pt = mc\\Delta\\theta$，改寫可得 $\\theta - t$ 線圖的斜率為：
            $$\\text{斜率} = \\frac{\\Delta\\theta}{t} = \\frac{P}{mc}$$
            由於兩物體以<strong>相同物料</strong>造成（比熱容量 $c_X = c_Y$）且使用<strong>相同功率</strong>加熱器（$P_X = P_Y$），在相同的加熱時間 $t$（即兩線交點處）內，兩者吸收的總能量相同：
            $$m_X c \\Delta\\theta_X = m_Y c \\Delta\\theta_Y \\implies \\frac{m_X}{m_Y} = \\frac{\\Delta\\theta_Y}{\\Delta\\theta_X}$$`,
            steps: `<p>1. 讀取兩線相交（加熱時間 $t$ 相同，溫度同為 $${T_int}\\text{ }^\\circ\\text{C}$）時各自的溫度變化 $\\Delta\\theta$：</p>
            $$\\Delta\\theta_X = ${T_int} - ${T0_X} = ${dT_X}\\text{ }^\\circ\\text{C}$$
            $$\\Delta\\theta_Y = ${T_int} - ${T0_Y} = ${dT_Y}\\text{ }^\\circ\\text{C}$$
            <p>2. 代入質量與溫升的反比關係計算 $m_X : m_Y$：</p>
            $$\\frac{m_X}{m_Y} = \\frac{\\Delta\\theta_Y}{\\Delta\\theta_X} = \\frac{${dT_Y}}{${dT_X}} = \\frac{${mX}}{${mY}}$$
            <p>因此，$X$ 的質量與 $Y$ 的質量之比為 <strong>$${correctStr}$</strong>。</p>`
        };
    }

    /**
     * 題型 2：相同質量、不同物料、相同加熱器功率 -> 求比熱容量比 c_X : c_Y
     */
    function createSameMassSpecificHeatRatioQuestion() {
        const scenarios = [
            { T0_X: 20, T0_Y: 40, T_int: 60, maxTemp: 100 }, // c_X : c_Y = 1 : 2
            { T0_X: 10, T0_Y: 30, T_int: 70, maxTemp: 100 }, // ΔT_X = 60, ΔT_Y = 40 => c_X : c_Y = 2 : 3
            { T0_X: 20, T0_Y: 50, T_int: 80, maxTemp: 120 }, // ΔT_X = 60, ΔT_Y = 30 => c_X : c_Y = 1 : 2
            { T0_X: 20, T0_Y: 40, T_int: 100, maxTemp: 120 } // ΔT_X = 80, ΔT_Y = 60 => c_X : c_Y = 3 : 4
        ];
        const { T0_X, T0_Y, T_int, maxTemp } = randChoice(scenarios);

        const dT_X = T_int - T0_X;
        const dT_Y = T_int - T0_Y;

        // m 與 P 相同 => c_X : c_Y = ΔT_Y : ΔT_X
        const [cX, cY] = simplifyRatio(dT_Y, dT_X);
        const correctStr = `${cX} : ${cY}`;
        const invStr = `${cY} : ${cX}`;

        const [initA, initB] = simplifyRatio(T0_X, T0_Y);
        const initStr = `${initA} : ${initB}`;
        const extraWrong = `${cX + 1} : ${cY + 1}`;

        const options = [invStr, correctStr, initStr, extraWrong];
        const correctIndex = 1;

        return {
            source: '< HKDSE 概念延伸題 >',
            conceptBadge: '不同物料的比熱容量比較',
            textZh: `兩個<strong>質量相同</strong>的物體 $X$ 和 $Y$ 由不同物料製成。兩者分別以功率相同的電熱器加熱，其溫度 $\\theta$ 隨時間 $t$ 的變化如上圖所示。$X$ 的比熱容量與 $Y$ 的比熱容量之比（$c_X : c_Y$）是多少？`,
            isGraphOptions: false,
            options,
            correctIndex,
            trapReasons: {
                [invStr]: `<strong>誤以為斜率越陡比熱容量越大：</strong>線圖斜率 $\\frac{\\Delta\\theta}{t} = \\frac{P}{mc}$ 與比熱容量 $c$ 成<strong>反比</strong>。$X$ 升溫較快，代表其比熱容量較小，正確比值應為 $${correctStr}$。`,
                [initStr]: `<strong>誤用初始溫度作比：</strong>直接使用 $t = 0$ 時的初溫 ${T0_X}\\text{ }^\\circ\\text{C}$ 與 ${T0_Y}\\text{ }^\\circ\\text{C}$ 計算比例，未有減去初溫求溫升 $\\Delta\\theta$。`,
                [extraWrong]: `<strong>溫差計算錯誤：</strong>正確的溫升應為 $\\Delta\\theta_X = ${T_int} - ${T0_X} = ${dT_X}\\text{ }^\\circ\\text{C}$ 與 $\\Delta\\theta_Y = ${T_int} - ${T0_Y} = ${dT_Y}\\text{ }^\\circ\\text{C}$。`
            },
            diagramCaption: '質量相同的物體 X 與 Y 之 θ - t 加熱線圖',
            mainSvgContent: buildHeatingGraphSVG({ T0_X, T0_Y, T_int, maxTemp }),
            principle: `在相同加熱時間 $t$（兩直線交點）內，功率相同的電熱器輸出相等熱能 $Q = Pt$。由於兩物體質量相同（$m_X = m_Y$）：
            $$m c_X \\Delta\\theta_X = m c_Y \\Delta\\theta_Y \\implies \\frac{c_X}{c_Y} = \\frac{\\Delta\\theta_Y}{\\Delta\\theta_X}$$`,
            steps: `<p>1. 從線圖交點（$\\theta = ${T_int}\\text{ }^\\circ\\text{C}$）計算兩物體的溫度變化：</p>
            $$\\Delta\\theta_X = ${T_int} - ${T0_X} = ${dT_X}\\text{ }^\\circ\\text{C}, \\quad \\Delta\\theta_Y = ${T_int} - ${T0_Y} = ${dT_Y}\\text{ }^\\circ\\text{C}$$
            <p>2. 計算比熱容量之比：</p>
            $$c_X : c_Y = \\Delta\\theta_Y : \\Delta\\theta_X = ${dT_Y} : ${dT_X} = ${correctStr}$$`
        };
    }

    /**
     * 題型 3：已知質量比與相同物料 -> 求電熱器功率比 P_X : P_Y
     */
    function createHeaterPowerRatioQuestion() {
        const scenarios = [
            { T0_X: 20, T0_Y: 40, T_int: 60, maxTemp: 100, mRatioX: 1, mRatioY: 2 }, // P_X/P_Y = (1*40)/(2*20) = 1:1
            { T0_X: 20, T0_Y: 40, T_int: 60, maxTemp: 100, mRatioX: 3, mRatioY: 2 }, // P_X/P_Y = (3*40)/(2*20) = 3:1
            { T0_X: 20, T0_Y: 50, T_int: 80, maxTemp: 120, mRatioX: 1, mRatioY: 4 }, // P_X/P_Y = (1*60)/(4*30) = 1:2
            { T0_X: 10, T0_Y: 40, T_int: 60, maxTemp: 100, mRatioX: 2, mRatioY: 5 }  // P_X/P_Y = (2*50)/(5*20) = 1:1
        ];
        const { T0_X, T0_Y, T_int, maxTemp, mRatioX, mRatioY } = randChoice(scenarios);

        const dT_X = T_int - T0_X;
        const dT_Y = T_int - T0_Y;

        // P = mcΔθ / t => P_X : P_Y = (m_X * Δθ_X) : (m_Y * Δθ_Y)
        const [pX, pY] = simplifyRatio(mRatioX * dT_X, mRatioY * dT_Y);
        const correctStr = `${pX} : ${pY}`;

        // 陷阱 1：忘記乘以質量比，直接用溫升比 Δθ_X : Δθ_Y
        const [dtA, dtB] = simplifyRatio(dT_X, dT_Y);
        const onlyTempRatio = `${dtA} : ${dtB}`;

        // 陷阱 2：把質量除進去而非乘進去 (m_Y * Δθ_X) : (m_X * Δθ_Y)
        const [wrongDivA, wrongDivB] = simplifyRatio(mRatioY * dT_X, mRatioX * dT_Y);
        const wrongDivRatio = `${wrongDivA} : ${wrongDivB}`;

        // 陷阱 3：倒反比例
        const invRatio = `${pY} : ${pX}`;

        const pool = [correctStr, onlyTempRatio, wrongDivRatio, invRatio, '2 : 3', '4 : 1'];
        const uniqueOptions = [...new Set(pool)].slice(0, 4);
        const correctIndex = uniqueOptions.indexOf(correctStr);

        const trapReasons = {};
        uniqueOptions.forEach(opt => {
            if (opt === correctStr) return;
            if (opt === onlyTempRatio) {
                trapReasons[opt] = `<strong>忽略了兩物體的質量差異：</strong>直接以溫升比 $\\Delta\\theta_X : \\Delta\\theta_Y = ${onlyTempRatio}$ 作答，忘記功率 $P = \\frac{mc\\Delta\\theta}{t}$ 同時正比於質量 $m$。`;
            } else if (opt === wrongDivRatio) {
                trapReasons[opt] = `<strong>誤把質量置於分母：</strong>計算功率時錯誤使用 $\\frac{\\Delta\\theta}{m}$，實際上加熱更大質量的物體需要更高功率（$P \\propto m\\Delta\\theta$）。`;
            } else {
                trapReasons[opt] = `<strong>比例計算或倒反錯誤：</strong>在相同時間 $t$ 內，$P_X : P_Y = (m_X \\Delta\\theta_X) : (m_Y \\Delta\\theta_Y) = (${mRatioX} \\times ${dT_X}) : (${mRatioY} \\times ${dT_Y}) = ${correctStr}$。`;
            }
        });

        return {
            source: '< HKDSE 綜合應用題 >',
            conceptBadge: '加熱功率、質量與溫升的綜合關係',
            textZh: `兩個以相同物料造成的物體 $X$ 和 $Y$，其質量之比為 $m_X : m_Y = ${mRatioX} : ${mRatioY}$。現分別以功率為 $P_X$ 和 $P_Y$ 的電熱器同時加熱兩者，所得的 $\\theta - t$ 線圖如上所示。電熱器功率之比 $P_X : P_Y$ 是多少？`,
            isGraphOptions: false,
            options: uniqueOptions,
            correctIndex,
            trapReasons,
            diagramCaption: '不同質量與不同加熱功率下的 θ - t 線圖',
            mainSvgContent: buildHeatingGraphSVG({ T0_X, T0_Y, T_int, maxTemp }),
            principle: `電熱器功率 $P$ 為單位時間內傳遞的熱能：
            $$P = \\frac{Q}{t} = \\frac{mc\\Delta\\theta}{t}$$
            在兩直線相交處，加熱時間 $t$ 相同，且兩物體比熱容量 $c$ 相同，因此功率與「質量 $\\times$ 溫升」成正比：
            $$\\frac{P_X}{P_Y} = \\frac{m_X \\Delta\\theta_X}{m_Y \\Delta\\theta_Y}$$`,
            steps: `<p>1. 由交點讀取加熱相同時間 $t$ 後兩者的溫升：</p>
            $$\\Delta\\theta_X = ${T_int} - ${T0_X} = ${dT_X}\\text{ }^\\circ\\text{C}, \\quad \\Delta\\theta_Y = ${T_int} - ${T0_Y} = ${dT_Y}\\text{ }^\\circ\\text{C}$$
            <p>2. 代入質量比 $m_X : m_Y = ${mRatioX} : ${mRatioY}$ 求功率比：</p>
            $$\\frac{P_X}{P_Y} = \\frac{${mRatioX} \\times ${dT_X}}{${mRatioY} \\times ${dT_Y}} = \\frac{${mRatioX * dT_X}}{${mRatioY * dT_Y}} = \\frac{${pX}}{${pY}}$$`
        };
    }

    // 註冊模組至 HKDSE 物理科無限 MC 練習機
    window.registerPhysicsModule({
        id: 'specific_heat_capacity_graphs',
        category: '熱和氣體 (Heat and Gases)',
        title: '比熱容量與 θ-t 加熱線圖分析',
        subtitle: '專題：利用加熱線圖交點與斜率求解質量比、比熱容量比及加熱器功率比',
        constantsHint: '不計熱量散失（Q = Pt = mcΔθ）',

        subTopics: [
            { value: 'all', label: '綜合隨機（全部題型）' },
            { value: 'mass_ratio', label: '1. 相同物料求質量比 (m_X : m_Y)' },
            { value: 'shc_ratio', label: '2. 相同質量求比熱容量比 (c_X : c_Y)' },
            { value: 'power_ratio', label: '3. 綜合求電熱器功率比 (P_X : P_Y)' }
        ],

        pastPapers: [
            () => createSameMaterialMassRatioQuestion({
                source: '< HKDSE 歷屆經典原題重現 >',
                T0_X: 20,
                T0_Y: 40,
                T_int: 60,
                maxTemp: 100
            })
        ],

        generateQuestion: function(subTopic) {
            if (subTopic === 'mass_ratio') return createSameMaterialMassRatioQuestion();
            if (subTopic === 'shc_ratio') return createSameMassSpecificHeatRatioQuestion();
            if (subTopic === 'power_ratio') return createHeaterPowerRatioQuestion();
            return randChoice([
                createSameMaterialMassRatioQuestion,
                createSameMassSpecificHeatRatioQuestion,
                createHeaterPowerRatioQuestion
            ])();
        },

        drawMainDiagram: function(q, svgElement, captionElement, containerBox) {
            containerBox.classList.remove('hidden');
            captionElement.textContent = q.diagramCaption || '溫度—時間（θ - t）加熱線圖';
            svgElement.innerHTML = q.mainSvgContent;
        }
    });
})();