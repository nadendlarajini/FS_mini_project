const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'books.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readBooks() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeBooks(books) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(books, null, 2), 'utf8');
}

function getNextBookId(books) {
  if (books.length === 0) {
    return 1;
  }

  const ids = books.map((book) => Number(book.id));
  return Math.max(...ids) + 1;
}

app.get('/api/books', (req, res) => {
  const books = readBooks();
  res.json(books);
});

app.get('/api/books/:id', (req, res) => {
  const books = readBooks();
  const book = books.find((item) => Number(item.id) === Number(req.params.id));

  if (!book) {
    return res.status(404).json({ message: 'Book not found.' });
  }

  res.json(book);
});

app.post('/api/books', (req, res) => {
  const { title, author, category, year } = req.body;

  if (!title || !author || !category || !year) {
    return res.status(400).json({ message: 'Please provide all book details.' });
  }

  const books = readBooks();
  const newBook = {
    id: getNextBookId(books),
    title: title.trim(),
    author: author.trim(),
    category: category.trim(),
    year: Number(year),
    status: 'Available'
  };

  books.push(newBook);
  writeBooks(books);

  res.status(201).json(newBook);
});

app.put('/api/books/:id', (req, res) => {
  const { title, author, category, year } = req.body;

  if (!title || !author || !category || !year) {
    return res.status(400).json({ message: 'Please provide all book details.' });
  }

  const books = readBooks();
  const index = books.findIndex((book) => Number(book.id) === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: 'Book not found.' });
  }

  books[index] = {
    ...books[index],
    title: title.trim(),
    author: author.trim(),
    category: category.trim(),
    year: Number(year)
  };

  writeBooks(books);
  res.json(books[index]);
});

app.delete('/api/books/:id', (req, res) => {
  const books = readBooks();
  const filteredBooks = books.filter((book) => Number(book.id) !== Number(req.params.id));

  if (filteredBooks.length === books.length) {
    return res.status(404).json({ message: 'Book not found.' });
  }

  writeBooks(filteredBooks);
  res.json({ message: 'Book deleted successfully.' });
});

app.put('/api/books/:id/issue', (req, res) => {
  const books = readBooks();
  const index = books.findIndex((book) => Number(book.id) === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: 'Book not found.' });
  }

  if (books[index].status === 'Issued') {
    return res.status(400).json({ message: 'This book is already issued.' });
  }

  books[index].status = 'Issued';
  writeBooks(books);
  res.json(books[index]);
});

app.put('/api/books/:id/return', (req, res) => {
  const books = readBooks();
  const index = books.findIndex((book) => Number(book.id) === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: 'Book not found.' });
  }

  if (books[index].status === 'Available') {
    return res.status(400).json({ message: 'This book is already available.' });
  }

  books[index].status = 'Available';
  writeBooks(books);
  res.json(books[index]);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Library Management System server running at http://localhost:${PORT}`);
});
