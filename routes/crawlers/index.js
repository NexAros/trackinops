/**
 *  competitor Routes
 *
 **/
const _ = require('lodash');
const express = require('express');
const router = express.Router({
  mergeParams: true
});
let middleware;
/**
 *  competitors
 *
 **/
// let jsm = require('../competitor/jsm/jsm.lt.js');
// let jsmUzpildymas = require('../competitor/jsm/jsmuzpildymas.lt.js');
// let jsmPrekes = require('../competitor/jsm/jsmprekes.lt.js');
// let conrad = require('../competitor/conrad.com.js');
// let prekes = require('../competitor/prekes.lt.js');
// let uzpildymas = require('../competitor/uzpildymas.lt.js');

/* params router level */
router.param('crawler_id', function (req, res, next, name) {
  if (/^[a-z]+$/i.test(name)) {
    next();
  } else {
    next('route');
  }
});

/* middleware router level */
if (middleware) {
  router.use(middleware);
}

/**
* Start action, starts a single site srawler
* Default mapping to POST '~/crawlers/:crawler_id/start', no GET mapping
*
* @param {Object} req
* @param {Object} res
* @param {Function} next
**/
router.post('/:crawler_id/start', function (req, res) {
  
  // TODO: Identify crawler_id from MongoDB
  // TODO: Start Process Links with crawler data from MongoDB
  // TODO: if crawler_id does not match = res.404  
  // TODO: if crawler starts = res:ok  
  // TODO: if craweler fails to start res.error  

});

module.exports = router;
