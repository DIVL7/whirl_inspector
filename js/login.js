// Funcionalidad de la página de inicio de sesión

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginButton = loginForm?.querySelector('button[type="submit"]');
    const statusMessage = document.createElement('div');
    statusMessage.className = 'status-message';
    
    // Agregar elemento de mensaje de estado después del formulario
    if (loginForm) {
        loginForm.after(statusMessage);
    }
    
    // Función para mostrar mensajes de estado
    function showStatus(message, isError = false) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
        statusMessage.style.display = 'block';
        
        // Ocultar automáticamente después de 5 segundos
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const employeeNumber = document.getElementById('employeeNumber').value;
            const password = document.getElementById('password').value;
            
            // Validación básica del formulario
            if (!employeeNumber || !password) {
                showStatus('Por favor, completa todos los campos.', true);
                return;
            }
            
            // Deshabilitar el botón de inicio de sesión y mostrar estado de carga
            if (loginButton) {
                loginButton.disabled = true;
                loginButton.textContent = 'Procesando...';
            }
            
            // Enviar solicitud de inicio de sesión al servidor
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employee_number: employeeNumber,
                    password: password
                })
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Credenciales incorrectas. Por favor, verifica tu número de empleado y contraseña.');
                    } else if (response.status === 400) {
                        throw new Error('Datos inválidos. Por favor, verifica la información proporcionada.');
                    } else {
                        throw new Error('Error en el servidor. Por favor, inténtalo de nuevo más tarde.');
                    }
                }
                return response.json();
            })
            .then(data => {
                // Rehabilitar el botón de inicio de sesión
                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.textContent = 'Continuar';
                }
                
                if (data.success) {
                    // Inicio de sesión exitoso
                    showStatus(data.message);
                    
                    // Guardar información del usuario en sessionStorage
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Redirigir según el rol del usuario después de un breve retraso
                    setTimeout(() => {
                        if (data.user.is_admin) {
                            window.location.href = '/admin/dashboard';
                        } else {
                            window.location.href = '/user/dashboard';
                        }
                    }, 1000);
                } else {
                    // Inicio de sesión fallido
                    showStatus(data.message, true);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showStatus(error.message, true);
                
                // Rehabilitar el botón de inicio de sesión
                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.textContent = 'Continuar';
                }
            });
        });
    }
});