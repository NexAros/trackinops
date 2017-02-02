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
const crawlersModel = require('../../models/crawlers');
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
  if (/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i.test(name)) {
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
  crawlersModel.findById(req.params.crawler_id, function (err, crawler) {
    if (err) return res.status(404);
    res.status(202).render('layout', {
      title: 'Crawler id = ' + crawler._id,
      message: 'Crawler (id= ' + crawler._id + ') has started at ' + _.now()
    });
  });
  // TODO: Identify crawler_id from MongoDB
  // TODO: Start Process Links with crawler data from MongoDB
  // TODO: if crawler_id does not match = res.404
  // TODO: if crawler starts = res:ok
  // TODO: if craweler fails to start res.error
});

/**
* Get single crawler by _id
* Default mapping to GET '~/crawlers/:crawler_id'
*
* @param {Object} req
* @param {Object} res
* @param {Function} next
**/
router.get('/:crawler_id', function (req, res, next) {
  crawlersModel.findById(req.params.crawler_id, function (err, crawler) {
    if (err) return next(err);
    res.status(200).render('layout', { title: 'Crawler id = ' + crawler._id, message: crawler._id });
  });
});

module.exports = router;
