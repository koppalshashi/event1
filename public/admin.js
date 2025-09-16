// API Base URL (adjust if hosted)
const API_BASE = "";

// --- Admin Dashboard ---
async function loadRegistrations() {
    const tableBody = document.getElementById("registrationTable");
    if (!tableBody) return;

    const token = localStorage.getItem("adminToken");
    if (!token) {
        window.location.href = "admin-login.html";
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/admin/registrations`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("adminToken");
            window.location.href = "admin-login.html";
            return;
        }

        const registrations = await res.json();
        tableBody.innerHTML = "";

        registrations.forEach((reg) => {
            const row = document.createElement("tr");

            // Determine status class and text
            const statusText = getStatusText(reg.isApproved, reg.isRejected);
            const statusClass = getStatusClass(reg.isApproved, reg.isRejected);
            
            // Determine buttons to show
            const actionButtonsHTML = getActionButtonsHTML(reg.isApproved, reg.isRejected, reg._id);

            row.innerHTML = `
                <td>${reg.studentName}</td>
                <td>${reg.college}</td>
                <td>${reg.email}</td>
                <td>${reg.event}</td>
                <td>${reg.payment ? reg.payment.utrNumber : "-"}</td>
                <td>
                    ${
                      reg.payment
                        ? `<a class="screenshot-link" href="/${reg.payment.screenshotPath}" target="_blank">View</a>`
                        : "-"
                    }
                </td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>${actionButtonsHTML}</td>
            `;
            tableBody.appendChild(row);
        });

        // Add event listeners after all buttons are in the DOM
        document.querySelectorAll(".btn-approve").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const id = e.target.closest('tr').dataset.id;
                approveRegistration(id);
            });
        });

        document.querySelectorAll(".btn-reject").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const id = e.target.closest('tr').dataset.id;
                rejectRegistration(id);
            });
        });

    } catch (err) {
        console.error("Failed to load registrations:", err);
    }
}

// Helper function to determine status text
function getStatusText(isApproved, isRejected) {
    if (isApproved) return "Approved";
    if (isRejected) return "Rejected";
    return "Pending";
}

// Helper function to determine status CSS class
function getStatusClass(isApproved, isRejected) {
    if (isApproved) return "status-approved";
    if (isRejected) return "status-rejected";
    return "status-pending";
}

// Helper function to get action buttons HTML
function getActionButtonsHTML(isApproved, isRejected, id) {
    if (isApproved || isRejected) {
        return "-"; // No action needed if already approved or rejected
    }
    return `
        <div class="action-buttons">
            <button class="btn btn-approve" data-id="${id}">Approve</button>
            <button class="btn btn-reject" data-id="${id}">Reject</button>
        </div>
    `;
}

// Function to handle approval
async function approveRegistration(id) {
    if (!confirm("Are you sure you want to approve this registration?")) return;
    
    const token = localStorage.getItem("adminToken");
    try {
        const res = await fetch(`${API_BASE}/api/admin/approve/${id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok) {
            showTemporaryMessage("Registration approved and email sent!", "success");
            loadRegistrations();
        } else {
            showTemporaryMessage(data.message || "Approval failed.", "error");
        }
    } catch (err) {
        showTemporaryMessage("Server error.", "error");
    }
}

// Function to handle rejection
async function rejectRegistration(id) {
    if (!confirm("Are you sure you want to reject this registration? This action cannot be undone.")) return;

    const token = localStorage.getItem("adminToken");
    try {
        const res = await fetch(`${API_BASE}/api/admin/reject/${id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok) {
            showTemporaryMessage("Registration rejected!", "success");
            loadRegistrations();
        } else {
            showTemporaryMessage(data.message || "Rejection failed.", "error");
        }
    } catch (err) {
        showTemporaryMessage("Server error.", "error");
    }
}

// --- Logout ---
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("adminToken");
        window.location.href = "admin-login.html";
    });
}

// Auto load on dashboard
window.addEventListener("DOMContentLoaded", loadRegistrations);

// Temporary Message Function (requires a message div in your HTML)
// Add this line to your HTML, somewhere near the top of your body tag:
// <div id="dashboardMessage" style="position:fixed; top:20px; right:20px; padding:10px 20px; border-radius:5px; z-index:1000; display:none;"></div>
function showTemporaryMessage(message, type) {
    const msgDiv = document.getElementById("dashboardMessage");
    if (!msgDiv) return;

    msgDiv.textContent = message;
    msgDiv.style.backgroundColor = type === "success" ? "#2ecc71" : "#e74c3c";
    msgDiv.style.color = "#fff";
    msgDiv.style.display = "block";
    msgDiv.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
    
    setTimeout(() => {
        msgDiv.style.display = "none";
    }, 4000); // Hide after 4 seconds
}
