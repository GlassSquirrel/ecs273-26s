from fastapi import FastAPI, HTTPException
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV1, StockModelV2, StockNewsModel,  StockNewsModelList, tsneDataModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_jintianx # please replace the database name with stock_[your name] to avoid collision at TA's side
            
app = FastAPI(
    title="Stock tracking API",
    summary="An aplication tracking stock prices and respective news"
)

# Enables CORS to allow frontend apps to make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. get stock list
@app.get("/stock_list", 
         response_model=StockListModel
    )
async def get_stock_list():
    """
    Get the list of stocks from the database
    The frontend use this for the drop down menu
    """
    stock_name_collection = db.get_collection("stock_list")
    stock_list = await stock_name_collection.find_one()
    return stock_list

# 2. get stock news
@app.get("/stocknews/{stock_name}", 
        response_model=StockNewsModelList
    )
async def get_stock_news(stock_name: str) -> StockNewsModelList:
    """
    Get the list of news for a specific stock from the database
    The news is sorted by date in ascending order
    If the ticker is not found return 404
    """
    stock_news_collection = db.get_collection("stock_news")

    # find related news for the ticker 
    cursor = stock_news_collection.find(
        {"Stock": stock_name}
    ).sort("Date", 1)

    news_list = await cursor.to_list(length=None)

    # If the ticker is not found
    if not news_list:
        raise HTTPException(
            status_code=404,
            detail=f"No news found for stock {stock_name}."
        )
    
    return {"Stock": stock_name, "News": news_list} # replace with your code to get the news from the database

# 3. get the stock price
@app.get("/stock/{stock_name}", 
        response_model=StockModelV1
    )
async def get_stock(stock_name: str) -> StockModelV1:
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    If the ticker is not found, return 404
    """
    stock_price_collection = db.get_collection("stock_prices")

    # find related price info for the ticker
    stock_data = await stock_price_collection.find_one(
        {"name": stock_name}
    )

    # if the ticker is not found
    if stock_data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Stock {stock_name} price information not found."
        )

    return stock_data # replace with your code to get the news from the database

# 4. get the t-sne coordinate
@app.get("/tsne/",
        response_model=list[tsneDataModel]
    )
async def get_tsne() -> list[tsneDataModel]:
    """
    Get the t-SNE data for a specific stock
    """
    tsne_collection = db.get_collection("tsne_data")

    cursor = tsne_collection.find({})
    tsne_list = await cursor.to_list(length=None)

    return tsne_list # replace with your code to get the news from the database
