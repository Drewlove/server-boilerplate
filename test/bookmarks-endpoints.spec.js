const knex = require('knex')
const fixtures = require('./bookmarks-fixtures')
const app = require('../src/app')

describe('Bookmarks Endpoints', () => {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => db('bookmarks').truncate())

  afterEach('cleanup', () => db('bookmarks').truncate())

  describe('unauthorized requests', ()=> {
    const bookmarksList = fixtures.makeBookmarksArray()

    beforeEach('insert bookmarks into database', ()=> {
      return db
      .into('bookmarks')
      .insert(bookmarksList)
    })
    it('responds with 401 unauthorized for GET bookmarks', ()=> {
      return supertest(app)
      .get('/bookmarks')
      .expect(401, {error:'Unauthorized request'})
    })
    it('responds with 401 unauthorized for GET bookmark by id', ()=> {
      return supertest(app)
      .get('/bookmarks/1')
      .expect(401, {error:'Unauthorized request'})
    })
    it('responds with 401 unauthorized for POST bookmark', ()=> {
      return supertest(app)
      .post('/bookmarks')
      .send({
        title: "new title", 
        url: "https://website.com", 
        description: "Great site", 
        rating: 4
      })
      .expect(401, {error: 'Unauthorized request'})
    })
    it('responds with 401 unauthorized for DELETE bookmark', ()=> {
      return supertest(app)
      .delete('/bookmarks/1')
      .expect(401, {error: 'Unauthorized request'})
    })
  })

  describe('GET /bookmarks', () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('gets the bookmarks from the database', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks)
      })
    })
    context('Given there is a malicious bookmark with XSS content', ()=> {
      const {maliciousBookmark, expectedBookmark} = fixtures.makeMaliciousBookmark()
      beforeEach('insert malicious bookmark', ()=> {
        return db
        .into('bookmarks')
        .insert(maliciousBookmark)
      })
      it('removes XSS attack content', ()=> {
        return supertest(app)
        .get('/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200)
        .then(res => {
          expect(res.body[0].title).to.eql(expectedBookmark.title)
          expect(res.body[0].description).to.eql(expectedBookmark.description) 
        })   
      })
    })
  })

  describe('GET /bookmarks/:id', () => {
    context(`Given no bookmarks`, () => {
      it(`responds 404 when bookmark doesn't exist`, () => {
        return supertest(app)
          .get(`/bookmarks/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Bookmark not found` }
          })
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2
        const expectedBookmark = testBookmarks[bookmarkId - 1]
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark)
      })
    })

    context('Given there is a bookmark with XSS content', ()=> {
      const {maliciousBookmark, expectedBookmark} = fixtures.makeMaliciousBookmark()
      beforeEach('insert bookmark with XSS content', ()=> {
        return db
        .insert(maliciousBookmark)
        .into('bookmarks')
      })
      it('returns bookmark with XSS content removed', ()=> {
        return supertest(app)
        .get(`/bookmarks/${maliciousBookmark.id}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title)
          expect(res.body.description).to.eql(expectedBookmark.description)
        })
      })
    })
  })
  describe('POST new bookmark', ()=> {
    it('adds new bookmark to database and responds with 201', ()=> {
      const newBookmark = {
        title: 'New Title', 
        url: 'http://new-url.com', 
        rating: 1, 
        description: 'awesome bookmark'
      }
      return supertest(app)
      .post(`/bookmarks`)
      .set(`Authorization`, `Bearer ${process.env.API_TOKEN}`)
      .send(newBookmark)
      .expect(201)
      .expect(res => {
        expect(res.body.title).to.eql(newBookmark.title)
        expect(res.body.url).to.eql(newBookmark.url)
        expect(res.body.rating).to.eql(newBookmark.rating)
        expect(res.body.description).to.eql(newBookmark.description)
        expect(res.body).to.have.property('id')
      })
      .then(res => {
        supertest(app)
        .get(`/bookmarks/${res.body.id}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(res.body)
      })
    })
    it('removes xss attack content from response', ()=> {
      const {maliciousBookmark, expectedBookmark} = fixtures.makeMaliciousBookmark(); 
      return supertest(app)
      .post('/bookmarks')
      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
      .send(maliciousBookmark)
      .expect(201)
      .then(res => {
        expect(res.body.title).to.eql(expectedBookmark.title)
        expect(res.body.content).to.eql(expectedBookmark.content)
      })
    })
    const fields = ['title', 'url', 'rating']; 
    fields.forEach(field => {
      const partialBookmark = {
        title: 'New Title', 
        url: 'http://new-url.com', 
        rating: 1, 
        description: 'awesome bookmark'
      }

      it(`responds with 400 if missing appropriate ${field}`, ()=> {
        delete partialBookmark[field]
        return supertest(app)
        .post('/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(partialBookmark)
        .expect(400, {error: {message: `Missing required ${field} in bookmark`}})
      })
    })
    it('responds with 400, if url is invalid', ()=> {
      const bookmarkInvalidUrl = {
        title: 'New Title', 
        url: 'invalid', 
        rating: 1, 
        description: 'awesome bookmark'
      }
      return supertest(app)
      .post('/bookmarks')
      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
      .send(bookmarkInvalidUrl)
      .expect(400, {error: {message: "Invalid URL"}})
    })
    it('responds with 400 if rating is invalid', ()=> {
      const bookmarkInvalidRating = {
        title: 'New Title', 
        url: 'http://new-url.com', 
        rating: 9, 
        description: 'awesome bookmark'
      }
      return supertest(app)
      .post('/bookmarks')
      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
      .send(bookmarkInvalidRating)
      .expect(400, {error: {message: 'Not a valid rating'}})
    })

  })
  describe('DELETE /bookmarks/:bookmark_id', ()=> {
    it('responds with 404 given invalid bookmark id', ()=> {
      const bookmarkId = 999
      return supertest(app)
      .delete(`/bookmarks/${bookmarkId}`)
      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
      .expect(404, {error: {message: 'Bookmark not found'}})
    })

    context('Given there are bookmarks in the database', ()=> {
      const bookmarksList = fixtures.makeBookmarksArray()
     
      beforeEach('insert articles', ()=> {
        return db
        .into('bookmarks')
        .insert(bookmarksList)
      })
      it('responds with 204 and deletes the bookmark given existing bookmark id', ()=> {
        const bookmarkId = 1
        const expectedBookmarks = bookmarksList.filter(bookmark => bookmark.id !== bookmarkId)
        return supertest(app)
        .delete(`/bookmarks/${bookmarkId}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(204)
        .then(res => {
          supertest(app)
          .get(`/bookmarks/`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(expectedBookmarks)
          })
        })
      })
    })
  })

