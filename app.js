
const API_BASE = "https://jsonplaceholder.typicode.com";
const USERS_ENDPOINT = `${API_BASE}/users`;

// -------------------- STATE --------------------
let contacts = [];      
let editId = null;       
let loading = false;     

// -------------------- DOM --------------------
const loadBtn = document.getElementById("loadBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");

const searchInput = document.getElementById("searchInput");
const listEl = document.getElementById("list");
const countBadge = document.getElementById("countBadge");

const form = document.getElementById("contactForm");
const formTitle = document.getElementById("formTitle");
const modeBadge = document.getElementById("modeBadge");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const phoneInput = document.getElementById("phoneInput");
const companyInput = document.getElementById("companyInput");

// errors
const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const phoneError = document.getElementById("phoneError");

// -------------------- EVENTS --------------------
loadBtn.addEventListener("click", loadContacts);
clearBtn.addEventListener("click", clearUI);
searchInput.addEventListener("input", render);

form.addEventListener("submit", onSubmitForm);
cancelEditBtn.addEventListener("click", exitEditMode);

// Event delegation for list buttons
listEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === "edit") {
    enterEditMode(id);
  } else if (action === "delete") {
    deleteContact(id);
  }
});

// -------------------- HELPERS --------------------
function setStatus(message, type = "info") {
 
  const prefix = type === "ok" ? "✅ " : type === "warn" ? "⚠️ " : type === "error" ? "❌ " : "ℹ️ ";
  statusEl.textContent = prefix + message;
}

function setLoading(isLoading) {
  loading = isLoading;
  loadBtn.disabled = isLoading;
  submitBtn.disabled = isLoading;
  clearBtn.disabled = isLoading;
}

function resetErrors() {
  nameError.textContent = "";
  emailError.textContent = "";
  phoneError.textContent = "";
}

function validateForm({ name, email, phone }) {
 
  resetErrors();
  let ok = true;

  if (!name || name.trim().length < 3) {
    nameError.textContent = "Name must be at least 3 characters.";
    ok = false;
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    emailError.textContent = "Please enter a valid email.";
    ok = false;
  }

  if (!phone || phone.trim().length < 6) {
    phoneError.textContent = "Phone must be at least 6 characters.";
    ok = false;
  }

  return ok;
}

function getFormData() {
  return {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    company: companyInput.value.trim()
  };
}

function fillForm(contact) {
  nameInput.value = contact.name || "";
  emailInput.value = contact.email || "";
  phoneInput.value = contact.phone || "";
  companyInput.value = contact.company?.name || contact.company || "";
}

function clearForm() {
  nameInput.value = "";
  emailInput.value = "";
  phoneInput.value = "";
  companyInput.value = "";
  resetErrors();
}

function enterEditMode(id) {
  const found = contacts.find(c => c.id === id);
  if (!found) {
    setStatus("Contact not found in UI state.", "warn");
    return;
  }

  editId = id;
  formTitle.textContent = "Edit Contact";
  modeBadge.textContent = "EDIT";
  submitBtn.textContent = "Save";
  cancelEditBtn.classList.remove("hidden");

  fillForm(found);
  setStatus(`Editing contact #${id}.`, "info");
}

function exitEditMode() {
  editId = null;
  formTitle.textContent = "Add Contact";
  modeBadge.textContent = "CREATE";
  submitBtn.textContent = "Add";
  cancelEditBtn.classList.add("hidden");

  clearForm();
  setStatus("Back to create mode.", "info");
}

function clearUI() {
  contacts = [];
  exitEditMode();
  render();
  setStatus("Cleared UI state.", "ok");
}

function normalizeForSearch(c) {
  const companyName = c.company?.name || c.company || "";
  return `${c.name} ${c.email} ${c.phone} ${companyName}`.toLowerCase();
}

function getFilteredContacts() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return contacts;
  return contacts.filter(c => normalizeForSearch(c).includes(q));
}

// -------------------- RENDER --------------------
function render() {
  const filtered = getFilteredContacts();
  countBadge.textContent = String(filtered.length);

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="muted small">No contacts to show. Click "Load Contacts" or add one.</div>
    `;
    return;
  }

  listEl.innerHTML = filtered.map(c => {
    const company = c.company?.name || c.company || "—";
    return `
      <div class="item">
        <div class="meta">
          <div class="name">${escapeHtml(c.name)}</div>
          <div class="sub">
            <div><strong>Email:</strong> ${escapeHtml(c.email)}</div>
            <div><strong>Phone:</strong> ${escapeHtml(c.phone)}</div>
            <div><strong>Company:</strong> ${escapeHtml(company)}</div>
            <div class="muted small">ID: ${c.id}</div>
          </div>
        </div>

        <div class="buttons">
          <button class="icon-btn" data-action="edit" data-id="${c.id}">Edit</button>
          <button class="icon-btn danger" data-action="delete" data-id="${c.id}">Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// -------------------- API CALLS --------------------
async function loadContacts() {
  try {
    setLoading(true);
    setStatus("Loading contacts from API...", "info");

    const res = await fetch(USERS_ENDPOINT);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

 
    contacts = data.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      company: u.company 
    }));

    exitEditMode();
    render();
    setStatus(`Loaded ${contacts.length} contacts.`, "ok");
  } catch (err) {
    setStatus(`Failed to load: ${err.message}`, "error");
  } finally {
    setLoading(false);
  }
}

async function createContact(payload) {
  const res = await fetch(USERS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function updateContact(id, payload) {
  const res = await fetch(`${USERS_ENDPOINT}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function deleteContactApi(id) {
  const res = await fetch(`${USERS_ENDPOINT}/${id}`, {
    method: "DELETE"
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
}

// -------------------- CRUD HANDLERS --------------------
async function onSubmitForm(e) {
  e.preventDefault();

  const formData = getFormData();
  const ok = validateForm(formData);
  if (!ok) {
    setStatus("Fix validation errors.", "warn");
    return;
  }

  
  const payload = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    company: { name: formData.company || "—" }
  };

  try {
    setLoading(true);

    if (editId === null) {
      setStatus("Creating contact (POST)...", "info");

      const created = await createContact(payload);


      const nextId = Number(created.id) || (Math.max(0, ...contacts.map(c => c.id)) + 1);

      contacts.unshift({
        id: nextId,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        company: payload.company
      });

      clearForm();
      render();
      setStatus(`Created (simulated) contact #${nextId}.`, "ok");
    } else {
      const id = editId;
      setStatus(`Updating contact #${id} (PUT)...`, "info");

      await updateContact(id, payload);

    
      contacts = contacts.map(c =>
        c.id === id
          ? { ...c, name: payload.name, email: payload.email, phone: payload.phone, company: payload.company }
          : c
      );

      exitEditMode();
      render();
      setStatus(`Updated (simulated) contact #${id}.`, "ok");
    }
  } catch (err) {
    setStatus(`Save failed: ${err.message}`, "error");
  } finally {
    setLoading(false);
  }
}

async function deleteContact(id) {
  const found = contacts.find(c => c.id === id);
  if (!found) return;

  const ok = confirm(`Delete "${found.name}" (ID: ${id})?`);
  if (!ok) return;

  try {
    setLoading(true);
    setStatus(`Deleting contact #${id} (DELETE)...`, "info");

    await deleteContactApi(id);

   
    contacts = contacts.filter(c => c.id !== id);

   
    if (editId === id) exitEditMode();

    render();
    setStatus(`Deleted (simulated) contact #${id}.`, "ok");
  } catch (err) {
    setStatus(`Delete failed: ${err.message}`, "error");
  } finally {
    setLoading(false);
  }
}


render();

