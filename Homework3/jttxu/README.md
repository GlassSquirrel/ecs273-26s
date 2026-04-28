# ECS 273 Homework3
This repository is for ECS 273 Visual Analytics homework 3. 

## Prerequisites
Before running the code, please make sure you have installed `Node.js` and `npm` (Node Package Manager), run the following command to check:
```
npm -v
```
If you have not installed them yet, please go to the official website of [Node.js](https://nodejs.org/) to download the latest version.

After clone the repository, run the following code in the terminal to install `d3` and the required packages. 
```
cd ecs273-26s\Homework3\react-js-template
npm install
npm install d3
```

## Data requirements
To make sure all the charts can be render successfully, please make sure you saved data from homework1 and homework2 in the `data` folder in the following structure:
```
data/
├── stockdata/
│    ├── AAPL.csv
│    ├── NVDA.csv
│    └── ...
├── stocknews/
│    ├── AAPL/
│    ├── NVDA/
│    └── ...
└── tsne.csv
```
Note: `tsne.csv` should contain one row per stock and include the stock ticker, two t-SNE coordinates, and the sector label.

## Visualization instruction


