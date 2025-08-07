/* ==================== ОБЩИЕ ПЕРЕМЕННЫЕ ==================== */
const preloader        = document.getElementById('preloader');
const navbar          = document.getElementById('navbar');
const themeSwitch     = document.getElementById('theme-checkbox');
const navLinks        = document.getElementById('nav-links');
const overlay         = document.getElementById('menu-overlay');
const backToTopBtn    = document.getElementById('back-to-top');

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

  themeSwitch.addEventListener('change', function() {
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
  const links    = document.querySelectorAll('.admin-nav-link');
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
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const imgSrc = item.querySelector('img').src;
            const modalOverlay = document.createElement('div');
            modalOverlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.9); display: flex; align-items: center;
                justify-content: center; z-index: 2000; cursor: zoom-out;
            `;
            const img = document.createElement('img');
            img.src = imgSrc;
            img.style.cssText = `
                max-width: 90%; max-height: 90%; border-radius: 10px;
                box-shadow: 0 0 30px rgba(219, 186, 20, 0.6);
            `;
            modalOverlay.appendChild(img);
            document.body.appendChild(modalOverlay);
            modalOverlay.addEventListener('click', () => modalOverlay.remove());
        });
    });
}

async function loadGallery() {
    const res   = await fetch('/gallery');
    const items = await res.json();
    const grid  = document.getElementById('galleryGrid');
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
  const res    = await fetch('/main');
  const items  = await res.json();
  const cfg    = items[0];
  
  // название
  document.getElementById('heroSitename').textContent = cfg.sitename;

  // название
  const rawName = cfg.sitename || ''; 
  let displayName;

  // 1) если есть пробелы, оборачиваем последнее слово
  if (rawName.includes(' ')) {
    const parts = rawName.split(' ');
    const last  = parts.pop();
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