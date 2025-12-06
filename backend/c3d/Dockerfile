FROM python:3.9

COPY requirements.txt .
RUN pip install -r requirements.txt
RUN pip install boto3

COPY main.py .
COPY app.py .

CMD ["python", "main.py"]
