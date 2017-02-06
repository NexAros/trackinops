// let _ = require('lodash');
let express = require('express');
let router = express.Router({
  mergeParams: true
});
let middleware;
let Runner = require('../../lib/runner');
/**
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
  // TODO: Check if crawler (aka Job) is valid on Runner controller
  // TODO: If crawler is valid, initCrawler on Runner
  // TODO: After Crawler initiation, create Execution details object (aka process or worker)  
  let run = new Runner();
  // console.log(run.initCrawler(req.params.crawler_id));
  let crawler = run.initCrawler(req.params.crawler_id);
  console.log(crawler);
  crawler.get(req.params.crawler_id, function (err, ress) {
    if (err) return next(err);
    res.status(200).render('layout', {
      title: 'Crawler id = ',
      message: 'Crawler = ' + ress.id
    });
  });

  // crawler.getCrawler(req.params.crawler_id, function (err, data) {
  //   //crawlersModel.findById(req.params.crawler_id, function (err, crawler_settings) {
  //   if (err) return res.status(404);

  //   //let crawler = runner.createRunner(crawler_settings);
  //   // TODO: start crawler URL processing and return Execution details
  //   res.status(204).render('layout', {
  //     title: 'Crawler id = ' + data._id,
  //     message: 'Crawler (id= ' + data._id + ') has started at ' + data // .moment().format()
  //   });
  // });

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
