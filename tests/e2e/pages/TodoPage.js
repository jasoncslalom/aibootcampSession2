const { expect } = require('@playwright/test');

class TodoPage {
  constructor(page) {
    this.page = page;
    this.taskNameInput = page.getByLabel('Task name');
    this.dueDateInput = page.getByLabel('Due date');
    this.addTaskButton = page.getByRole('button', { name: 'Add Task' });
    this.taskList = page.locator('.items-section ul');
  }

  async navigate() {
    await this.page.goto('/');
    await this.page.waitForSelector('.items-section', { state: 'visible' });
    // Wait for loading to finish
    await expect(this.page.getByText('Loading data...')).not.toBeVisible({ timeout: 10000 });
  }

  async addTask(name, dueDate = '') {
    await this.taskNameInput.fill(name);
    if (dueDate) {
      await this.dueDateInput.fill(dueDate);
    }
    await this.addTaskButton.click();
    await expect(this.page.getByText(name)).toBeVisible();
  }

  async editTask(currentName, newName, newDueDate = '') {
    const taskItem = this.page.locator('.task-item').filter({ hasText: currentName });
    await taskItem.getByRole('button', { name: /edit/i }).click();
    const nameInput = this.page.getByLabel('Edit task name');
    await nameInput.fill(newName);
    if (newDueDate) {
      await this.page.getByLabel('Edit due date').fill(newDueDate);
    }
    await this.page.getByRole('button', { name: 'Save' }).click();
    await expect(this.page.getByText(newName)).toBeVisible();
  }

  async deleteTask(name) {
    const taskItem = this.page.locator('.task-item').filter({ hasText: name });
    await taskItem.getByRole('button', { name: new RegExp(`delete ${name}`, 'i') }).click();
    await expect(this.page.getByText(name)).not.toBeVisible();
  }

  async getTaskNames() {
    await this.taskList.waitFor({ state: 'visible' });
    return this.page.locator('.task-name').allTextContents();
  }

  async getTaskDueDate(name) {
    const taskItem = this.page.locator('.task-item').filter({ hasText: name });
    const dueDateEl = taskItem.locator('.task-due-date');
    if (await dueDateEl.count() === 0) return null;
    return dueDateEl.textContent();
  }
}

module.exports = { TodoPage };
