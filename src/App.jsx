import { Fragment, useState } from "react";
import { searchIndex, indexDocument } from "./elasticsearch";
import "./App.css";

function SearchPanel() {
  const [query, setQuery]       = useState("");
  const [size, setSize]         = useState(10);
  const [results, setResults]   = useState(null);
  const [total, setTotal]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpanded = (id) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const data  = await searchIndex(query.trim(), size);
      const hits  = data?.hits?.hits || [];
      const count = data?.hits?.total?.value ?? hits.length;
      setResults(hits);
      setTotal(count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2 className="panel-title"><span className="icon">⌕</span> Search</h2>
      <form onSubmit={handleSearch} className="search-form">
        <div className="input-row">
          <input
            className="text-input"
            type="text"
            placeholder='e.g. mars  or  genre:Drama'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="size-select"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n} results</option>
            ))}
          </select>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error">❌ {error}</div>}

      {results !== null && (
        <div className="results">
          <p className="results-meta">
            {total} result{total !== 1 ? "s" : ""} — showing {results.length}
          </p>
          {results.length === 0 ? (
            <p className="empty">No documents matched.</p>
          ) : (
            <div className="result-table-wrapper">
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Year</th>
                    <th>Director</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((hit) => {
                    const source = hit._source || {};
                    const isOpen = expandedId === hit._id;
                    const actors = source.actor ?? source.actors ?? "-";
                    return (
                      <Fragment key={hit._id}>
                        <tr
                          className="result-row"
                          onClick={() => toggleExpanded(hit._id)}
                          aria-expanded={isOpen}
                        >
                          <td>
                            <span className={`arrow-icon ${isOpen ? "open" : ""}`}>
                              ▼
                            </span>
                            {source.title ?? "-"}
                          </td>
                          <td>{source.year ?? "-"}</td>
                          <td>{source.director ?? "-"}</td>
                          <td className="result-score">{hit._score?.toFixed(3)}</td>
                        </tr>
                        {isOpen && (
                          <tr className="result-details-row">
                            <td colSpan="4" className="result-details-cell">
                              <div className="details-panel">
                                <div className="details-grid">
                                  <div><strong>Title:</strong> {source.title ?? "-"}</div>
                                  <div><strong>Actors:</strong> {actors}</div>
                                  <div><strong>Director:</strong> {source.director ?? "-"}</div>
                                  <div><strong>Genre:</strong> {source.genre ?? "-"}</div>
                                  <div><strong>Year:</strong> {source.year ?? "-"}</div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function UploadPanel() {
  const [title, setTitle]       = useState("");
  const [actor, setActor]       = useState("");
  const [director, setDirector] = useState("");
  const [genre, setGenre]       = useState("");
  const [year, setYear]         = useState("");
  const [status, setStatus]     = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (!title.trim() || !director.trim() || !genre.trim() || !year.trim()) {
      setStatus({ type: "error", message: "Please fill in title, director, genre, and year." });
      return;
    }

    const payload = {
      title: title.trim(),
      actor: actor.trim(),
      director: director.trim(),
      genre: genre.trim(),
      year: Number(year),
    };

    setLoading(true);
    try {
      const data = await indexDocument(payload);
      setStatus({ type: "success", message: `Indexed document ${data._id}.` });
      setTitle("");
      setActor("");
      setDirector("");
      setGenre("");
      setYear("");
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2 className="panel-title"><span className="icon">↑</span> Upload</h2>
      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="input-row">
          <label className="field-label">
            Title
            <input
              className="text-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Movie title"
            />
          </label>
        </div>

        <div className="input-row">
          <label className="field-label">
            Actors
            <input
              className="text-input"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="Lead actors"
            />
          </label>
        </div>

        <div className="input-row">
          <label className="field-label">
            Director
            <input
              className="text-input"
              value={director}
              onChange={(e) => setDirector(e.target.value)}
              placeholder="Director"
            />
          </label>
        </div>

        <div className="input-row">
          <label className="field-label">
            Genre
            <input
              className="text-input"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Genre"
            />
          </label>
        </div>

        <div className="input-row">
          <label className="field-label">
            Year
            <input
              className="text-input"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Release year"
            />
          </label>
        </div>

        {status && (
          <div className={`alert ${status.type === "success" ? "alert-success" : "alert-error"}`}>
            <pre>{status.message}</pre>
          </div>
        )}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save movie"}
        </button>
      </form>
    </section>
  );
}

export default function App() {
  const [tab, setTab] = useState("search");

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">◈</span>
            <span className="logo-text">Movie<em>Tracker</em></span>
          </div>
          <nav className="tabs">
            <button className={`tab ${tab === "search" ? "active" : ""}`} onClick={() => setTab("search")}>Search</button>
            <button className={`tab ${tab === "upload" ? "active" : ""}`} onClick={() => setTab("upload")}>Upload</button>
          </nav>
        </div>
      </header>
      <main className="app-main">
        {tab === "search" ? <SearchPanel /> : <UploadPanel />}
      </main>
    </div>
  );
}
