"""Simple wrapper around AWS Bedrock using boto3."""

import boto3
import base64
import json
from .config import settings


class BedrockClient:
    def __init__(self):
        # credentials will be automatically picked up from env vars
        self.client = boto3.client(
            "bedrock",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key,
            aws_secret_access_key=settings.aws_secret_key,
        )

    def generate_text(self, model_id: str, prompt: str, temperature: float = 0.7, max_tokens: int = 300):
        """Generate text using Bedrock with Claude 3 Haiku model."""
        try:
            runtime_client = boto3.client(
                "bedrock-runtime",
                region_name=settings.aws_region,
                aws_access_key_id=settings.aws_access_key,
                aws_secret_access_key=settings.aws_secret_key,
            )
            
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            
            response = runtime_client.invoke_model(
                modelId="anthropic.claude-3-haiku-20240307-v1:0",
                body=json.dumps(body)
            )
            
            response_body = json.loads(response["body"].read())
            answer = response_body.get("content", [{}])[0].get("text", "")
            
            return answer
            
        except Exception as e:
            # If Bedrock fails, return a helpful error message
            return f"Error calling Bedrock Claude: {str(e)}"

    def analyze_image(self, image_data: str, prompt: str, model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"):
        """Analyze image using Claude 3 Sonnet vision model."""
        try:
            runtime_client = boto3.client(
                "bedrock-runtime",
                region_name=settings.aws_region,
                aws_access_key_id=settings.aws_access_key,
                aws_secret_access_key=settings.aws_secret_key,
            )
            
            # Claude 3 uses messages format
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": image_data
                                }
                            },
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ],
                "max_tokens": 1000,
                "temperature": 0.1
            }
            
            response = runtime_client.invoke_model(
                modelId=model_id,
                body=json.dumps(body)
            )
            
            response_body = json.loads(response["body"].read())
            answer = response_body.get("content", [{}])[0].get("text", "")
            
            return answer
            
        except Exception as e:
            return f"Error calling Claude 3 Vision: {str(e)}"


if __name__ == "__main__":
    bc = BedrockClient()
    try:
        out = bc.generate_text(model_id="amazon.titan-embed-text-v1", prompt="Hello")
        print(out)
    except Exception as e:
        print("Bedrock call failed", e)
