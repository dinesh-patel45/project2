from fastapi import FastAPI
import pandas as pd
from pydantic import BaseModel,Field
import joblib
from fastapi.middleware.cors import CORSMiddleware
app=FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
COLUMNS = ["latitude", "longitude", "price", "minimum_nights",
    "number_of_reviews", "reviews_per_month",
    "calculated_host_listings_count", "availability_365",
    "neighbourhood_group", "neighbourhood",]

# Patch for scikit-learn backward compatibility
import sklearn.compose._column_transformer
class _RemainderColsList(list):
    pass
sklearn.compose._column_transformer._RemainderColsList = _RemainderColsList

model=joblib.load("best_model.pkl")

def patch_imputers(estimator):
    if hasattr(estimator, 'steps'):
        for _, step in estimator.steps:
            patch_imputers(step)
    elif hasattr(estimator, 'transformers_'):
        for _, transformer, _ in estimator.transformers_:
            patch_imputers(transformer)
    elif hasattr(estimator, 'transformer_list'):
        for _, transformer in estimator.transformer_list:
            patch_imputers(transformer)
    
    if estimator.__class__.__name__ == 'SimpleImputer':
        if hasattr(estimator, '_fit_dtype') and not hasattr(estimator, '_fill_dtype'):
            estimator._fill_dtype = estimator._fit_dtype

patch_imputers(model)

#pydantic model=the input validation
class Features(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    price: float = Field(..., gt=0, description="Price per night, must be positive")
    minimum_nights: int = Field(..., ge=1, le=365, description="Minimum nights required for booking")
    number_of_reviews: int = Field(..., ge=0, description="Total number of reviews")
    reviews_per_month: float = Field(..., ge=0, description="Average reviews per month")
    calculated_host_listings_count: int = Field(..., ge=0, description="Number of listings by this host")
    availability_365: int = Field(..., ge=0, le=365, description="Days available out of 365")
    neighbourhood_group: str = Field(..., min_length=1, description="Borough or neighbourhood group")
    neighbourhood: str = Field(..., min_length=1, description="Specific neighbourhood name")

@app.get('/')
def greet():
    return "hello guys"

@app.post('/predict')
def predict(features:Features):
    row=pd.DataFrame([features.model_dump()],columns=COLUMNS)
    prediction=model.predict(row)
    probability=model.predict_proba(row)
    return {
        "predicted_room_type": prediction[0],
        "probability": probability.tolist()[0]# convert numpy array to list for json series
       
   } 

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
