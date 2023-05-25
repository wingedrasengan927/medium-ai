import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())


class APIkeys:
    openaiAPI: str = os.getenv("OPENAI_KEY")
