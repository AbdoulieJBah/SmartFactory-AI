from fastapi import FastAPI
from routers import products

app = FastAPI(title="SmartFactory AI")

app.include_router(products.router)

@app.get("/")
def root():
    return {"message": "SmartFactory AI Backend Running"}