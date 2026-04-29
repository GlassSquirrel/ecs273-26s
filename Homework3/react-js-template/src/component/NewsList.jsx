import { useState, useEffect } from "react";

const API_BASE = "http://localhost:3001/api";

export default function NewsList({ selectedStock }) {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedContent, setExpandedContent] = useState({});
  const [loadingContent, setLoadingContent] = useState(null);

  // when selectedStock changes, get the news list
  useEffect(() => {
    if (!selectedStock) {
      setNewsList([]);
      setExpandedId(null);
      return;
    }

    setLoading(true);
    setExpandedId(null);

    fetch(`${API_BASE}/news/${selectedStock}`)
      .then((r) => r.json())
      .then((data) => {
        setNewsList(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedStock]);

  // 点击某条新闻：展开/收起，并懒加载全文
  const handleToggle = async (item) => {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(item.id);

    // 如果还没加载过这条新闻的内容
    if (!expandedContent[item.id]) {
      setLoadingContent(item.id);
      try {
        const res = await fetch(
          `${API_BASE}/news/${selectedStock}/${encodeURIComponent(item.filename)}`
        );
        const data = await res.json();
        setExpandedContent((prev) => ({ ...prev, [item.id]: data.content }));
      } catch {
        setExpandedContent((prev) => ({
          ...prev,
          [item.id]: "Failed to load content.",
        }));
      } finally {
        setLoadingContent(null);
      }
    }
  };

  // 格式化显示日期
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (!selectedStock) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm px-4 text-center">
        Select a stock to view related news.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading news...
      </div>
    );
  }

  if (newsList.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm px-4 text-center">
        No news found for <strong className="ml-1">{selectedStock}</strong>.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto divide-y divide-gray-200">
      {newsList.map((item) => {
        const isExpanded = expandedId === item.id;
        const isLoadingThis = loadingContent === item.id;

        return (
          <div
            key={item.id}
            className="px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleToggle(item)}
          >
            {/* 标题行 */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-800 leading-snug flex-1">
                {item.title}
              </p>
              <span className="text-gray-400 text-xs mt-0.5 flex-shrink-0">
                {isExpanded ? "▲" : "▼"}
              </span>
            </div>

            {/* 日期 */}
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.date)}</p>

            {/* 展开的全文 */}
            {isExpanded && (
              <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                {isLoadingThis ? (
                  <span className="text-gray-400 italic">Loading...</span>
                ) : (
                  expandedContent[item.id] || ""
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}