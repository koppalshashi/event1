// API Base URL (adjust if hosted)
const API_BASE = "";

// --- Admin Login ---
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("loginMessage");

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("adminToken", data.token);
        window.location.href = "admin-dashboard.html";
      } else {
        msg.textContent = data.message || "Login failed.";
      }
    } catch (err) {
      msg.textContent = "Server error.";
    }
  });
}

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

      row.innerHTML = `
        <td>${reg.studentName}</td>
        <td>${reg.college}</td>
        <td>${reg.email}</td>
        <td>${reg.event}</td>
        <td>${reg.payment ? reg.payment.utrNumber : "-"}</td>
        <td>
          ${
            reg.payment
              ? `<a href="/${reg.payment.screenshotPath}" target="_blank">View</a>`
              : "-"
          }
        </td>
        <td>${reg.isApproved ? "✅ Approved" : "⏳ Pending"}</td>
        <td>
          ${
            !reg.isApproved
              ? `<button class="btn approveBtn" data-id="${reg._id}">Approve</button>`
              : "-"
          }
        </td>
      `;
      tableBody.appendChild(row);
    });

    document.querySelectorAll(".approveBtn").forEach((btn) => {
      btn.addEventListener("click", () => approveRegistration(btn.dataset.id));
    });
  } catch (err) {
    console.error("Failed to load registrations:", err);
  }
}

async function approveRegistration(id) {
  const token = localStorage.getItem("adminToken");
  try {
    const res = await fetch(`${API_BASE}/api/admin/approve/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (res.ok) {
      alert("Approved & Email sent!");
      loadRegistrations();
    } else {
      alert(data.message || "Approval failed.");
    }
  } catch (err) {
    alert("Server error.");
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
