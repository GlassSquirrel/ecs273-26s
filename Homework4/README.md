# Homework 4 Templates

This folder contains two parts, client and server. To start the project, make sure you have activitated the environment for this course:
```
conda activate ecs273
```

## Prerequisites
Before running the application, ensure that you have the following installed:
- Node.js & npm (for the frontend)
- MongoDB Community Server (running locally on the default port `27017`, You can go to the [mongoDB official website](https://www.mongodb.com/try/download/community) to download the MongoDB Community Server.)
- Python 3.x (for the backend)

## Server

For the server part, make sure you have the respective packages installed.

```
cd server
pip install -r requirements.txt
```

Secondly, make sure you have already installed and started your mongoDB local server. 
For Mac, to test if MongoDB is actually running, run

```
brew services start mongodb-community
```
For Windows, press `Win+R`, then key in `services.msc`. See if you can find MongoDB Server is running. 

Then, put your data into database with:

```
python import_data.py
```

Finally, start your api server by,

```
uvicorn main:app --reload --port 8000
```
The backend API is now running at `http://localhost:8000`. You can view the interactive API documentation at `http://localhost:8000/docs`.

## Client

For the client part, make sure you have install the required packages first. Open another terminal and activate the environment for ecs 273.
```
cd client
npm install
```

```
npm run dev
```
