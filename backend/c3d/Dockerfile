# syntax=docker/dockerfile:1
FROM --platform=linux/amd64 public.ecr.aws/lambda/python:3.12

COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

COPY app.py converter.py ${LAMBDA_TASK_ROOT}/

CMD ["converter.handler"]
