const knex=require('knex')
const knexfile=require('./knexfile')

const kdb = knex(knexfile.development)
module.exports = kdb