import sys

sys.path.append(".")
from app.services.ai_autocomplete import clip_context


def test_clip_context_with_no_clipping():
    previous_context = "This is the previous context."
    current_context = "This is the current context."
    next_context = "This is the next context."

    assert clip_context(previous_context, current_context, next_context) == (
        "This is the previous context.This is the next context.This is the current context."
    )


def test_clip_context_with_clipping_on_current_context():
    previous_context = "This is the previous context."
    current_context = "The role of statistics is crucial in the analysis part. It helps us to test the hypothesis and arrive at a decision by observing the monitored data. Now, there are various hypothesis testing methods tailored for different scenarios, but in this article, we’ll understand the idea and the process behind the hypothesis testing framework through a simple example."
    next_context = "This is the next context."

    assert clip_context(
        previous_context, current_context, next_context, max_length=52
    ) == (
        " test the hypothesis and arrive at a decision by observing the monitored data. Now, there are various hypothesis testing methods tailored for different scenarios, but in this article, we’ll understand the idea and the process behind the hypothesis testing framework through a simple example."
    )


def test_clip_context_with_clipping_on_previous_context():
    previous_context = "The role of statistics is crucial in the analysis part. It helps us to test the hypothesis and arrive at a decision by observing the monitored data. Now, there are various hypothesis testing methods tailored for different scenarios, but in this article, we’ll understand the idea and the process behind the hypothesis testing framework through a simple example."
    current_context = "This is the current context."
    next_context = "This is the next context."

    assert clip_context(
        previous_context, current_context, next_context, max_length=52
    ) == (
        " a decision by observing the monitored data. Now, there are various hypothesis testing methods tailored for different scenarios, but in this article, we’ll understand the idea and the process behind the hypothesis testing framework through a simple example.This is the current context."
    )


def test_clip_context_with_clipping_on_next_context():
    previous_context = "This is the previous context."
    current_context = "This is the current context."
    next_context = "The role of statistics is crucial in the analysis part. It helps us to test the hypothesis and arrive at a decision by observing the monitored data. Now, there are various hypothesis testing methods tailored for different scenarios, but in this article, we’ll understand the idea and the process behind the hypothesis testing framework through a simple example."

    assert clip_context(
        previous_context, current_context, next_context, max_length=52
    ) == (
        "The role of statistics is crucial in the analysis part. It helps us to test the hypothesis and arrive at a decision by observing the monitored data. Now, there are various hypothesis testing methods tailored for differentThis is the previous context.This is the current context."
    )


def test_clip_context_with_empty_current_context():
    previous_context = "This is the previous context."
    current_context = ""
    next_context = "This is the next context."

    assert clip_context(previous_context, current_context, next_context) == (
        "This is the previous context.This is the next context."
    )


def test_clip_context_with_empty_previous_context():
    previous_context = ""
    current_context = "This is the current context."
    next_context = "This is the next context."

    assert clip_context(previous_context, current_context, next_context) == (
        "This is the next context.This is the current context."
    )


def test_clip_context_with_empty_next_context():
    previous_context = "This is the previous context."
    current_context = "This is the current context."
    next_context = ""

    assert clip_context(previous_context, current_context, next_context) == (
        "This is the previous context.This is the current context."
    )
