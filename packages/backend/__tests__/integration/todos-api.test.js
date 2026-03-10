const request = require('supertest');
const { app, db } = require('../../src/app');

afterAll(() => {
  if (db) {
    db.close();
  }
});

beforeEach(() => {
  db.exec('DELETE FROM items');
});

const createItem = (name, due_date = null) =>
  request(app)
    .post('/api/items')
    .send({ name, due_date })
    .set('Accept', 'application/json');

describe('TODO API Integration Tests', () => {
  describe('Full task lifecycle', () => {
    it('should create, update, and delete a task with a due date', async () => {
      // Create
      const createRes = await createItem('Buy groceries', '2026-03-15');
      expect(createRes.status).toBe(201);
      const id = createRes.body.id;
      expect(createRes.body.due_date).toBe('2026-03-15');

      // Update
      const updateRes = await request(app)
        .put(`/api/items/${id}`)
        .send({ name: 'Buy groceries and cook', due_date: '2026-03-16' })
        .set('Accept', 'application/json');
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.name).toBe('Buy groceries and cook');
      expect(updateRes.body.due_date).toBe('2026-03-16');

      // Confirm it appears in the list
      const listRes = await request(app).get('/api/items');
      expect(listRes.status).toBe(200);
      const found = listRes.body.find(item => item.id === id);
      expect(found).toBeDefined();
      expect(found.name).toBe('Buy groceries and cook');

      // Delete
      const deleteRes = await request(app).delete(`/api/items/${id}`);
      expect(deleteRes.status).toBe(200);

      // Confirm it no longer appears
      const listAfter = await request(app).get('/api/items');
      const notFound = listAfter.body.find(item => item.id === id);
      expect(notFound).toBeUndefined();
    });
  });

  describe('Sort order by due_date', () => {
    it('should return tasks sorted by due_date ascending, nulls last', async () => {
      await createItem('Task C - Far', '2026-06-01');
      await createItem('Task A - Near', '2026-03-11');
      await createItem('Task B - Mid', '2026-04-15');
      await createItem('Task D - No Date', null);

      const res = await request(app).get('/api/items');
      expect(res.status).toBe(200);

      const names = res.body.map(i => i.name);
      expect(names.indexOf('Task A - Near')).toBeLessThan(names.indexOf('Task B - Mid'));
      expect(names.indexOf('Task B - Mid')).toBeLessThan(names.indexOf('Task C - Far'));
      expect(names.indexOf('Task C - Far')).toBeLessThan(names.indexOf('Task D - No Date'));
    });
  });

  describe('Edit task', () => {
    it('should reflect updated name and due_date in subsequent GET', async () => {
      const created = await createItem('Initial Task', '2026-05-10');
      const id = created.body.id;

      await request(app)
        .put(`/api/items/${id}`)
        .send({ name: 'Revised Task', due_date: '2026-05-20' });

      const res = await request(app).get('/api/items');
      const item = res.body.find(i => i.id === id);
      expect(item.name).toBe('Revised Task');
      expect(item.due_date).toBe('2026-05-20');
    });

    it('should allow editing a task to remove its due date', async () => {
      const created = await createItem('Task With Date', '2026-05-10');
      const id = created.body.id;

      await request(app)
        .put(`/api/items/${id}`)
        .send({ name: 'Task Without Date', due_date: null });

      const res = await request(app).get('/api/items');
      const item = res.body.find(i => i.id === id);
      expect(item.due_date).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should return 404 when updating a deleted item', async () => {
      const created = await createItem('To Be Deleted');
      const id = created.body.id;

      await request(app).delete(`/api/items/${id}`);

      const updateRes = await request(app)
        .put(`/api/items/${id}`)
        .send({ name: 'Ghost Update' });
      expect(updateRes.status).toBe(404);
    });
  });
});
