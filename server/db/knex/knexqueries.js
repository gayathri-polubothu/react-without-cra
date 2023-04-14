const knexdb = require('./knexdb')
const getKnexUsers = (req, resp) => {
    knexdb().select().from('users').then(users=> resp.send(users))
}
const getKnexUserById = (req, resp) => {
    knexdb('users').select().where('id', '=',req.params.id).then(users=> resp.send(users))
}

const createTable = (req, res) => {
    const {tableName, schema} = req.body
    const newTable = knexdb.schema.hasTable(tableName).then(function(exists) {
        if (!exists) {
            return knexdb.schema.createTable(tableName, function(t) {
                for(const col of schema) {
                    switch(col.type) {
                        case 'number':
                            if(col.isPrimary) {
                                t.increments(col.name).primary()
                            } else {
                                t.integer(col.name)
                            }
                            break;
                        case 'boolean':
                            t.boolean(col.name)
                            break;
                        case 'string':
                        default:
                            t.string(col.name, 100)
                            break;
                    }
                }
            });

        }
    });
    res.send(newTable || [])
}

module.exports = {
    getKnexUsers,
    getKnexUserById,
    createTable
}