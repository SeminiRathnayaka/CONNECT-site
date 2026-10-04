FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# app/main.py is an interactive command line chatbot and would sit waiting for
# input forever, so the server has to be started explicitly.
CMD ["uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "8000"]
