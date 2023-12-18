const express = require("express");
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const {Pool} = require('pg');

//inisialisasi express
const app = express();


//inisialisasi db
const pool = new Pool({
    user: "postgres",
    password: "kart0tuying",
    host: "localhost",
    database: "movies",
    port: 5432
});

const jsDocOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation Home Work Week 9',
        version: '1.0.0',
      },
    },
    apis: ['./*.js'], // files containing annotations as above
  };
  
const swaggerSpec = swaggerJsDoc(jsDocOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

//membaca json body dari client
app.use(express.json());

//loggin middleware
app.use(morgan('common'))



app.post('/register', async (req, res, next) => {
    const data = req.body;
   
    try {
        const result = await pool.query('INSERT INTO users (id, email, gender, password, role) VALUES ($1, $2, $3, $4, $5)', [data.id, data.email, data.gender, data.password, data.role]);  

        res.status(200).json({
            success: true,
            data: result
        });
    }catch (error) {
        next(error.detail)
    }  
})

//Login
app.post('/login', async(req, res, next) => {
    const data = req.body; 

    try {
        const query = `SELECT * FROM users WHERE email = $1 AND password = $2 LIMIT 1`
        const result = await pool.query(query, [data.email, data.password])


        if(!result.rows.length){
            res.status(200).json({
                success: false,
                data: null,
                message: "email atau password salah"
            });
        } else {
            res.status(200).json({
                result,
                success: true,
                data: null,
                message: "email atau password benar"
            });
        }
    }catch (error) {
        next(error.detail)
    }


})

//Pagination GET users
app.post('/users/paginate', async (req, res, next) => {
    const page = parseInt(req.body.page);
    const limit = parseInt(req.body.limit);

    //hitung awal dan akhir index
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const query = `SELECT * FROM users`
    const user = await pool.query(query)
    

    const results = {};
    if(endIndex < user.rows.length) {
        results.next = {
            page: page + 1,
            limit: limit,
        };
    }

    if (startIndex > 0) {
        results.previous = {
            page: page - 1,
            limit: limit,
        };
    }

    results.results = user.rows.slice(startIndex, endIndex);

    res.json(results);
})

//pagination get movies
app.post('/movies/paginate', async (req, res, next) => {
    const page = parseInt(req.body.page);
    const limit = parseInt(req.body.limit);

    //hitung awal dan akhir index
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const query = `SELECT * FROM movies`
    const movie = await pool.query(query)
    

    const results = {};
    if(endIndex < movie.rows.length) {
        results.next = {
            page: page + 1,
            limit: limit,
        };
    }

    if (startIndex > 0) {
        results.previous = {
            page: page - 1,
            limit: limit,
        };
    }

    results.results = movie.rows.slice(startIndex, endIndex);

    res.json(results);
})



//PUT
app.put('/update', async (req, res, next) => {
    const data = req.body;
   
    try {
        const query = `UPDATE users 
        SET email = $2, gender = $3, password = $4, role = $5 
        WHERE id = $1`
        const result = await pool.query(query, [data.id, data.email, data.gender, data.password, data.role]);  

        res.status(200).json({
            success: true,
            data: result
        });
    }catch (error) {
        next(error.detail)
    }  
})

//Delete
app.delete('/:id', async(req, res, next) => {
    const id = req.params.id;
   
    try {
        const result = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);  

        res.status(200).json({
            success: true,
            data: result,
            message: `User deleted with id: ${id}`
        });
    }catch (error) {
        next(error.detail)
    }  
})


//error handling middleware
app.use((err, req, res, next) => {
    res.status(500).json({
        success: false,
        error: err
    })  
});

app.listen(3000);