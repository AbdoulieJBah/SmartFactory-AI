from google import genai

from config import GEMINI_API_KEY, GEMINI_MODEL


def generate_ai_response(question: str, factory_context: dict) -> str:
    if not GEMINI_API_KEY:
        return (
            "Gemini API key is missing. Please configure GEMINI_API_KEY "
            "in your backend .env file."
        )

    client = genai.Client(api_key=GEMINI_API_KEY)

    prompt = f"""
You are SmartFactory AI Copilot, an expert assistant for manufacturing MES and ERP systems.

You help factory managers, production planners, quality teams, inventory teams, maintenance teams, and executives understand factory performance.

Use only the provided factory context. Do not invent data.

User question:
{question}

Factory context:
{factory_context}

Give a clear, practical operational answer with recommendations.
"""

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    return response.text or "No response generated from Gemini."