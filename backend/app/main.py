from fastapi import FastAPI

app = FastAPI(title="SmartFactory AI")

@app.get("/")
def root():
    return {"message": "SmartFactory AI Backend Running"}