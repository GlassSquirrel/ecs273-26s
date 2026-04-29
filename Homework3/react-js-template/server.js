import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const NEWS_DIR = path.join(__dirname, "data", "stocknews");

app.use(cors());

// 获取某个 ticker 的新闻列表（只返回标题和日期）
app.get("/api/news/:ticker", (req, res) => {
  const tickerDir = path.join(NEWS_DIR, req.params.ticker);
  if (!fs.existsSync(tickerDir)) return res.json([]);

  const files = fs.readdirSync(tickerDir).filter((f) => f.endsWith(".txt"));

  const newsList = files.map((filename) => {
    // 文件名格式: "2026-04-24 10-35_This Tech Company Is..."
    const [datePart, ...titleParts] = filename.replace(".txt", "").split("_");
    return {
      id: filename,
      date: datePart.replace(" ", "T").replace(/-(\d{2})$/, ":$1"), // 格式化时间
      title: titleParts.join("_"),
      filename,
    };
  });

  // 按日期降序排列（最新的在前）
  newsList.sort((a, b) => b.date.localeCompare(a.date));
  res.json(newsList);
});

// 获取某条新闻的完整内容
app.get("/api/news/:ticker/:filename", (req, res) => {
  const filePath = path.join(
    NEWS_DIR,
    req.params.ticker,
    req.params.filename
  );
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Not found" });

  const content = fs.readFileSync(filePath, "utf-8");
  res.json({ content });
});

app.listen(3001, () => console.log("News API running on http://localhost:3001"));