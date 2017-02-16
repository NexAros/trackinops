const kue = require('kue');
const queue = kue.createQueue();

const crawlerModel = require('./models/crawlerModel');
const executionModel = require('./models/executionModel');
const categoryModel = require('./models/categoryModel');
const productModel = require('./models/productModel');
const requestModel = require('./models/requestModel');
const ObjectID = require('mongodb').ObjectID;

const request = require('request');
const Nightmare = require('nightmare');
const cheerio = require('cheerio');

const _ = require('lodash');
const moment = require('moment');
const util = require('util');
const noop = function () { };

exports = module.exports = Crawler;

function Crawler(data) {
  // this.type = type;
  // this.data = data || {};
  // this._max_attempts = 1;
  // this._jobEvents = exports.jobEvents;
  // //  this.client = redis.client();
  // this.client = Job.client/* || (Job.client = redis.client())*/;
  // this.priority('normal');
  // this.on('error', function (err) {
  // });// prevent uncaught exceptions on failed job errors
  if (typeof data === String) { if (/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i.test(data)) this._id = data; }
  if (data) {
    if (/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i.test(data.id)) this._id = data.id;
    this.crawlerCustomId = data.crawlerCustomId;
    this.tags = data.tags || [];
    this.startingLinks = data.startingLinks || [];
    this.crawlMatches = data.crawlMatches || [];
    this.pageParserExtract = data.pageParserExtract || [];
    this.urlIncludeFragment = data.urlIncludeFragment || true;
    this.loadImages = data.loadImages || true;
    this.loadCss = data.loadCss || true;
    this.maxCrawledPages = parseInt(data.maxCrawledPages, 10) || 10;
    this.maxCrawlDepth = parseInt(data.maxCrawlDepth, 10) || 3;
    this.crawlSpread = data.crawlSpread || 'singleDomain';
    this.maxInfiniteScrollHeight = parseInt(data.maxInfiniteScrollHeight, 10) || 1200;
    this.maxParallelRequests = parseInt(data.maxParallelRequests, 10) || 2;
    this.finishWebhookUrl = data.finishWebhookUrl;
  }
  // console.log(this);
  // console.log(data);
}

queue
  // .on('job progress', function (id, progress) {
  // kue.Job.get(id, function (err, job) {
  //   console.log('file "%s" %d%% complete', job.data.url, progress);
  // });
  // })
  .on('job complete', function (id, result) {
    kue.Job.get(id, function (err, job) {
      let parserResult = pageParser(job, result);
      let requestDoc = new requestModel({
        executionId: job.data.execution._id,
        url: job.data.URL,
        requestedAt: job.created_at,
        loadingStartedAt: job.started_at,
        loadingFinishedAt: job.updated_at,
        // responseStatus: resStatus,
        // responseHeaders:
        parserStartedAt: parserResult.parserStartedAt,
        parserFinishedAt: parserResult.parserFinishedAt,
        parserResult: parserResult
        // uniqueUrl: String,

        // contentType: String,
        // method: String,
        // referrerId: String,
        // downloadedBytes: Number,

        // depth: Number,

        // errorInfo: String
      }).save(function (err, results) {
        // console.log(results._id);
      });
      // TODO: insert the crawled page data to DB
      // information: url, execution, parsed data

      //     if (err) throw err;
      //     //   console.log('removed completed job #%d', job.id);
      //     // });
      //     // if (complete === filesToDownload) {
      //     //   process.exit(0);
      //     // }
      //   });
      // }); if (err) throw err;
      //     //   console.log('removed completed job #%d', job.id);
      //     // });
      //     // if (complete === filesToDownload) {
      //     //   process.exit(0);
      //     // }
    });
  });


function pageParser(job, result) {
  result.parserStartedAt = Date.now();
  let parser = job.data.parser;
  $ = cheerio.load(result.html);
  // _.forEach(job.data.parser, function (toParse) {
  for (let selectorName in parser) {
    if (Object.prototype.hasOwnProperty.call(parser, selectorName)) {
      if (selectorName == 'path') {
        result[selectorName] = '>>';
        result[selectorName] += $(parser[selectorName]).map(function (i, el) {
          // this === el
          return $(this).text();
        }).get().join('>>');
      } else if (selectorName == 'name' || selectorName == 'sku' || selectorName == 'price') {
        result[selectorName] = $(parser[selectorName]).first().text();
      } else if (selectorName == 'image') {
        result[selectorName] = $(parser[selectorName]).first().attr('src');
      } else if (selectorName == 'description') {
        result[selectorName] = $(parser[selectorName]).first().html();
      } else if (selectorName == 'productId' || selectorName == 'categoryId' || selectorName == 'currency') {
        continue;
        // TODO: ifs for productId, categoryId, currency
      }
    }
  }
  result.parserFinishedAt = Date.now();
  return result;
  // });
}

// exports.get
Crawler.prototype.get = function (id, user, fn) {
  if (typeof user === 'function' && !fn) {
    fn = user;
    user = '';
  }
  const crawler = new Crawler;

  crawler._id = new ObjectID(id);
  // TODO: include filter by user id
  crawlerModel.findById(id, function (err, doc) {
    if (err) return fn(err);
    if (!doc) {
      return fn(new Error('crawler ' + crawler._id + ' doesn.t exist'));
    }
    crawler.crawlerCustomId = doc.crawlerCustomId;
    crawler.tags = doc.tags;
    crawler.startingLinks = doc.startingLinks;
    crawler.crawlMatches = doc.crawlMatches;
    crawler.pageParserExtract = doc.pageParserExtract;
    crawler.urlIncludeFragment = doc.urlIncludeFragment;
    crawler.loadImages = doc.loadImages;
    crawler.loadCss = doc.loadCss;
    crawler.maxCrawledPages = doc.maxCrawledPages;
    crawler.maxCrawlDepth = doc.maxCrawlDepth;
    crawler.crawlSpread = doc.crawlSpread;
    crawler.maxInfiniteScrollHeight = doc.maxInfiniteScrollHeight;
    crawler.maxParallelRequests = doc.maxParallelRequests;
    crawler.finishWebhookUrl = doc.finishWebhookUrl;

    // let crawler = new Crawler(doc);

    return fn(err, crawler);
  });
};

// Crawler.prototype.setId = function (id, fn) {
//   fn = fn || noop;

//   this._id = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i.test(id) ? id : new ObjectID();

//   return fn(this);
// };

Crawler.prototype.save = function (fn) {
  // TODO: create another method to use only for creating to get createdAt date
  fn = fn || noop;
  let self = this;

  self.updatedAt = Date.now(); // moment().format();
  // TODO: send it to update

  // self.createdAt = Date.now(); // moment().format();


  // update or create if not found
  crawlerModel.findByIdAndUpdate(self._id, self, { new: true, upsert: true }, function (err, doc) {
    if (err) return fn(err);
    return fn();
  });
  return this;
};

Crawler.prototype.startPreProcessing = function (crawler, fn) {
  fn = fn || noop;
  let self = this;



  this.createExecutionDocument(crawler, function (err, executionDoc) {
    if (err) return fn(err);
    // executionDoc is a modified crawler object and saved in Excecutions collection
    // console.log(executionDoc);
    // TODO: start kue.process for the crawler
    return createProcessQueuedURLs(executionDoc, function () {
      return queStartingExecutionURLs(executionDoc, fn);
    });

    // preProcessCrawlerURLs('START', crawler, fn);
  });

  // return fn();
};

Crawler.prototype.createExecutionDocument = function (crawler, fn) {
  fn = fn || noop;

  // modifying crawler document for execution document
  delete crawler._id;
  delete crawler.createdAd;
  crawler.startedAt = Date.now();
  crawler.finishedURLs = [];
  // create crawler Execution document in MongoDB
  executionModel.findOneAndUpdate({ crawlerCustomId: crawler.crawlerCustomId, startedAt: crawler.startedAt },
    crawler, { new: true, upsert: true }, function (err, executionDoc) {
      if (err) return fn(err);
      return fn(null, executionDoc);
    });
};

function createProcessQueuedURLs(executionDoc, fn) {
  fn = fn || noop;
  // console.log(executionDoc._id);
  // create as many Processors as allowed for the Execution document
  queue.process('execution:' + executionDoc._id, executionDoc.maxParallelRequests, function (job, done) {
    // getExecutionFinishedURLs(executionDoc._id, function* (err, finishedURLs) {
    // executionModel.findById(executionDoc._id, { _id: 0, finishedURLs: 1 }, function (err, finishedURLs) {
    // if (err) { done(err); }
    // if (finishedURLs.length === executionDoc.maxCrawledPages) done(null, 'Reached maxCrawledPages limit');
    // if (!_.indexOf(finishedURLs, job.data.URL) >= 0) { // continue if not found in finished array

    // } else {
    //   done(new Error('URL ' + job.data.URL + ' already finished'));
    // }
    // done(null, executionDoc);
    // const nightInst =
    new Nightmare({
      show: false, // true/false - showing a loading browser
      ignoreSslErrors: false,
      webSecurity: false
    }).goto(job.data.URL)
      .wait(job.data.waitForSelector)
      .evaluate(function () {
        return document.documentElement.innerHTML;
      })
      .end()
      .then(function (html) {
        let result = {};
        result.htmlLength = html.length;
        result.html = html;
        done(null, result);
      })
      .catch(function (error) {
        // console.error('Search failed:', error);
        done(error);
      });
    // scrape.scrape(job.data.URL, done);


    // TODO: nightmare scroll to bottom (maxInfiniteScrollHeight), wait for no more requests
    // TODO: extract html
    // TODO: extract links -> queNewExecutionURLs
    // TODO: match the page by URL regex -> extract selectors


    // });
    // email(job.data.to, done);
  });
  return fn();
}

function getExecutionFinishedURLs(id, fn) {
  fn = fn || noop;
  executionModel.findById(id, { _id: 0, finishedURLs: 1 }, function (err, array) {
    if (err) fn(err);
    return fn(null, array);
  });
}


function queStartingExecutionURLs(executionDoc, fn) {
  fn = fn || noop;

  // TODO: precheck if URL is not in queue list in Execution document queuedURLs

  const executionStarted = _.after(executionDoc.startingLinks.length, function () {
    fn(null, executionDoc);
  });

  _.forEach(executionDoc.startingLinks, function (startingLink) {
    // console.log(link);
    // if (startingLink.key === 'START') {
    // TODO: pre-check links if they are loadable (correct url; not 301; etc.)
    // TODO: insert pageType to job creation
    // TODO: insert pageType match value to job creation




    // creates Redis crawl que for each starting link
    const job = queue.create('execution:' + executionDoc._id, {
      title: 'execution:' + executionDoc._id + ':url:' + startingLink.url,
      // user: 1,
      URL: startingLink.url,
      match: startingLink.match,
      waitForSelector: startingLink.waitForSelector ? startingLink.waitForSelector : null,
      parser: startingLink.parser,
      execution: executionDoc
    }).attempts(4).backoff(function (attempts, delay) {
      // attempts will correspond to the nth attempt failure so it will start with 0
      // delay will be the amount of the last delay, not the initial delay unless attempts === 0
      let time = 0;
      switch (attempts) {

        case 1: time = 5 * 60 * 1000; break; // 5 mins;
        case 2: time = 30 * 60 * 1000; break; // 30 mins
        case 3: time = 60 * 60 * 1000; break; // 1 hour
        case 4: time = 12 * 60 * 60 * 1000; break; // 12 hours
        default: time = 0; // right away for attempts = 0
      }
      return time;
    }).save(function (err) {
      // if (err) return
      if (err) {
        console.log('error job ' + job.id, err);
        // executionStarted();
      }
      // TODO: should increase queuedLinks array in MongoDB Executions collection
      executionModel.findByIdAndUpdate(
        executionDoc._id,
        { $push: { queuedURLs: job.data.URL } },
        { safe: true, upsert: true },
        function (er, model) {
          // TODO: build error process function which could get all the errors and fill detailed reports about em'
          // if (er) return 1; process MongoDB queue errors
          executionStarted();
        }
      );
    });
    // }
  });
}

exports.get = function (id, user, fn) {
  if (typeof user === 'function' && !fn) {
    fn = user;
    user = '';
  }
  const crawler = new Crawler;

  crawler.id = id;
  crawlerModel.findById(id, function (err, doc) {
    if (err) return fn(err);
    if (!doc) {
      return fn(new Error('crawler "' + id + '" doesn.t exist'));
    }
    // crawler.crawlerCustomId = doc.crawlerCustomId;
    // crawler.tags = doc.tags;
    // crawler.startingLinks = doc.startingLinks;
    // crawler.crawlMatches = doc.crawlMatches;
    // crawler.pageParserExtract = doc.pageParserExtract;
    // crawler.urlIncludeFragment = doc.urlIncludeFragment;
    // crawler.loadImages = doc.loadImages;
    // crawler.loadCss = doc.loadCss;
    // crawler.maxCrawledPages = doc.maxCrawledPages;
    // crawler.maxCrawlDepth = doc.maxCrawlDepth;
    // crawler.crawlSpread = doc.crawlSpread;
    // crawler.maxInfiniteScrollHeight = doc.maxInfiniteScrollHeight;
    // crawler.maxParallelRequests = doc.maxParallelRequests;
    // crawler.finishWebhookUrl = doc.finishWebhookUrl;

    let crawler = new Crawler(doc);

    return fn(err, crawler);
  });
};
