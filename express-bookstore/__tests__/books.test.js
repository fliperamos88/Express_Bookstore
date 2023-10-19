process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');

let book_isbn;

beforeEach(async () => {
  let result = await db.query(`
      INSERT INTO
        books (isbn, amazon_url,author,language,pages,publisher,title,year)
        VALUES(
          '123432122',
          'https://amazon.com/taco',
          'Elie',
          'English',
          100,
          'Nothing publishers',
          'my first book', 2008)
        RETURNING isbn`);
  book_isbn = result.rows[0].isbn;
});

describe('query book', () => {
  test('GET /books/:isbn', async () => {
    const response = await request(app).get(`/books/${book_isbn}`);
    expect(response.body.book.author).toBe('Elie');
    expect(response.body.book.language).toBe('English');
    expect(response.body.book.isbn).toBe(book_isbn);
  });
  test("Responds with 404 if can't find book in question", async function () {
    const response = await request(app).get(`/books/999`);
    expect(response.statusCode).toBe(404);
  });
});

describe('edit book', () => {
  test('put /books/:isbn', async () => {
    const response = await request(app).put(`/books/${book_isbn}`).send({
      amazon_url: 'https://taco.com',
      author: 'mctest',
      language: 'spanish',
      pages: 1000,
      publisher: 'yeah right',
      title: 'UPDATED BOOK',
      year: 2000,
    });
    expect(response.body.book.author).toBe('mctest');
    expect(response.body.book.language).toBe('spanish');
    expect(response.body.book.isbn).toBe(book_isbn);
  });

  test('Responds with 400 if missing something', async function () {
    const response = await request(app).put(`/books/${book_isbn}`).send({
      amazon_url: 'https://taco.com',
      author: 'mctest',
      pages: 1000,
      publisher: 'yeah right',
      title: 'UPDATED BOOK',
      year: 2000,
    });
    expect(response.statusCode).toBe(400);
  });
});

afterEach(async function () {
  await db.query('DELETE FROM BOOKS');
});

afterAll(async function () {
  await db.end();
});
