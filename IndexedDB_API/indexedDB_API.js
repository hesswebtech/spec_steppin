/**
 * IndexedDB Configuration and Safe DOM Controller
 * Built without innerHTML to prevent XSS vulnerabilities.
 */

const DB_NAME = 'TaskManagerDB';
const DB_VERSION = 1;
const STORE_NAME = 'tasks';

// DOM Element References using querySelector
const taskForm = document.querySelector('#task-form');
const taskTitleInput = document.querySelector('#task-title');
const taskCategorySelect = document.querySelector('#task-category');
const taskList = document.querySelector('#task-list');
const emptyState = document.querySelector('#empty-state');
const clearAllBtn = document.querySelector('#clear-all-btn');

/**
 * Opens or upgrades the IndexedDB database instance.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
	return new Promise((resolve, reject) => {
		// Feature detection for IndexedDB support
		if (!('indexedDB' in window)) {
			return reject(new Error('IndexedDB is not supported in this browser.'));
		}

		const request = window.indexedDB.open(DB_NAME, DB_VERSION);

		// Schema initialization runs only on version changes
		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, {
					keyPath: 'id',
					autoIncrement: true
				});
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Persists a new task object to the store.
 * @param {Object} task
 * @returns {Promise<number>}
 */
async function addTask(task) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);
		const request = store.add(task);

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		tx.oncomplete = () => db.close();
	});
}

/**
 * Fetches all stored tasks via a readonly transaction.
 * @returns {Promise<Array>}
 */
async function getAllTasks() {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readonly');
		const store = tx.objectStore(STORE_NAME);
		const request = store.getAll();

		request.onsuccess = () => resolve(request.result || []);
		request.onerror = () => reject(request.error);
		tx.oncomplete = () => db.close();
	});
}

/**
 * Deletes a task by primary key ID.
 * @param {number} id
 * @returns {Promise<void>}
 */
async function deleteTask(id) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);
		const request = store.delete(id);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
		tx.oncomplete = () => db.close();
	});
}

/**
 * Clears all records from the object store.
 * @returns {Promise<void>}
 */
async function clearAllTasks() {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);
		const request = store.clear();

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
		tx.oncomplete = () => db.close();
	});
}

/**
 * Safely constructs a DOM list item using native document methods.
 * Ensures user data is treated strictly as text, preventing XSS.
 * @param {Object} task
 * @returns {HTMLLIElement}
 */
function createTaskElement(task) {
	const li = document.createElement('li');
	li.className = 'task-item';

	const taskInfo = document.createElement('div');
	taskInfo.className = 'task-info';

	const heading = document.createElement('h3');
	// Use textContent instead of innerHTML to safely escape raw strings
	heading.textContent = task.title;

	const badge = document.createElement('span');
	badge.className = 'badge';
	badge.textContent = task.category;

	taskInfo.appendChild(heading);
	taskInfo.appendChild(badge);

	const deleteBtn = document.createElement('button');
	deleteBtn.className = 'delete-btn';
	deleteBtn.setAttribute('aria-label', `Delete task ${task.title}`);
	deleteBtn.dataset.id = String(task.id);
	deleteBtn.textContent = '×';

	li.appendChild(taskInfo);
	li.appendChild(deleteBtn);

	return li;
}

/**
 * Reads tasks from IndexedDB and replaces the current DOM tree.
 */
async function renderTasks() {
	try {
		const tasks = await getAllTasks();

		// Safely empty the list container
		taskList.replaceChildren();

		if (tasks.length === 0) {
			if (emptyState) emptyState.style.display = 'block';
			return;
		}

		if (emptyState) emptyState.style.display = 'none';

		// Batch append to avoid unnecessary reflows
		const fragment = document.createDocumentFragment();
		tasks.forEach((task) => {
			fragment.appendChild(createTaskElement(task));
		});

		taskList.appendChild(fragment);
	} catch (error) {
		console.error('Failed to render tasks from IndexedDB:', error);
	}
}

// Event Listeners
if (taskForm && taskTitleInput && taskCategorySelect) {
	taskForm.addEventListener('submit', async (e) => {
		e.preventDefault();

		const title = taskTitleInput.value.trim();
		const category = taskCategorySelect.value;

		if (!title) return;

		try {
			await addTask({
				title,
				category,
				createdAt: new Date().toISOString()
			});
			taskForm.reset();
			await renderTasks();
		} catch (error) {
			console.error('Failed to save task:', error);
		}
	});
}

if (taskList) {
	taskList.addEventListener('click', async (e) => {
		const target = e.target;
		// Check if clicked element is the delete button
		if (
			target instanceof HTMLButtonElement &&
			target.classList.contains('delete-btn')
		) {
			const id = Number(target.dataset.id);
			if (!Number.isNaN(id)) {
				try {
					await deleteTask(id);
					await renderTasks();
				} catch (error) {
					console.error(`Failed to delete task ${id}:`, error);
				}
			}
		}
	});
}

if (clearAllBtn) {
	clearAllBtn.addEventListener('click', async () => {
		try {
			await clearAllTasks();
			await renderTasks();
		} catch (error) {
			console.error('Failed to clear object store:', error);
		}
	});
}

// Initial bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', renderTasks);
