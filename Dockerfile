# Stage 1: Build Frontend Assets
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend-react
COPY frontend-react/package*.json ./
RUN npm install
COPY frontend-react/ ./
RUN npm run build

# Stage 2: Production Python Backend & Unified Server
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements-eng.txt ./
RUN pip install --no-cache-dir -r requirements-eng.txt

# Copy backend code, scripts, tests
COPY backend/ ./backend/
COPY scripts/ ./scripts/
COPY tests/ ./tests/

# Copy compiled React frontend assets
COPY --from=frontend-builder /app/frontend-react/dist ./frontend-react/dist

# Expose HTTP port
EXPOSE 8000

# Set environment
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Start Uvicorn production server
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
