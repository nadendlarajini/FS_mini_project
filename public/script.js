const bookTableBody = document.getElementById('bookTableBody');
const bookForm = document.getElementById('bookForm');
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const categoryInput = document.getElementById('category');
const yearInput = document.getElementById('year');
const bookIdInput = document.getElementById('bookId');
const searchInput = document.getElementById('searchInput');
const totalBooks = document.getElementById('totalBooks');
const availableBooks = document.getElementById('availableBooks');
const issuedBooks = document.getElementById('issuedBooks');
const submitButton = document.getElementById('submitButton');
const cancelEditButton = document.getElementById('cancelEdit');
const formTitle = document.getElementById('formTitle');

let bookList = [];

async function loadBooks() {
  try {
    const response = await fetch('/api/books');
    bookList = await response.json();
    renderBooks();
    updateStatistics();
  } catch (error) {
    console.error('Error loading books:', error);
    alert('Could not load books. Please try again later.');
  }
}

function updateStatistics() {
  const total = bookList.length;
  const available = bookList.filter((book) => book.status === 'Available').length;
  const issued = total - available;

  totalBooks.textContent = total;
  availableBooks.textContent = available;
  issuedBooks.textContent = issued;
}

function renderBooks() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const filteredBooks = bookList.filter((book) => {
    if (!searchValue) {
      return true;
    }

    return (
      book.title.toLowerCase().includes(searchValue) ||
      book.author.toLowerCase().includes(searchValue) ||
      book.category.toLowerCase().includes(searchValue)
    );
  });

  if (filteredBooks.length === 0) {
    bookTableBody.innerHTML = '<tr><td colspan="7">No books found.</td></tr>';
    return;
  }

  bookTableBody.innerHTML = filteredBooks
    .map((book) => {
      const statusClass = book.status === 'Available' ? 'status-available' : 'status-issued';
      const issueDisabled = book.status === 'Issued' ? 'disabled' : '';
      const returnDisabled = book.status === 'Available' ? 'disabled' : '';

      return `
        <tr>
          <td>${book.id}</td>
          <td>${book.title}</td>
          <td>${book.author}</td>
          <td>${book.category}</td>
          <td>${book.year}</td>
          <td><span class="status-badge ${statusClass}">${book.status}</span></td>
          <td>
            <div class="action-buttons">
              <button class="issue-btn" data-action="issue" data-id="${book.id}" ${issueDisabled}>Issue</button>
              <button class="return-btn" data-action="return" data-id="${book.id}" ${returnDisabled}>Return</button>
              <button class="edit-btn" data-action="edit" data-id="${book.id}">Edit</button>
              <button class="delete-btn" data-action="delete" data-id="${book.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function resetForm() {
  bookForm.reset();
  bookIdInput.value = '';
  formTitle.textContent = 'Add Book';
  submitButton.textContent = 'Add Book';
  cancelEditButton.classList.add('hidden');
}

function fillFormForEdit(book) {
  bookIdInput.value = book.id;
  titleInput.value = book.title;
  authorInput.value = book.author;
  categoryInput.value = book.category;
  yearInput.value = book.year;
  formTitle.textContent = 'Update Book';
  submitButton.textContent = 'Update Book';
  cancelEditButton.classList.remove('hidden');
}

bookForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const bookData = {
    title: titleInput.value.trim(),
    author: authorInput.value.trim(),
    category: categoryInput.value.trim(),
    year: yearInput.value
  };

  if (!bookData.title || !bookData.author || !bookData.category || !bookData.year) {
    alert('Please fill in all fields.');
    return;
  }

  try {
    const bookId = bookIdInput.value;
    let response;

    if (bookId) {
      response = await fetch(`/api/books/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
      });
    } else {
      response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
      });
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Something went wrong.');
    }

    resetForm();
    await loadBooks();
  } catch (error) {
    console.error('Error saving book:', error);
    alert(error.message);
  }
});

cancelEditButton.addEventListener('click', resetForm);

searchInput.addEventListener('input', renderBooks);

document.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (!action || !id) {
    return;
  }

  try {
    if (action === 'issue') {
      const response = await fetch(`/api/books/${id}/issue`, { method: 'PUT' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Issue failed.');
      }
      await loadBooks();
    }

    if (action === 'return') {
      const response = await fetch(`/api/books/${id}/return`, { method: 'PUT' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Return failed.');
      }
      await loadBooks();
    }

    if (action === 'delete') {
      const confirmed = confirm('Are you sure you want to delete this book?');
      if (!confirmed) {
        return;
      }

      const response = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Delete failed.');
      }
      await loadBooks();
    }

    if (action === 'edit') {
      const selectedBook = bookList.find((book) => Number(book.id) === Number(id));
      if (selectedBook) {
        fillFormForEdit(selectedBook);
      }
    }
  } catch (error) {
    console.error('Action failed:', error);
    alert(error.message);
  }
});

loadBooks();
