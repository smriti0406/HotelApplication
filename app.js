var express = require('express');
var smritiController  = require('./controllers/smritiController');
//var tablefunc = require('./updatetable');
var login =  require('./login');
var app = express();
//tablefunc();
app.set('view engine', 'ejs');


console.log("your are listening to port 8000");
login(app);
smritiController(app);
app.listen(8000);