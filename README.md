### Predict role via external ML service

Backend expects an ML service at `ML_SERVICE_URL` (default `http://localhost:8000/predict`).

Request:

```
POST /api/analyze/predict-role (multipart/form-data)
  - resumeFile: PDF
```

Env:

```
ML_SERVICE_URL=http://localhost:8000/predict
```

# SmartResumeClassifier