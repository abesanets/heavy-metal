const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

/* ==================== КОНФИГУРАЦИЯ ПУТЕЙ ==================== */
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
const UPLOAD_DIR2 = path.join(__dirname, 'uploads2');
const MATERIALS_JSON = path.join(__dirname, 'data', 'materials.json');
const GALLERY_JSON = path.join(__dirname, 'data', 'gallery.json');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const CONFIRMATION_KEY = '791f136fdc926e810edd1b6643a9f3cb3029c9af726fbeed657a7fc9714168db';

/* ==================== НАСТРОЙКА MULTER ==================== */
const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});

const mainStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR2),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const uploadGallery = multer({ storage: galleryStorage });
const uploadMaterial = multer({ storage: galleryStorage });
const uploadMain = multer({ storage: mainStorage });

/* ==================== СЕРВЕРНАЯ КОНФИГУРАЦИЯ ==================== */
function readConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }
  // дефолтный объект
  return {
    sitename: '',
    description: '',
    slogan: '',
    image: '',
    password: 'admin123'
  };
}

function writeConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

// Считываем конфиг, включая пароль
const initialConfig = readConfig();
let CORRECT_PASSWORD = initialConfig.password || 'admin123';


// Создаем необходимые директории
[UPLOAD_DIR, UPLOAD_DIR2].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/* ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==================== */
function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function readConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }
  return {
    sitename: '',
    description: '',
    slogan: '',
    image: ''
  };
}

function writeConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

/* ==================== MIDDLEWARE ==================== */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: 'YOUR_SECRET_KEY',
  resave: false,
  saveUninitialized: true
}));

// Защита админки
app.use((req, res, next) => {
  if (req.path === '/admin.html' && !req.session.auth) {
    return res.redirect('/login.html');
  }
  next();
});

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads2', express.static(UPLOAD_DIR2));

/* ==================== АУТЕНТИФИКАЦИЯ ==================== */
app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === CORRECT_PASSWORD) {
    req.session.auth = true;
    return res.json({ success: true, message: 'Авторизация прошла успешно' });
  }
  setTimeout(() => {
    res.json({ success: false, message: 'Неверный пароль. Попробуйте ещё раз.' });
  }, 1500);
});

app.post('/change-password', (req, res) => {
  const { oldPass, newPass, passKey } = req.body;
  if (!req.session.auth) {
    return res.status(401).json({ success: false, message: 'Не авторизованы' });
  }
  if (passKey !== CONFIRMATION_KEY) {
    return res.status(403).json({ success: false, message: 'Неверный ключ подтверждения' });
  }
  if (oldPass !== CORRECT_PASSWORD) {
    return res.status(400).json({ success: false, message: 'Текущий пароль введён неверно' });
  }

  // обновляем переменную
  CORRECT_PASSWORD = newPass;

  // перезаписываем в config.json
  const cfg = readConfig();
  cfg.password = newPass;
  writeConfig(cfg);

  return res.json({ success: true, message: 'Пароль успешно изменён!' });
});


app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Session destroy error:', err);
    res.redirect('/login.html');
  });
});



/* ==================== КАТЕГОРИИ ==================== */
const CATEGORIES_JSON = path.join(__dirname, 'data', 'categories.json');

function readCategories() {
  if (!fs.existsSync(CATEGORIES_JSON)) return [];
  return JSON.parse(fs.readFileSync(CATEGORIES_JSON, 'utf8'));
}

function writeCategories(categories) {
  fs.writeFileSync(CATEGORIES_JSON, JSON.stringify(categories, null, 2), 'utf8');
}

app.get('/categories', (req, res) => {
  try {
    let categories = readCategories();
    categories.sort((a, b) => a.id - b.id);
    res.json(categories);
  } catch (err) {
    console.error('Ошибка чтения категорий:', err);
    res.status(500).json({ error: 'Ошибка сервера при загрузке категорий' });
  }
});

app.post('/categories', (req, res) => {
  const { title, status } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Название категории обязательно' });

  let categories = readCategories();

  if (categories.some(cat => cat.title.toLowerCase() === title.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Категория с таким названием уже существует' });
  }

  const newCategory = {
    id: Date.now(),
    title,
    status: status === 'published' ? 'published' : 'draft'
  };

  categories.push(newCategory);
  writeCategories(categories);
  res.json({ success: true, category: newCategory });
});

app.post('/categories/update', (req, res) => {
  const { id, title, status } = req.body;
  if (!id || !title) return res.status(400).json({ success: false, message: 'ID и название обязательны' });

  let categories = readCategories();
  const idx = categories.findIndex(c => String(c.id) === String(id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Категория не найдена' });

  if (categories.some((cat, i) => i !== idx && cat.title.toLowerCase() === title.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Категория с таким названием уже существует' });
  }

  const oldTitle = categories[idx].title; // <== Сохраняем старое название

  categories[idx].title = title;
  categories[idx].status = status === 'published' ? 'published' : 'draft';
  writeCategories(categories);

  // === Обновляем товары, если название категории изменилось ===
  if (oldTitle !== title) {
    const materials = readMaterials(); // Подключи эту функцию как readCategories()
    const updated = materials.map(m => {
      if (m.category === oldTitle) {
        m.category = title;
      }
      return m;
    });
    writeMaterials(updated); // Тоже должна быть как writeCategories()
  }

  res.json({ success: true, category: categories[idx] });
});


app.post('/categories/delete', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: 'ID обязателен' });

  let categories = readCategories();
  const newCategories = categories.filter(c => String(c.id) !== String(id));
  if (newCategories.length === categories.length) {
    return res.status(404).json({ success: false, message: 'Категория не найдена' });
  }

  writeCategories(newCategories);
  res.json({ success: true });
});


/* ==================== ГАЛЕРЕЯ ==================== */
app.get('/gallery', (req, res) => {
  const items = readJSON(GALLERY_JSON);
  res.json(items);
});

app.post('/upload', uploadGallery.single('image'), (req, res) => {
  const gallery = readJSON(GALLERY_JSON);
  gallery.push({
    filename: req.file.filename,
    title: req.body.title || '',
    date: new Date().toISOString()
  });
  writeJSON(GALLERY_JSON, gallery);
  res.json({ success: true });
});

app.post('/delete', (req, res) => {
  let gallery = readJSON(GALLERY_JSON).filter(i => i.filename !== req.body.filename);
  writeJSON(GALLERY_JSON, gallery);
  fs.unlink(path.join(UPLOAD_DIR, req.body.filename), () => res.json({ success: true }));
});

/* ==================== МАТЕРИАЛЫ ==================== */
/* ======= Server-side (Express) ======= */
// Получить все
app.get('/materials_magaz', (req, res) => {
  const materials = readJSON(MATERIALS_JSON);
  const categories = readJSON(path.join(__dirname, 'data', 'categories.json')); // путь к категориям

  // Список названий опубликованных категорий
  const publishedCategories = categories
    .filter(cat => cat.status === 'published')
    .map(cat => cat.title);

  // Фильтруем материалы по статусу и по категории (опубликованной)
  const filteredMaterials = materials.filter(m =>
    m.status === 'published' && publishedCategories.includes(m.category)
  );

  filteredMaterials.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(filteredMaterials);
});


app.get('/materials', (req, res) => {
  let materials = readJSON(MATERIALS_JSON);
  materials.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(materials);
});

// Создать
app.post('/materials', uploadMaterial.single('image'), (req, res) => {
  const materials = readJSON(MATERIALS_JSON);
  materials.push({
    id: Date.now(),
    title: req.body.title,
    category: req.body.category,
    content: req.body.content,
    image: req.file?.filename || '',
    date: new Date().toISOString(),
    status: req.body.status || 'draft'  // теперь учитывается статус из формы
  });
  writeJSON(MATERIALS_JSON, materials);
  res.json({ success: true });
});


// Обновить
function readMaterials() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'data/materials.json')));
}

function writeMaterials(data) {
  fs.writeFileSync(path.join(__dirname, 'data/materials.json'), JSON.stringify(data, null, 2));
}


app.post('/materials/update', uploadMaterial.single('image'), (req, res) => {
  const { id, title, content, category, status } = req.body;
  const materials = readJSON(MATERIALS_JSON);
  const idx = materials.findIndex(m => String(m.id) === String(id));
  if (idx === -1) {
    return res.json({ success: false });
  }

  // Если пришёл новый файл — удаляем старый
  if (req.file) {
    const oldImg = materials[idx].image;
    if (oldImg) fs.unlink(path.join(UPLOAD_DIR, oldImg), () => { });
    materials[idx].image = req.file.filename;
  }

  // Приводим статус к одному значению, даже если массив
  const cleanStatus = Array.isArray(status)
    ? (status.includes('published') ? 'published' : '')
    : (status || 'published');

  // Обновляем материал
  materials[idx] = {
    ...materials[idx],
    title,
    content,
    category,
    status: cleanStatus
  };

  writeJSON(MATERIALS_JSON, materials);
  res.json({ success: true });
});

// Удалить материал
app.post('/materials/delete', (req, res) => {
  const { id, image } = req.body;
  console.log('Удаляем материал', id);

  // Читаем, фильтруем, записываем файл
  let materials = readJSON(MATERIALS_JSON);
  const updated = materials.filter(m => String(m.id) !== String(id));
  writeJSON(MATERIALS_JSON, updated);

  // Удаляем изображение
  if (image) {
    fs.unlink(path.join(UPLOAD_DIR, image), err => {
      if (err) console.error('Ошибка при удалении изображения:', err);
    });
  }

  return res.json({ success: true });
});


// Удалить
app.post('/categories/delete', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: 'ID обязателен' });

  let categories = readCategories();
  const category = categories.find(c => String(c.id) === String(id));
  if (!category) return res.status(404).json({ success: false, message: 'Категория не найдена' });

  // Удаляем категорию
  categories = categories.filter(c => String(c.id) !== String(id));
  writeCategories(categories);

  // Удаляем все товары из этой категории
  let materials = readJSON(MATERIALS_JSON);
  const updatedMaterials = materials.filter(m => m.category !== category.title);

  // Удаление связанных изображений
  const removedItems = materials.filter(m => m.category === category.title);
  for (const item of removedItems) {
    if (item.image) fs.unlink(path.join(UPLOAD_DIR, item.image), () => { });
  }

  writeJSON(MATERIALS_JSON, updatedMaterials);

  res.json({ success: true, message: 'Категория и связанные товары удалены' });
});


/* ==================== ГЛАВНАЯ СТРАНИЦА ==================== */
app.get('/main', (req, res) => {
  const cfg = readConfig();
  res.json([cfg]);
});

app.post('/main', uploadMain.single('image'), (req, res) => {
  const { sitename, description, slogan, currentImage } = req.body;
  const cfg = {
    sitename,
    description,
    slogan,
    image: req.file ? '/uploads2/' + req.file.filename : currentImage
  };

  writeConfig(cfg);
  res.json({ message: 'Настройки сохранены' });
});

app.post('/admin/save-settings', uploadMain.single('image'), (req, res) => {
  try {
    const { sitename, description, slogan, currentImage } = req.body;
    const uploadedImage = req.file;

    const config = {
      sitename,
      description,
      slogan,
      image: uploadedImage ? '/uploads2/' + uploadedImage.filename : currentImage
    };

    writeConfig(config);
    res.json({ success: true }); // alert вызывается во фронтенде
  } catch (err) {
    console.error('Ошибка на сервере:', err);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});


// В самом верху файла
const fsPromises = require('fs/promises');

async function cleanupUploadsDir() {
  try {
    // создаём папку, если нет
    await fsPromises.mkdir(UPLOAD_DIR2, { recursive: true });

    // читаем её содержимое
    const files = await fsPromises.readdir(UPLOAD_DIR2);
    if (files.length <= 1) return; // нечего чистить

    // получаем информацию о каждом файле
    const stats = await Promise.all(files.map(async file => {
      const filepath = path.join(UPLOAD_DIR2, file);
      const stat = await fsPromises.stat(filepath);
      return { file, mtime: stat.mtime };
    }));

    // сортируем по времени модификации, старые — в начало
    stats.sort((a, b) => a.mtime - b.mtime);

    // удаляем все, кроме самого нового (последнего в массиве)
    const toDelete = stats.slice(0, stats.length - 1);
    await Promise.all(toDelete.map(({ file }) =>
      fsPromises.unlink(path.join(UPLOAD_DIR2, file))
    ));

    console.log(`🧹 Удалено ${toDelete.length} старых файла(ов), оставлен: ${stats[stats.length - 1].file}`);
  } catch (err) {
    console.error('Ошибка при очистке uploads2:', err);
  }
}

// Запускаем один раз при старте сервера
cleanupUploadsDir();

// А теперь — каждые 24 часа (24 ч * 60 мин * 60 сек * 1000 мс)
setInterval(cleanupUploadsDir, 24 * 60 * 60 * 1000);



/* ==================== ЗАПУСК СЕРВЕРА ==================== */
app.listen(PORT, () => console.log(`Сервер работает на http://localhost:${PORT} 🔥`));