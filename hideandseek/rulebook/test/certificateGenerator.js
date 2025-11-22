class CertificateGenerator {
    static DEFAULT_CONFIG = {
        sealUrl: "/images/stamp.svg",
        flagUrl: "/images/roc.svg",
        certImgSelector: "#certImg",
        canvasSelector: "#certCanvas",
        assocName: "ZTAKH.LOL",
        fonts: [
            "600 10px 'Noto Serif'",
            "600 10px 'Noto Serif TC'",
            "900 10px 'Noto Serif'",
            "900 10px 'Noto Serif TC'"
        ],
        failedColor: "#E74C3C",
        learnerColor: "#95A5A6"
    };

    constructor(config) {
        this.config = { ...CertificateGenerator.DEFAULT_CONFIG, ...config };
        this._validateRequiredConfig();

        this.dom = {
            certImg: document.querySelector(this.config.certImgSelector),
            canvas: document.querySelector(this.config.canvasSelector)
        };
        this._validateDOMElements();

        this.builtInSealImage = new Image();
        this.builtInFlagImage = new Image();
        this.isImagesLoaded = false;
        this.isFontsLoaded = false;
        this.determineCertificateLevel = this.config.determineCertificateLevel;
        this.dclVar = this.config.dclVar;
        this.QUESTIONS = this.config.QUESTIONS;
        this.dateObj = new Date();
        this.dateInt = [this.dateObj.getFullYear() - 1911, this.dateObj.getMonth() + 1, this.dateObj.getDate()];
    }

    async init() {
        try {
            await this._preloadBuiltInImages();
        } catch (error) {
            console.error("資源加載失敗：", error);
        }
    }

    async generateCertificate({ pName }) {
        this._validateGenerateParams({ pName });

        const { level, dwuanway, desc } = this.determineCertificateLevel(this.dclVar);

        const chars = this._collectCharacters({ pName, desc, level, dwuanway });
        this.isFontsLoaded = false;
        await this._loadFonts(chars);

        const dateStr = this._formatROCDate();

        const { canvas, ctx } = this._getCanvasContext();
        const W = canvas.width;
        const H = canvas.height;

        this._clearCanvas(ctx, W, H);
        this._drawBackground(ctx, W, H);
        this._drawBorder(ctx, W, H);
        this._drawHeader(ctx, W, this.dclVar);
        this._drawContent(ctx, W, { pName, desc, level, dwuanway });
        this._drawFooter(ctx, W, H, dateStr);

        const imageUrl = canvas.toDataURL("image/png");
        this.dom.certImg.src = imageUrl;
        this.dom.certImg.parentElement.href = imageUrl;
    }

    _validateRequiredConfig() {
        if (typeof this.config.determineCertificateLevel !== "function") {
            throw new Error("必須提供 determineCertificateLevel 外部函數");
        }
    }

    _validateDOMElements() {
        if (!this.dom.certImg) {
            throw new Error(`未找到證書預覽圖元素，選擇器：${this.config.certImgSelector}`);
        }
        if (!this.dom.canvas) {
            throw new Error(`未找到 Canvas 元素，選擇器：${this.config.canvasSelector}`);
        }
    }

    _validateGenerateParams({ pName }) {
        if (!pName || typeof pName !== "string" || pName.trim() === "") {
            throw new Error("請提供有效的玩家姓名");
        }
    }

    async _loadFonts(chars) {
        const { chinese, english } = this._splitChars(chars);

        const fontPromises = this.config.fonts.map(fontSpec => {
            if (fontSpec.includes("'Noto Serif TC'")) {
                return document.fonts.load(fontSpec, chinese);
            } else if (fontSpec.includes("'Noto Serif'")) {
                return document.fonts.load(fontSpec, english);
            } else {
                return document.fonts.load(fontSpec, chars);
            }
        });

        await Promise.all(fontPromises);
        await new Promise(requestAnimationFrame);
        this.isFontsLoaded = true;
    }

    _collectCharacters({ pName, desc, level, dwuanway }) {
        const templateText = `覕相揣玩家能力檢定證書查，。！・玩家特授予頭銜中華民國年月日0123456789ZTAKH.LOL`;
        const dynamicText = `${pName}${desc}${level}${dwuanway}`;

        const all = (templateText + dynamicText).replace(/\s+/g, "");
        return [...new Set(all)].join("");
    }

    _splitChars(chars) {
        const chinese = [];
        const english = [];

        for (const ch of chars) {
            if (/[\u4e00-\u9fff]/.test(ch)) chinese.push(ch);
            else english.push(ch);
        }

        return {
            chinese: [...new Set(chinese)].join(""),
            english: [...new Set(english)].join("")
        };
    }

    _preloadBuiltInImages() {
        return new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalImages = 2;

            const handleLoad = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    this.isImagesLoaded = true;
                    resolve();
                }
            };

            const handleError = (url) => {
                reject(new Error(`圖片加載失敗：${url}`));
            };

            this.builtInSealImage.crossOrigin = "Anonymous";
            this.builtInSealImage.onload = handleLoad;
            this.builtInSealImage.onerror = () => handleError(this.config.sealUrl);
            this.builtInSealImage.src = this.config.sealUrl;

            this.builtInFlagImage.crossOrigin = "Anonymous";
            this.builtInFlagImage.onload = handleLoad;
            this.builtInFlagImage.onerror = () => handleError(this.config.flagUrl);
            this.builtInFlagImage.src = this.config.flagUrl;
        });
    }

    _formatROCDate() {
        const rocYear = this.dateInt[0];
        const month = String(this.dateInt[1]).padStart(2, "0");
        const day = String(this.dateInt[2]).padStart(2, "0");
        return `中　華　民　國　${rocYear}　年　${month}　月　${day}　日`;
    }

    _getCanvasContext() {
        const canvas = this.dom.canvas;
        const ctx = canvas.getContext("2d");
        return { canvas, ctx };
    }

    _clearCanvas(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
    }

    _drawBackground(ctx, w, h) {
        ctx.fillStyle = "#FDFBF7";
        ctx.fillRect(0, 0, w, h);

        this._addNoise(ctx, w, h);
        this._drawGuilloche(ctx, w, h);
    }

    _drawBorder(ctx, w, h) {
        ctx.strokeStyle = "#1B2A41";
        ctx.lineWidth = 12;
        ctx.strokeRect(40, 40, w - 80, h - 80);

        const pad = 16;
        const ix = 40 + pad;
        const iy = 40 + pad;
        const iw = w - 80 - pad * 2;
        const ih = h - 80 - pad * 2;

        ctx.strokeStyle = "#C5A059";
        ctx.lineWidth = 3;
        ctx.strokeRect(ix, iy, iw, ih);
        ctx.strokeRect(ix + 10, iy + 10, iw - 20, ih - 20);

        this._drawCornerRuyi(ctx, ix, iy, 0);
        this._drawCornerRuyi(ctx, ix + iw, iy, Math.PI / 2);
        this._drawCornerRuyi(ctx, ix + iw, iy + ih, Math.PI);
        this._drawCornerRuyi(ctx, ix, iy + ih, -Math.PI / 2);
    }

    _drawHeader(ctx, w, { passedSections, finalScore, accuracy }) {
        ctx.textAlign = "center";

        ctx.save();
        ctx.translate(w / 2, 160);
        this._drawLogoMark(ctx);
        ctx.restore();

        ctx.fillStyle = "#1B2A41";
        ctx.font = "900 68px 'Noto Serif', 'Noto Serif TC', serif";
        ctx.letterSpacing = "8px";
        ctx.fillText("覕相揣玩家能力檢定證書", w / 2, 280);
        ctx.letterSpacing = "0";

        ctx.font = "600 24px 'Noto Serif', 'Noto Serif TC', serif";
        ctx.fillStyle = "#555";
        ctx.textAlign = "right";
        const certNo = new CertificateEncoder({
            year: this.dateInt[0],
            month: this.dateInt[1],
            day: this.dateInt[2],
            score: finalScore,
            sections: passedSections
        }).encodeCertificate();
        ctx.fillText(`證字 ${certNo} 號`, w - 160, 330);
    }

    _drawContent(ctx, w, { pName, desc, level, dwuanway }) {
        ctx.textAlign = "left";
        const startY = 430;
        const indent = 160;
        const contentWidth = w - indent * 2;

        this._drawNameLine(ctx, indent, startY, pName);

        ctx.font = "600 40px 'Noto Serif', 'Noto Serif TC', serif";
        ctx.fillStyle = "#444";
        this._wrapText(ctx, desc, indent, startY + 90, contentWidth, 50);

        this._drawLevelLine(ctx, indent, startY + 300, level, dwuanway);
    }

    _drawNameLine(ctx, x, y, pName) {
        ctx.font = "600 38px 'Noto Serif', 'Noto Serif TC', serif";
        ctx.fillStyle = "#1B2A41";
        const prefixWidth = ctx.measureText("查　").width;
        ctx.fillText("查　", x, y);

        ctx.font = "900 64px 'Noto Serif', 'Noto Serif TC', serif";
        ctx.fillStyle = "#000";
        const nameWidth = ctx.measureText(pName).width;
        ctx.fillText(pName, x + prefixWidth, y);

        ctx.font = "600 38px 'Noto Serif', 'Noto Serif TC', serif";
        ctx.fillStyle = "#1B2A41";
        ctx.fillText("　玩家，", x + prefixWidth + nameWidth, y);

        ctx.beginPath();
        ctx.moveTo(x + prefixWidth - 10, y + 15);
        ctx.lineTo(x + prefixWidth + nameWidth + 10, y + 15);
        ctx.strokeStyle = "#C5A059";
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    _drawLevelLine(ctx, x, y, level, dwuanway) {
        ctx.font = "600 36px 'Noto Serif', 'Noto Serif TC', serif";
        ctx.fillStyle = "#1B2A41";
        const prefixText = "特授予　";
        const prefixWidth = ctx.measureText(prefixText).width;
        ctx.fillText(prefixText, x, y);

        let levelColor = "#C5A059";
        if (level === "臨門一腳") levelColor = this.config.failedColor;
        if (level === "學習證明") levelColor = this.config.learnerColor;

        ctx.font = "900 56px 'Noto Serif', 'Noto Serif TC', serif";
        ctx.fillStyle = levelColor;
        const rankText = `${level}・${dwuanway}`;
        const rankWidth = ctx.measureText(rankText).width;
        ctx.fillText(rankText, x + prefixWidth, y);

        ctx.font = "600 36px 'Noto Serif', 'Noto Serif TC', serif";
        ctx.fillStyle = "#1B2A41";
        ctx.fillText(`　頭銜。`, x + prefixWidth + rankWidth, y);
    }

    _drawFooter(ctx, w, h, dateStr) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#1B2A41";

        ctx.font = "600 32px 'Noto Serif', 'Noto Serif TC', serif";
        ctx.fillText(dateStr, w / 2, 920);

        ctx.font = "900 36px 'Noto Serif', 'Noto Serif TC', serif";
        ctx.letterSpacing = "4px";
        ctx.fillText(this.config.assocName, w / 2, 1000);
        ctx.letterSpacing = "0";

        const sealSize = 220;
        this._drawStampWithRubberNoise(ctx, this.builtInSealImage, w / 2, 920, sealSize);
    }

    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const punctuationRegex = /[。！，、；：？]/;
        const chars = text.split("");
        let line = "";
        let lines = [];

        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const testLine = line + char;
            const testWidth = ctx.measureText(testLine).width;

            if (testWidth > maxWidth && line !== "") {
                if (punctuationRegex.test(char)) {
                    line += char;
                } else {
                    lines.push(line.trim());
                    line = char;

                    while (i + 1 < chars.length && punctuationRegex.test(chars[i + 1])) {
                        line += chars[i + 1];
                        i++;
                    }
                }
            } else {
                line = testLine;
            }
        }

        if (line) lines.push(line.trim());

        lines.forEach((currentLine, lineIndex) => {
            const isLastLine = lineIndex === lines.length - 1;
            const lineWidth = ctx.measureText(currentLine).width;

            if (!isLastLine) {
                const charsInLine = currentLine.split("");
                const spacesNeeded = charsInLine.length - 1;
                const spaceBetweenChars = (maxWidth - lineWidth) / spacesNeeded;

                let currentX = x;
                for (let i = 0; i < charsInLine.length; i++) {
                    const ch = charsInLine[i];
                    ctx.fillText(ch, currentX, y);
                    currentX += ctx.measureText(ch).width;
                    if (i < charsInLine.length - 1) currentX += spaceBetweenChars;
                }
            } else {
                ctx.fillText(currentLine, x, y);
            }

            y += lineHeight;
        });
    }

    _drawGuilloche(ctx, w, h) {
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(197, 160, 89, 0.2)";
        const cx = w / 2, cy = h / 2;

        for (let r = 120; r < w; r += 25) {
            ctx.beginPath();
            for (let angle = 0; angle < Math.PI * 2; angle += 0.01) {
                const radius = r + Math.sin(angle * 24) * 12;
                const px = cx + Math.cos(angle) * radius * 1.1;
                const py = cy + Math.sin(angle) * radius;
                angle === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        ctx.restore();
    }

    _drawCornerRuyi(ctx, x, y, rot) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(70, 0);
        ctx.bezierCurveTo(60, 25, 35, 25, 25, 25);
        ctx.bezierCurveTo(25, 35, 25, 60, 0, 70);
        ctx.closePath();
        ctx.fillStyle = "#1B2A41";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(8, 8);
        ctx.lineTo(55, 8);
        ctx.quadraticCurveTo(25, 8, 8, 55);
        ctx.closePath();
        ctx.strokeStyle = "#C5A059";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    _drawLogoMark(ctx) {
        const flagSize = 64;
        ctx.save();
        ctx.drawImage(this.builtInFlagImage, -flagSize / 2, -flagSize / 1.75, flagSize, flagSize);
        ctx.restore();

        ctx.beginPath();
        ctx.moveTo(-130, 0);
        ctx.lineTo(-60, 0);
        ctx.moveTo(60, 0);
        ctx.lineTo(130, 0);
        ctx.strokeStyle = "#1B2A41";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-110, 12);
        ctx.lineTo(-50, 12);
        ctx.moveTo(50, 12);
        ctx.lineTo(110, 12);
        ctx.strokeStyle = "#C5A059";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    _addNoise(ctx, w, h) {
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 8;
            data[i] += noise;     // R
            data[i + 1] += noise; // G
            data[i + 2] += noise; // B
        }

        ctx.putImageData(imgData, 0, 0);
    }

    _drawStampWithRubberNoise(ctx, img, x, y, size) {
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = size;
        offscreenCanvas.height = size;
        const octx = offscreenCanvas.getContext("2d");

        octx.drawImage(img, 0, 0, size, size);

        const imgData = octx.getImageData(0, 0, size, size);
        const data = imgData.data;
        const alphaVariation = 0.25;
        const colorVariation = 0.25;
        const grain = 0.5;

        for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            if (a === 0) continue;

            const n = Math.random() * 2 - 1;
            data[i] *= 1 + n * colorVariation;     // R
            data[i + 1] *= 1 + n * colorVariation; // G
            data[i + 2] *= 1 + n * colorVariation; // B
            data[i + 3] = Math.max(0, Math.min(255, a * (1 + n * alphaVariation) + n * grain * 255));
        }

        octx.putImageData(imgData, 0, 0);

        // 繪製到目標Canvas
        ctx.save();
        ctx.drawImage(offscreenCanvas, x - size / 2, y - size / 2);
        ctx.restore();
    }
}

class CertificateEncoder {
    static FIELD = {
        YEAR: 3,
        MONTH: 2,
        DAY: 2,
        SCORE: 5,
        SECTIONS: 1,
        SALT: 2
    };

    static SHIFT = 7;
    static MOD = 10;
    static CHECKSUM_MOD = 10;

    constructor({ year, month, day, score, sections }) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.score = score;
        this.sections = sections;
    }

    encodeCertificate() {
        const {
            YEAR, MONTH, DAY, SCORE, SECTIONS
        } = CertificateEncoder.FIELD;

        const yearStr = this.year.toString().padStart(YEAR, '0');
        const monthStr = this.month.toString().padStart(MONTH, '0');
        const dayStr = this.day.toString().padStart(DAY, '0');
        const scoreStr = this.score.toFixed(2).replace(".", "").padStart(5, "0");
        const sectionsStr = this.sections.toString().padStart(SECTIONS, '0');
        const saltStr = Utils.getRandomInt(99).toString().padStart(2, "0");

        const raw = yearStr + monthStr + dayStr + scoreStr + sectionsStr + saltStr;

        let encoded = "";
        for (const ch of raw) {
            const digit = parseInt(ch, 10);
            encoded += (digit + CertificateEncoder.SHIFT) % CertificateEncoder.MOD;
        }

        const sum = [...encoded].reduce((acc, d) => acc + parseInt(d), 0);
        const checksum = (sum % CertificateEncoder.CHECKSUM_MOD).toString();

        return BigInt(encoded + checksum).toString(36).toUpperCase();
    }

    static decodeCertificate(base36) {
        let numeric;

        try {
            numeric = this._base36ToBigInt(base36).toString();
        } catch {
            throw new Error("檢驗失敗，該字號無效。（b）");
        }

        const TOTAL_LEN =
            this.FIELD.YEAR +
            this.FIELD.MONTH +
            this.FIELD.DAY +
            this.FIELD.SCORE +
            this.FIELD.SECTIONS +
            this.FIELD.SALT +
            1;

        numeric = numeric.padStart(TOTAL_LEN, "0");

        if (numeric.length !== TOTAL_LEN) {
            throw new Error("檢驗失敗，該字號無效。（l）");
        }

        const body = numeric.slice(0, -1);
        const checksum = numeric.slice(-1);

        const sum = [...body].reduce((acc, d) => acc + parseInt(d), 0);
        const expected = (sum % this.CHECKSUM_MOD).toString();

        if (expected !== checksum) {
            throw new Error("檢驗失敗，該字號已被竄改或不存在。（cks）");
        }

        let decoded = "";
        for (const ch of body) {
            const digit = parseInt(ch, 10);
            decoded += (digit - this.SHIFT + 10) % 10;
        }

        const { YEAR, MONTH, DAY, SCORE, SECTIONS, SALT } = this.FIELD;

        let idx = 0;

        const year = parseInt(decoded.slice(idx, idx += YEAR), 10);
        const month = parseInt(decoded.slice(idx, idx += MONTH), 10);
        const day = parseInt(decoded.slice(idx, idx += DAY), 10);
        const scoreRaw = decoded.slice(idx, idx += SCORE);
        const sections = parseInt(decoded.slice(idx, idx += SECTIONS), 10);

        const score = this._decodeScore(scoreRaw);

        if (month < 1 || month > 12) throw new Error("檢驗失敗，該字號已被竄改或不存在。（m）");
        if (day < 1 || day > 31) throw new Error("檢驗失敗，該字號已被竄改或不存在。（d）");
        if (score < 0 || score > 100) throw new Error("檢驗失敗，該字號已被竄改或不存在。（s）");
        if (sections < 0 || sections > 5) throw new Error("檢驗失敗，該字號已被竄改或不存在。（ss）");

        return { year, month, day, score, sections };
    }

    static _decodeScore(str) {
        const cleaned = str.replace(/^0+/, "");

        if (cleaned === "") return 0;

        const intPart = cleaned.slice(0, -2);
        const decPart = cleaned.slice(-2);

        return Number(intPart + "." + decPart);
    }

    static _base36ToBigInt(str) {
        const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
        let result = 0n;
        for (const ch of str.toLowerCase()) {
            const value = BigInt(alphabet.indexOf(ch));
            if (value < 0n) throw new Error("Invalid Base36 character: " + ch);
            result = result * 36n + value;
        }
        return result;
    }
}

if (typeof window !== "undefined") {
    window.CertificateGenerator = CertificateGenerator;
    window.CertificateEncoder = CertificateEncoder;
}