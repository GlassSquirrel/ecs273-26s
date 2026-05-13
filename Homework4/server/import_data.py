import os
import re
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_jintianx

# 1. setups
stock_name_collection = db.get_collection("stock_list")
stock_price_collection = db.get_collection("stock_prices")
stock_news_collection = db.get_collection("stock_news")
tsne_collection = db.get_collection("tsne_data")

tickers = [ 'XOM', 'CVX', 'HAL',
            'MMM', 'CAT', 'DAL',
            'MCD', 'NKE', 'KO',
            'JNJ', 'PFE', 'UNH',
            'JPM', 'GS', 'BAC',
            'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']

DATA_DIR = os.path.join(os.path.dirname(__file__),"data")
STOCKDATA_DIR = os.path.join(DATA_DIR, "stockdata")
STOCKNEWS_DIR = os.path.join(DATA_DIR, "stocknews")
TSNE_DIR = os.path.join(DATA_DIR, "tsne.csv")

# 2. get stock names
async def import_tickers_to_mongodb():
    # Insert the tickers into the collection
    await stock_name_collection.delete_many({})  # in case of replication
    await stock_name_collection.insert_one({
        "tickers": tickers
    })
    print("√ stock_list imported")

# 3. get stock prices
async def import_stock_prices_to_mongodb():
    await stock_price_collection.delete_many({})
    documents = []
    for ticker in tickers:
        price_path = os.path.join(STOCKDATA_DIR, f"{ticker}.csv")
        if not os.path.exists(price_path):
            print(f"× {ticker}.csv not found, skipped")
            continue
        df = pd.read_csv(price_path)
        doc = {
            "name":   ticker,
            "date":   df["Date"].astype(str).tolist(),
            "Open":   df["Open"].tolist(),
            "High":   df["High"].tolist(),
            "Low":    df["Low"].tolist(),
            "Close":  df["Close"].tolist(),
            "Volume": df["Volume"].tolist(),
        }
        documents.append(doc)

    if documents:
        await stock_price_collection.insert_many(documents)
    print(f"√ stock_price imported ({len(documents)} stocks)")

# 4. get stock news
# 4.1 parse the news file
def parse_news_file(filepath: str, ticker: str) -> dict:
    """
    filename scheme: "yyyy-mm-dd tt-tt_News Title.txt"
    file content scheme: 
        News Title
        yyyy-mm-dd tt-tt
        https://finance.yahoo.com/news/URL
        ----------
        Body

    """
    filename = os.path.splitext(os.path.basename(filepath))[0]

    # parse file name
    match = re.match(r'^(\d{4}-\d{2}-\d{2}) (\d{2})-(\d{2})_(.*)', filename)
    if match:
        date_fallback  = f"{match.group(1)} {match.group(2)}:{match.group(3)}"
        title_fallback = match.group(4).strip()
    else:
        date_fallback  = ""
        title_fallback = filename
    
    # parse file content
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except Exception:
        return {
            "Stock":   ticker,
            "Title":   title_fallback,
            "Date":    date_fallback,
            "Url":     "",
            "content": ""
        }
    
    title         = ""
    date          = ""
    url           = ""
    content_lines = []
    header_done   = False

    for line in lines:
        stripped = line.strip()

        if header_done:
            content_lines.append(stripped)
            continue

        # seperate line
        if not stripped or re.match(r'^[-=*_~]{3,}$', stripped):
            if title or date or url:
                header_done = True
            continue

        if re.match(r'https?://', stripped):
            url = stripped
        elif re.match(r'\d{4}-\d{2}-\d{2}', stripped):
            date = stripped
        elif not title:
            title = stripped
        else:
            header_done = True
            content_lines.append(stripped)
        
    content = ' '.join(l for l in content_lines if l).strip()

    # in case there's no title or date contained in the content
    if not title:
        title = title_fallback
    if not date:
        date = date_fallback
    
    return {
        "Stock":   ticker,
        "Title":   title,
        "Date":    date,
        "Url":     url,
        "content": content,
    }

# 4.2 import news
async def import_stock_news_to_mongodb():
    await stock_news_collection.delete_many({})
    documents = []
    for ticker in tickers:
        news_dir = os.path.join(STOCKNEWS_DIR, ticker)
        if not os.path.isdir(news_dir):
            print(f"× news folder for {ticker} not found, skipped")
            continue
        news_txt = [f for f in os.listdir(news_dir) if f.endswith('.txt')]
        for fname in news_txt:
            fpath = os.path.join(news_dir, fname)
            doc = parse_news_file(fpath, ticker)
            documents.append(doc)
        
    if documents:
        await stock_news_collection.insert_many(documents)
    print(f"√ stock_news imported ({len(documents)} news)")

# 5. get t-SNE data
async def import_tsne_to_mongodb():
    await tsne_collection.delete_many({})
    df = pd.read_csv(TSNE_DIR)
    documents = []
    for _, row in df.iterrows():
        doc = {
            "Stock":  row["Ticker"],
            "x":      float(row["t-SNE_Dim1"]),
            "y":      float(row["t-SNE_Dim2"]),
            "Sector": row["Sector"],
        }
        documents.append(doc)
    await tsne_collection.insert_many(documents)
    print(f"√ tsne_data imported ({len(documents)} stocks)")

# 6. main entrance
async def main():
    await import_tickers_to_mongodb()
    await import_stock_prices_to_mongodb()
    await import_stock_news_to_mongodb()
    await import_tsne_to_mongodb()
    print('\n All data imported to stock_jintianx')

if __name__ == "__main__":
    asyncio.run(main())
