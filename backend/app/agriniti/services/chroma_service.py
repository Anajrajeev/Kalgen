"""
ChromaDB service — vector store for listings and buyer profiles.

Two collections:
  - listings       → one doc per active listing
  - buyer_profiles → one doc per buyer user

All operations are synchronous (ChromaDB's default client is sync).
"""

import chromadb

_client = chromadb.PersistentClient(path="./chroma_db")

listings_col = _client.get_or_create_collection(
    name="listings",
    metadata={"hnsw:space": "cosine"},
)

buyer_profiles_col = _client.get_or_create_collection(
    name="buyer_profiles",
    metadata={"hnsw:space": "cosine"},
)


# ---------------------------------------------------------------------------
# Listings collection
# ---------------------------------------------------------------------------

def upsert_listing(
    listing_id: str,
    embedding: list[float],
    metadata: dict,
) -> None:
    """Index or re-index a listing."""
    listings_col.upsert(
        ids=[listing_id],
        embeddings=[embedding],
        metadatas=[metadata],
    )


def delete_listing(listing_id: str) -> None:
    """Remove a listing from the vector store."""
    try:
        listings_col.delete(ids=[listing_id])
    except Exception:
        pass  # silently ignore if not found


def query_listings(
    query_embedding: list[float],
    n: int = 10,
    where: dict | None = None,
) -> list[dict]:
    """
    Find the top-n most similar listings to the query vector.
    Returns a list of dicts with keys: id, distance, metadata.
    """
    kwargs: dict = {
        "query_embeddings": [query_embedding],
        "n_results": min(n, max(1, listings_col.count())),
        "include": ["metadatas", "distances"],
    }
    if where:
        kwargs["where"] = where

    results = listings_col.query(**kwargs)
    if not results["ids"] or not results["ids"][0]:
        return []

    return [
        {
            "id": results["ids"][0][i],
            "distance": results["distances"][0][i],
            "score": round(1 - results["distances"][0][i], 4),  # cosine → similarity
            "metadata": results["metadatas"][0][i],
        }
        for i in range(len(results["ids"][0]))
    ]


# ---------------------------------------------------------------------------
# Buyer profiles collection
# ---------------------------------------------------------------------------

def upsert_buyer(
    user_id: str,
    embedding: list[float],
    metadata: dict,
) -> None:
    buyer_profiles_col.upsert(
        ids=[user_id],
        embeddings=[embedding],
        metadatas=[metadata],
    )


def query_buyers(
    query_embedding: list[float],
    n: int = 10,
) -> list[dict]:
    """Find top-n buyers matching the query vector (e.g. from a listing)."""
    count = buyer_profiles_col.count()
    if count == 0:
        return []

    results = buyer_profiles_col.query(
        query_embeddings=[query_embedding],
        n_results=min(n, count),
        include=["metadatas", "distances"],
    )

    if not results["ids"] or not results["ids"][0]:
        return []

    return [
        {
            "id": results["ids"][0][i],
            "distance": results["distances"][0][i],
            "score": round(1 - results["distances"][0][i], 4),
            "metadata": results["metadatas"][0][i],
        }
        for i in range(len(results["ids"][0]))
    ]
