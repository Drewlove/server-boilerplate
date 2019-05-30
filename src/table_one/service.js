//ENV SET UP, change table name
const table = 'table_one'

const Service = {
  getAll(knex) {
    return knex.select('*').from(table)
  },
  getById(knex, id) {
    return knex.from(table).select('*').where('id', id).first()
  },
  insertItem(knex, newItem) {
    return knex
      .insert(newItem)
      .into(table)
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },
  deleteItem(knex, id) {
    return knex
    .from(table)
    .where({ id })
    .delete()
  },
  updateItem(knex, id, newFields) {
    return knex(table)
    .where({ id })
    .update(newFields)
  },
}

module.exports = Service
