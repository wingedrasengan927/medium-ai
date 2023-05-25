from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.services.ai_autocomplete import (
    fetch_autocomplete_response,
    num_tokens_from_string,
)
from app.services.ai_edit import edit_text, edit_text_chat_completion
from loguru import logger
from typing import Literal
import json
import os
from app.models.ai_edit_model import AIEdit
from app.models.ai_autocomplete_model import AIAutoSuggest

# set up logging
logger.add("logs/ai_api.log", rotation="100 MB", level="DEBUG")

app = FastAPI(
    title="AI API",
    version="1.0",
    description="API for AI model",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.post("/autocomplete")
def autocomplete(context: AIAutoSuggest):
    logger.info(f"Received request to autocomplete text")
    autocomplete_text = fetch_autocomplete_response(
        previous_context=context.previousContext,
        current_context=context.currentContext,
        next_context=context.nextContext,
        model_name=context.modelName,
    )

    return {"message": autocomplete_text}


@app.post("/save_state")
def save_state(editor_state: dict):
    logger.info(f"Received request to save state")

    try:
        with open("app/data/editor_state.json", "w") as f:
            json.dump(editor_state, f)
    except Exception as e:
        logger.error(f"Error saving state: {e}")
        return {"message": "Error saving state"}


@app.get("/load_state")
def load_state():
    logger.info(f"Received request to load state")

    if os.path.exists("app/data/editor_state.json") == False:
        raise HTTPException(status_code=404, detail="State file does not exist")

    try:
        with open("app/data/editor_state.json", "r") as f:
            editor_state = json.load(f)
            return editor_state
    except Exception as e:
        logger.error(f"Error loading state: {e}")
        return {"message": "Error loading state"}


@app.post("/ai_edit")
def ai_edit(ai_edit: AIEdit):
    logger.info(f"Received request to edit text")

    n_tokens = num_tokens_from_string(ai_edit.selectedText, model_name="davinci")
    if n_tokens > 4096:
        raise HTTPException(
            status_code=400,
            detail=f"Input text is too long. It has {n_tokens} tokens, but the maximum is 2048.",
        )
    elif n_tokens == 0:
        raise HTTPException(
            status_code=400,
            detail=f"Input text is empty.",
        )

    try:
        edited_text = edit_text_chat_completion(
            instruction=ai_edit.instruction,
            temperature=ai_edit.temperature,
            selected_text=ai_edit.selectedText,
        )

        return {"edited_text": edited_text}
    except Exception as e:
        logger.error(f"Error editing text: {e}")
        raise HTTPException(status_code=500, detail=str(e))
