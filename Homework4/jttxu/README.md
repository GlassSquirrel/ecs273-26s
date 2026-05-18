# Homework 4

This folder contains two parts, client and server. 

## Prerequisites
Before running the application, ensure that you have the following installed:
- Node.js & npm (for the frontend)
- MongoDB Community Server (running locally on the default port `27017`, You can go to the [mongoDB official website](https://www.mongodb.com/try/download/community) to download the MongoDB Community Server.)
- Python 3.x with conda environment `ecs273` (for the backend)
First, activate the course environment:
```
conda activate ecs273
```

## 1. Install Server Dependencies
For the server part, make sure you have the respective dependencies installed.
```
cd server
pip install -r requirements.txt
```

## 2. Install Client Dependencies
For the client part, open another terminal, activate the environment, then:
```
cd client
npm install
```
## 3. Start MongoDB
Have your stock data files stored in `server/data` file, with stock price data inside the `stockdata` file, as `<TICKER>.csv`, news data inside the `stocknews/<TICKER>` as `.txt` files, and t-SNE data at `tsne.csv` with columns: `Ticker, t-SNE_Dim1, t-SNE_Dim2, Sector`. The structure is:
```
data/
├── stockdata/     (results from Homework 1 Task 1, for the past 2 years.)
│ ├── CAT.csv
│ ├── CVX.csv
│ └── ...
├── stocknews/    (results from Homework 1 Task 2)
│ ├── AAPL/
│ ├── NVDA/
│ └── ...
└── tsne.csv
```
Before running the code, make sure you have already installed and started your mongoDB local server. 
For Mac, to test if MongoDB is actually running, run
```
brew services start mongodb-community
```
For Windows, press `Win+R`, then key in `services.msc`. See if you can find MongoDB Server is running. 
If not running, open PowerShell as Administrator and run:
```
net start MongoDB
```

## 4. Import Data into MongoDB
Put your data into database with:
```
cd server
python import_data.py
```
This will create a database named `stock_jintianx` with the following collections:
- `stock_list`: list of 20 stock tickers
- `stock_prices`: historical price data for each stock
- `stock_news`: news articles for each stock
- `tsne_data`: t-SNE projection coordinates with sector labels

## 5. Run the FastAPI Backend
Start your api server by,
```
uvicorn main:app --reload --port 8000
```
The backend API is now running at `http://localhost:8000`. You can view the interactive API documentation at `http://localhost:8000/docs`.

Available endpoints:
- `GET /stock_list`: returns all stock tickers
- `GET /stock/{stock_name}`: returns price time-series for a specific stock
- `GET /stocknews/{stock_name}`: returns news articles for a specific stock
- `GET /tsne`: returns t-SNE projection data for all stocks

## 6. Run the React Frontend
Make sure you have the backend API running, then in the separate terminal:
```
cd client
npm run dev
```
click the URL (usually `http://localhost:5173/`) to see the user interface.
