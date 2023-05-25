import openai
import re
from app.config.config_files import APIkeys

openai.api_key = APIkeys.openaiAPI


def remove_newlines_and_spaces(string):
    pattern = r"\s+$"
    return re.sub(pattern, "", string)


def remove_quotes(string):
    """
    remove single and double quotes from the extreme ends of the string
    """
    pattern = r"^['\"]|['\"]$"
    return re.sub(pattern, "", string)


def edit_text_chat_completion(
    instruction: str,
    selected_text: str,
    temperature: float,
):
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant to a writer. ONLY edit the text as instructed.",
            },
            {
                "role": "user",
                "content": "Edit the following text: "
                f"{selected_text}" + "\n" + f"{instruction}",
            },
        ],
        temperature=temperature / 100,
    )

    response_text = response.choices[0].message.content

    # post processing
    response_text = remove_newlines_and_spaces(response_text)
    response_text = response_text.replace("\t", "")
    response_text = remove_quotes(response_text)

    return response_text


def edit_text(instruction: str, selected_text: str, temperature: float):
    response = openai.Edit.create(
        model="text-davinci-edit-001",
        input=selected_text,
        instruction=instruction,
        temperature=temperature / 100,
        top_p=1,
    )

    # remove /n and spaces from the end of the response
    response_text = response.choices[0].text
    response_text = remove_newlines_and_spaces(response_text)

    # remove /t from the response
    response_text = response_text.replace("\t", "")

    return response_text
