const request = require('supertest');
const { app, db } = require('../src/app');

// Close the database connection after all tests
afterAll(() => {
  if (db) {
    db.close();
  }
});

// Test helpers
const createItem = async (name = 'Temp Item to Delete', due_date = null) => {
  const response = await request(app)
    .post('/api/items')
    .send({ name, due_date })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /api/items', () => {
    it('should return all items', async () => {
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check if items have the expected structure
      const item = response.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('due_date');
      expect(item).toHaveProperty('created_at');
    });

    it('should return items sorted by due_date ascending with nulls last', async () => {
      await createItem('No Due Date Task', null);
      await createItem('Far Future Task', '2030-12-31');
      await createItem('Near Future Task', '2026-03-11');

      const response = await request(app).get('/api/items');
      expect(response.status).toBe(200);

      const itemsWithDate = response.body.filter(item => item.due_date !== null);
      for (let i = 0; i < itemsWithDate.length - 1; i++) {
        expect(itemsWithDate[i].due_date <= itemsWithDate[i + 1].due_date).toBe(true);
      }

      const nullItems = response.body.filter(item => item.due_date === null);
      const lastDatedIndex = response.body.findLastIndex(item => item.due_date !== null);
      const firstNullIndex = response.body.findIndex(item => item.due_date === null);
      if (nullItems.length > 0 && lastDatedIndex >= 0) {
        expect(firstNullIndex).toBeGreaterThan(lastDatedIndex);
      }
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item without due_date', async () => {
      const newItem = { name: 'Test Item' };
      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newItem.name);
      expect(response.body).toHaveProperty('due_date');
      expect(response.body.due_date).toBeNull();
      expect(response.body).toHaveProperty('created_at');
    });

    it('should create a new item with a due_date', async () => {
      const newItem = { name: 'Task with Due Date', due_date: '2026-04-01' };
      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(newItem.name);
      expect(response.body.due_date).toBe('2026-04-01');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update an existing item name and due_date', async () => {
      const item = await createItem('Original Name', '2026-05-01');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Updated Name', due_date: '2026-06-15' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.due_date).toBe('2026-06-15');
      expect(response.body.id).toBe(item.id);
    });

    it('should allow clearing due_date to null', async () => {
      const item = await createItem('Task With Date', '2026-05-01');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Task With Date', due_date: null })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.due_date).toBeNull();
    });

    it('should return 404 when updating a non-existent item', async () => {
      const response = await request(app)
        .put('/api/items/999999')
        .send({ name: 'Ghost Item' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 when name is missing in update', async () => {
      const item = await createItem('Item To Update');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Item name is required');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app)
        .put('/api/items/abc')
        .send({ name: 'Test' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an existing item', async () => {
      const item = await createItem('Item To Be Deleted');

      const deleteResponse = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Item deleted successfully', id: item.id });

      const deleteAgain = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 404 when item does not exist', async () => {
      const response = await request(app).delete('/api/items/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/api/items/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });
  });
});
