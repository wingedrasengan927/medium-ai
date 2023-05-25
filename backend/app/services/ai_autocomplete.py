import tiktoken
import openai
from app.services.ai_edit import remove_newlines_and_spaces
from app.config.config_files import APIkeys

openai.api_key = APIkeys.openaiAPI


def num_tokens_from_string(string: str, model_name: str) -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.encoding_for_model(model_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens


def clip_context(
    previous_context: str,
    current_context: str,
    next_context: str,
    max_tokens: int,
    max_length: int = 2048,
    model_name: str = "text-curie-001",
):
    """
    Combine and clip all the contexts to max_length.
    """
    if "davinci" in model_name:
        max_length = 4096

    # subtract max_tokens from max_length to account for the tokens in the current context
    max_length = max_length - max_tokens

    result = {"prompt": "", "suffix": ""}

    encoding = tiktoken.encoding_for_model(model_name)
    current_context_tokens = encoding.encode(current_context)
    if len(current_context_tokens) > max_length:
        current_context_tokens = current_context_tokens[
            len(current_context_tokens) - max_length :
        ]
        result["prompt"] = encoding.decode(current_context_tokens)
        return result
    else:
        previous_context_tokens = encoding.encode(previous_context)
        if len(previous_context_tokens) + len(current_context_tokens) > max_length:
            previous_context_tokens = previous_context_tokens[
                len(previous_context_tokens)
                + len(current_context_tokens)
                - max_length :
            ]
            result["prompt"] = encoding.decode(
                previous_context_tokens + current_context_tokens
            )

            return result

        next_context_tokens = encoding.encode(next_context)
        if (
            len(previous_context_tokens)
            + len(current_context_tokens)
            + len(next_context_tokens)
            > max_length
        ):
            next_context_tokens = next_context_tokens[
                : max_length
                - len(previous_context_tokens)
                - len(current_context_tokens)
            ]

            result["prompt"] = encoding.decode(
                previous_context_tokens + current_context_tokens
            )
            result["suffix"] = encoding.decode(next_context_tokens)

            return result

        result["prompt"] = previous_context + current_context
        result["suffix"] = next_context
        return result


def openai_completion(
    result: dict, max_tokens: int, model_name: str = "text-curie-001"
):
    is_space_at_end = result["prompt"].endswith(" ")
    # getting better results if we remove space at the end
    prompt = result["prompt"].rstrip()
    if model_name == "text-davinci-002":
        suffix = result["suffix"].lstrip() if len(result["suffix"]) > 0 else None

        res = openai.Completion.create(
            model=model_name,
            prompt=prompt,
            suffix=suffix,
            max_tokens=max_tokens,
            temperature=0.2,
            stop=["\n"],
            echo=False,
        )
    else:
        suffix = result["suffix"].lstrip() if len(result["suffix"]) > 0 else ""
        input_text = suffix + prompt

        res = openai.Completion.create(
            model=model_name,
            prompt=input_text,
            max_tokens=max_tokens,
            temperature=0.2,
            stop=["\n"],
            echo=False,
        )

    res_text = res["choices"][0]["text"]

    # post processing

    # remove new lines and spaces from the end of the autocomplete response
    res_text = remove_newlines_and_spaces(res_text)
    # remove tabs from the autocomplete response
    res_text = res_text.replace("\t", "")

    if is_space_at_end:
        res_text = res_text.lstrip()

    return res_text


def fetch_autocomplete_response(
    previous_context: str,
    current_context: str,
    next_context: str,
    model_name: str = "text-curie-001",
    min_tokens: int = 16,
    max_tokens: int = 64,
):
    """
    Parameters
    -----------

    previous_context: str
        The text that comes before the current context.
    current_context: str
        The current text being typed by the user.
    next_context: str
        The text that comes after the current context.
    model_name: str
        The name of the model to use for the autocomplete response.
    min_tokens: int
        minimum number of tokens required to trigger the autocomplete response.
    max_tokens: int
        maximum number of tokens the model will return in the autocomplete response.
    """
    parsed_context = clip_context(
        previous_context,
        current_context,
        next_context,
        max_tokens=max_tokens,
        model_name=model_name,
    )
    text_total = parsed_context["prompt"] + parsed_context["suffix"]
    n_tokens = num_tokens_from_string(text_total, model_name=model_name)

    if n_tokens > min_tokens:
        autocomplete_text = openai_completion(
            parsed_context, max_tokens=max_tokens, model_name=model_name
        )
        return autocomplete_text

    return ""
