from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware 
from typing import Optional, List
from simbad import visible_objects_bundoora

app = FastAPI(title = "Telescope Simulator API",
              description = "API backend for astronomical object queries",
              version = "1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for production/release: use specific URLs)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

@app.get("/")
def root():
    return {"message": "Telescope Simulator API is running"}

@app.get("/visible")
def visible_objects(
    min_alt_deg: float = Query(30.0, description = "Minimum altitude in degrees"),
    magnitude: float = Query(6.5, description = "Maximum visual magnitude")
):
    try:
        objects = visible_objects_bundoora(min_alt_deg, magnitude)
        if not objects:
            return {"message": "No objects found. Check if it is night time or adjust filters.", "data": []}
        return {"count": len(objects), "data": objects}
    except Exception as e:
        return {"error": str(e)}