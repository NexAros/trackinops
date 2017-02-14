// let _ = require('lodash');
const express = require('express');
const router = express.Router({
  mergeParams: true
});
let middleware;
const runner = require('../../lib/runner');
const Runner = runner.createRunner();
const Crawler = require('../../lib/crawler');
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
// get crawler by crawler_id
router.get('/:crawler_id', function (req, res, next) {
  // const Crawler = Runner.initCrawler(req.params.crawler_id);
  const Crawl = new Crawler(req.params.crawler_id).get(req.params.crawler_id, function (err, crawler) {
    if (err) return next(err);
    if (!crawler) return res.status(410);
    return res.status(200).render('layout', {
      title: 'Crawler id = ' + crawler._id,
      message: JSON.stringify(crawler) + ' ' + crawler.startingLinks[0].value
    });
  });
});
// creates new crawler or updates the old one
// TODO: save function was re-written, test out if body have and heve no ID
router.post('/', function (req, res, next) {
  // TODO: req.body.crawlerCustomId == required
  // const crawler = Runner.initCrawler(req.body).save(function (err) {
  const crawler = new Crawler(req.body).save(function (err) {
    if (err) return next(err);
    // console.log('c', crawler);
    return res.status(201).json(crawler._id);
  });
});

// starts crawler execution
router.post('/:crawler_id/start', function (req, res, next) {
  // Check if Crawler is valid
  new Crawler().get(req.params.crawler_id, function (err, crawlerObj) {
    if (err) return next(err);

    // If crawler is valid startPreProcessing
    return new Crawler().startPreProcessing(crawlerObj, function (err, executionDoc) {
      if (err) return next(err);

      return res.status(200).render('layout', {
        title: 'Crawler id = ',
        message: 'Crawler = ' + executionDoc._id + ' has started'
      });
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

module.exports = router;
