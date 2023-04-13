const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const createError = require('http-errors')
const path = require('path')
const cookieParser = require('cookie-parser')
const db = require('./db/queries')
var indexRouter = require('./routes')
const app = express()
const port = 4040

app.use('/bundle', express.static(path.join(__dirname, '../client/dist')))
app.use(bodyParser.json({ limit: '5mb' }))
app.use(cors())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use('/hello', indexRouter)
app.get('/', (request, response) => {
    response.json({ info: 'Node.js, Express, and Postgres API' })
})

app.get('/users', db.getUsers)
app.get('/users/:id', db.getUserById)
app.post('/users', db.createUser)
app.put('/users/:id', db.updateUser)
app.delete('/users/:id', db.deleteUser)

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})