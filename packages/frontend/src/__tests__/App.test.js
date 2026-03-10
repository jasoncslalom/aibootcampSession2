import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const mockItems = [
  { id: 1, name: 'Test Item 1', due_date: '2026-03-12', created_at: '2026-01-01T00:00:00.000Z' },
  { id: 2, name: 'Test Item 2', due_date: null, created_at: '2026-01-02T00:00:00.000Z' },
];

// Mock server to intercept API requests
const server = setupServer(
  rest.get('/api/items', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockItems));
  }),

  rest.post('/api/items', (req, res, ctx) => {
    const { name, due_date } = req.body;
    if (!name || name.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Item name is required' }));
    }
    return res(
      ctx.status(201),
      ctx.json({ id: 3, name, due_date: due_date || null, created_at: new Date().toISOString() })
    );
  }),

  rest.put('/api/items/:id', (req, res, ctx) => {
    const { id } = req.params;
    const { name, due_date } = req.body;
    if (!name || name.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Item name is required' }));
    }
    const original = mockItems.find(i => i.id === parseInt(id));
    if (!original) {
      return res(ctx.status(404), ctx.json({ error: 'Item not found' }));
    }
    return res(
      ctx.status(200),
      ctx.json({ ...original, name, due_date: due_date || null })
    );
  }),

  rest.delete('/api/items/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.status(200), ctx.json({ message: 'Item deleted successfully', id: parseInt(id) }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the header', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText('To Do App')).toBeInTheDocument();
    expect(screen.getByText('Keep track of your tasks')).toBeInTheDocument();
  });

  test('loads and displays items with due dates', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Loading data...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });
  });

  test('adds a new item with a due date', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Enter task name');
    const dateInput = screen.getByLabelText('Due date');

    await act(async () => {
      await user.type(nameInput, 'New Test Task');
      await user.type(dateInput, '2026-04-01');
    });

    const submitButton = screen.getByText('Add Task');
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('New Test Task')).toBeInTheDocument();
    });
  });

  test('edits an existing item', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    await act(async () => {
      await user.click(editButtons[0]);
    });

    const nameInput = screen.getByLabelText('Edit task name');
    expect(nameInput).toBeInTheDocument();

    await act(async () => {
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Item 1');
    });

    const saveButton = screen.getByText('Save');
    await act(async () => {
      await user.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Updated Item 1')).toBeInTheDocument();
    });
  });

  test('cancels edit without saving changes', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    await act(async () => {
      await user.click(editButtons[0]);
    });

    const cancelButton = screen.getByText('Cancel');
    await act(async () => {
      await user.click(cancelButton);
    });

    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Edit task name')).not.toBeInTheDocument();
  });

  test('handles API error on fetch', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch data/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no items', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('No items found. Add some!')).toBeInTheDocument();
    });
  });
});
