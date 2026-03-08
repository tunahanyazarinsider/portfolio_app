FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY Backend/stock_service/requirements.txt ./requirements-base.txt
COPY requirements-ml.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements-base.txt -r requirements-ml.txt

# Copy the application code
COPY Backend/ml_service/ .

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]
