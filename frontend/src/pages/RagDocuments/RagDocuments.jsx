import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Eye,
  FileText,
  LoaderCircle,
  MessageSquareText,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { ragService } from "../../services/rag/rag.service.js";
import RagAnswerBody from "../../components/RagAnswerBody/RagAnswerBody.jsx";
import styles from "./RagDocuments.module.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const documentIdOf = document => document?.documentId ?? document?.document_id;

const formatBytes = bytes => {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = date => {
  if (!date) return "";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function RagDocuments() {
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeTab, setActiveTab] = useState("ask");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const activeDocument = useMemo(
    () => documents.find(document => String(documentIdOf(document)) === String(activeId)),
    [activeId, documents],
  );

  const refreshDocuments = useCallback(async () => {
    const response = await ragService.listDocuments();
    const nextDocuments = response.data || [];
    setDocuments(nextDocuments);
    setActiveId(currentId => {
      if (nextDocuments.some(document => String(documentIdOf(document)) === String(currentId))) {
        return currentId;
      }
      return nextDocuments.length ? documentIdOf(nextDocuments[0]) : null;
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    ragService
      .listDocuments()
      .then(response => {
        if (!mounted) return;
        const nextDocuments = response.data || [];
        setDocuments(nextDocuments);
        setActiveId(nextDocuments.length ? documentIdOf(nextDocuments[0]) : null);
      })
      .catch(err => {
        if (mounted) setError(err.response?.data?.msg || err.response?.data?.message || "Could not load your documents.");
      })
      .finally(() => mounted && setIsLoading(false));
    return () => { mounted = false; };
  }, []);

  const hasProcessingDocuments = documents.some(
    document => document.status === "processing" || document.status === "pending",
  );
  useEffect(() => {
    if (!hasProcessingDocuments) return undefined;
    const timer = window.setInterval(() => {
      refreshDocuments().catch(err => {
        setError(err.response?.data?.msg || err.response?.data?.message || "Could not refresh document status.");
      });
    }, 3500);
    return () => window.clearInterval(timer);
  }, [hasProcessingDocuments, refreshDocuments]);

  useEffect(() => {
    let mounted = true;
    let objectUrl = "";
    if (
      activeTab !== "preview" ||
      !activeDocument ||
      activeDocument.status !== "ready"
    ) {
      return undefined;
    }

    ragService
      .fetchPdfObjectUrl(documentIdOf(activeDocument))
      .then(url => {
        objectUrl = url;
        if (mounted) setPreviewUrl(url);
        else URL.revokeObjectURL(url);
      })
      .catch(err => {
        if (mounted) setError(err.response?.data?.msg || err.response?.data?.message || "Could not load PDF preview.");
      })
      .finally(() => mounted && setIsPreviewLoading(false));
    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeDocument, activeTab]);

  const uploadFile = async file => {
    if (!file) return;
    setError("");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose a PDF file to upload.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("PDF files must be 10 MB or smaller.");
      return;
    }

    setIsUploading(true);
    try {
      const response = await ragService.uploadPdf(file);
      const newDocument = response.data;
      setDocuments(current => [
        newDocument,
        ...current.filter(document => String(documentIdOf(document)) !== String(documentIdOf(newDocument))),
      ]);
      setActiveId(documentIdOf(newDocument));
      setActiveTab("ask");
      setPreviewUrl("");
      setIsPreviewLoading(false);
      setAnswer(null);
      setSearchResults([]);
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUploadChange = event => uploadFile(event.target.files?.[0]);
  const handleDrop = event => {
    event.preventDefault();
    uploadFile(event.dataTransfer.files?.[0]);
  };

  const deleteDocument = async document => {
    if (!window.confirm(`Delete "${document.title}" and its indexed content?`)) return;
    const id = documentIdOf(document);
    setDeletingId(id);
    setError("");
    try {
      await ragService.deleteDocument(id);
      const remaining = documents.filter(item => String(documentIdOf(item)) !== String(id));
      setDocuments(remaining);
      setActiveId(remaining.length ? documentIdOf(remaining[0]) : null);
      setActiveTab("ask");
      setPreviewUrl("");
      setIsPreviewLoading(false);
      setAnswer(null);
      setSearchResults([]);
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || "Could not delete the document.");
    } finally {
      setDeletingId(null);
    }
  };

  const submitQuery = async event => {
    event.preventDefault();
    if (!query.trim() || !activeDocument) return;
    setError("");
    if (activeTab === "ask") {
      setIsAsking(true);
      setAnswer(null);
      try {
        const response = await ragService.queryDocument(documentIdOf(activeDocument), query.trim());
        setAnswer(response.data);
      } catch (err) {
        setError(err.response?.data?.msg || err.response?.data?.message || "Could not answer from this document.");
      } finally {
        setIsAsking(false);
      }
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    try {
      const response = await ragService.searchInDocument(documentIdOf(activeDocument), query.trim());
      setSearchResults(response.data?.results || []);
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || "Could not search this document.");
    } finally {
      setIsSearching(false);
    }
  };

  const selectDocument = document => {
    setActiveId(documentIdOf(document));
    setActiveTab("ask");
    setPreviewUrl("");
    setIsPreviewLoading(false);
    setQuery("");
    setAnswer(null);
    setSearchResults([]);
    setError("");
  };

  const changeTab = tab => {
    if (activeTab === tab) return;
    if (activeTab === "preview" || tab === "preview") setPreviewUrl("");
    setIsPreviewLoading(tab === "preview");
    setActiveTab(tab);
  };

  return (
    <div className={styles.workspace}>
      <aside className={styles.library}>
        <div className={styles.library__heading}>
          <div className={styles.library__icon}><BookOpen size={19} /></div>
          <div>
            <h2>Knowledge base</h2>
            <p>Your private PDF library</p>
          </div>
        </div>

        <button
          type="button"
          className={styles.upload}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={event => event.preventDefault()}
          onDrop={handleDrop}
          disabled={isUploading}
        >
          {isUploading ? <LoaderCircle className={styles.spin} size={20} /> : <UploadCloud size={20} />}
          <span>{isUploading ? "Uploading and indexing..." : "Upload a PDF"}</span>
          <small>Drop a file here or browse · up to 10 MB</small>
        </button>
        <input
          ref={fileInputRef}
          className={styles.fileInput}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleUploadChange}
        />

        <div className={styles.library__listHeading}>
          <span>Your documents</span>
          <span className={styles.count}>{documents.length}</span>
        </div>

        <div className={styles.documentList}>
          {isLoading ? (
            <div className={styles.emptyList}><LoaderCircle className={styles.spin} size={18} /> Loading library...</div>
          ) : documents.length === 0 ? (
            <div className={styles.emptyList}>
              <FileText size={22} />
              <span>No documents yet. Upload a PDF to get started.</span>
            </div>
          ) : documents.map(document => {
            const id = documentIdOf(document);
            return (
              <button
                type="button"
                key={id}
                className={`${styles.documentItem} ${String(activeId) === String(id) ? styles["documentItem--active"] : ""}`}
                onClick={() => selectDocument(document)}
              >
                <FileText className={styles.documentItem__icon} size={19} />
                <span className={styles.documentItem__details}>
                  <strong title={document.title}>{document.title}</strong>
                  <small>{formatBytes(document.byteSize ?? document.byte_size)} · {formatDate(document.createdAt ?? document.created_at)}</small>
                  <span className={`${styles.status} ${styles[`status--${document.status}`] || ""}`}>
                    {document.status === "processing" || document.status === "pending" ? (
                      <LoaderCircle className={styles.spin} size={12} />
                    ) : document.status === "failed" ? <AlertCircle size={12} /> : null}
                    {document.status}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className={styles.library__privacy}>Documents are private to your account.</p>
      </aside>

      <main className={styles.content}>
        {error && (
          <div className={styles.alert} role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button type="button" aria-label="Dismiss error" onClick={() => setError("")}>×</button>
          </div>
        )}

        {!activeDocument ? (
          <section className={styles.welcome}>
            <div className={styles.welcome__icon}><Sparkles size={27} /></div>
            <h2>Ask questions about your documents</h2>
            <p>Upload a PDF to search its contents, ask grounded questions, and preview it here.</p>
            <button type="button" className={styles.primaryButton} onClick={() => fileInputRef.current?.click()}>
              <UploadCloud size={17} /> Add your first PDF
            </button>
          </section>
        ) : (
          <>
            <header className={styles.documentHeader}>
              <div className={styles.documentHeader__title}>
                <div className={styles.documentHeader__icon}><FileText size={22} /></div>
                <div>
                  <h1 title={activeDocument.title}>{activeDocument.title}</h1>
                  <p>{formatBytes(activeDocument.byteSize ?? activeDocument.byte_size)} <span>·</span> Added {formatDate(activeDocument.createdAt ?? activeDocument.created_at)}</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => deleteDocument(activeDocument)}
                disabled={deletingId !== null}
                aria-label="Delete document"
                title="Delete document"
              >
                {deletingId !== null ? <LoaderCircle className={styles.spin} size={18} /> : <Trash2 size={18} />}
              </button>
            </header>

            {activeDocument.status === "failed" ? (
              <section className={styles.processing}>
                <AlertCircle size={25} />
                <h2>Could not process this document</h2>
                <p>{activeDocument.errorMessage || "Try uploading a text-based PDF again."}</p>
              </section>
            ) : activeDocument.status !== "ready" ? (
              <section className={styles.processing}>
                <LoaderCircle className={styles.spin} size={26} />
                <h2>Preparing your document</h2>
                <p>We are extracting text and indexing it for AI search. This page will update when it is ready.</p>
              </section>
            ) : (
              <>
                <nav className={styles.tabs} aria-label="Document tools">
                  <button type="button" className={`${styles.tab} ${activeTab === "ask" ? styles["tab--active"] : ""}`} onClick={() => changeTab("ask")}>
                    <MessageSquareText size={17} /> Ask AI
                  </button>
                  <button type="button" className={`${styles.tab} ${activeTab === "search" ? styles["tab--active"] : ""}`} onClick={() => changeTab("search")}>
                    <Search size={17} /> Semantic search
                  </button>
                  <button type="button" className={`${styles.tab} ${activeTab === "preview" ? styles["tab--active"] : ""}`} onClick={() => changeTab("preview")}>
                    <Eye size={17} /> PDF preview
                  </button>
                </nav>

                {activeTab === "ask" && (
                  <section className={styles.toolPanel}>
                    <div className={styles.panelIntro}>
                      <div className={styles.panelIntro__icon}><Sparkles size={19} /></div>
                      <div>
                        <h2>Ask this document</h2>
                        <p>Answers are grounded in the uploaded PDF and include source references.</p>
                      </div>
                    </div>
                    <form className={styles.queryForm} onSubmit={submitQuery}>
                      <label className={styles.srOnly} htmlFor="rag-question">Ask a question about this PDF</label>
                      <textarea
                        id="rag-question"
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        placeholder="What would you like to know from this document?"
                        rows={3}
                        maxLength={2000}
                      />
                      <div className={styles.queryForm__footer}>
                        <span>AI will only use information in this document.</span>
                        <button className={styles.primaryButton} type="submit" disabled={!query.trim() || isAsking}>
                          {isAsking ? <LoaderCircle className={styles.spin} size={16} /> : <Sparkles size={16} />}
                          {isAsking ? "Thinking..." : "Ask AI"}
                        </button>
                      </div>
                    </form>
                    {isAsking && <div className={styles.loadingResult}><LoaderCircle className={styles.spin} size={19} /> Searching the document and preparing an answer...</div>}
                    {answer && <article className={styles.resultCard}><div className={styles.resultCard__heading}><Sparkles size={17} /><h3>Answer</h3></div><RagAnswerBody answer={answer.answer} citations={answer.citations} /></article>}
                    {!answer && !isAsking && <div className={styles.suggestion}><BookOpen size={20} /><span>Try asking for a summary, a key definition, or a specific detail.</span></div>}
                  </section>
                )}

                {activeTab === "search" && (
                  <section className={styles.toolPanel}>
                    <div className={styles.panelIntro}>
                      <div className={styles.panelIntro__icon}><Search size={19} /></div>
                      <div>
                        <h2>Search document meaning</h2>
                        <p>Find relevant passages even when they use different wording.</p>
                      </div>
                    </div>
                    <form className={styles.searchForm} onSubmit={submitQuery}>
                      <label className={styles.srOnly} htmlFor="rag-search">Search within this PDF</label>
                      <Search size={18} />
                      <input
                        id="rag-search"
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        placeholder="Describe what you are looking for..."
                        maxLength={2000}
                      />
                      <button className={styles.primaryButton} type="submit" disabled={!query.trim() || isSearching}>
                        {isSearching ? <LoaderCircle className={styles.spin} size={16} /> : null}
                        {isSearching ? "Searching..." : "Search"}
                      </button>
                    </form>
                    {isSearching && <div className={styles.loadingResult}><LoaderCircle className={styles.spin} size={19} /> Finding relevant excerpts...</div>}
                    {!isSearching && searchResults.length > 0 && (
                      <div className={styles.searchResults}>
                        <h3>{searchResults.length} relevant {searchResults.length === 1 ? "passage" : "passages"}</h3>
                        {searchResults.map(result => (
                          <article className={styles.excerpt} key={result.chunkId}>
                            <div className={styles.excerpt__meta}>
                              <span>Passage {result.chunkIndex + 1}</span>
                              <span>{Math.round(result.score * 100)}% match</span>
                            </div>
                            <p>{result.excerpt}</p>
                          </article>
                        ))}
                      </div>
                    )}
                    {!isSearching && query && searchResults.length === 0 && <div className={styles.suggestion}><Search size={20} /><span>No matching passages yet. Try a related concept or another phrase.</span></div>}
                    {!query && <div className={styles.suggestion}><BookOpen size={20} /><span>Search for a topic, phrase, or concept inside this PDF.</span></div>}
                  </section>
                )}

                {activeTab === "preview" && (
                  <section className={styles.previewPanel}>
                    {isPreviewLoading && <div className={styles.previewLoading}><LoaderCircle className={styles.spin} size={22} /> Loading PDF preview...</div>}
                    {previewUrl && <iframe className={styles.previewFrame} src={previewUrl} title={`PDF preview: ${activeDocument.title}`} />}
                    {!isPreviewLoading && !previewUrl && <div className={styles.suggestion}><FileText size={20} /><span>PDF preview is unavailable.</span></div>}
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}