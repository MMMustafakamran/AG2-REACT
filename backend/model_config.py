"""Model configuration, factored out of the three agents.

Every AG2 snippet in the docs builds its model inline as

    llm_config=LLMConfig({"model": "gpt-5.4-mini"})

That constructor does not exist in any published `ag2` release (see
`API_DRIFT.md`). The shipped equivalent in ag2 1.0.3 is `OpenAIConfig`, passed
to `Agent(config=...)`, so that is what this helper returns. The model id is
still the one the docs name, so a run that fails on the model is a real
failure and not a substitution of ours.
"""

from __future__ import annotations

import os

from ag2.config import ModelConfig, OpenAIConfig

# What every AG2 doc snippet passes to `LLMConfig`.
DOCS_MODEL = "gpt-5.4-mini"


def build_model_config() -> ModelConfig:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Set OPENAI_API_KEY. AG2's docs use OpenAI for every sample.")

    return OpenAIConfig(
        model=os.getenv("OPENAI_CHAT_MODEL_ID", DOCS_MODEL),
        api_key=api_key,
        streaming=True,
    )
