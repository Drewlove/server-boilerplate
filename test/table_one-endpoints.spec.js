const knex = require('knex')
const {makeItemsArray, makeMaliciousItem} = require('./table_one-fixtures')
const app = require('../src/app')

//ENV SET UP, 
//change table name and add properties in table into array
const table = 'table_one' 
const properties = ['first_name', 'age']

const newItem = {
  first_name: 'Jonny Boy', 
  age: 24
}
const patchItemSomeFields = {
  age: 5000
}
const patchItemAllFields = {
  first_name: 'New name', 
  age: 1000
}

describe(`${table} Endpoints`, () => {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => db(table).truncate())

  afterEach('cleanup', () => db(table).truncate())

  describe(`Unauthorized requests`, () => {
    const testItems = makeItemsArray()

    beforeEach('insert items', () => {
      return db
        .into(table)
        .insert(testItems)
    })

    it(`responds with 401 Unauthorized for GET /api/${table}`, () => {
      return supertest(app)
        .get(`/api/${table}`)
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for POST /api/${table}`, () => {
      return supertest(app)
        .post(`/api/${table}`)
        .send(newItem)
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for GET /api/${table}/:id`, () => {
      const secondItem = testItems[1]
      return supertest(app)
        .get(`/api/${table}/${secondItem.id}`)
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for DELETE /api/${table}/:id`, () => {
      const item = testItems[1]
      return supertest(app)
        .delete(`/api/${table}/${item.id}`)
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for PATCH /api/${table}/:id`, () => {
      const item = testItems[1]
      return supertest(app)
        .patch(`/api/${table}/${item.id}`)
        .send({patchItemAllFields})
        .expect(401, { error: 'Unauthorized request' })
    })
  })

  describe(`GET /api/${table}`, () => {
    context(`Given no table_one`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get(`/api/${table}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context(`Given there are ${table} in the database`, () => {
      const testItems = makeItemsArray()

      beforeEach(`insert ${table}`, () => {
        return db
          .into(table)
          .insert(testItems)
      })

      it(`gets the ${table} from the store`, () => {
        return supertest(app)
          .get(`/api/${table}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testItems)
      })
    })

    context(`Given an XSS attack ${table}`, () => {
      const { maliciousItem, expectedItem } = makeMaliciousItem()

      beforeEach(`insert malicious ${table}`, () => {
        return db
          .into(table)
          .insert([maliciousItem])
      })
//ENV SET UP, 
//have fields with potential xss content in the expect statement
      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/${table}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].first_name).to.eql(expectedItem.first_name)
            expect(res.body[0].age).to.eql(expectedItem.age)
          })
      })
    })
  })

  describe(`GET /api/${table}/:id`, () => {
    context(`Given no ${table}`, () => {
      it(`responds 404 when ${table} doesn't exist`, () => {
        return supertest(app)
          .get(`/api/${table}/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Table ${table}: Item Not Found` }
          })
      })
    })

    context(`Given there are ${table} in the database`, () => {
      const testItems = makeItemsArray()

      beforeEach(`insert ${table}`, () => {
        return db
          .into(table)
          .insert(testItems)
      })

      it(`responds with 200 and the specified ${table}`, () => {
        const itemId = 2
        const expectedItem = testItems[itemId - 1]
        return supertest(app)
          .get(`/api/${table}/${itemId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedItem)
      })
    })

    context(`Given an XSS attack ${table}`, () => {
      const { maliciousItem, expectedItem } = makeMaliciousItem()

      beforeEach(`insert malicious ${table}`, () => {
        return db
          .into(table)
          .insert([maliciousItem])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/${table}/${maliciousItem.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedItem.title)
            expect(res.body.description).to.eql(expectedItem.description)
          })
      })
    })
  })

  describe(`DELETE /api/${table}/:id`, () => {
    context(`Given no ${table}`, () => {
      it(`responds 404 whe ${table} doesn't exist`, () => {
        return supertest(app)
          .delete(`/api/${table}/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Table ${table}: Item Not Found` }
          })
      })
    })

    context(`Given there are ${table} in the database`, () => {
      const testItems = makeItemsArray()

      beforeEach(`insert ${table}`, () => {
        return db
          .into(table)
          .insert(testItems)
      })

      it(`removes the ${table} by ID from the store`, () => {
        const idToRemove = 2
        const expectedItem = testItems.filter(item => item.id !== idToRemove)
        return supertest(app)
          .delete(`/api/${table}/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/api/${table}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedItem)
          )
      })
    })
  })
//ENV SET UP
//replace first_name and age properties below with properties of actual table
  describe(`POST /api/${table}`, () => {
    properties.forEach(field => {
      const newItem = {
        first_name: 'New Name', 
        age: 1000
      }

      it(`responds with 400 missing '${field}' if not supplied`, () => {
        delete newItem[field]

        return supertest(app)
          .post(`/api/${table}`)
          .send(newItem)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: `'${field}' is required` }
          })
      })
    })

    //validation tests for data type here, ie if URL is valid,
    //if rating submitted is between the expected range of 1-5, etc. 

    it('adds a new item to the store', () => {
      return supertest(app)
        .post(`/api/${table}`)
        .send(newItem)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.first_name).to.eql(newItem.first_name)
          expect(res.body.age).to.eql(newItem.age)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/${table}/${res.body.id}`)
        })
        .then(res =>
          supertest(app)
            .get(`/api/${table}/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        )
    })

    //ENV SET UP
    //add all additional fields that could have XSS content
    //into expect statement below
    it('removes XSS attack content from response', () => {
      const { maliciousItem, expectedItem } = makeMaliciousItem()
      return supertest(app)
        .post(`/api/${table}`)
        .send(maliciousItem)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          //ENV SET UP, add here
          expect(res.body.first_name).to.eql(expectedItem.first_name)
        })
    })
  })

  describe(`PATCH /api/${table}/:item_id`, () => {
    context(`Given no ${table}`, () => {
      it(`responds with 404`, () => {
        const itemId = 123456
        return supertest(app)
          .patch(`/api/${table}/${itemId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Table ${table}: Item Not Found`} })
      })
    })

    context(`Given there are ${table} in the database`, () => {
      const testItems = makeItemsArray()

      beforeEach(`insert ${table}`, () => {
        return db
          .into(table)
          .insert(testItems)
      })

      it(`responds with 204 and updates the ${table}`, () => {
        const idToUpdate = 2

        const expectedItem = {
          ...testItems[idToUpdate - 1],
          ...patchItemAllFields
        }
        return supertest(app)
          .patch(`/api/${table}/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(patchItemAllFields)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/${table}/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedItem)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/${table}/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain either ${properties}`
            }
          })
      })

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const expectedItem = {
          ...testItems[idToUpdate - 1],
          ...patchItemSomeFields
        }

        return supertest(app)
          .patch(`/api/${table}/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({
            ...patchItemSomeFields,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/${table}/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedItem)
          )
      })
    })
  })
})