/* ==================== ОБЩИЕ ПЕРЕМЕННЫЕ ==================== */
const preloader = document.getElementById('preloader');
const navbar = document.getElementById('navbar');
const themeSwitch = document.getElementById('theme-checkbox');
const navLinks = document.getElementById('nav-links');
const overlay = document.getElementById('menu-overlay');
const backToTopBtn = document.getElementById('back-to-top');

/* ==================== ПРЕЛОАДЕР ==================== */
window.addEventListener('load', () => {
  preloader.classList.add('hide');
  setTimeout(() => preloader.remove(), 1000);
});

/* ==================== ПЛАВНАЯ ПРОКРУТКА ==================== */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
      }
    });
  });
}

/* ==================== АНИМАЦИИ ПРИ СКРОЛЛЕ ==================== */
function handleScrollAnimations() {
  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight / 1.3) {
      el.classList.add('animated');
    }
  });
}

function handleNavbarScroll() {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
}

/* ==================== ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ ==================== */
function setupThemeSwitcher() {
  const savedTheme = localStorage.getItem('theme');

  // По умолчанию — светлая тема, если нет сохранённой
  if (savedTheme === 'dark' || !savedTheme) {
    // если в хранилище «dark» — оставляем тёмную
    document.documentElement.removeAttribute('data-theme');
    themeSwitch.checked = false;
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    themeSwitch.checked = true;      // переключатель в положении «светло»
  }

  themeSwitch.addEventListener('change', function () {
    if (this.checked) {
      // Включили светлую
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    } else {
      // Включили тёмную
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
    }
  });
}


/* ==================== ПЕРЕКЛЮЧЕНИЕ РАЗДЕЛОВ ==================== */
function setupAdminSections() {
  const links = document.querySelectorAll('.admin-nav-link');
  const sections = document.querySelectorAll('.admin-section');

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.dataset.section;
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      sections.forEach(s => s.classList.remove('active'));
      document.getElementById(target).classList.add('active');
    });
  });
}

/* ==================== КНОПКА "НАВЕРХ" ==================== */
function setupBackToTop() {
  window.addEventListener('scroll', () => {
    backToTopBtn.classList.toggle('visible', window.pageYOffset > 300);
  });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function renderCategoryFilters() {
  fetch('/categories')
    .then(res => res.json())
    .then(categories => {
      const container = document.getElementById('categoriesFilter');
      container.innerHTML = '';

      // Оставляем только категории со статусом published
      const publishedCategories = categories.filter(cat => cat.status === 'published');

      // Если нет категорий — ничего не делаем
      if (publishedCategories.length === 0) return;

      // Создаём кнопки по категориям
      publishedCategories.forEach((cat, index) => {
        const btn = document.createElement('button');
        btn.className = 'cat-btn';
        btn.dataset.cat = cat.title;
        btn.textContent = cat.title;

        // Первая кнопка — активная по умолчанию
        if (index === 0) {
          btn.classList.add('active');
          renderMaterials(cat.title); // Сразу отрисовать материалы этой категории
        }

        container.appendChild(btn);
      });

      // Навешиваем обработчики на все кнопки после создания
      setupCategoryFilter();
    })
    .catch(err => console.error('Ошибка загрузки категорий:', err));
}

window.addEventListener('DOMContentLoaded', () => {
  renderCategoryFilters();
});




// ==================== МАГАЗИН: ЗАГРУЗКА И ФИЛЬТРАЦИЯ ПО КАТЕГОРИЯМ ====================

// Хранит все материалы после загрузки
let materialsData = [];

// Инициализация: загрузить данные и подключить фильтрацию
document.addEventListener('DOMContentLoaded', async () => {
  await loadMaterials();
  setupCategoryFilter(); // поиск убран
});

// 1) Загрузка материалов с сервера
async function loadMaterials() {
  try {
    const res = await fetch('/materials_magaz');
    materialsData = await res.json();

    // Активируем первую категорию по умолчанию
    const firstBtn = document.querySelector('.cat-btn');
    if (firstBtn) {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      firstBtn.classList.add('active');
      renderMaterials(firstBtn.dataset.cat);
    }

  } catch (err) {
    console.error('Ошибка загрузки материалов:', err);
  }
}

// 2) Отрисовка карточек только по категории
function renderMaterials(category) {
  const container = document.getElementById('materialsContainer');
  const noResults = document.getElementById('noResults');
  container.innerHTML = '';

  const filtered = materialsData.filter(m =>
    category === 'all' || m.category === category
  );

  if (filtered.length === 0) {
    noResults.style.display = '';
  } else {
    noResults.style.display = 'none';
    filtered.forEach(m => {
      // 1) Создаём ссылку
      const link = document.createElement('a');
      link.href = `#contacts`;         // якорь на секцию
      link.className = 'material-card animate-on-scroll';
      link.style.textDecoration = 'none';     // убрать подчеркивание
      link.style.color = 'inherit';           // сохранить цвет текста

      // 2) Внутри ссылки формируем HTML карточки
      link.innerHTML = `
        <div class="card-img">
          <img src="/uploads/${m.image}" alt="${m.title}">
        </div>
        <div class="card-content">
          <h3 class="item-title">${m.title}</h3>
          <p>${m.content}</p>
        </div>
      `;

      // 3) Вставляем ссылку в контейнер
      container.appendChild(link);
    });
  }
}


// 3) Фильтрация по кнопкам категорий
function setupCategoryFilter() {
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // переключаем активную кнопку
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // прокручиваем вниз для анимации (если нужно)
      window.scrollBy({ top: 1, behavior: 'smooth' });

      // отрисовываем с новым фильтром
      renderMaterials(btn.dataset.cat);
    });
  });
}


/* ==================== ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ ==================== */
function setupGallery() {
  // Собираем все элементы и src картинок
  const items = Array.from(document.querySelectorAll('.gallery-item'));
  const images = items.map(it => it.querySelector('img').src);

  // Создаём один раз lightbox элементы (повторное использование)
  let overlay = document.querySelector('.gallery-lightbox-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'gallery-lightbox-overlay';
    overlay.innerHTML = `
      <div class="gallery-lightbox-close" aria-label="Закрыть" title="Закрыть">
        <!-- X -->
        <svg viewBox="0 0 24 24"><path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 1 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/></svg>
      </div>
      <div class="gallery-lightbox-panel" role="dialog" aria-modal="true">
        <img class="gallery-lightbox-img" src="" alt="">
      </div>
      <div class="gallery-lightbox-nav gallery-lightbox-prev" aria-label="Предыдущее" title="Предыдущее">
        <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
      </div>
      <div class="gallery-lightbox-nav gallery-lightbox-next" aria-label="Следующее" title="Следующее">
        <svg viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const panel = overlay.querySelector('.gallery-lightbox-panel');
  const imgEl = overlay.querySelector('.gallery-lightbox-img');
  const btnPrev = overlay.querySelector('.gallery-lightbox-prev');
  const btnNext = overlay.querySelector('.gallery-lightbox-next');
  const btnClose = overlay.querySelector('.gallery-lightbox-close');

  let currentIndex = 0;

  function showAt(index) {
    if (index < 0) index = images.length - 1;
    if (index >= images.length) index = 0;
    currentIndex = index;
    imgEl.src = images[currentIndex];
    imgEl.alt = items[currentIndex].querySelector('img').alt || `Image ${currentIndex + 1}`;
    // Открыть оверлей (класс open триггерит анимацию)
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden'; // запрет прокрутки страницы
    // фокус на закрытие для доступности
    btnClose.focus();
  }

  function closeLightbox() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function prev() { showAt(currentIndex - 1); }
  function next() { showAt(currentIndex + 1); }

  // Навешиваем клики на миниатюры
  items.forEach((item, idx) => {
    // если галерея динамически перестраивается, можно обновлять images и items извне
    item.addEventListener('click', () => showAt(idx));
  });

  // События управления
  btnPrev.onclick = (e) => { e.stopPropagation(); prev(); };
  btnNext.onclick = (e) => { e.stopPropagation(); next(); };
  btnClose.onclick = (e) => { e.stopPropagation(); closeLightbox(); };

  // Клик по overlay вне панели — закрыть
  overlay.addEventListener('click', (e) => {
    // если клик не внутри панели и не на навигации — закрываем
    if (!panel.contains(e.target) &&
      !btnPrev.contains(e.target) &&
      !btnNext.contains(e.target) &&
      !btnClose.contains(e.target)) {
      closeLightbox();
    }
  });

  // Клавиши ← → и Esc
  function onKey(e) {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'ArrowLeft') { prev(); }
    else if (e.key === 'ArrowRight') { next(); }
    else if (e.key === 'Escape') { closeLightbox(); }
  }
  window.addEventListener('keydown', onKey);

  // очистка при необходимости — возвращаем слушатели, если будете ломать/пересоздавать галерею
  // (в простом варианте не используем)
}

async function loadGallery() {
  const res = await fetch('/gallery');
  const items = await res.json();
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';

  items.reverse().forEach(i => {
    const div = document.createElement('div');
    div.className = 'gallery-item animate-on-scroll';
    div.innerHTML = `
            <img src="/uploads/${i.filename}" alt="${i.title}">
            <div class="overlay"><i class="fas fa-search-plus fa-3x"></i></div>
        `;
    grid.appendChild(div);
  });

  setupGallery();
  handleScrollAnimations();
}

/* ==================== ЗАГРУЗКА ГЛАВНОЙ СТРАНИЦЫ ==================== */
async function loadMain() {
  const res = await fetch('/main');
  const items = await res.json();
  const cfg = items[0];

  // название
  document.getElementById('heroSitename').textContent = cfg.sitename;

  // название
  const rawName = cfg.sitename || '';
  let displayName;

  // 1) если есть пробелы, оборачиваем последнее слово
  if (rawName.includes(' ')) {
    const parts = rawName.split(' ');
    const last = parts.pop();
    const prefix = parts.join(' ');
    displayName = `${prefix} <span>${last}</span>`;
  } else {
    // 2) иначе ищем границу строчная→заглавная
    const match = rawName.match(/^(.+?)([A-Z].+)$/);
    if (match) {
      displayName = `${match[1]}<span>${match[2]}</span>`;
    } else {
      // если не нашли границу — просто оборачиваем всё
      displayName = `<span>${rawName}</span>`;
    }
  }

  // и вставляем в элемент через innerHTML
  document.getElementById('heroSitename2').innerHTML = displayName;


  // footer
  document.getElementById('heroSitename3').textContent = cfg.sitename;

  // текст
  document.getElementById('heroDesc').textContent = cfg.description;

  // заголовок: оборачиваем последн. слово в <span>
  document.getElementById('heroTitle').innerHTML = cfg.slogan;

  // картинка
  const container = document.getElementById('homeImage');
  container.innerHTML = '';
  if (cfg.image) {
    const img = document.createElement('img');
    img.src = cfg.image;
    img.alt = 'Hero';
    container.appendChild(img);
  }
}





/* ==================== ИНИЦИАЛИЗАЦИЯ ==================== */
function init() {
  setupSmoothScroll();
  setupThemeSwitcher();
  setupAdminSections();
  setupBackToTop();

  Promise.all([
    loadGallery(),
    loadMaterials(),
    loadMain()
  ])

  window.addEventListener('scroll', () => {
    handleScrollAnimations();
    handleNavbarScroll();
  });
  handleScrollAnimations();
}

document.addEventListener('DOMContentLoaded', loadMain);
init();