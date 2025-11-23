export function renderNavBar(activePage) {
    const navHTML = `
        <nav class="bottom-nav">
            <a href="friends.html" class="nav-item ${activePage === 'friends' ? 'active' : ''}">
                <span class="nav-icon">🏠</span>
                <span>Home</span>
            </a>
            <a href="notifications.html" class="nav-item ${activePage === 'notifications' ? 'active' : ''}">
                <span class="nav-icon">🔔</span>
                <span>Alerts</span>
            </a>
            <a href="userlist.html" class="nav-item ${activePage === 'userlist' ? 'active' : ''}">
                <span class="nav-icon">👥</span>
                <span>Users</span>
            </a>
            <a href="settings.html" class="nav-item ${activePage === 'settings' ? 'active' : ''}">
                <span class="nav-icon">⚙️</span>
                <span>Settings</span>
            </a>
        </nav>
    `;

    document.body.insertAdjacentHTML('beforeend', navHTML);
}
