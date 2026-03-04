# 流月流日總覽

根據我自身喜忌來顯示未來的流月、流日以及運勢參考。

## 功能

- 七天卡片式排版，自動標記今日（台灣時間）
- 依干支組合根據自身喜忌分級標色
- 資料來源為：`calendar.8s8s.net`，無資料時自動退回 Mock 資料

## 開發

```bash
npm install
npm run dev
```

更新黃曆資料（寫入 `public/almanac.json`）：

```bash
node scripts/fetch-almanac.js
```

## 部署

```bash
npm run build
bash scripts/prepare-deploy.sh  # 將 almanac.json 複製至 dist/
```

將 `dist/` 部署至 GitHub Pages 或任何靜態主機。

## Acknowledgments

- 黃曆資料來源：[calendar.8s8s.net](https://calendar.8s8s.net)
- UI 字型：[Noto Sans TC](https://fonts.google.com/noto/specimen/Noto+Sans+TC)、[Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4)（Google Fonts）

## License

MIT
