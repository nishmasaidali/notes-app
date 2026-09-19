import { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [color, setColor] = useState("white");

  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const [selectedNotes, setSelectedNotes] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const contentRef = useRef(null);

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem("notes");

    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyboard(event) {
      if (event.ctrlKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        openForm();
      }

      if (event.key === "Escape") {
        closeForm();
      }
    }

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  // Open form
  function openForm() {
    setShowForm(true);
    setError("");
  }

  // Close form
  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setContent("");
    setTags("");
    setColor("white");
    setError("");
  }

  // Format content
  function formatText(type) {
    const textarea = contentRef.current;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.substring(start, end);

    let newContent = "";
    let cursorPosition = end;

    if (type === "bold") {
      newContent =
        content.substring(0, start) +
        "**" +
        selectedText +
        "**" +
        content.substring(end);

      cursorPosition = end + 4;
    }

    if (type === "italic") {
      newContent =
        content.substring(0, start) +
        "*" +
        selectedText +
        "*" +
        content.substring(end);

      cursorPosition = end + 2;
    }

    if (type === "bullet") {
      newContent =
        content.substring(0, start) +
        "- " +
        content.substring(start);

      cursorPosition = start + 2;
    }

    if (type === "number") {
      newContent =
        content.substring(0, start) +
        "1. " +
        content.substring(start);

      cursorPosition = start + 3;
    }

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        cursorPosition,
        cursorPosition
      );
    }, 0);
  }

  // Add or update note
  function saveNote(event) {
    event.preventDefault();

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    // Validation
    if (cleanContent === "") {
      setError("Content is required.");
      return;
    }

    if (cleanTitle.length > 100) {
      setError("Title must be 100 characters or less.");
      return;
    }

    if (cleanContent.length > 5000) {
      setError("Content must be 5000 characters or less.");
      return;
    }

    // Convert tags to array
    const tagArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    if (tagArray.length > 5) {
      setError("Maximum 5 tags are allowed.");
      return;
    }

    for (let tag of tagArray) {
      if (tag.length > 20) {
        setError("Each tag must be 20 characters or less.");
        return;
      }
    }

    // Duplicate check
    const duplicate = notes.find((note) => {
      return (
        note.id !== editingId &&
        note.title.toLowerCase() === cleanTitle.toLowerCase() &&
        note.content.toLowerCase() === cleanContent.toLowerCase()
      );
    });

    if (duplicate) {
      setError("This note already exists.");
      return;
    }

    // Update
    if (editingId !== null) {
      setNotes((previousNotes) =>
        previousNotes.map((note) => {
          if (note.id === editingId) {
            return {
              ...note,
              title: cleanTitle,
              content: cleanContent,
              tags: tagArray,
              color: color,
              updatedAt: new Date().toISOString(),
            };
          }

          return note;
        })
      );
    }

    // Create
    else {
      const now = new Date().toISOString();

      const newNote = {
        id: Date.now(),
        title: cleanTitle,
        content: cleanContent,
        tags: tagArray,
        color: color,
        createdAt: now,
        updatedAt: now,
        pinned: false,
        archived: false,
      };

      setNotes((previousNotes) => [
        newNote,
        ...previousNotes,
      ]);
    }

    closeForm();
  }

  // Edit
  function editNote(note) {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags.join(", "));
    setColor(note.color);
    setShowForm(true);
  }

  // Delete
  function deleteNote(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) return;

    setNotes((previousNotes) =>
      previousNotes.filter((note) => note.id !== id)
    );

    setSelectedNotes((previous) =>
      previous.filter((noteId) => noteId !== id)
    );
  }

  // Pin
  function togglePin(id) {
    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === id
          ? {
              ...note,
              pinned: !note.pinned,
              updatedAt: new Date().toISOString(),
            }
          : note
      )
    );
  }

  // Archive
  function toggleArchive(id) {
    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === id
          ? {
              ...note,
              archived: !note.archived,
              updatedAt: new Date().toISOString(),
            }
          : note
      )
    );
  }

  // Select note
  function selectNote(id) {
    setSelectedNotes((previous) => {
      if (previous.includes(id)) {
        return previous.filter((noteId) => noteId !== id);
      }

      return [...previous, id];
    });
  }

  // Delete selected
  function deleteSelected() {
    if (selectedNotes.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedNotes.length} selected note(s)?`
    );

    if (!confirmed) return;

    setNotes((previousNotes) =>
      previousNotes.filter(
        (note) => !selectedNotes.includes(note.id)
      )
    );

    setSelectedNotes([]);
  }

  // Archive selected
  function archiveSelected() {
    if (selectedNotes.length === 0) return;

    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        selectedNotes.includes(note.id)
          ? {
              ...note,
              archived: !note.archived,
              updatedAt: new Date().toISOString(),
            }
          : note
      )
    );

    setSelectedNotes([]);
  }

  // Filter and search
  let filteredNotes = notes.filter((note) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      note.title.toLowerCase().includes(searchText) ||
      note.content.toLowerCase().includes(searchText) ||
      note.tags.some((tag) =>
        tag.toLowerCase().includes(searchText)
      );

    if (!matchesSearch) {
      return false;
    }

    if (filter === "active") {
      return !note.archived;
    }

    if (filter === "pinned") {
      return note.pinned;
    }

    if (filter === "archived") {
      return note.archived;
    }

    return true;
  });

  // Sorting
  if (sort === "newest") {
    filteredNotes.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );
  }

  if (sort === "oldest") {
    filteredNotes.sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );
  }

  if (sort === "title") {
    filteredNotes.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }

  if (sort === "color") {
    filteredNotes.sort((a, b) =>
      a.color.localeCompare(b.color)
    );
  }

  // Pinned notes first
  filteredNotes.sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned)
  );

  // Select all
  function selectAll() {
    const visibleIds = filteredNotes.map(
      (note) => note.id
    );

    const allSelected = visibleIds.every((id) =>
      selectedNotes.includes(id)
    );

    if (allSelected) {
      setSelectedNotes((previous) =>
        previous.filter(
          (id) => !visibleIds.includes(id)
        )
      );
    } else {
      setSelectedNotes((previous) => [
        ...new Set([
          ...previous,
          ...visibleIds,
        ]),
      ]);
    }
  }

  const allSelected =
    filteredNotes.length > 0 &&
    filteredNotes.every((note) =>
      selectedNotes.includes(note.id)
    );

  // Display formatted content
  function displayContent(text) {
    const lines = text.split("\n");

    return lines.map((line, index) => {
      if (line.startsWith("- ")) {
        return (
          <div className="list-line" key={index}>
            • {displayInlineText(line.substring(2))}
          </div>
        );
      }

      if (/^\d+\.\s/.test(line)) {
        return (
          <div className="list-line" key={index}>
            {line.substring(0, line.indexOf(".") + 1)}{" "}
            {displayInlineText(
              line.replace(/^\d+\.\s/, "")
            )}
          </div>
        );
      }

      return (
        <p key={index}>
          {line === ""
            ? "\u00A0"
            : displayInlineText(line)}
        </p>
      );
    });
  }

  // Bold and italic display
  function displayInlineText(text) {
    const parts = text.split(
      /(\*\*.*?\*\*|\*.*?\*)/g
    );

    return parts.map((part, index) => {
      if (
        part.startsWith("**") &&
        part.endsWith("**")
      ) {
        return (
          <strong key={index}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (
        part.startsWith("*") &&
        part.endsWith("*")
      ) {
        return (
          <em key={index}>
            {part.slice(1, -1)}
          </em>
        );
      }

      return (
        <span key={index}>
          {part}
        </span>
      );
    });
  }

  return (
    <div className="app">

      {/* Header */}

      <header className="header">
        <div className="header-content">

          <div>
            <h1>My Notes</h1>

            <p>
              Keep your thoughts organized
            </p>
          </div>

          <button
            className="add-button"
            onClick={openForm}
          >
            + Add Note
          </button>

        </div>
      </header>

      <main className="container">

        {/* Search and filters */}

        <section className="search-section">

          <div>
            <label>Search</label>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search notes..."
            />
          </div>

          <div>
            <label>Filter</label>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
            >
              <option value="all">
                All Notes
              </option>

              <option value="active">
                Active
              </option>

              <option value="pinned">
                Pinned
              </option>

              <option value="archived">
                Archived
              </option>
            </select>
          </div>

          <div>
            <label>Sort</label>

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
            >
              <option value="newest">
                Newest First
              </option>

              <option value="oldest">
                Oldest First
              </option>

              <option value="title">
                Title A-Z
              </option>

              <option value="color">
                Color
              </option>
            </select>
          </div>

        </section>

        {/* Bulk actions */}

        {filteredNotes.length > 0 && (
          <section className="bulk-section">

            <label>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={selectAll}
              />

              Select All
            </label>

            {selectedNotes.length > 0 && (
              <>
                <span>
                  {selectedNotes.length} selected
                </span>

                <button
                  onClick={archiveSelected}
                  className="secondary-button"
                >
                  Archive
                </button>

                <button
                  onClick={deleteSelected}
                  className="delete-selected"
                >
                  Delete Selected
                </button>
              </>
            )}

          </section>
        )}

        {/* Heading */}

        <div className="notes-header">

          <div>
            <h2>Your Notes</h2>

            <p>
              {filteredNotes.length} note
              {filteredNotes.length !== 1
                ? "s"
                : ""}
            </p>
          </div>

          <button
            className="add-button"
            onClick={openForm}
          >
            + New Note
          </button>

        </div>

        {/* Notes */}

        {filteredNotes.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              📝
            </div>

            <h2>
              No notes found
            </h2>

            <p>
              Create a note or change your search/filter.
            </p>

          </div>

        ) : (

          <div className="notes-grid">

            {filteredNotes.map((note) => (

              <article
                key={note.id}
                className={`note-card note-${note.color} ${
                  note.pinned
                    ? "pinned"
                    : ""
                }`}
              >

                <div className="note-top">

                  <div className="note-title">

                    <input
                      type="checkbox"
                      checked={selectedNotes.includes(
                        note.id
                      )}
                      onChange={() =>
                        selectNote(note.id)
                      }
                    />

                    <h3>
                      {note.title ||
                        "Untitled Note"}
                    </h3>

                  </div>

                  {note.pinned && (
                    <span>📌</span>
                  )}

                </div>

                <div className="note-content">
                  {displayContent(note.content)}
                </div>

                {/* Tags */}

                {note.tags.length > 0 && (
                  <div className="tags">

                    {note.tags.map((tag) => (
                      <span
                        className="tag"
                        key={tag}
                      >
                        #{tag}
                      </span>
                    ))}

                  </div>
                )}

                {/* Dates */}

                <div className="dates">

                  <small>
                    Created:{" "}
                    {new Date(
                      note.createdAt
                    ).toLocaleString()}
                  </small>

                  {note.updatedAt !==
                    note.createdAt && (
                    <small>
                      Updated:{" "}
                      {new Date(
                        note.updatedAt
                      ).toLocaleString()}
                    </small>
                  )}

                </div>

                {/* Buttons */}

                <div className="note-buttons">

                  <button
                    onClick={() =>
                      editNote(note)
                    }
                    className="edit-button"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      togglePin(note.id)
                    }
                  >
                    {note.pinned
                      ? "Unpin"
                      : "Pin"}
                  </button>

                  <button
                    onClick={() =>
                      toggleArchive(note.id)
                    }
                  >
                    {note.archived
                      ? "Unarchive"
                      : "Archive"}
                  </button>

                  <button
                    onClick={() =>
                      deleteNote(note.id)
                    }
                    className="delete-button"
                  >
                    Delete
                  </button>

                </div>

              </article>

            ))}

          </div>

        )}

      </main>

      {/* Create / Edit Modal */}

      {showForm && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <h2>
                {editingId
                  ? "Edit Note"
                  : "Create Note"}
              </h2>

              <button
                className="close-button"
                onClick={closeForm}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={saveNote}
              className="form"
            >

              {error && (
                <div className="error">
                  {error}
                </div>
              )}

              {/* Title */}

              <label>
                Title
                <span>
                  {" "}
                  (optional)
                </span>
              </label>

              <input
                type="text"
                value={title}
                maxLength={100}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Enter title"
              />

              <small>
                {title.length}/100
              </small>

              {/* Content */}

              <label>
                Content *
              </label>

              <div className="toolbar">

                <button
                  type="button"
                  onClick={() =>
                    formatText("bold")
                  }
                >
                  <strong>B</strong>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    formatText("italic")
                  }
                >
                  <em>I</em>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    formatText("bullet")
                  }
                >
                  • List
                </button>

                <button
                  type="button"
                  onClick={() =>
                    formatText("number")
                  }
                >
                  1. List
                </button>

              </div>

              <textarea
                ref={contentRef}
                value={content}
                maxLength={5000}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                placeholder="Write your note..."
              />

              <small>
                {content.length}/5000
              </small>

              {/* Tags */}

              <label>
                Tags
                <span>
                  {" "}
                  (comma separated)
                </span>
              </label>

              <input
                type="text"
                value={tags}
                onChange={(event) =>
                  setTags(event.target.value)
                }
                placeholder="work, study, personal"
              />

              <small>
                Maximum 5 tags
              </small>

              {/* Colors */}

              <label>
                Note Color
              </label>

              <div className="colors">

                {[
                  "white",
                  "blue",
                  "sky",
                  "indigo",
                  "slate",
                  "cyan",
                ].map((item) => (

                  <button
                    type="button"
                    key={item}
                    className={`color color-${item} ${
                      color === item
                        ? "selected-color"
                        : ""
                    }`}
                    onClick={() =>
                      setColor(item)
                    }
                  />

                ))}

              </div>

              {/* Form buttons */}

              <div className="form-buttons">

                <button
                  type="button"
                  onClick={closeForm}
                  className="cancel-button"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  {editingId
                    ? "Update Note"
                    : "Save Note"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;