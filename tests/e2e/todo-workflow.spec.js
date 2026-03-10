const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

test.describe('Todo App - Critical User Journeys', () => {
  let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.navigate();
  });

  test('should display the app header and task list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'To Do App' })).toBeVisible();
    await expect(page.getByText('Keep track of your tasks')).toBeVisible();
    await expect(page.locator('.items-section')).toBeVisible();
  });

  test('should add a new task with a due date', async ({ page }) => {
    await todoPage.addTask('E2E Task with Due Date', '2026-04-15');

    const dueDate = await todoPage.getTaskDueDate('E2E Task with Due Date');
    expect(dueDate).toBeTruthy();
    expect(dueDate).toContain('Apr');
  });

  test('should add a task without a due date', async () => {
    await todoPage.addTask('E2E Task No Due Date');

    const dueDate = await todoPage.getTaskDueDate('E2E Task No Due Date');
    expect(dueDate).toBeNull();
  });

  test('should edit an existing task name and due date', async ({ page }) => {
    await todoPage.addTask('Task Before Edit', '2026-05-01');

    await todoPage.editTask('Task Before Edit', 'Task After Edit', '2026-05-20');

    await expect(page.getByText('Task Before Edit')).not.toBeVisible();
    await expect(page.getByText('Task After Edit')).toBeVisible();

    const dueDate = await todoPage.getTaskDueDate('Task After Edit');
    expect(dueDate).toContain('May');
  });

  test('should cancel editing without saving changes', async ({ page }) => {
    await todoPage.addTask('Cancel Edit Task', '2026-06-01');

    const taskItem = page.locator('.task-item').filter({ hasText: 'Cancel Edit Task' });
    await taskItem.getByRole('button', { name: /edit/i }).click();

    const nameInput = page.getByLabel('Edit task name');
    await nameInput.fill('Should Not Be Saved');

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByText('Cancel Edit Task')).toBeVisible();
    await expect(page.getByText('Should Not Be Saved')).not.toBeVisible();
  });

  test('should delete a task', async ({ page }) => {
    await todoPage.addTask('Task To Delete');

    await expect(page.getByText('Task To Delete')).toBeVisible();

    await todoPage.deleteTask('Task To Delete');

    await expect(page.getByText('Task To Delete')).not.toBeVisible();
  });

  test('should display tasks sorted by due date with closest date first', async ({ page }) => {
    // Clear existing tasks by reloading onto a fresh state — we rely on seed data being sorted
    // Add tasks in non-chronological order
    await todoPage.addTask('Far Task', '2030-12-31');
    await todoPage.addTask('Near Task', '2026-03-11');
    await todoPage.addTask('Mid Task', '2027-06-15');

    const names = await todoPage.getTaskNames();

    const nearIdx = names.findIndex(n => n.includes('Near Task'));
    const midIdx = names.findIndex(n => n.includes('Mid Task'));
    const farIdx = names.findIndex(n => n.includes('Far Task'));

    // All three must have been found
    expect(nearIdx).toBeGreaterThanOrEqual(0);
    expect(midIdx).toBeGreaterThanOrEqual(0);
    expect(farIdx).toBeGreaterThanOrEqual(0);

    // Near should appear before Mid, Mid before Far
    expect(nearIdx).toBeLessThan(midIdx);
    expect(midIdx).toBeLessThan(farIdx);
  });
});
