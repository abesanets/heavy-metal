// ——————————————————————
// Форматирование даты dd.mm.yyyy
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function renderColoredStatus(status) {
  const map = {
    published: { label: 'Опубликован', color: 'green' },
    draft: { label: 'Скрыт', color: 'orange' },
    incomplete: { label: 'Нецелой', color: 'gray' }
  };

  const info = map[status] || { label: status, color: 'red' };

  return `<span style="color: ${info.color}; font-weight: bold;">${info.label}</span>`;
}


// ——————————————————————
// Универсальный загрузчик файлов
function setupFileUpload({ uploadEl, inputEl, textEl, btnEl }) {
  btnEl.addEventListener('click', () => inputEl.click());

  inputEl.addEventListener('change', () => {
    if (inputEl.files.length) {
      textEl.textContent = inputEl.files[0].name;
      uploadEl.classList.add('has-file');
    }
  });

  ['dragenter', 'dragover'].forEach(evt =>
    uploadEl.addEventListener(evt, e => {
      e.preventDefault();
      uploadEl.classList.add('drag-over');
    })
  );

  ['dragleave', 'drop'].forEach(evt =>
    uploadEl.addEventListener(evt, e => {
      e.preventDefault();
      uploadEl.classList.remove('drag-over');
    })
  );

  uploadEl.addEventListener('drop', e => {
    if (!e.dataTransfer.files.length) return;
    inputEl.files = e.dataTransfer.files;
    textEl.textContent = e.dataTransfer.files[0].name;
    uploadEl.classList.add('has-file');
  });

  uploadEl.addEventListener('click', e => {
    if ([uploadEl, textEl].includes(e.target) || e.target.tagName === 'I') {
      inputEl.click();
    }
  });
}

// ——————————————————————
// Загрузка и заполнение настроек
async function loadSettings() {
  const res = await fetch('/main');
  const [cfg = {}] = await res.json();

  document.getElementById('sitename').value = cfg.sitename || '';
  document.getElementById('description').value = cfg.description || '';
  document.getElementById('slogan').value = cfg.slogan || '';

  const currInput = document.getElementById('currentImage');
  const txt = document.getElementById('homeUploadText');
  currInput.value = cfg.image || '';
  if (cfg.image) txt.textContent = cfg.image.split('/').pop();
}

// ——————————————————————
// Загрузка и рендер категорий
const form = document.getElementById('categoryForm');
const catIdInput = document.getElementById('catId');
const catTitleInput = document.getElementById('catTitle');
const catStatusCheckbox = document.getElementById('catStatus');
const catStatusLabel = document.getElementById('catStatusLabel');
const catSubmitBtn = document.getElementById('catSubmitBtn');
const catCancelBtn = document.getElementById('catCancelEditBtn');
const catFormTitle = document.getElementById('catFormModeTitle');
const categoriesTable = document.getElementById('categoriesTable');

let categories = [];

// Обновляем лейбл переключателя статуса
function updateCatStatusLabel() {
  if (catStatusCheckbox.checked) {
    catStatusLabel.textContent = 'Опубликовано';
    catStatusLabel.style.color = '#4caf50';
  } else {
    catStatusLabel.textContent = 'Скрыто';
    catStatusLabel.style.color = '#ffc107';
  }
}
catStatusCheckbox.addEventListener('change', updateCatStatusLabel);
updateCatStatusLabel();

// Загрузка и рендер категорий в таблицу
async function loadCategories() {
  try {
    const res = await fetch('/categories');
    categories = await res.json();
    renderCategoriesTable();
  } catch (e) {
    console.error('Ошибка загрузки категорий:', e);
  }
}

function renderCategoriesTable() {
  categoriesTable.innerHTML = '';
  categories.forEach(cat => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${cat.title}</td>
      <td>${cat.status === 'published' ? '<span style="color: green; font-weight:bold;">Опубликовано</span>' : '<span style="color: orange; font-weight:bold;">Скрыто</span>'}</td>
      <td class="table-actions">
        <button class="table-btn edit" data-id="${cat.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="table-btn delete" data-id="${cat.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    categoriesTable.appendChild(tr);
  });

  // Навешиваем события
  categoriesTable.querySelectorAll('.table-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = categories.find(c => c.id == btn.dataset.id);
      startEditCategory(cat);
    });
  });

  categoriesTable.querySelectorAll('.table-btn.delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Удалить категорию?')) return;
      const id = btn.dataset.id;
      try {
        const res = await fetch('/categories/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) {
          alert('Категория удалена');
          await loadCategories();
          resetForm();
        } else {
          alert(data.message || 'Ошибка удаления');
        }
      } catch (e) {
        alert('Ошибка сервера');
        console.error(e);
      }
    });
  });
}

function startEditCategory(cat) {
  catIdInput.value = cat.id;
  catTitleInput.value = cat.title;
  catStatusCheckbox.checked = cat.status === 'published';
  updateCatStatusLabel();

  catFormTitle.textContent = 'Редактирование категории';
  catSubmitBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить';
  catCancelBtn.style.display = 'inline-block';

  window.scrollTo({ top: form.offsetTop, behavior: 'smooth' });
}

function resetForm() {
  catIdInput.value = '';
  catTitleInput.value = '';
  catStatusCheckbox.checked = true;
  updateCatStatusLabel();

  catFormTitle.textContent = 'Добавление категории';
  catSubmitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Добавить категорию';
  catCancelBtn.style.display = 'none';
}

catCancelBtn.addEventListener('click', resetForm);

form.addEventListener('submit', async e => {
  e.preventDefault();

  const id = catIdInput.value.trim();
  const title = catTitleInput.value.trim();
  const status = catStatusCheckbox.checked ? 'published' : 'draft';

  if (!title) {
    alert('Введите название категории');
    return;
  }

  try {
    let url = '/categories';
    let method = 'POST';
    let body = { title, status };

    if (id) {
      url = '/categories/update';
      method = 'POST';
      body.id = id;
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.success) {
      alert(id ? 'Категория обновлена' : 'Категория добавлена');
      resetForm();
      await loadCategories();
    } else {
      alert(data.message || 'Ошибка сервера');
    }
  } catch (e) {
    alert('Ошибка сервера');
    console.error(e);
  }
});

// Загрузка категорий при старте
window.addEventListener('DOMContentLoaded', () => {
  loadCategories();
});



// ——————————————————————
// Загрузка и рендер материалов
function populateCategories() {
  fetch('/categories')
    .then(res => res.json())
    .then(categories => {
      const select = document.getElementById('matCategory');
      select.innerHTML = '<option value="">Выберите категорию</option>';
      categories.forEach(cat => {
        // cat — это объект, берем только title
        const opt = document.createElement('option');
        opt.value = cat.title;     // берем title как значение
        opt.textContent = cat.title; // и как текст
        select.appendChild(opt);
      });
    })
    .catch(err => {
      console.error('Ошибка загрузки категорий:', err);
    });
}




async function loadAdminMaterials() {
  const res = await fetch('/materials');
  const items = await res.json();
  const tbody = document.getElementById('materialsTable');
  tbody.innerHTML = '';

  items.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m.category || '-'}</td>
      <td>${m.title}</td>
      <td>${formatDate(m.date)}</td>
      <td>${renderColoredStatus(m.status)}</td>
      <td class="table-actions">
        <button class="table-btn edit" data-id="${m.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="table-btn delete" data-id="${m.id}" data-image="${m.image}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.table-btn.delete').forEach(btn =>
    btn.addEventListener('click', async () => {
      if (!confirm('Удалить товар?')) return;
      await fetch('/materials/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: btn.dataset.id,
          image: btn.dataset.image
        })
      });
      resetForm2();
      loadAdminMaterials();
    })
  );

  tbody.querySelectorAll('.table-btn.edit').forEach(btn =>
    btn.addEventListener('click', () => {
      const material = items.find(x => x.id == btn.dataset.id);
      startEditMode(material);
    })
  );
}

// ——————————————————————
// Логика формы материалов
const form2 = document.getElementById('materialForm');
const cancelBtn2 = document.getElementById('cancelEditBtn');

form2.addEventListener('submit', handleForm2Submit);
cancelBtn2.addEventListener('click', resetForm2);

function startEditMode(m) {
  window.scrollTo({ top: document.getElementById('materials').offsetTop, behavior: 'smooth' });

  document.getElementById('formModeTitle').textContent = 'Редактирование товара';
  document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Сохранить';
  cancelBtn2.style.display = 'inline-block';

  document.getElementById('matId').value = m.id;
  document.getElementById('matCategory').value = m.category;
  document.getElementById('matTitle').value = m.title;
  document.getElementById('matContent').value = m.content;
  document.getElementById('matStatus').checked = m.status === 'published';
  updateStatusLabel(); // 🟢 добавь это сюда

  document.getElementById('matUploadText').textContent = m.image || 'Перетащите изображение или нажмите';
}

async function handleForm2Submit(e) {
  e.preventDefault();
  const formData = new FormData(form2);
  const isPublished = document.getElementById('matStatus').checked;
  const isEdit = !!document.getElementById('matId').value;

  formData.append('status', isPublished ? 'published' : 'draft');

  const url = isEdit ? '/materials/update' : '/materials';
  const res = await fetch(url, { method: 'POST', body: formData });
  const result = await res.json();

  if (!result.success) return alert('Ошибка при сохранении');
  alert(isEdit ? 'Изменения сохранены' : 'Товар добавлен');
  resetForm2();
  loadAdminMaterials();
}

function resetForm2() {
  form2.reset();
  document.getElementById('matId').value = '';
  document.getElementById('matStatus').checked = true;
  document.getElementById('formModeTitle').textContent = 'Добавление товара';
  document.getElementById('submitBtn').innerHTML = '<i class="fas fa-plus-circle"></i> Добавить товар';
  cancelBtn2.style.display = 'none';
  document.getElementById('matUploadText').textContent = 'Перетащите изображение или нажмите';
}
const checkbox = document.getElementById("matStatus");
const label = document.getElementById("statusLabel");

// ——————————————————————
// Обработка настроек (форма)
document.getElementById('settingsForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  try {
    const response = await fetch('/admin/save-settings', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Ошибка при отправке данных');
    const result = await response.json();
    alert('Настройки успешно сохранены!');
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Произошла ошибка при сохранении настроек.');
  }
});

// ——————————————————————
// Загрузка и рендер галереи
async function loadAdminGallery() {
  const res = await fetch('/gallery');
  const items = await res.json();
  const tbody = document.getElementById('galleryTable');
  tbody.innerHTML = '';

  items.reverse().forEach(i => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="/uploads/${i.filename}" class="table-img"></td>
      <td>${i.title}</td>
      <td>${formatDate(i.date)}</td>
      <td class="table-actions">
        <button class="table-btn delete" data-filename="${i.filename}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.table-btn.delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Удалить это изображение?')) return;
      await fetch('/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: btn.dataset.filename })
      });
      loadAdminGallery();
    });
  });
}

document.getElementById('uploadForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const data = new FormData(e.target);
  const res = await fetch('/upload', { method: 'POST', body: data });
  const result = await res.json();
  if (result.success) {
    e.target.reset();
    document.getElementById('uploadText').textContent = 'Перетащите изображение или нажмите';
    loadAdminGallery();
    alert('Изображение загружено');
  } else {
    alert('Ошибка при загрузке');
  }
});


// ——————————————————————
// Форма смены пароля
document.getElementById('changePassForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const oldPass = document.getElementById('oldPass').value;
  const newPass = document.getElementById('newPass').value;
  const passKey = document.getElementById('passKey').value;

  const res = await fetch('/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPass, newPass, passKey })
  });

  const json = await res.json();
  alert(json.message);
});

// ——————————————————————
// Счётчики
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

Promise.all([
  fetch('/materials').then(r => r.json())
]).then(([materials]) => {
  document.getElementById('count-materials').textContent = materials.length;
  document.getElementById('count-visitors').textContent = rand(1000, 10000).toLocaleString();
}).catch(console.error);

// ——————————————————————
// Навигация и анимации
document.querySelectorAll('.admin-nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    link.classList.add('active');
    document.getElementById(link.dataset.section).classList.add('active');
  });
});

document.querySelectorAll('.stat-card, .form-btn').forEach(el => {
  el.addEventListener('mouseenter', () => el.style.transform = 'translateY(-5px)');
  el.addEventListener('mouseleave', () => el.style.transform = 'translateY(0)');
});

// ——————————————————————
// Выход
document.querySelector('.admin-logout')?.addEventListener('click', () => {
  if (confirm('Вы действительно хотите выйти из админ‑панели?')) {
    window.location.href = 'index.html';
  }
});

function updateStatusLabel() {
  const checkbox = document.getElementById("matStatus");
  const label = document.getElementById("statusLabel");

  if (!checkbox || !label) return;
  if (checkbox.checked) {
    label.textContent = "Опубликовано";
    label.style.color = "#4caf50";
  } else {
    label.textContent = "Скрыто";
    label.style.color = "#ffc107";
  }
}


// ——————————————————————
// Инициализация при загрузке DOM
window.addEventListener('DOMContentLoaded', () => {
  // Аплоадеры
  setupFileUpload({
    uploadEl: document.getElementById('matFileUpload'),
    inputEl: document.getElementById('matImage'),
    textEl: document.getElementById('matUploadText'),
    btnEl: document.getElementById('matFileBtn'),
  });

  setupFileUpload({
    uploadEl: document.getElementById('fileUpload'),
    inputEl: document.getElementById('imgFile'),
    textEl: document.getElementById('uploadText'),
    btnEl: document.getElementById('fileBtn'),
  });

  setupFileUpload({
    uploadEl: document.getElementById('homeFileUpload'),
    inputEl: document.getElementById('homeImage'),
    textEl: document.getElementById('homeUploadText'),
    btnEl: document.getElementById('homeFileBtn'),
  });

  // Данные
  loadSettings();
  loadAdminGallery();
  loadAdminMaterials();
  populateCategories();

  checkbox?.addEventListener("change", updateStatusLabel);
  updateStatusLabel(); // первый запуск

});
