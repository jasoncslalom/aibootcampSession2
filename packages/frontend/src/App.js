import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItem, due_date: newDueDate || null }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      const result = await response.json();
      setData([...data, result]);
      setNewItem('');
      setNewDueDate('');
    } catch (err) {
      setError('Error adding item: ' + err.message);
      console.error('Error adding item:', err);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDueDate(item.due_date || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDueDate('');
  };

  const handleSave = async (itemId) => {
    if (!editName.trim()) return;

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, due_date: editDueDate || null }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const updated = await response.json();
      setData(data.map(item => (item.id === itemId ? updated : item)));
      setEditingId(null);
      setEditName('');
      setEditDueDate('');
    } catch (err) {
      setError('Error updating item: ' + err.message);
      console.error('Error updating item:', err);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setData(data.filter(item => item.id !== itemId));
      setError(null);
    } catch (err) {
      setError('Error deleting item: ' + err.message);
      console.error('Error deleting item:', err);
    }
  };

  const formatDueDate = (due_date) => {
    if (!due_date) return null;
    const date = new Date(due_date + 'T00:00:00');
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>To Do App</h1>
        <p>Keep track of your tasks</p>
      </header>

      <main>
        <section className="add-item-section">
          <h2>Add New Task</h2>
          <form onSubmit={handleSubmit} className="add-item-form">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Enter task name"
              aria-label="Task name"
            />
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              aria-label="Due date"
            />
            <button type="submit">Add Task</button>
          </form>
        </section>

        <section className="items-section">
          <h2>Tasks</h2>
          {loading && <p>Loading data...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && (
            <ul>
              {data.length > 0 ? (
                data.map((item) => (
                  <li key={item.id} className="task-item">
                    {editingId === item.id ? (
                      <div className="edit-form">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          aria-label="Edit task name"
                        />
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          aria-label="Edit due date"
                        />
                        <button type="button" className="save-btn" onClick={() => handleSave(item.id)}>Save</button>
                        <button type="button" className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <div className="task-info">
                          <span className="task-name">{item.name}</span>
                          {item.due_date && (
                            <span className="task-due-date">Due: {formatDueDate(item.due_date)}</span>
                          )}
                        </div>
                        <div className="task-actions">
                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() => handleEdit(item)}
                            aria-label={`Edit ${item.name}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => handleDelete(item.id)}
                            aria-label={`Delete ${item.name}`}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))
              ) : (
                <p>No items found. Add some!</p>
              )}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;