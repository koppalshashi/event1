document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://event1-vk4i.onrender.com';

    // --- DOM Elements for Login/Register Switch ---
    const loginCard = document.getElementById('login-card');
    const registerCard = document.getElementById('register-card');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginCard.style.display = 'none';
            registerCard.style.display = 'block';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerCard.style.display = 'none';
            loginCard.style.display = 'block';
        });
    }

    // --- LOGIC FOR ADMIN LOGIN ---
    const loginPage = document.getElementById('login-card');
    if (loginPage) {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const loginBtn = document.getElementById('login-btn');
        const errorMessageDiv = document.getElementById('login-error');

        loginBtn.addEventListener('click', async () => {
            const username = usernameInput.value;
            const password = passwordInput.value;
            errorMessageDiv.textContent = '';

            try {
                const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('adminToken', data.token);
                    window.location.href = 'admin-dashboard.html';
                } else {
                    errorMessageDiv.textContent = data.message || 'Login failed. Please check your credentials.';
                }
            } catch (error) {
                console.error('Login error:', error);
                errorMessageDiv.textContent = 'An error occurred. Please try again.';
            }
        });
    }

    // --- LOGIC FOR ADMIN REGISTRATION ---
    const registerPage = document.getElementById('register-card');
    if (registerPage) {
        const usernameInput = document.getElementById('reg-username');
        const passwordInput = document.getElementById('reg-password');
        const registerBtn = document.getElementById('register-btn');
        const errorMessageDiv = document.getElementById('register-error');

        registerBtn.addEventListener('click', async () => {
            const username = usernameInput.value;
            const password = passwordInput.value;
            errorMessageDiv.textContent = '';

            try {
                const response = await fetch(`${API_BASE_URL}/api/admin/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Admin account created successfully! You can now log in.');
                    // Switch back to login form
                    registerCard.style.display = 'none';
                    loginCard.style.display = 'block';
                } else {
                    errorMessageDiv.textContent = data.message || 'Registration failed.';
                }
            } catch (error) {
                console.error('Registration error:', error);
                errorMessageDiv.textContent = 'An error occurred. Please try again.';
            }
        });
    }

    // --- LOGIC FOR ADMIN DASHBOARD PAGE ---
    const dashboardPage = document.querySelector('.dashboard-container');
    if (dashboardPage) {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = 'admin-login.html';
            return;
        }

        const registrationsTableBody = document.querySelector('#registrations-table tbody');
        const logoutBtn = document.getElementById('logout-btn');

        const fetchAndRenderRegistrations = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/admin/registrations`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.status === 403) {
                    localStorage.removeItem('adminToken');
                    window.location.href = 'admin-login.html';
                    return;
                }

                const registrations = await response.json();
                renderTable(registrations);
            } catch (error) {
                console.error('Failed to fetch registrations:', error);
                alert('Failed to load registrations. Please try logging in again.');
            }
        };

        const renderTable = (registrations) => {
            registrationsTableBody.innerHTML = '';
            registrations.forEach(reg => {
                const row = document.createElement('tr');
                const payment = reg.payment || {};
                const screenshotUrl = payment.screenshotPath ? `${API_BASE_URL}/${payment.screenshotPath}` : 'no-screenshot.png';

                row.innerHTML = `
                    <td>${reg.studentName}</td>
                    <td>${reg.college}</td>
                    <td>${reg.event}</td>
                    <td>${payment.utrNumber || 'N/A'}</td>
                    <td><img src="${screenshotUrl}" alt="Screenshot" class="screenshot-preview" data-full-src="${screenshotUrl}"></td>
                    <td class="status-${reg.isApproved ? 'approved' : 'pending'}">${reg.isApproved ? 'Approved' : 'Pending'}</td>
                    <td>
                        <button class="btn-approve" data-id="${reg._id}" ${reg.isApproved ? 'disabled' : ''}>
                            ${reg.isApproved ? 'Approved' : 'Approve'}
                        </button>
                    </td>
                `;
                registrationsTableBody.appendChild(row);
            });

            addTableListeners();
        };

        const addTableListeners = () => {
            document.querySelectorAll('.btn-approve').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    const confirmation = confirm('Are you sure you want to approve this registration?');

                    if (confirmation) {
                        e.target.disabled = true;
                        e.target.textContent = 'Approving...';
                        try {
                            const response = await fetch(`${API_BASE_URL}/api/admin/approve/${id}`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });

                            if (response.ok) {
                                e.target.textContent = 'Approved';
                                e.target.parentElement.previousElementSibling.textContent = 'Approved';
                                e.target.parentElement.previousElementSibling.classList.remove('status-pending');
                                e.target.parentElement.previousElementSibling.classList.add('status-approved');
                            } else {
                                const errorData = await response.json();
                                alert(`Approval failed: ${errorData.message}`);
                                e.target.disabled = false;
                                e.target.textContent = 'Approve';
                            }
                        } catch (error) {
                            console.error('Approval request failed:', error);
                            alert('An error occurred during approval.');
                            e.target.disabled = false;
                            e.target.textContent = 'Approve';
                        }
                    }
                });
            });

            const modal = document.getElementById('screenshot-modal');
            const modalImg = document.getElementById('modal-image');
            const closeBtn = document.querySelector('.close-btn');

            document.querySelectorAll('.screenshot-preview').forEach(img => {
                img.addEventListener('click', (e) => {
                    modal.style.display = 'block';
                    modalImg.src = e.target.dataset.fullSrc;
                });
            });

            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        };

        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            window.location.href = 'admin-login.html';
        });

        fetchAndRenderRegistrations();
    }
});