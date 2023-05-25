from pydantic import BaseModel
from typing import Literal


class AIAutoSuggest(BaseModel):
    previousContext: str
    currentContext: str
    nextContext: str
    modelName: Literal[
        "text-davinci-003",
        "text-davinci-002",
        "text-davinci-001",
        "text-curie-001",
        "text-babbage-001",
        "text-ada-001",
        "davinci",
        "curie",
        "babbage",
        "ada",
    ]
