import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const NEWS_DIR = path.join(__dirname, "data", "stocknews");

app.use(cors());

// 获取某个 ticker 的新闻列表
app.get("/api/news/:ticker", (req, res) => {
  const tickerDir = path.join(NEWS_DIR, req.params.ticker);
  if (!fs.existsSync(tickerDir)) return res.json([]);

  const files = fs.readdirSync(tickerDir).filter((f) => f.endsWith(".txt"));

  const newsList = files.map((filename) => {
    const filePath = path.join(tickerDir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const lines = raw.split(/\r?\n/);

    // 1. 从文件名提取日期（用于排序和展示）
    const [datePart] = filename.split("_");

    // 2. 从文件第一行提取完整标题
    // 查找以 "Title:" 开头的行
    const titleLine = lines.find(l => l.trim().startsWith("Title:"));
    let title = "";
    if (titleLine) {
      title = titleLine.replace(/^Title:\s*/i, "").trim();
    } else {
      // 如果文件内没找到 Title，则退而求其次使用文件名（去掉日期部分）
      title = filename.replace(".txt", "").split("_").slice(1).join("_");
    }

    return {
      id: filename, // 保持 filename 作为唯一 ID
      date: datePart.replace(" ", "T").replace(/-(\d{2})$/, ":$1"),
      title,
      filename,
    };
  });

  // 按日期降序排列
  newsList.sort((a, b) => b.date.localeCompare(a.date));
  res.json(newsList);
});

// 获取某条新闻的完整内容
app.get("/api/news/:ticker/:filename", (req, res) => {
  const filePath = path.join(NEWS_DIR, req.params.ticker, req.params.filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Not found" });

  const raw = fs.readFileSync(filePath, "utf-8");

  // --- 清洗逻辑开始 ---
  
  let content = "";

  // 策略 A：如果有 "----------" 分隔符，直接取其后的内容
  const separator = "----------";
  const separatorIndex = raw.indexOf(separator);
  
  if (separatorIndex !== -1) {
    content = raw.slice(separatorIndex + separator.length).trim();
  } 
  else {
    // 策略 B：如果没有分隔符，我们需要跳过开头的元数据行
    const lines = raw.split(/\r?\n/);
    let startIdx = 0;
    
    // 我们假设开头的 Title, Date, URL 占据了前几行
    // 逻辑：跳过所有以 Title:, Date:, URL: 开头的行，直到遇到第一个非空且非元数据的行
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isMetadata = /^Title:|^Date:|^URL:|^http/i.test(line);
      
      if (line === "" || isMetadata) {
        continue; // 继续跳过
      } else {
        startIdx = i; // 找到了真正的正文起点
        break;
      }
    }
    content = lines.slice(startIdx).join("\n").trim();
  }

  res.json({ content });
});

app.listen(3001, () => console.log("News API running on http://localhost:3001"));