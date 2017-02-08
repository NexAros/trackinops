const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
// const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const kue = require('kue');
const ui = require('kue-ui');

// start MongoDB with Mongoose
const mongoose = require('mongoose');

let uri = 'mongodb://localhost/trackinops';
// Use bluebird
mongoose.Promise = require('bluebird'); // for Mongoose
let options = { promiseLibrary: require('bluebird') }; // for MongoDB driver
global.db = mongoose.createConnection(uri, options);

const routes = require('./routes');

const app = express();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// set up kue and kue-ui
kue.createQueue();

ui.setup({
  apiURL: '/restricted/kue-api', // IMPORTANT: specify the api url
  baseURL: '/restricted/kue-ui', // IMPORTANT: specify the base url
  updateInterval: 5000 // Optional: Fetches new data every 5000 ms
});

// Mount kue JSON api
app.use('/restricted/kue-api', kue.app);
// Mount UI
app.use('/restricted/kue-ui', ui.app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
