const express = require('express');
const router = express.Router();
const config = require('../config.js');
const sql = require('mysql');
// add some middleware to parse out our post request data
router.use(express.json());
router.use(express.urlencoded({ 'extended' : false }));

//localhost:3000/users/getone { "user": "Trevor", "pass": "text" }
// create a connection to our sql database using our user credentials
// that were stored in config.js
let pool = sql.createPool({
    connectionLimit: 20,
    host : config.host,
    user : config.user,
    password : config.password,
    database : config.database,
    port: 8889 // windows/linux: 3306
})

//a route with /:text is a dynamic route
// what comes after the colon is a route parameter
//can be used lik a variable in your JS code function(arg)
router.post('/getone', (req, res) => {
    console.log(`hit the user route: the user is ${req.body}`);

    pool.getConnection((err, connection) => {
        if (err) throw err;
// get the user from the incoming route request (the data passed from te front end)
        let currentUser = req.body,
 // create an object to store the login attepmt result (pass / fall)
        loginResult = {};

        let query = `SELECT first_name, password FROM user WHERE first_name="${currentUser.username}"`;

        connection.query(query, (err, user) => {
            connection.release();

            if (err) throw err;

            //check if the user exists
            if (!user[0]) {
                       //if it does, check the password
                loginResult.action = 'add';
            } else if (user[0].password !== currentUser.password) {
                          //if they don't match, don't authenticate
                loginResult.field = 'password'; //tell the UI which field is wrong
                loginResult.action = 'retry';
            } else {
                loginResult.action = 'authenticate';
            }
    
            //if they DO match, you're in!
            // send back the login result - pass or fail
            res.json(loginResult);
        })
    })
    // console.log(`hit the user route: the user is ${req.params.user}`);
    // res.end('done');
})

router.post('/signup', (req, res) => {
    console.log('hit add user route');

    let user = req.body;

    pool.getConnection((err, connection) => {
        if (err) throw err;

        let query = `INSERT INTO user(first_name, last_name, password, role, permissions, 
            avatar) VALUES('${user.username}', 'test', '${user.password}', 0, 3, '')`;
        // run a query, get some results (or an error)
        connection.query(query, (err, result) => {
            connection.release();

            if (err) throw err;

            console.log(result);
            res.json({action: 'added'});
        })
    })
})
// this route handler will match with any /users api call
router.get('/getall', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;

        // run a query, get some results (or an error)
        connection.query('SELECT * FROM user', function(error, results) {
            connection.release();

            if (error) throw error;

            results.forEach(result => {
                delete result.password;
                delete result.last_name;

                if (!result.avata) {
                    result.avatar = "temp_avatar.jpg";
                }
            })

            console.log(results);
            res.json(results);
        })
    })
})

module.exports = router;