from pydantic import BaseModel


class AIEdit(BaseModel):
    instruction: str
    selectedText: str
    temperature: float = 0.2
