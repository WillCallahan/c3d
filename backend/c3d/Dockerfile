FROM public.ecr.aws/lambda/python:3.12

COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

COPY main.py ${LAMBDA_TASK_ROOT}/
COPY app.py ${LAMBDA_TASK_ROOT}/
COPY converter.py ${LAMBDA_TASK_ROOT}/

ARG HANDLER=app.handler
ENV LAMBDA_HANDLER=${HANDLER}

CMD ["app.handler"]
