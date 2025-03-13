// Main JavaScript for the landing page

document.addEventListener('DOMContentLoaded', function() {
    // Animation for circles (optional enhancement)
    const circles = document.querySelectorAll('.circle');
    
    circles.forEach(circle => {
        // Add a subtle animation to each circle
        const randomDelay = Math.random() * 2;
        circle.style.animation = `float 8s ease-in-out ${randomDelay}s infinite`;
    });
    
    // Add animation keyframes to the document
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% { transform: translate(0, 0); }
            50% { transform: translate(5px, 5px); }
            100% { transform: translate(0, 0); }
        }
    `;
    document.head.appendChild(style);
});