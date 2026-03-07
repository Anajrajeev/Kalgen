"""Chroma DB wrapper for storing and querying vectors."""

import chromadb
from typing import List, Optional
from .config import settings
import os


class ChromaStore:
    def __init__(self, collection_name: str = "default"):
        # Ensure the chroma directory exists
        os.makedirs(settings.chroma_dir, exist_ok=True)
        
        # Use the new PersistentClient API
        self.client = chromadb.PersistentClient(path=settings.chroma_dir)
        # create or get collection
        self.collection = self.client.get_or_create_collection(name=collection_name)

    def add_documents(self, ids: List[str], texts: List[str], embeddings: List[List[float]]):
        self.collection.add(ids=ids, documents=texts, embeddings=embeddings)

    def query(self, query_embedding: List[float], n_results: int = 5) -> List[dict]:
        results = self.collection.query(query_embeddings=[query_embedding],
                                        n_results=n_results)
        # return list of dicts with id, document, distance
        out = []
        for i in range(len(results["ids"][0])):
            out.append({
                "id": results["ids"][0][i],
                "document": results["documents"][0][i],
                "distance": results["distances"][0][i],
            })
        return out

    def persist(self):
        # PersistentClient automatically persists data, no action needed
        pass


if __name__ == "__main__":
    store = ChromaStore()
    store.add_documents(["1"], ["hello"], [[0.1]*512])
    print(store.query([0.1]*512))
