// ====== State Management ======
const STORAGE_KEY = 'lesson_attendance_records';
const ADMIN_PASSWORD = 'admin123'; // Change for real use

// ====== Utility Functions ======
function getRecords() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function setRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

// ====== Navigation ======
const mainContent = document.getElementById('main-content');
document.getElementById('nav-checkin').onclick = showCheckIn;
document.getElementById('nav-dashboard').onclick = showDashboard;
document.getElementById('nav-admin').onclick = showAdminLogin;

// ====== Page Rendering ======
function showCheckIn() {
  mainContent.innerHTML = `
    <section class="max-w-xl mx-auto bg-white p-8 rounded-lg shadow">
      <h2 class="text-xl font-bold mb-6 text-blue-700">Student Check-In</h2>
      <form id="checkin-form" class="space-y-4">
        <div>
          <label class="block font-medium">Name</label>
          <input type="text" name="name" required class="w-full border rounded px-3 py-2 mt-1"/>
        </div>
        <div>
          <label class="block font-medium">Student ID</label>
          <input type="text" name="studentId" required class="w-full border rounded px-3 py-2 mt-1"/>
        </div>
        <div>
          <label class="block font-medium">Note <span class="text-gray-400 text-sm">(optional)</span></label>
          <input type="text" name="note" class="w-full border rounded px-3 py-2 mt-1"/>
        </div>
        <button type="submit" class="bg-blue-700 text-white px-5 py-2 rounded hover:bg-blue-800">Check In</button>
      </form>
      <div id="checkin-msg" class="mt-4"></div>
    </section>
  `;
  document.getElementById('checkin-form').onsubmit = handleCheckIn;
}

function handleCheckIn(event) {
  event.preventDefault();
  const form = event.target;
  const name = form.name.value.trim();
  const studentId = form.studentId.value.trim();
  const note = form.note.value.trim();
  const now = new Date();

  if (!name || !studentId) return;

  // Prevent duplicate check-in per day
  const today = now.toISOString().slice(0, 10);
  const records = getRecords();
  const alreadyChecked = records.some(r =>
    r.studentId === studentId && r.date.slice(0, 10) === today
  );

  const msgDiv = document.getElementById('checkin-msg');
  if (alreadyChecked) {
    msgDiv.innerHTML = `<p class="text-red-600 font-semibold">Already checked in today.</p>`;
    return;
  }

  records.push({
    name, studentId, note,
    date: now.toISOString()
  });
  setRecords(records);

  msgDiv.innerHTML = `<p class="text-green-600 font-semibold">Check-in successful!</p>`;
  form.reset();
}

function showDashboard() {
  const records = getRecords();
  mainContent.innerHTML = `
    <section class="bg-white p-8 rounded-lg shadow">
      <h2 class="text-xl font-bold text-blue-700 mb-4">Attendance Dashboard</h2>
      <div class="mb-4 flex flex-col md:flex-row gap-3 items-center">
        <input type="date" id="filter-date" class="border rounded px-2 py-1"/>
        <input type="text" id="filter-name" placeholder="Filter by Name" class="border rounded px-2 py-1"/>
        <button id="export-csv" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Export CSV</button>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full border border-gray-300 rounded">
          <thead class="bg-blue-100">
            <tr>
              <th class="px-3 py-2 border">Date/Time</th>
              <th class="px-3 py-2 border">Name</th>
              <th class="px-3 py-2 border">Student ID</th>
              <th class="px-3 py-2 border">Note</th>
            </tr>
          </thead>
          <tbody id="attendance-tbody">
            <!-- Rows go here -->
          </tbody>
        </table>
      </div>
    </section>
  `;
  renderDashboardRows(records);

  document.getElementById('filter-date').oninput = filterDashboard;
  document.getElementById('filter-name').oninput = filterDashboard;
  document.getElementById('export-csv').onclick = exportCSV;
}

function renderDashboardRows(records) {
  const tbody = document.getElementById('attendance-tbody');
  if (!tbody) return;
  tbody.innerHTML = records.length === 0
    ? `<tr><td class="px-3 py-2 border text-center text-gray-400" colspan="4">No records found.</td></tr>`
    : records.map(r => `
      <tr>
        <td class="px-3 py-2 border">${formatDate(r.date)}</td>
        <td class="px-3 py-2 border">${r.name}</td>
        <td class="px-3 py-2 border">${r.studentId}</td>
        <td class="px-3 py-2 border">${r.note || '-'}</td>
      </tr>
    `).join('');
}

function filterDashboard() {
  const dateVal = document.getElementById('filter-date').value;
  const nameVal = document.getElementById('filter-name').value.trim().toLowerCase();
  let records = getRecords();
  if (dateVal) records = records.filter(r => r.date.slice(0, 10) === dateVal);
  if (nameVal) records = records.filter(r => r.name.toLowerCase().includes(nameVal));
  renderDashboardRows(records);
}

function exportCSV() {
  const records = getRecords();
  const csv = [
    ['Date/Time', 'Name', 'Student ID', 'Note'],
    ...records.map(r => [
      formatDate(r.date), r.name, r.studentId, r.note?.replace(/"/g, '""') || ''
    ])
  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function showAdminLogin() {
  mainContent.innerHTML = `
    <section class="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
      <h2 class="text-xl font-bold mb-6 text-blue-700">Admin Login</h2>
      <form id="admin-login-form" class="space-y-4">
        <div>
          <label class="block font-medium">Password</label>
          <input type="password" name="password" required class="w-full border rounded px-3 py-2 mt-1"/>
        </div>
        <button type="submit" class="bg-blue-700 text-white px-5 py-2 rounded hover:bg-blue-800">Login</button>
      </form>
      <div id="admin-login-msg" class="mt-4"></div>
    </section>
  `;
  document.getElementById('admin-login-form').onsubmit = handleAdminLogin;
}

function handleAdminLogin(event) {
  event.preventDefault();
  const form = event.target;
  const pwd = form.password.value;
  const msgDiv = document.getElementById('admin-login-msg');
  if (pwd === ADMIN_PASSWORD) {
    showAdminPanel();
  } else {
    msgDiv.innerHTML = `<p class="text-red-600 font-semibold">Incorrect password.</p>`;
  }
}

function showAdminPanel() {
  const records = getRecords();
  mainContent.innerHTML = `
    <section class="bg-white p-8 rounded-lg shadow">
      <h2 class="text-xl font-bold text-blue-700 mb-4">Admin Panel</h2>
      <div class="mb-4 flex gap-3">
        <button id="admin-clear" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Clear All Records</button>
        <button id="admin-logout" class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-600">Logout</button>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full border border-gray-300 rounded">
          <thead class="bg-blue-100">
            <tr>
              <th class="px-3 py-2 border">Date/Time</th>
              <th class="px-3 py-2 border">Name</th>
              <th class="px-3 py-2 border">Student ID</th>
              <th class="px-3 py-2 border">Note</th>
              <th class="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody id="admin-tbody">
            <!-- Rows go here -->
          </tbody>
        </table>
      </div>
    </section>
  `;
  renderAdminRows(records);

  document.getElementById('admin-clear').onclick = () => {
    if (confirm("Are you sure you want to clear all attendance records?")) {
      setRecords([]);
      showAdminPanel();
    }
  };
  document.getElementById('admin-logout').onclick = showAdminLogin;
}

function renderAdminRows(records) {
  const tbody = document.getElementById('admin-tbody');
  if (!tbody) return;
  tbody.innerHTML = records.length === 0
    ? `<tr><td class="px-3 py-2 border text-center text-gray-400" colspan="5">No records found.</td></tr>`
    : records.map((r, i) => `
      <tr>
        <td class="px-3 py-2 border">${formatDate(r.date)}</td>
        <td class="px-3 py-2 border">${r.name}</td>
        <td class="px-3 py-2 border">${r.studentId}</td>
        <td class="px-3 py-2 border">${r.note || '-'}</td>
        <td class="px-3 py-2 border">
          <button class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700" onclick="deleteAdminRecord(${i})">Delete</button>
        </td>
      </tr>
    `).join('');
}

// To allow deletion, we attach the deleteAdminRecord function to window
window.deleteAdminRecord = function(idx) {
  const records = getRecords();
  if (idx >= 0 && idx < records.length) {
    if (confirm("Delete this record?")) {
      records.splice(idx, 1);
      setRecords(records);
      showAdminPanel();
    }
  }
};

// ====== Initial Load ======
showCheckIn();
