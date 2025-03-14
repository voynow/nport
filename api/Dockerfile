FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml pdm.lock ./
COPY src/ src/

RUN pip install --no-cache-dir pdm && \
    pdm install --prod --no-lock --no-editable

ENV PYTHONPATH=/app/src

EXPOSE 8000

CMD ["pdm", "run", "python", "-m", "uvicorn", "src.nport.app:app", "--host", "0.0.0.0", "--port", "8000"]

# python -m uvicorn src.nport.app:app --host 0.0.0.0 --port 8000