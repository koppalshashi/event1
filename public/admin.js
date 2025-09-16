// admin.js
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    alert('You must log in as admin.');
    window.location.href = 'admin-login.html';
    return;
  }

  const tableBody = document.getElementById('registrationTable');
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.href = 'admin-login.html';
  });

  try {
    const response = await fetch('http://localhost:5000/api/admin/registrations', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch registrations');
    }

    const registrations = await response.json();
    tableBody.innerHTML = '';

    registrations.forEach(reg => {
      const tr = document.createElement('tr');

      // Registration data
      const name = `<td>${reg.studentName}</td>`;
      const college = `<td>${reg.college}</td>`;
      const email = `<td>${reg.email}</td>`;
      const event = `<td>${reg.event}</td>`;

      // Payment data (may not exist yet)
      const utr = `<td>${reg.payment ? reg.payment.utrNumber : 'N/A'}</td>`;
      const screenshot = `<td>${
        reg.payment
          ? `<a href="http://localhost:5000/${reg.payment.screenshotPath}" target="_blank">View Screenshot</a>`
          : 'N/A'
      }</td>`;

      // Status
      const status = `<td>${reg.isApproved ? '✅ Approved' : '⏳ Pending'}</td>`;

      // Action button
      const action = `<td>${
        !reg.isApproved
          ? `<button class="approveBtn" data-id="${reg._id}">Approve</button>`
          : '—'
      }</td>`;

      tr.innerHTML = name + college + email + event + utr + screenshot + status + action;
      tableBody.appendChild(tr);
    });

    // Attach approve button handlers
    document.querySelectorAll('.approveBtn').forEach(btn => {
      btn.addEventListener('click', async e => {
        const regId = e.target.dataset.id;
        if (confirm('Approve this registration?')) {
          try {
            const res = await fetch(`http://localhost:5000/api/admin/approve/${regId}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            alert(data.message);
            window.location.reload();
          } catch (err) {
            console.error(err);
            alert('Failed to approve.');
          }
        }
      });
    });
  } catch (err) {
    console.error('Error fetching data:', err);
    alert('Error fetching registrations.');
  }
});
