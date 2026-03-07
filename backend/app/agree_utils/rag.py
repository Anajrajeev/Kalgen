"""RAG orchestrator: retrieve context from Chroma and call Bedrock."""

from typing import List
from .embedder import Embedder
from .store import ChromaStore
from .bedrock_client import BedrockClient


class RAGSystem:
    def __init__(self, collection_name: str = "default", embed_dim: int = 512, require_bedrock: bool = True):
        self.embedder = Embedder(dim=embed_dim)
        self.store = ChromaStore(collection_name=collection_name)
        self.bedrock = BedrockClient() if require_bedrock else None

    def _clean_text(self, text: str) -> str:
        """Remove special characters and clean up text for better readability."""
        import re
        # Remove extra quotes and special characters
        cleaned = re.sub(r'["\']', '', text)  # Remove various quotes
        cleaned = re.sub(r'[^\w\s\.\,\-\(\)]', '', cleaned)  # Keep only letters, numbers, spaces, basic punctuation
        # Clean up multiple spaces
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        # Fix any double punctuation
        cleaned = re.sub(r'\.+', '.', cleaned)
        cleaned = re.sub(r'\,+', ',', cleaned)
        return cleaned

    def ingest(self, ids: List[str], texts: List[str]):
        embeddings = self.embedder.embed_texts(texts)
        self.store.add_documents(ids, texts, embeddings)
        self.store.persist()

    def query(self, query_text: str, model_id: str = "amazon.titan-embed-text-v1", n_ctx: int = 3, return_context: bool = False):
        # embed query
        print(f"RAG: embedding query '{query_text}'")
        q_emb = self.embedder.embed_texts([query_text])[0]

        print(f"RAG: searching store for top {n_ctx} results")
        results = self.store.query(q_emb, n_results=n_ctx)
        print(f"RAG: raw store results: {results}")

        # build context string using truncated snippets to avoid huge prompts
        snippets = []
        max_per_doc = 500  # characters per document
        for r in results:
            doc = r['document']
            if len(doc) > max_per_doc:
                print(f"RAG: truncating document id={r['id']} from {len(doc)} chars to {max_per_doc}")
                doc = doc[:max_per_doc] + "..."
            snippets.append(doc)
        context = "\n".join(snippets)

        # Limit context to ~6000 characters to stay within 8192 token limit
        # Rough estimate: 1 token ≈ 4 characters
        max_context_chars = 6000
        if len(context) > max_context_chars:
            context = context[:max_context_chars] + "..."

        # If Bedrock is not available, return context only
        if self.bedrock is None:
            answer = f"Based on the available context: {context[:500]}... (Note: Full AI response requires Bedrock configuration)"
        else:
            # Construct a user‑friendly prompt that requests a short, simple
            # explanation suitable for a layperson or farmer.
            prompt = (
                "You are a helpful agricultural assistant that answers questions in plain, simple "
                "language that any farmer can understand. Based on the provided context, give a clear, "
                "concise answer to the farmer's question. Focus on the most relevant information. "
                "IMPORTANT: Use only standard letters, numbers, and basic punctuation. "
                "Avoid any special characters, quotes, or formatting symbols.\n\n"
                f"Context:\n{context}\n\n"
                f"Question: {query_text}\n\n"
                "Provide a helpful answer in simple terms:"
            )
            print(f"RAG: sending prompt to Bedrock:\n{prompt[:200]}...")
            raw_answer = self.bedrock.generate_text(model_id=model_id, prompt=prompt)
            
            # Clean the answer to remove special characters
            answer = self._clean_text(raw_answer)
            print(f"RAG: cleaned answer: {answer[:200]}...")
        
        if return_context:
            return answer, context
        return answer


if __name__ == "__main__":
    rag = RAGSystem()
    rag.ingest(["1"], ["The quick brown fox jumps over the lazy dog."])
    print(rag.query("What jumps over the lazy dog?"))
