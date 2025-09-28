class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.isDarkMode = false;
        this.draggedElement = null;
        
        this.initializeElements();
        this.loadFromStorage();
        this.bindEvents();
        this.updateDisplay();
    }

    initializeElements() {
        this.todoInput = document.getElementById('todo-input');
        this.todoList = document.getElementById('todo-list');
        this.itemsLeft = document.getElementById('items-left');
        this.themeIcon = document.getElementById('theme-icon');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.clearButton = document.querySelector('.clear-completed');
        this.inputCheck = document.querySelector('.input-check');
    }

    bindEvents() {
        // Input events
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.todoInput.value.trim()) {
                this.addTodo(this.todoInput.value.trim());
                this.todoInput.value = '';
            }
        });

        this.inputCheck.addEventListener('click', () => {
            if (this.todoInput.value.trim()) {
                this.addTodo(this.todoInput.value.trim());
                this.todoInput.value = '';
            }
        });

        // Theme toggle
        this.themeIcon.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter(btn.dataset.filter);
            });
        });

        // Clear 
        this.clearButton.addEventListener('click', () => {
            this.clearCompleted();
        });
    }

    addTodo(text) {
        const todo = {
            id: Date.now(),
            text: text,
            completed: false
        };
        
        this.todos.unshift(todo);
        this.saveToStorage();
        this.updateDisplay();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.updateDisplay();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveToStorage();
        this.updateDisplay();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.updateDisplay();
    }

    clearCompleted() {
        this.todos = this.todos.filter(t => !t.completed);
        this.saveToStorage();
        this.updateDisplay();
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark', this.isDarkMode);
        
        // Update theme icon 
        if (this.isDarkMode) {
            this.themeIcon.className = 'fas fa-moon';
        } else {
            this.themeIcon.className = 'fas fa-sun';
        }
        
        this.saveToStorage();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    updateDisplay() {
        // Clear current todos
        this.todoList.innerHTML = '';
        
        // Get filtered todos
        const filteredTodos = this.getFilteredTodos();
        
        // Render todos
        filteredTodos.forEach(todo => {
            this.renderTodo(todo);
        });
        
        // Update items left count
        const activeTodos = this.todos.filter(t => !t.completed);
        const count = activeTodos.length;
        this.itemsLeft.textContent = `${count} item${count !== 1 ? 's' : ''} left`;
        
        // Show/hide clear button
        const hasCompleted = this.todos.some(t => t.completed);
        this.clearButton.style.visibility = hasCompleted ? 'visible' : 'hidden';
    }

    renderTodo(todo) {
        const todoElement = document.createElement('div');
        todoElement.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        todoElement.draggable = true;
        todoElement.dataset.id = todo.id;
        
        todoElement.innerHTML = `
            <div class="todo-check ${todo.completed ? 'checked' : ''}">
                <i class="fas fa-check"></i>
            </div>
            <span class="todo-text">${this.escapeHtml(todo.text)}</span>
            <button class="delete-btn">×</button>
        `;
        
        // Add event listeners
        const checkElement = todoElement.querySelector('.todo-check');
        const deleteButton = todoElement.querySelector('.delete-btn');
        
        checkElement.addEventListener('click', () => {
            this.toggleTodo(todo.id);
        });
        
        deleteButton.addEventListener('click', () => {
            this.deleteTodo(todo.id);
        });
        
        // Add drag and drop events
        this.addDragEvents(todoElement);
        
        this.todoList.appendChild(todoElement);
    }

    addDragEvents(element) {
        element.addEventListener('dragstart', (e) => {
            this.draggedElement = element;
            element.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
            this.draggedElement = null;
        });

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedElement && this.draggedElement !== element) {
                const draggedId = parseInt(this.draggedElement.dataset.id);
                const targetId = parseInt(element.dataset.id);
                this.reorderTodos(draggedId, targetId);
            }
        });
    }

    reorderTodos(draggedId, targetId) {
        const draggedIndex = this.todos.findIndex(t => t.id === draggedId);
        const targetIndex = this.todos.findIndex(t => t.id === targetId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            // Remove dragged item
            const [draggedItem] = this.todos.splice(draggedIndex, 1);
            
            // Insert at new position
            this.todos.splice(targetIndex, 0, draggedItem);
            
            this.saveToStorage();
            this.updateDisplay();
        }
    }

    saveToStorage() {
        const data = {
            todos: this.todos,
            currentFilter: this.currentFilter,
            isDarkMode: this.isDarkMode
        };
        localStorage.setItem('todoApp', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('todoApp');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.todos = data.todos || [];
                this.currentFilter = data.currentFilter || 'all';
                this.isDarkMode = data.isDarkMode || false;
                
                // theme
                document.body.classList.toggle('dark', this.isDarkMode);
                if (this.isDarkMode) {
                    this.themeIcon.className = 'fas fa-moon';
                } else {
                    this.themeIcon.className = 'fas fa-sun';
                }
                
                // Set active filter
                this.filterButtons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
                });
                
            } catch (e) {
                console.error('Error loading from storage:', e);
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});