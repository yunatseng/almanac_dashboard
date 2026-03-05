import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 取得當前檔案的目錄路徑 (ES 模組中的 __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 發送 HTTPS 請求
function fetchHttps(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Almanac-Dashboard/1.0 (GitHub Actions)',
        'Accept': 'text/html'
      }
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return fetchAuto(response.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        if (response.statusCode === 200) resolve(data);
        else reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      });
    }).on('error', reject);
  });
}

// 發送 HTTP 請求
function fetchHttp(url) {
  return new Promise((resolve, reject) => {
    http.get(url, {
      headers: {
        'User-Agent': 'Almanac-Dashboard/1.0 (GitHub Actions)',
        'Accept': 'text/html'
      }
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return fetchAuto(response.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        if (response.statusCode === 200) resolve(data);
        else reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      });
    }).on('error', reject);
  });
}

// 自動判斷 HTTP/HTTPS
function fetchAuto(url) {
  if (url.startsWith('https://')) {
    return fetchHttps(url).catch(() => {
      const httpUrl = url.replace('https://', 'http://');
      console.log(`⚠️  HTTPS 失敗，嘗試 HTTP: ${httpUrl}`);
      return fetchHttp(httpUrl);
    });
  }
  return fetchHttp(url);
}

// 從 HTML 中解析歲次（月柱、日柱）
function parseAlmanac(html, dateStr) {
  // 找到歲次那一行：<p><span>歲次：</span>丙午年 庚寅月 丁丑日</p>
  const suiCiMatch = html.match(/歲次[：:]\s*<\/span>\s*([^<]+)/);
  if (!suiCiMatch) {
    console.warn(`⚠️  ${dateStr}: 找不到歲次資料`);
    return null;
  }

  const suiCiText = suiCiMatch[1].trim();
  // 解析：丙午年 庚寅月 丁丑日
  const yearMatch = suiCiText.match(/(\S{2})年/);
  const monthMatch = suiCiText.match(/(\S{2})月/);
  const dayMatch = suiCiText.match(/(\S{2})日/);

  // 找到農曆日期
  const lunarMatch = html.match(/農曆日期[：:]\s*<\/span>\s*([^<]+)/);
  const lunarDate = lunarMatch ? lunarMatch[1].trim() : '';

  return {
    yearPillar: yearMatch ? yearMatch[1] : '',
    monthPillar: monthMatch ? monthMatch[1] : '',
    dayPillar: dayMatch ? dayMatch[1] : '',
    lunarDate: lunarDate,
    rawSuiCi: suiCiText
  };
}

// 取得未來 N 天的日期陣列
function getDateRange(startDate, days) {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

// 星期對照
const WEEKDAY_MAP = ['日', '一', '二', '三', '四', '五', '六'];

// 將日期物件轉為 "YYYY/M/D" 字串
function toDateStr(d) {
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

// 主要抓取函數
async function fetchAlmanac() {
  console.log('🚀 開始黃曆歲次數據更新...');

  // 以台灣時間 (UTC+8) 為基準取得「今天」
  const now = new Date();
  const twOffset = 8 * 60;
  const localOffset = now.getTimezoneOffset();
  const twNow = new Date(now.getTime() + (twOffset + localOffset) * 60 * 1000);

  const today = new Date(twNow.getFullYear(), twNow.getMonth(), twNow.getDate());
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = lastDayOfMonth - today.getDate() + 1;
  const neededDates = getDateRange(today, daysLeft);
  const neededDateStrs = new Set(neededDates.map(toDateStr));

  // 確保 public 目錄存在
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const outputPath = path.join(publicDir, 'almanac.json');

  // 讀取既有 cache，只保留「今天到月底」範圍內的資料
  let cachedDays = [];
  if (fs.existsSync(outputPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      cachedDays = (existing.days || []).filter(d => neededDateStrs.has(d.date));
      console.log(`📦 快取命中 ${cachedDays.length} / ${neededDates.length} 天`);
    } catch {
      console.warn('⚠️  快取讀取失敗，將重新抓取所有資料');
    }
  }

  // 找出缺少的日期
  const cachedDateSet = new Set(cachedDays.map(d => d.date));
  const missingDates = neededDates.filter(d => !cachedDateSet.has(toDateStr(d)));

  if (missingDates.length === 0) {
    console.log('✅ 資料已完整，無需抓取');
    writeAlmanac(outputPath, cachedDays, neededDates, []);
    return;
  }

  console.log(`📡 需補抓 ${missingDates.length} 天 (${toDateStr(missingDates[0])} ~ ${toDateStr(missingDates[missingDates.length - 1])})`);

  const newResults = [];
  const errors = [];

  for (const date of missingDates) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const dateStr = toDateStr(date);
    const url = `https://calendar.8s8s.net/calendar/${y}/${y}-${m}-${d}.html`;

    try {
      console.log(`📡 正在抓取 ${dateStr}...`);
      const html = await fetchAuto(url);
      const parsed = parseAlmanac(html, dateStr);

      if (parsed) {
        newResults.push({
          date: dateStr,
          year: y,
          month: m,
          day: d,
          weekday: WEEKDAY_MAP[date.getDay()],
          lunarDate: parsed.lunarDate,
          monthPillar: parsed.monthPillar,
          dayPillar: parsed.dayPillar,
          yearPillar: parsed.yearPillar,
          rawSuiCi: parsed.rawSuiCi,
          fetchedAt: new Date().toISOString()
        });
        console.log(`✅ ${dateStr}: ${parsed.monthPillar}月 ${parsed.dayPillar}日`);
      } else {
        errors.push({ date: dateStr, error: '解析失敗' });
      }
    } catch (error) {
      console.error(`❌ ${dateStr}: ${error.message}`);
      errors.push({ date: dateStr, error: error.message });
    }

    // 每次請求間隔 1 秒，避免對網站造成壓力
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 合併 cache + 新抓資料，依日期排序後寫入
  const allDays = [...cachedDays, ...newResults].sort((a, b) => {
    const [ay, am, ad] = a.date.split('/').map(Number);
    const [by, bm, bd] = b.date.split('/').map(Number);
    return ay !== by ? ay - by : am !== bm ? am - bm : ad - bd;
  });

  writeAlmanac(outputPath, allDays, neededDates, errors);
}

function writeAlmanac(outputPath, days, neededDates, errors) {
  const outputData = {
    days,
    metadata: {
      totalDays: days.length,
      startDate: neededDates[0].toISOString().slice(0, 10),
      endDate: neededDates[neededDates.length - 1].toISOString().slice(0, 10),
      lastUpdated: new Date().toISOString(),
      errors
    }
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');

  console.log(`\n✨ almanac.json 已更新`);
  console.log(`📊 總計: ${days.length} 天的數據`);
  console.log(`📁 文件位置: ${outputPath}`);

  if (errors.length > 0) {
    console.warn(`⚠️  遇到 ${errors.length} 個錯誤:`);
    errors.forEach(err => console.warn(`   - ${err.date}: ${err.error}`));
  }
}

// 執行抓取
fetchAlmanac().catch(error => {
  console.error('💥 抓取過程中發生嚴重錯誤:', error);
  process.exit(1);
});
