"""Document loader for ingesting PDFs from Knowledge folder."""

import os
import pdfplumber
from pathlib import Path
from typing import List, Tuple


def load_pdf_documents(knowledge_dir: str = "./Knowledge") -> List[Tuple[str, str]]:
    """
    Load all PDF documents from the Knowledge directory.
    
    Args:
        knowledge_dir: Path to the Knowledge folder containing PDFs
        
    Returns:
        List of tuples (doc_id, text_content)
    """
    documents = []
    
    if not os.path.exists(knowledge_dir):
        print(f"Knowledge directory not found: {knowledge_dir}")
        return documents
    
    pdf_files = list(Path(knowledge_dir).glob("*.pdf"))
    
    if not pdf_files:
        print(f"No PDF files found in {knowledge_dir}")
        return documents
    
    print(f"Found {len(pdf_files)} PDF files to ingest")
    
    for pdf_path in pdf_files:
        doc_id = pdf_path.stem  # filename without extension
        print(f"Processing {pdf_path.name}...")
        
        try:
            text_content = ""
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    text = page.extract_text() or ""
                    text_content += f"\n\n--- Page {page_num} ---\n\n{text}"
            
            if text_content.strip():
                documents.append((doc_id, text_content))
                print(f"  ✓ Extracted {len(text_content)} characters from {pdf_path.name}")
            else:
                print(f"  ⚠ No text extracted from {pdf_path.name}")
                
        except Exception as e:
            print(f"  ✗ Error processing {pdf_path.name}: {str(e)}")
    
    return documents


def ingest_documents(rag_system, documents: List[Tuple[str, str]]):
    """
    Ingest documents into the RAG system.
    
    Args:
        rag_system: RAGSystem instance
        documents: List of (doc_id, text_content) tuples
    """
    if not documents:
        print("No documents to ingest")
        return
    
    ids = [doc[0] for doc in documents]
    texts = [doc[1] for doc in documents]
    
    try:
        rag_system.ingest(ids, texts)
        print(f"\n✓ Successfully ingested {len(documents)} documents into Chroma")
    except Exception as e:
        print(f"\n✗ Error ingesting documents: {str(e)}")


if __name__ == "__main__":
    from .rag import RAGSystem
    
    docs = load_pdf_documents()
    if docs:
        rag = RAGSystem()
        ingest_documents(rag, docs)
