"""RAG orchestrator: retrieve context from Chroma and call Bedrock."""

import re
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
        """Clean text to remove special characters"""
        if not text:
            return ""
        
        # Very minimal cleaning - just remove obvious problematic characters
        cleaned = text
        
        # Remove URLs only
        cleaned = re.sub(r'https?://[^\s]+', '', cleaned)
        
        # Remove only truly problematic characters
        cleaned = re.sub(r'[^\w\s\.\,\-\(\)\n]', '', cleaned)
        
        # Clean up multiple spaces
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # If result is empty after cleaning, return a basic answer
        if len(cleaned) < 5:
            return "Based on the available agricultural information, please provide more details about your specific farming question."
        
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
        max_per_doc = 350  # Reduced from 500 to 350 characters
        for r in results:
            doc = r['document']
            if len(doc) > max_per_doc:
                print(f"RAG: truncating document id={r['id']} from {len(doc)} chars to {max_per_doc}")
                doc = doc[:max_per_doc] + "..."
            snippets.append(doc)
        context = "\n".join(snippets)

        # Limit context to ~700 characters to stay within 8192 token limit
        # Reduced from 6000 to 700 characters
        max_context_chars = 700
        if len(context) > max_context_chars:
            context = context[:max_context_chars] + "..."

        # If Bedrock is not available, return context only
        if self.bedrock is None:
            answer = f"Based on the available context: {context[:500]}... (Note: Full AI response requires Bedrock configuration)"
        else:
            # Construct a user‑friendly prompt that requests a short, simple
            # explanation suitable for a layperson or farmer.
            prompt = (
                "Based on the provided context, answer the farmer's question directly. "
                "Give only the answer in 1-2 sentences. Do not include any instructions or explanations.\n\n"
                f"Context:\n{context}\n\n"
                f"Question: {query_text}\n\n"
                "Answer:"
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
