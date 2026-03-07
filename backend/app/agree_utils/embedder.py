"""Embedding helper

This module is a placeholder for generating vector embeddings. In a
production system you would swap this out for a real model (e.g. OpenAI,
HuggingFace, or custom Haiku model).
"""

from typing import List
import numpy as np


class Embedder:
    def __init__(self, dim: int = 512):
        self.dim = dim

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        # TODO: replace with real embedding model
        return [self._fake_embed(t) for t in texts]

    def _fake_embed(self, text: str) -> List[float]:
        # deterministic dummy: hash to seed
        seed = abs(hash(text)) % (2**32)
        rng = np.random.RandomState(seed)
        return rng.rand(self.dim).tolist()


if __name__ == "__main__":
    e = Embedder()
    print(e.embed_texts(["hello world", "test"]))
