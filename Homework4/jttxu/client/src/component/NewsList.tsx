import { useState, useEffect } from "react";

//define type
interface NewsItem {
  Title: string;
  Date: string;
  Url?: string;
  content?: string;
}

interface NewsListProps {
  selectedStock: string | null;
}

// backend: fastAPI
const API_BASE = "http://127.0.0.1:8000";

export default function NewsList({ selectedStock }: NewsListProps) {
  // 1. create states
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 2. fetch the news list
  useEffect(() => {
    if (!selectedStock) {
      setNewsList([]);
      setExpandedId(null);
      return;
    }

    setLoading(true);
    setExpandedId(null);

    fetch(`${API_BASE}/stocknews/${selectedStock}`)
      .then((r) => {
        if (!r.ok) throw new Error("No news found");
        return r.json();
      })
      .then((data: { News: NewsItem[] }) => {
        setNewsList(data.News || []);
        setLoading(false);
      })
      .catch(() => {
        setNewsList([]);
        setLoading(false);
      });
  }, [selectedStock]);

  // 3. expand/undo
  const handleToggle = (id: number): void => {
    setExpandedId(expandedId === id ? null : id);
  };

  // date formate
  const formatDate = (dateStr: string): string => {
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

  // 4. loading/empty
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

  // 5. UI render
  return (
    <div className="h-full overflow-y-auto divide-y divide-gray-200">
      {newsList.map((item, id) => {
        const isExpanded = expandedId === id;
        return (
          <div
            key={id}
            className="px-3 py-2 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            {/* title+date */}
            <div className="cursor-pointer" onClick={() => handleToggle(id)}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-800 leading-snug flex-1">
                  {item.Title}
                </p>
                <span className="text-gray-400 text-xs mt-0.5 flex-shrink-0">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.Date)}</p>
            </div>

            {/* content */}
            {isExpanded && (
              <div
                className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed"
                onClick={(e) => e.stopPropagation()}
              >
                {item.content ? (
                  item.content
                ) : (
                  <span className="text-gray-400 italic">No content available.</span>
                )}

                {/* url */}
                {item.Url && (
                  <a
                    href={item.Url}
                    target="_blank"
                    rel="noreferrer"
                    className="block mt-2 text-blue-500 hover:underline"
                  >
                    Read original article
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}