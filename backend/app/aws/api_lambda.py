"""
AWS Lambda Handler for API Gateway + FastAPI
Adapts FastAPI ASGI app into an AWS Lambda compatible handler using Mangum.
"""
from mangum import Mangum
from app.main import app

# Handler to configure in AWS Lambda Console: app.aws.api_lambda.handler
handler = Mangum(app, lifespan="off")
