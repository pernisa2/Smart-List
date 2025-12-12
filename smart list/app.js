const STORAGE_KEY = "lista-smart:v1";

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const tagInput = document.getElementById("tagInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const counter = document.getElementById("counter");
const clearDoneBtn = document.getElementById("clearDoneBtn");

const modal = document.getElementById("modal");
const editText = document.getElementById("editText");
const editTag = document.getElementById("editTag");
const saveEdit = document.getElementById("saveEdit");
const cancelEdit = document.getElementById("cancelEdit");
const closeModal = document.getElementById("closeModal");

let tasks = load();
let filter = "all";
let editingId = null;

const filterBtns = [...document.querySelectorAll(".chip")];
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    render();
  });
});

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = taskInput.value.trim();
  const tag = tagInput.value.trim();

  if (!text) return;

  tasks.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    text,
    tag,
    done: false,
    createdAt: Date.now(),
  });

  save();
  taskForm.reset();
  taskInput.focus();
  render();
});

clearDoneBtn.addEventListener("click", () => {
  const before = tasks.length;
  tasks = tasks.filter(t => !t.done);
  if (tasks.length !== before) {
    save();
    render();
  }
});

function toggleDone(id){
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  save();
  render();
}

function removeTask(id){
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
}

function openEdit(id){
  const t = tasks.find(x => x.id === id);
  if (!t) return;

  editingId = id;
  editText.value = t.text;
  editTag.value = t.tag || "";
  showModal(true);

  // foco bom no iPhone
  setTimeout(() => editText.focus(), 60);
}

function confirmEdit(){
  if (!editingId) return;
  const t = tasks.find(x => x.id === editingId);
  if (!t) return;

  const newText = editText.value.trim();
  const newTag = editTag.value.trim();

  if (!newText) return;

  t.text = newText;
  t.tag = newTag;

  editingId = null;
  save();
  render();
  showModal(false);
}

saveEdit.addEventListener("click", confirmEdit);
cancelEdit.addEventListener("click", () => { editingId = null; showModal(false); });
closeModal.addEventListener("click", () => { editingId = null; showModal(false); });

document.addEventListener("keydown", (e) => {
  if (modal.getAttribute("aria-hidden") === "false") {
    if (e.key === "Escape") { editingId = null; showModal(false); }
    if (e.key === "Enter") { confirmEdit(); }
  }
});

function showModal(open){
  modal.setAttribute("aria-hidden", open ? "false" : "true");
}

function getFiltered(){
  if (filter === "open") return tasks.filter(t => !t.done);
  if (filter === "done") return tasks.filter(t => t.done);
  return tasks;
}

function render(){
  const items = getFiltered();

  taskList.innerHTML = "";
  emptyState.style.display = tasks.length ? "none" : "block";

  const openCount = tasks.filter(t => !t.done).length;
  counter.textContent = `${openCount} pendentes`;

  items.forEach(t => {
    const li = document.createElement("li");
    li.className = `item ${t.done ? "done" : ""}`;

    li.innerHTML = `
      <div class="check ${t.done ? "done" : ""}" role="button" aria-label="Marcar como feito">
        <span>${t.done ? "✓" : ""}</span>
      </div>

      <div class="texts">
        <div class="title">${escapeHtml(t.text)}</div>
        <div class="meta">
          ${t.tag ? `<span class="tag">${escapeHtml(t.tag)}</span>` : ""}
          <span>${formatDate(t.createdAt)}</span>
        </div>
      </div>

      <div class="actions">
        <button class="iconBtn" title="Editar" aria-label="Editar">✏️</button>
        <button class="iconBtn danger" title="Excluir" aria-label="Excluir">🗑️</button>
      </div>
    `;

    const check = li.querySelector(".check");
    const editBtn = li.querySelectorAll(".iconBtn")[0];
    const delBtn = li.querySelectorAll(".iconBtn")[1];

    check.addEventListener("click", () => toggleDone(t.id));
    editBtn.addEventListener("click", () => openEdit(t.id));
    delBtn.addEventListener("click", () => removeTask(t.id));

    taskList.appendChild(li);
  });
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch{
    return [];
  }
}

function formatDate(ts){
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" });
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* PWA: registrar Service Worker */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

render();
