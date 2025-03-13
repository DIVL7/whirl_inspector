/**
 * JavaScript para el Dashboard del Usuario Técnico
 */

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
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
        } catch (error) {
            console.error('Error al parsear datos de usuario:', error);
        }
    }

    // Toggle del menú lateral
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        sidebar.classList.toggle('show');
        mainContent.classList.toggle('expanded');
    });

    // Manejo del menú de usuario
    userMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        userMenuDropdown.classList.toggle('show');
    });

    // Cerrar el menú desplegable al hacer clic en cualquier parte
    document.addEventListener('click', function(e) {
        if (userMenuDropdown.classList.contains('show') && !userMenu.contains(e.target)) {
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

    // Navegación por el sidebar
    const sidebarLinks = document.querySelectorAll('.sidebar-nav li a');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Si tiene submenú, toggle de ese submenú
            const parent = this.parentElement;
            if (parent.classList.contains('has-submenu')) {
                e.preventDefault();
                parent.classList.toggle('open');
            }
            
            // Solo para enlaces de primer nivel que no tengan submenú
            if (!parent.classList.contains('has-submenu')) {
                // Remover clase activa de todos los enlaces
                sidebarLinks.forEach(item => {
                    item.parentElement.classList.remove('active');
                });
                
                // Agregar clase activa al enlace actual
                parent.classList.add('active');
            }
        });
    });

    // Detectar si estamos en móvil para comportamiento adecuado
    function checkMobile() {
        if (window.innerWidth < 992) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
        }
    }

    // Ejecutar al cargar y en cambios de tamaño
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Simular carga de datos (en una aplicación real, esto vendría de la API)
    function simulateDataLoad() {
        // Mostrar alguna animación de carga si fuera necesario
        setTimeout(() => {
            // Aquí se cargarían los datos reales desde la API
            console.log('Datos cargados');
        }, 500);
    }

    simulateDataLoad();
});