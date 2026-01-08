/**
 * Sidebar Navigation Controller
 * Handles mobile responsive sidebar toggle functionality
 */

// DOM Elements
const toggleBtn = document.getElementById('toggleBtn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
let sidebarOverlay;

// Initialize sidebar functionality
function initializeSidebar() {
    // Create overlay for mobile
    createSidebarOverlay();
    
    // Set up event listeners
    setupEventListeners();
    
    // Handle window resize
    handleWindowResize();
    
    // Initialize sidebar state based on screen size
    initializeSidebarState();
}

// Create overlay element for mobile sidebar
function createSidebarOverlay() {
    sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);
    
    // Close sidebar when overlay is clicked
    sidebarOverlay.addEventListener('click', closeSidebar);
}

// Set up all event listeners
function setupEventListeners() {
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }
    
    // Handle keyboard navigation
    document.addEventListener('keydown', handleKeyboardNav);
    
    // Handle window resize
    window.addEventListener('resize', handleWindowResize);
    
    // Close sidebar when clicking nav items on mobile
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });
}

// Toggle sidebar open/close
function toggleSidebar() {
    if (sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

// Open sidebar
function openSidebar() {
    sidebar.classList.add('open');
    sidebar.classList.remove('closed');
    sidebarOverlay.classList.add('active');
    
    // Update toggle button icon
    if (toggleBtn) {
        toggleBtn.innerHTML = '✕';
        toggleBtn.setAttribute('aria-label', 'Close sidebar');
    }
    
    // Prevent body scroll on mobile when sidebar is open
    if (window.innerWidth <= 768) {
        document.body.style.overflow = 'hidden';
    }
}

// Close sidebar
function closeSidebar() {
    sidebar.classList.remove('open');
    sidebar.classList.add('closed');
    sidebarOverlay.classList.remove('active');
    
    // Update toggle button icon
    if (toggleBtn) {
        toggleBtn.innerHTML = '☰';
        toggleBtn.setAttribute('aria-label', 'Open sidebar');
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
}

// Handle keyboard navigation
function handleKeyboardNav(e) {
    // Close sidebar with Escape key
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        closeSidebar();
    }
}

// Handle window resize events
function handleWindowResize() {
    const width = window.innerWidth;
    
    if (width > 768) {
        // Desktop view - show sidebar, hide overlay
        sidebar.classList.remove('open', 'closed');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
        
        if (toggleBtn) {
            toggleBtn.innerHTML = '☰';
            toggleBtn.setAttribute('aria-label', 'Toggle sidebar');
        }
    } else {
        // Mobile view - ensure sidebar is closed by default
        if (!sidebar.classList.contains('open')) {
            sidebar.classList.add('closed');
        }
    }
}

// Initialize sidebar state based on screen size
function initializeSidebarState() {
    const width = window.innerWidth;
    
    if (width <= 768) {
        // Start closed on mobile
        sidebar.classList.add('closed');
        sidebar.classList.remove('open');
    } else {
        // Start open on desktop
        sidebar.classList.remove('closed', 'open');
    }
    
    // Set initial toggle button state
    if (toggleBtn) {
        toggleBtn.innerHTML = '☰';
        toggleBtn.setAttribute('aria-label', 'Toggle sidebar');
    }
}

// Enhanced navigation with smooth transitions
function enhanceNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach((item, index) => {
        // Add stagger animation delay
        item.style.animationDelay = `${index * 0.1}s`;
        
        // Add enhanced hover effects
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateX(8px)';
        });
        
        item.addEventListener('mouseleave', () => {
            if (!item.classList.contains('active')) {
                item.style.transform = 'translateX(0)';
            }
        });
    });
}

// Add touch gesture support for mobile
function addTouchGestures() {
    let startX = null;
    let currentX = null;
    let sidebarWidth = 250;
    
    // Touch start
    document.addEventListener('touchstart', (e) => {
        if (window.innerWidth > 768) return;
        
        startX = e.touches[0].clientX;
        
        // If starting from left edge, prepare to open sidebar
        if (startX < 20 && !sidebar.classList.contains('open')) {
            sidebar.style.transition = 'none';
        }
    });
    
    // Touch move
    document.addEventListener('touchmove', (e) => {
        if (window.innerWidth > 768 || startX === null) return;
        
        currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        
        // Swipe right from left edge to open
        if (startX < 20 && diffX > 0 && !sidebar.classList.contains('open')) {
            const progress = Math.min(diffX / sidebarWidth, 1);
            sidebar.style.transform = `translateX(${-sidebarWidth + (progress * sidebarWidth)}px)`;
            sidebarOverlay.style.opacity = progress * 0.5;
        }
        
        // Swipe left to close
        if (sidebar.classList.contains('open') && diffX < -50) {
            const progress = Math.max((diffX + 50) / sidebarWidth, -1);
            sidebar.style.transform = `translateX(${progress * sidebarWidth}px)`;
            sidebarOverlay.style.opacity = Math.max(0.5 + (progress * 0.5), 0);
        }
    });
    
    // Touch end
    document.addEventListener('touchend', (e) => {
        if (window.innerWidth > 768 || startX === null) return;
        
        const diffX = currentX - startX;
        
        // Reset styles
        sidebar.style.transition = '';
        sidebar.style.transform = '';
        sidebarOverlay.style.opacity = '';
        
        // Determine action based on swipe distance
        if (startX < 20 && diffX > sidebarWidth * 0.3) {
            openSidebar();
        } else if (sidebar.classList.contains('open') && diffX < -50) {
            closeSidebar();
        }
        
        startX = null;
        currentX = null;
    });
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeSidebar();
    enhanceNavigation();
    addTouchGestures();
});

// Export functions for external use
window.sidebarController = {
    open: openSidebar,
    close: closeSidebar,
    toggle: toggleSidebar,
    isOpen: () => sidebar.classList.contains('open')
};