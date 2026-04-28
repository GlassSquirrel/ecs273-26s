import React, { useState, useEffect } from "react";
import * as d3 from "d3";

const allNewsFiles = import.meta.glob('../../data/stocknews/**/*.txt', { as: 'raw', eager: true });

export default function NewsList({ selectedStock }) {
  const [news, setNews] = useState([]);
  // 记录当前哪一条新闻被展开了 (null 表示全部收起)
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    // 每次切换股票时，自动把展开的新闻收起
    setExpandedIndex(null);

    // 1. 如果没有选择股票：清空新闻列表，直接 return
    if (!selectedStock) {
      setNews([]);
      return;
    }

    // 2. 动态筛选并解析当前股票的新闻
    const stockNews = [];
    
    // 遍历抓取到的所有文件路径
    for (const path in allNewsFiles) {
      // 检查这个路径是不是属于当前选中的股票 (比如包含 "/AAPL/")
      if (path.includes(`/${selectedStock}/`)) {
        // 获取 txt 文件的纯文本内容
        const rawContent = allNewsFiles[path];
        
        // 从路径中提取文件名 (例如从 "/public/.../2026-04-24 10-35_This is news.txt" 中提取最后一部分)
        const filename = path.split('/').pop().replace('.txt', '');
        
        // 解析文件名，提取日期和标题
        let date = "Unknown Date";
        let title = filename;
        
        // 假设你的文件名格式是 "2026-04-24 10-35_新闻标题"
        if (filename.includes('_')) {
          // 在第一个下划线处切开
          const firstUnderscoreIndex = filename.indexOf('_');
          const dateTimePart = filename.substring(0, firstUnderscoreIndex); // "2026-04-24 10-35"
          
          date = dateTimePart.split(' ')[0]; // 只取 "2026-04-24"
          title = filename.substring(firstUnderscoreIndex + 1); // 剩下的全部作为标题
        }

        // 把拼装好的新闻塞进数组
        stockNews.push({
          Title: title,
          Date: date,
          Content: rawContent
        });
      }
    }

    // 3. 将新闻按照日期从新到旧排序 (降序)
    stockNews.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    
    // 更新到页面上
    setNews(stockNews);

  }, [selectedStock]);

  return (
    <div className="w-full h-full overflow-y-auto p-3">
      {!selectedStock ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-10">
          <p>Please select a stock from the menu above.</p>
        </div>
      ) : news.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">No news available for {selectedStock}.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {news.map((item, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold text-blue-900 flex-1 pr-2">
                  {item.Title}
                </h4>
                <span className="text-xs text-gray-500 whitespace-nowrap pt-0.5">
                  {item.Date}
                </span>
              </div>

              {expandedIndex === index && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {item.Content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}