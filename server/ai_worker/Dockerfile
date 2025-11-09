# Base stage
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app

# Development stage
FROM base AS development
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]

# Production stage
FROM base AS production
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install gunicorn
COPY . .
EXPOSE 8000
ENV PYTHONOPTIMIZE=1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
