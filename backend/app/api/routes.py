from fastapi import APIRouter, Query
from typing import Optional
from app.services.simbad import visible_objects_bundoora

router = APIRouter(prefix="/api", tags=["telescope"])

@router.get("/visible")
def get_visible_objects(
    min_alt_deg: float = Query(30.0, description="Minimum altitude in degrees"),
    magnitude: float = Query(6.5, description="Maximum visual magnitude")
):
    """
    Get visible astronomical objects based on altitude and magnitude filters.
    """
    try:
        objects = visible_objects_bundoora(min_alt_deg, magnitude)
        if not objects:
            return {
                "message": "No objects found. Check if it is night time or adjust filters.",
                "data": []
            }
        return {"count": len(objects), "data": objects}
    except Exception as e:
        return {"error": str(e)}
