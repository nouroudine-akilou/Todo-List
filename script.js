// TaskMaster Pro - JavaScript Functionality
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.currentEditId = null;
        this.currentDeleteId = null;
        this.draggedItem = null;
        
        this.initializeElements();
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
    }

    initializeElements() {
        // Input elements
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.searchInput = document.getElementById('searchInput');
        
        // Priority selectors
        this.priorityOptions = document.querySelectorAll('.priority-option');
        this.editPriorityOptions = document.getElementById('editPriorityOptions');
        
        // Display elements
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');
        this.totalTasksSpan = document.getElementById('totalTasks');
        this.completedTasksSpan = document.getElementById('completedTasks');
        
        // Filter buttons
        this.filterBtns = document.querySelectorAll('.filter-btn');
        
        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');
        
        // Modal elements
        this.editModal = document.getElementById('editModal');
        this.editTaskInput = document.getElementById('editTaskInput');
        this.closeModal = document.getElementById('closeModal');
        this.cancelEdit = document.getElementById('cancelEdit');
        this.saveEdit = document.getElementById('saveEdit');
        
        // Delete modal elements
        this.deleteModal = document.getElementById('deleteModal');
        this.deleteTaskPreview = document.getElementById('deleteTaskPreview');
        this.closeDeleteModal = document.getElementById('closeDeleteModal');
        this.cancelDelete = document.getElementById('cancelDelete');
        this.confirmDelete = document.getElementById('confirmDelete');
        
        // Load theme
        this.loadTheme();
    }

    bindEvents() {
        // Add task
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        // Priority selection
        this.priorityOptions.forEach(option => {
            option.addEventListener('click', (e) => this.selectPriority(e.target.closest('.priority-option')));
        });
        
        // Search
        this.searchInput.addEventListener('input', () => this.renderTasks());
        
        // Filter
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Modal events
        this.closeModal.addEventListener('click', () => this.closeEditModal());
        this.cancelEdit.addEventListener('click', () => this.closeEditModal());
        this.saveEdit.addEventListener('click', () => this.saveTaskEdit());
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeEditModal();
        });
        
        // Delete modal events
        this.closeDeleteModal.addEventListener('click', () => {
            console.log('Close button clicked');
            this.hideDeleteModal();
        });
        this.cancelDelete.addEventListener('click', () => {
            console.log('Cancel button clicked');
            this.hideDeleteModal();
        });
        this.confirmDelete.addEventListener('click', () => {
            console.log('Confirm button clicked');
            this.confirmTaskDelete();
        });
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) {
                console.log('Modal backdrop clicked');
                this.hideDeleteModal();
            }
        });
        
        // Edit priority selection
        if (this.editPriorityOptions) {
            this.editPriorityOptions.addEventListener('click', (e) => {
                const option = e.target.closest('.priority-option');
                if (option) this.selectEditPriority(option);
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEditModal();
                this.hideDeleteModal();
            }
            if (e.ctrlKey && e.key === 'Enter') this.addTask();
        });
    }

    // Priority Selection Methods
    selectPriority(option) {
        // Remove active class from all options
        this.priorityOptions.forEach(opt => opt.classList.remove('active'));
        // Add active class to selected option
        option.classList.add('active');
    }
    
    selectEditPriority(option) {
        // Remove active class from all edit options
        this.editPriorityOptions.querySelectorAll('.priority-option').forEach(opt => opt.classList.remove('active'));
        // Add active class to selected option
        option.classList.add('active');
    }
    
    getSelectedPriority() {
        const selected = document.querySelector('.priority-option.active');
        return selected ? selected.dataset.priority : 'medium';
    }
    
    getSelectedEditPriority() {
        const selected = this.editPriorityOptions.querySelector('.priority-option.active');
        return selected ? selected.dataset.priority : 'medium';
    }
    
    resetPrioritySelection() {
        // Reset to medium priority
        this.priorityOptions.forEach(opt => opt.classList.remove('active'));
        const mediumOption = document.querySelector('.priority-option[data-priority="medium"]');
        if (mediumOption) mediumOption.classList.add('active');
    }

    // Task Management
    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;

        const task = {
            id: this.generateId(),
            text: text,
            priority: this.getSelectedPriority(),
            completed: false,
            createdAt: new Date().toISOString(),
            order: this.tasks.length
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        // Clear input and reset priority
        this.taskInput.value = '';
        this.resetPrioritySelection();
        
        // Show success feedback with Dynamic Style
        this.showNotification(' Tâche ajoutée avec succès!', 'success');
    }

    deleteTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            this.currentDeleteId = id;
            this.showDeleteModal(task);
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    editTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            this.currentEditId = id;
            this.editTaskInput.value = task.text;
            
            // Set priority in edit modal
            this.editPriorityOptions.querySelectorAll('.priority-option').forEach(opt => opt.classList.remove('active'));
            const priorityOption = this.editPriorityOptions.querySelector(`[data-priority="${task.priority}"]`);
            if (priorityOption) priorityOption.classList.add('active');
            
            this.showEditModal();
        }
    }

    saveTaskEdit() {
        const newText = this.editTaskInput.value.trim();
        if (!newText || !this.currentEditId) return;

        const task = this.tasks.find(task => task.id === this.currentEditId);
        if (task) {
            task.text = newText;
            task.priority = this.getSelectedEditPriority();
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderTasks();
            this.closeEditModal();
            this.showNotification('Tâche modifiée avec succès!', 'success');
        }
    }

    // Drag and Drop
    initializeDragAndDrop() {
        const taskItems = this.tasksList.querySelectorAll('.task-item');
        
        taskItems.forEach(item => {
            item.draggable = true;
            
            item.addEventListener('dragstart', (e) => {
                this.draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            
            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
                this.draggedItem = null;
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                if (this.draggedItem && this.draggedItem !== item) {
                    this.reorderTasks(this.draggedItem.dataset.id, item.dataset.id);
                }
            });
        });
    }

    reorderTasks(draggedId, targetId) {
        const draggedIndex = this.tasks.findIndex(task => task.id === draggedId);
        const targetIndex = this.tasks.findIndex(task => task.id === targetId);
        
        if (draggedIndex > -1 && targetIndex > -1) {
            const draggedTask = this.tasks.splice(draggedIndex, 1)[0];
            this.tasks.splice(targetIndex, 0, draggedTask);
            
            // Update order values
            this.tasks.forEach((task, index) => {
                task.order = index;
            });
            
            this.saveTasks();
            this.renderTasks();
        }
    }

    // Filtering and Searching
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        this.renderTasks();
    }

    getFilteredTasks() {
        let filtered = [...this.tasks];
        
        // Apply filter
        switch (this.currentFilter) {
            case 'pending':
                filtered = filtered.filter(task => !task.completed);
                break;
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
        }
        
        // Apply search
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(task => 
                task.text.toLowerCase().includes(searchTerm)
            );
        }
        
        // Sort by order
        filtered.sort((a, b) => a.order - b.order);
        
        return filtered;
    }

    // Rendering
    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.tasksList.style.display = 'none';
            this.emptyState.style.display = 'block';
        } else {
            this.tasksList.style.display = 'block';
            this.emptyState.style.display = 'none';
            
            this.tasksList.innerHTML = filteredTasks.map(task => 
                this.createTaskHTML(task)
            ).join('');
            
            // Initialize drag and drop after rendering
            this.initializeDragAndDrop();
        }
    }

    createTaskHTML(task) {
        const priorityClass = `priority-${task.priority}`;
        const priorityText = {
            low: 'Normale',
            medium: 'Important',
            high: 'Urgent'
        }[task.priority];
        
        const createdDate = new Date(task.createdAt).toLocaleDateString('en-US');
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="taskManager.toggleTask('${task.id}')">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="priority-badge ${priorityClass}">${priorityText}</span>
                        <span><i class="fas fa-calendar"></i> ${createdDate}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn" onclick="taskManager.editTask('${task.id}')" title="Edit Dynamic Style">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="taskManager.deleteTask('${task.id}')" title="Delete & Save">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        
        this.totalTasksSpan.textContent = total;
        this.completedTasksSpan.textContent = completed;
    }

    // Modal Management
    showEditModal() {
        this.editModal.classList.add('show');
        this.editTaskInput.focus();
        document.body.style.overflow = 'hidden';
    }

    closeEditModal() {
        this.editModal.classList.remove('show');
        this.currentEditId = null;
        document.body.style.overflow = '';
    }

    showDeleteModal(task) {
        // Create Dynamic task preview with Style
        const priorityText = {
            low: 'Normale',
            medium: 'Important',
            high: 'Urgent'
        }[task.priority];
        
        const priorityClass = `priority-${task.priority}`;
        const createdDate = new Date(task.createdAt).toLocaleDateString('en-US');
        
        this.deleteTaskPreview.innerHTML = `
            <div class="preview-text">${this.escapeHtml(task.text)}</div>
            <div class="preview-meta">
                <span class="priority-badge ${priorityClass}">${priorityText}</span>
                <span><i class="fas fa-calendar"></i> ${createdDate}</span>
            </div>
        `;
        
        this.deleteModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus auf Abbrechen-Button setzen (sicherere Option)
        setTimeout(() => this.cancelDelete.focus(), 100);
    }

    hideDeleteModal() {
        this.deleteModal.classList.remove('show');
        this.currentDeleteId = null;
        document.body.style.overflow = '';
    }

    confirmTaskDelete() {
        if (this.currentDeleteId) {
            // Task tatsächlich löschen
            this.tasks = this.tasks.filter(task => task.id !== this.currentDeleteId);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.hideDeleteModal();
            this.showNotification('Tâche supprimée avec succès!', 'info');
        }
    }

    // Theme Management
    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        
        if (isDark) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            this.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            this.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const body = document.body;
        
        if (savedTheme === 'dark') {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            this.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            this.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    // Notifications
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
            <span>${message}</span>
        `;
        
        // Add styles if not already present
        if (!document.querySelector('.notification-styles')) {
            const style = document.createElement('style');
            style.className = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    box-shadow: var(--shadow-lg);
                    border-left: 4px solid var(--accent-primary);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    z-index: 10000;
                    animation: slideInRight 0.3s ease;
                    max-width: 300px;
                }
                .notification-success { border-left-color: var(--success); }
                .notification-error { border-left-color: var(--error); }
                .notification-info { border-left-color: var(--accent-primary); }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Data Management
    loadTasks() {
        try {
            const tasks = localStorage.getItem('taskmaster-tasks');
            return tasks ? JSON.parse(tasks) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('taskmaster-tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
            this.showNotification('Fehler beim Speichern!', 'error');
        }
    }

    // Utility functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Public API for debugging/extending
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'taskmaster-backup.json';
        link.click();
    }

    importTasks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                this.tasks = importedTasks;
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
                this.showNotification('Tâches importées avec succès!', 'success');
            } catch (error) {
                this.showNotification('Erreur lors de l\'importation des tâches!', 'error');
            }
        };
        reader.readAsText(file);
    }

    clearAllTasks() {
        if (confirm('Êtes-vous sûr de vouloir supprimer toutes les tâches ? Cette action est irréversible.')) {
            this.tasks = [];
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Toutes les tâches ont été supprimées avec succès!', 'info');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
    
    // Add some demo tasks if no tasks exist
    if (window.taskManager.tasks.length === 0) {
        // const demoTasks = [
        //     {
        //         id: window.taskManager.generateId(),
        //         text: 'Welcome to TaskMaster Pro by TheDoc!',
        //         priority: 'high',
        //         completed: false,
        //         createdAt: new Date().toISOString(),
        //         order: 0
        //     },
        //     {
        //         id: window.taskManager.generateId(),
        //         text: 'Try TheDoc Dynamic theme (moon icon)',
        //         priority: 'medium',
        //         completed: false,
        //         createdAt: new Date().toISOString(),
        //         order: 1
        //     },
        //     {
        //         id: window.taskManager.generateId(),
        //         text: 'Drag & Drop tasks to reorder Dynamically & Smart',
        //         priority: 'low',
        //         completed: false,
        //         createdAt: new Date().toISOString(),
        //         order: 2
        //     }
        // ];
        
        window.taskManager.tasks = demoTasks;
        window.taskManager.saveTasks();
        window.taskManager.renderTasks();
        window.taskManager.updateStats();
    }
    
    console.log(' TaskMaster Pro geladen!');
    console.log(' Tipp: Nutzen Sie taskManager.exportTasks() zum Backup oder taskManager.clearAllTasks() zum Zurücksetzen');
});
            