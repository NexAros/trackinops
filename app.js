let express = require('express');
let path = require('path');
// var favicon = require('serve-favicon');
let logger = require('morgan');
// var cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let kue = require('kue');
let ui = require('kue-ui');

const routes = require('./routes/index');

const app = express();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
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
  let err = new Error('Not Found');
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
