
const EventEmitter = require('events').EventEmitter;
const kue = require('kue');
// let jobs = kue.createQueue();

// var EventEmitter = require('events').EventEmitter
//   , Worker       = require('./queue/worker')
//   , events       = require('./queue/events')
const Crawler = require('./crawler');
//   , Warlock      = require('node-redis-warlock')
//   , _            = require('lodash')
//   , redis        = require('./redis')
const noop = function () { };

exports = module.exports = Runner;

exports.Crawler = Crawler;

exports.createRunner = function (settings) {
  if (!Runner.singleton) {
    Runner.singleton = new Runner(settings);
  }
  return Runner.singleton;
};

function Runner(settings) {
  settings = settings || {};
  this.name = settings.name || 'trackinOps';
  // this.id = ['trackinOps', require('os').hostname(), process.pid].join(':');
  this._options = settings;
  // this.promoter = null;
  // this.workers = exports.workers;
  // this.shuttingDown = false;
  // Job.disableSearch = settings.disableSearch !== false;
  // settings.jobEvents !== undefined ? Job.jobEvents = settings.jobEvents : '';
  // redis.configureFactory(settings, this);
  // this.client = Worker.client = Job.client = redis.createClient();
}

/**
 * Inherit from `EventEmitter.prototype`.
 */

Runner.prototype.__proto__ = EventEmitter.prototype;

Runner.prototype.initCrawler = function (data) {
  return new Crawler(data);
};

// Runner.prototype.getCrawler = function (id, fn) {
//   Crawler.get(id, function (err, crawler) {
//     if (err) return fn(err);
//     if (!crawler) {
//       return fn(new Error('crawler "' + id + '" doesnt exist'));
//     }
//     fn(crawler);
//   });
// };





// Runner.prototype.startCrawlById = function (crawler_id, fn) {
//   crawlersModel.findById(crawler_id, function (err, crawler) {
//     if (err) return fn(new Error('Crawler start FAILED!'));
//     new Runner()


//   });

//   jobs.create(crawler._id, {
//     {

//     }
//     "_id" : ObjectId("5891de7598fdf5c14c34b424"),
//     "crawlerCustomId" : "test_crawler",
//     "tags" : [
//       "berrybaldai.lt"
//     ],
//     "startingLinks" : [
//       {
//         "key": "START",
//         "value": "http://www.berrybaldai.lt"
//       },
//       {
//         "key": "START",
//         "value": "http://www.berrybaldai.lt/baldai/sofos"
//       },
//       {
//         "key": "START",
//         "value": "http://www.berrybaldai.lt/svetaines-baldai/svetaines-minksti-baldai/trivietes-sofos/3te-sofa-su-mechanizmu-gobelenas-51"
//       }
//     ],
//     "crawlMatches" : [
//       {
//         "match": "HomePage",
//         "urlRegEx": "http://www.berrybaldai.lt"
//       },
//       {
//         "match": "GroupPage",
//         "urlRegEx": "http://www.berrybaldai.lt/[.+]",
//         "selector": "div.category-view > h1"
//       },
//       {
//         "match": "GroupPagePaginated",
//         "urlRegEx": "http://www.berrybaldai.lt/[.+page=d+]",
//         "selector": "div.category-view > h1"
//       },
//       {
//         "match": "ProductPage",
//         "urlRegEx": "http://www.berrybaldai.lt/[.+]",
//         "selector": "div.left-side > h1"
//       }
//     ],
//     "pageParserExtract" : [
//       {
//         "match": "HomePage",
//         "path": "div.breadcrumbs > ul > li > a.text"
//       },
//       {
//         "match": "GroupPage",
//         "path": "div.breadcrumbs > ul > li > a.text",
//         "name": "div.category-view > h1"
//       },
//       {
//         "match": "ProductPage",
//         "path": "div.breadcrumbs > ul > li > a.text",
//         "selector": "div.left-side > h1"
//       }
//     ],
//     "urlIncludeFragment" : true,
//     "loadImages" : true,
//     "loadCss" : true,
//     "maxCrawledPages" : 10,
//     "maxCrawlDepth" : 3,
//     "crawlSpread" : "singleDomain",
//     "maxInfiniteScrollHeight" : 1200,
//     "maxParallelRequests" : 5,
//     "finishWebhookUrl" : ""
// }
//   }  

//   )
// });

// // runner.processUrls() {

// }



// function create() {
//     const name = ['tobi', 'loki', 'jane', 'manny'][Math.random() * 4 | 0];
//     jobs.create('video conversion', {
//         title: 'converting ' + name + "'s to avi",
//         user: 1,
//         frames: 200
//     }).save();
//     setTimeout(create, Math.random() * 3000 | 0);
// }

// create();

// function create2() {
//     const name = ['tobi', 'loki', 'jane', 'manny'][Math.random() * 4 | 0];
//     jobs.create('email', {
//         title: 'emailing ' + name + '',
//         body: 'hello'
//     }).save();
//     setTimeout(create2, Math.random() * 1000 | 0);
// }

// create2();


// module.exports = runner;
