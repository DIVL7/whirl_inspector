/**
 * JavaScript para gestión de cursos
 */

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos comunes
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const userMenu = document.getElementById('userMenu');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    const logoutButton = document.getElementById('logoutButton');
    const userName = document.getElementById('userName');

    // Obtener datos de usuario del sessionStorage
    const userData = sessionStorage.getItem('user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            // Mostrar nombre del usuario
            if (user.name) {
                userName.textContent = user.name;
            } else if (user.first_name && user.last_name) {
                userName.textContent = `${user.first_name} ${user.last_name}`;
            } else if (user.employee_number) {
                userName.textContent = `Usuario ${user.employee_number}`;
            }

            // Verificar si el usuario es administrador
            if (!user.is_admin) {
                // Redirigir a dashboard de usuario
                window.location.href = '/user/dashboard';
            }
        } catch (error) {
            console.error('Error al parsear datos de usuario:', error);
        }
    } else {
        // Si no hay datos de sesión, redirigir al login
        window.location.href = '/login.html';
    }

    // Toggle del menú lateral
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            sidebar.classList.toggle('show');
            mainContent.classList.toggle('expanded');
        });
    }

    // Manejo del menú de usuario
    if (userMenu) {
        userMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            userMenuDropdown.classList.toggle('show');
        });
    }

    // Cerrar el menú desplegable al hacer clic en cualquier parte
    document.addEventListener('click', function(e) {
        if (userMenuDropdown && userMenuDropdown.classList.contains('show') && !userMenu.contains(e.target)) {
            userMenuDropdown.classList.remove('show');
        }
    });

    // Manejo del cierre de sesión
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Eliminar los datos de sesión
            sessionStorage.removeItem('user');
            // Redirigir al login
            window.location.href = '/login.html';
        });
    }

    // Detectar la página actual
    const currentUrl = window.location.pathname;
    
    if (currentUrl.includes('/admin/courses/create')) {
        // Página de creación de curso
        initCreateCoursePage();
    } else if (currentUrl.includes('/admin/courses/edit')) {
        // Página de edición de curso
        initEditCoursePage();
    } else if (currentUrl.includes('/admin/courses')) {
        // Página de listado de cursos
        initCoursesListPage();
    }
});

/**
 * Inicializar la página de listado de cursos
 */
function initCoursesListPage() {
    // Referencias a elementos específicos
    const coursesTableBody = document.getElementById('coursesTableBody');
    const searchInput = document.getElementById('searchCourses');
    const searchButton = document.getElementById('searchButton');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const closeModalBtn = document.querySelector('.close-modal');
    
    let courseToDelete = null;
    
    // Cargar categorías para el filtro
    loadCategories(categoryFilter);
    
    // Cargar cursos
    loadCourses();
    
    // Agregar event listeners para filtros
    if (searchButton) {
        searchButton.addEventListener('click', loadCourses);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loadCourses();
            }
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', loadCourses);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', loadCourses);
    }
    
    // Configurar modal de eliminación
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeDeleteModal);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteCourse);
    }
    
    window.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
    
    /**
     * Cargar la lista de cursos desde la API
     */
    function loadCourses() {
        // Mostrar indicador de carga
        if (coursesTableBody) {
            coursesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando cursos...</td></tr>';
        }
        
        // Recopilar filtros
        const filters = {};
        
        if (searchInput && searchInput.value.trim()) {
            filters.search = searchInput.value.trim();
        }
        
        if (categoryFilter && categoryFilter.value) {
            filters.category = categoryFilter.value;
        }
        
        if (statusFilter && statusFilter.value) {
            filters.active = statusFilter.value;
        }
        
        // Construir query string
        const queryString = Object.keys(filters)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(filters[key])}`)
            .join('&');
        
        // Obtener token de sesión
        const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
        const token = userData.token || '';
        
        // Realizar solicitud a la API
        fetch(`/api/courses${queryString ? '?' + queryString : ''}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los cursos');
            }
            return response.json();
        })
        .then(data => {
            renderCourses(data.data || []);
        })
        .catch(error => {
            console.error('Error:', error);
            if (coursesTableBody) {
                coursesTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">
                            <div class="alert error">
                                Error al cargar los cursos. Inténtelo de nuevo.
                            </div>
                        </td>
                    </tr>
                `;
            }
        });
    }
    
    /**
     * Renderizar la lista de cursos en la tabla
     */
    function renderCourses(courses) {
        if (!coursesTableBody) return;
        
        if (courses.length === 0) {
            coursesTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        No se encontraron cursos. <a href="/admin/courses/create">Crear nuevo curso</a>
                    </td>
                </tr>
            `;
            return;
        }
        
        coursesTableBody.innerHTML = '';
        
        courses.forEach(course => {
            const row = document.createElement('tr');
            
            // Formatear duración
            const duration = course.duration_hours > 0 
                ? `${course.duration_hours} horas` 
                : 'No definido';
            
            // Formatear estado
            const statusClass = course.is_active ? 'active' : 'inactive';
            const statusText = course.is_active ? 'Activo' : 'Inactivo';
            
            row.innerHTML = `
                <td>${escapeHtml(course.title)}</td>
                <td>${escapeHtml(course.category_name || 'Sin categoría')}</td>
                <td>${duration}</td>
                <td>${course.enrolled_count || 0}</td>
                <td><span class="course-status ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-icons">
                        <button class="action-btn view-btn" title="Ver Curso" data-id="${course.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" title="Editar Curso" data-id="${course.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Eliminar Curso" data-id="${course.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            // Agregar event listeners para botones de acción
            const viewBtn = row.querySelector('.view-btn');
            const editBtn = row.querySelector('.edit-btn');
            const deleteBtn = row.querySelector('.delete-btn');
            
            if (viewBtn) {
                viewBtn.addEventListener('click', function() {
                    const courseId = this.getAttribute('data-id');
                    // Implementación futura para visualizar curso
                    console.log('Ver curso:', courseId);
                });
            }
            
            if (editBtn) {
                editBtn.addEventListener('click', function() {
                    const courseId = this.getAttribute('data-id');
                    window.location.href = `/admin/courses/edit/${courseId}`;
                });
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    const courseId = this.getAttribute('data-id');
                    openDeleteModal(courseId, course.title);
                });
            }
            
            coursesTableBody.appendChild(row);
        });
    }
    
    /**
     * Abrir modal de confirmación para eliminar curso
     */
    function openDeleteModal(courseId, courseTitle) {
        courseToDelete = courseId;
        
        const modalBody = deleteModal.querySelector('.modal-body p');
        if (modalBody) {
            modalBody.textContent = `¿Está seguro de que desea eliminar el curso "${courseTitle}"? Esta acción no se puede deshacer.`;
        }
        
        deleteModal.style.display = 'block';
    }
    
    /**
     * Cerrar modal de eliminación
     */
    function closeDeleteModal() {
        deleteModal.style.display = 'none';
        courseToDelete = null;
    }
    
    /**
     * Confirmar y procesar eliminación de curso
     */
    function confirmDeleteCourse() {
        if (!courseToDelete) {
            closeDeleteModal();
            return;
        }
        
        // Obtener token de sesión
        const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
        const token = userData.token || '';
        
        // Realizar solicitud a la API
        fetch(`/api/courses/${courseToDelete}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al eliminar el curso');
            }
            return response.json();
        })
        .then(data => {
            closeDeleteModal();
            
            // Mostrar mensaje de éxito y recargar
            alert('Curso eliminado exitosamente');
            loadCourses();
        })
        .catch(error => {
            console.error('Error:', error);
            closeDeleteModal();
            alert('Error al eliminar el curso. Inténtelo de nuevo.');
        });
    }
}

/**
 * Inicializar la página de creación de curso
 */
function initCreateCoursePage() {
    // Referencias a elementos específicos
    const createCourseForm = document.getElementById('createCourseForm');
    const formMessage = document.getElementById('formMessage');
    const categorySelect = document.getElementById('courseCategory');
    
    // Cargar categorías
    loadCategories(categorySelect);
    
    // Manejar envío del formulario
    if (createCourseForm) {
        createCourseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validar formulario
            if (!validateCourseForm(createCourseForm, formMessage)) {
                return;
            }
            
            // Recopilar datos del formulario
            const formData = {
                title: document.getElementById('courseTitle').value.trim(),
                description: document.getElementById('courseDescription').value.trim(),
                category_id: document.getElementById('courseCategory').value,
                duration_hours: document.getElementById('courseDuration').value,
                is_active: document.getElementById('courseActive').checked
            };
            
            // Obtener token de sesión
            const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
            const token = userData.token || '';
            
            // Realizar solicitud a la API
            fetch('/api/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al crear el curso');
                }
                return response.json();
            })
            .then(data => {
                showFormMessage(formMessage, 'Curso creado exitosamente', false);
                
                // Redireccionar después de un breve retraso
                setTimeout(() => {
                    window.location.href = '/admin/courses';
                }, 1500);
            })
            .catch(error => {
                console.error('Error:', error);
                showFormMessage(formMessage, 'Error al crear el curso. Inténtelo de nuevo.', true);
            });
        });
    }
}

/**
 * Inicializar la página de edición de curso
 */
function initEditCoursePage() {
    // Referencias a elementos específicos
    const editCourseForm = document.getElementById('editCourseForm');
    const formMessage = document.getElementById('formMessage');
    const categorySelect = document.getElementById('courseCategory');
    const courseId = getCourseIdFromUrl();
    const loadingIndicator = document.getElementById('loadingIndicator');
    const courseFormPanel = document.getElementById('courseFormPanel');
    const courseModulesPanel = document.getElementById('courseModulesPanel');
    
    // Cargar categorías
    loadCategories(categorySelect);
    
    // Cargar datos del curso
    if (courseId) {
        loadCourseData(courseId);
    } else {
        window.location.href = '/admin/courses';
    }
    
    // Manejar envío del formulario
    if (editCourseForm) {
        editCourseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validar formulario
            if (!validateCourseForm(editCourseForm, formMessage)) {
                return;
            }
            
            // Recopilar datos del formulario
            const formData = {
                title: document.getElementById('courseTitle').value.trim(),
                description: document.getElementById('courseDescription').value.trim(),
                category_id: document.getElementById('courseCategory').value,
                duration_hours: document.getElementById('courseDuration').value,
                is_active: document.getElementById('courseActive').checked
            };
            
            // Obtener token de sesión
            const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
            const token = userData.token || '';
            
            // Realizar solicitud a la API
            fetch(`/api/courses/${courseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al actualizar el curso');
                }
                return response.json();
            })
            .then(data => {
                showFormMessage(formMessage, 'Curso actualizado exitosamente', false);
                
                // Recargar datos después de un breve retraso
                setTimeout(() => {
                    loadCourseData(courseId);
                }, 1500);
            })
            .catch(error => {
                console.error('Error:', error);
                showFormMessage(formMessage, 'Error al actualizar el curso. Inténtelo de nuevo.', true);
            });
        });
    }
    
    /**
     * Cargar datos del curso para edición
     */
    function loadCourseData(courseId) {
        // Mostrar indicador de carga
        if (loadingIndicator) loadingIndicator.style.display = 'flex';
        if (courseFormPanel) courseFormPanel.style.display = 'none';
        if (courseModulesPanel) courseModulesPanel.style.display = 'none';
        
        // Obtener token de sesión
        const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
        const token = userData.token || '';
        
        // Realizar solicitud a la API
        fetch(`/api/courses/${courseId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los datos del curso');
            }
            return response.json();
        })
        .then(data => {
            const course = data.data;
            if (!course) {
                throw new Error('Curso no encontrado');
            }
            
            // Llenar el formulario con los datos del curso
            fillCourseForm(course);
            
            // Cargar módulos si hay alguno
            renderModules(course.modules || []);
            
            // Ocultar indicador de carga y mostrar paneles
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (courseFormPanel) courseFormPanel.style.display = 'block';
            if (courseModulesPanel) courseModulesPanel.style.display = 'block';
        })
        .catch(error => {
            console.error('Error:', error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            alert('Error al cargar los datos del curso. Redireccionando a la lista de cursos.');
            setTimeout(() => {
                window.location.href = '/admin/courses';
            }, 1000);
        });
    }
    
    /**
     * Llenar formulario con datos del curso
     */
    function fillCourseForm(course) {
        document.getElementById('courseId').value = course.id;
        document.getElementById('courseTitle').value = course.title || '';
        document.getElementById('courseDescription').value = course.description || '';
        document.getElementById('courseDuration').value = course.duration_hours || 0;
        document.getElementById('courseActive').checked = Boolean(course.is_active);
        
        const categorySelect = document.getElementById('courseCategory');
        if (categorySelect && course.category_id) {
            categorySelect.value = course.category_id;
        }
        
        // Mostrar información adicional
        document.getElementById('enrolledCount').textContent = course.enrolled_count || 0;
        
        // Formatear fechas
        if (course.created_at) {
            const createdDate = new Date(course.created_at);
            document.getElementById('creationDate').textContent = createdDate.toLocaleString();
        }
        
        if (course.updated_at) {
            const updatedDate = new Date(course.updated_at);
            document.getElementById('updateDate').textContent = updatedDate.toLocaleString();
        }
    }
    
    /**
     * Renderizar módulos del curso
     */
    function renderModules(modules) {
        const modulesList = document.getElementById('modulesList');
        if (!modulesList) return;
        
        if (modules.length === 0) {
            modulesList.innerHTML = `
                <p class="no-modules-message">Este curso aún no tiene módulos.</p>
            `;
            return;
        }
        
        modulesList.innerHTML = '';
        
        modules.forEach((module, index) => {
            const moduleCard = document.createElement('div');
            moduleCard.className = 'module-card';
            
            moduleCard.innerHTML = `
                <div class="module-header">
                    <h4 class="module-title">
                        <i class="fas fa-cube"></i>
                        Módulo ${index + 1}: ${escapeHtml(module.title)}
                    </h4>
                    <div class="module-actions">
                        <button class="btn-sm edit-module-btn" data-id="${module.id}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-sm btn-outline view-module-btn" data-id="${module.id}">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </div>
                </div>
                <div class="module-body">
                    <p class="module-description">${escapeHtml(module.description || 'Sin descripción')}</p>
                    ${module.lessons && module.lessons.length > 0 ? `
                        <div class="lessons-container">
                            <h5><i class="fas fa-list"></i> Lecciones (${module.lessons.length})</h5>
                            <ul class="lessons-list">
                                ${module.lessons.map(lesson => `
                                    <li>${escapeHtml(lesson.title)}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : '<p class="no-lessons">Este módulo aún no tiene lecciones.</p>'}
                </div>
            `;
            
            // Agregar event listeners para botones
            const editBtn = moduleCard.querySelector('.edit-module-btn');
            const viewBtn = moduleCard.querySelector('.view-module-btn');
            
            if (editBtn) {
                editBtn.addEventListener('click', function() {
                    const moduleId = this.getAttribute('data-id');
                    // Implementación futura: editar módulo
                    console.log('Editar módulo:', moduleId);
                });
            }
            
            if (viewBtn) {
                viewBtn.addEventListener('click', function() {
                    const moduleId = this.getAttribute('data-id');
                    // Implementación futura: ver módulo
                    console.log('Ver módulo:', moduleId);
                });
            }
            
            modulesList.appendChild(moduleCard);
        });
    }
}

/**
 * Obtener ID del curso desde la URL
 */
function getCourseIdFromUrl() {
    const urlParts = window.location.pathname.split('/');
    const courseId = urlParts[urlParts.length - 1];
    return !isNaN(courseId) ? courseId : null;
}

/**
 * Cargar categorías de cursos
 */
function loadCategories(selectElement) {
    if (!selectElement) return;
    
    // Obtener token de sesión
    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    const token = userData.token || '';
    
    // Realizar solicitud a la API
    fetch('/api/courses/categories', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al cargar las categorías');
        }
        return response.json();
    })
    .then(data => {
        const categories = data.data || [];
        
        // Agregar opción predeterminada
        const defaultOption = selectElement.querySelector('option[value=""]');
        if (!defaultOption) {
            selectElement.innerHTML = '<option value="">Seleccionar categoría</option>';
        }
        
        // Agregar categorías
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            selectElement.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error al cargar categorías:', error);
    });
}

/**
 * Validar formulario de curso
 */
function validateCourseForm(form, messageElement) {
    // Validar título
    const title = form.querySelector('[name="title"]');
    if (!title || !title.value.trim()) {
        showFormMessage(messageElement, 'El título del curso es obligatorio', true);
        return false;
    }
    
    // Validar categoría
    const category = form.querySelector('[name="category_id"]');
    if (!category || !category.value) {
        showFormMessage(messageElement, 'Debe seleccionar una categoría', true);
        return false;
    }
    
    // Validar descripción
    const description = form.querySelector('[name="description"]');
    if (!description || !description.value.trim()) {
        showFormMessage(messageElement, 'La descripción del curso es obligatoria', true);
        return false;
    }
    
    return true;
}

/**
 * Mostrar mensaje en el formulario
 */
function showFormMessage(element, message, isError) {
    if (!element) return;
    
    element.textContent = message;
    element.className = isError ? 'alert error' : 'alert success';
    element.style.display = 'block';
    
    // Hacer scroll hacia el mensaje
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Función de utilidad: Escape HTML para prevenir XSS
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}