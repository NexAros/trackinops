const _ = require('lodash');
const util = require('util');
const noop = function () { };
const crawlerModel = require('./models/crawlerModel');
const executionModel = require('./models/executionModel');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const kue = require('kue');
const queue = kue.createQueue();
const request = require('request');
const Nightmare = require('nightmare');
// const vo = require('vo');
const cheerio = require('cheerio');
const scrape = require('./scrape');

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

// exports.get
Crawler.prototype.get = function (id, user, fn) {
  if (typeof user === 'function' && !fn) {
    fn = user;
    user = '';
  }
  const crawler = new Crawler;

  crawler._id = id;
  // TODO: include filter by user id
  crawlerModel.findById(id, function (err, doc) {
    if (err) return fn(err);
    if (!doc) {
      return fn(new Error('crawler "' + crawler._id + '" doesn.t exist'));
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
    console.log(executionDoc);
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
  console.log(executionDoc._id);
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
      .evaluate(function () {
        return document.documentElement.innerHTML;
      })
      .end()
      .then(function (html) {
        // console.log(html);
        let result = {};
        result.length = html.length;

        $ = cheerio.load(html);

        // tree.children = [];
        // $('#nav td.level1.ces ul.level2 > li > a').each(function (i, elem) {
        //   tree.children[i] = {};
        //   tree.children[i].name = $(elem).text();
        //   tree.children[i].url = $(elem).attr('href');
        //   tree.children[i].id = parseInt($(elem).attr('href').split('/SHOP_AREA_')[1].split('-')[0]);
        // });

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
    if (startingLink.key === 'START') {
      // TODO: pre-check links if they are loadable (correct url; not 301; etc.)
      // TODO: insert pageType to job creation
      // TODO: insert pageType match value to job creation




      // creates Redis crawl que for each starting link
      const job = queue.create('execution:' + executionDoc._id, {
        title: 'execution:' + executionDoc._id + ':' + startingLink.value,
        // user: 1,
        URL: startingLink.value,
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
          executionStarted();
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
    }
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

// /**
//  * Return a function that handles fetching
//  * of jobs by the ids fetched.
//  *
//  * @param {Function} fn
//  * @param {String} order
//  * @param {String} jobType
//  * @return {Function}
//  * @api private
//  */

// function get(fn, order, jobType) {
//   return function (err, ids) {
//     if (err) return fn(err);
//     var pending = ids.length
//       , jobs = {};
//     if (!pending) return fn(null, ids);
//     ids.forEach(function (id) {
//       id = redis.client().stripFIFO(id); // turn zid back to regular job id
//       exports.get(id, jobType, function (err, job) {
//         if (err) {
//           console.error(err);
//         } else {
//           jobs[redis.client().createFIFO(job.id)] = job;
//         }
//         --pending || fn(null, 'desc' == order
//           ? map(jobs, ids).reverse()
//           : map(jobs, ids));

//       });
//     });
//   }
// }

// /**
//  * Get with the range `from`..`to`
//  * and invoke callback `fn(err, ids)`.
//  *
//  * @param {Number} from
//  * @param {Number} to
//  * @param {String} order
//  * @param {Function} fn
//  * @api public
//  */

// exports.range = function (from, to, order, fn) {
//   redis.client().zrange(redis.client().getKey('jobs'), from, to, get(fn, order));
// };

// /**
//  * Get jobs of `state`, with the range `from`..`to`
//  * and invoke callback `fn(err, ids)`.
//  *
//  * @param {String} state
//  * @param {Number} from
//  * @param {Number} to
//  * @param {String} order
//  * @param {Function} fn
//  * @api public
//  */

// exports.rangeByState = function (state, from, to, order, fn) {
//   redis.client().zrange(redis.client().getKey('jobs:' + state), from, to, get(fn, order));
// };

// /**
//  * Get jobs of `type` and `state`, with the range `from`..`to`
//  * and invoke callback `fn(err, ids)`.
//  *
//  * @param {String} type
//  * @param {String} state
//  * @param {Number} from
//  * @param {Number} to
//  * @param {String} order
//  * @param {Function} fn
//  * @api public
//  */

// exports.rangeByType = function (type, state, from, to, order, fn) {
//   redis.client().zrange(redis.client().getKey('jobs:' + type + ':' + state), from, to, get(fn, order, type));
// };
// /**
//  * Remove job `id` if it exists and invoke callback `fn(err)`.
//  *
//  * @param {Number} id
//  * @param {Function} fn
//  * @api public
//  */

// exports.remove = function (id, fn) {
//   fn = fn || noop;
//   exports.get(id, function (err, job) {
//     if (err) return fn(err);
//     if (!job) return fn(new Error('failed to find job ' + id));
//     job.remove(fn);
//   });
// };

// /**
//  * Get log for job `id` and callback `fn(err, log)`.
//  *
//  * @param {Number} id
//  * @param {Function} fn
//  * @return {Type}
//  * @api public
//  */

// exports.log = function (id, fn) {
//   /*redis*/
//   Job.client/*()*/.lrange(Job.client.getKey('job:' + id + ':log'), 0, -1, fn);
// };



// /**
//  * Inherit from `EventEmitter.prototype`.
//  */

// Job.prototype.__proto__ = EventEmitter.prototype;

// /**
//  * Return JSON-friendly object.
//  *
//  * @return {Object}
//  * @api public
//  */

// Job.prototype.toJSON = function () {
//   return {
//     id: this.id
//     , type: this.type
//     , data: this.data
//     , result: this.result
//     , priority: this._priority
//     , progress: this._progress || 0
//     , progress_data: this.progress_data
//     , state: this._state
//     , error: this._error
//     , created_at: this.created_at
//     , promote_at: this.promote_at
//     , updated_at: this.updated_at
//     , failed_at: this.failed_at
//     , started_at: this.started_at
//     , duration: this.duration
//     , delay: this._delay
//     , workerId: this.workerId
//     , ttl: this._ttl
//     , attempts: {
//       made: Number(this._attempts) || 0
//       , remaining: this._attempts > 0 ? this._max_attempts - this._attempts : Number(this._max_attempts) || 1
//       , max: Number(this._max_attempts) || 1
//     }
//   };
// };


// Job.prototype.refreshTtl = function () {
//   ('active' === this.state() && this._ttl > 0)
//     ?
//     this.client.zadd(this.client.getKey('jobs:' + this.state()), Date.now() + parseInt(this._ttl), this.zid, noop)
//     :
//     noop();
// };


// /**
//  * Log `str` with sprintf-style variable args or anything (objects,arrays,numbers,etc).
//  *
//  * Examples:
//  *
//  *    job.log('preparing attachments');
//  *    job.log('sending email to %s at %s', user.name, user.email);
//  *    job.log({key: 'some key', value: 10});
//  *    job.log([1,2,3]);
//  *
//  * Specifiers:
//  *
//  *   - %s : string
//  *   - %d : integer
//  *
//  * @param {String} str
//  * @param {Mixed} ...
//  * @return {Job} for chaining
//  * @api public
//  */

// Job.prototype.log = function (str) {
//   if (typeof str === 'string') {
//     var formatted = util.format.apply(util, arguments);
//   } else {
//     var formatted = util.inspect(str);
//   }
//   this.client.rpush(this.client.getKey('job:' + this.id + ':log'), formatted, noop);
//   this.set('updated_at', Date.now());
//   return this;
// };

// /**
//  * Get job `key`
//  *
//  * @param {String} key
//  * @param {Function} fn
//  * @return {Job} for chaining
//  * @api public
//  */

// Job.prototype.get = function (key, fn) {
//   this.client.hget(this.client.getKey('job:' + this.id), key, fn || noop);
//   return this;
// };

// /**
//  * Set the job progress by telling the job
//  * how `complete` it is relative to `total`.
//  * data can be used to pass extra data to job subscribers
//  *
//  * @param {Number} complete
//  * @param {Number} total
//  * @param {Object} data
//  * @return {Job} for chaining
//  * @api public
//  */

// Job.prototype.progress = function (complete, total, data) {
//   if (0 == arguments.length) return this._progress;
//   var n = Math.min(100, complete * 100 / total | 0);
//   this.set('progress', n);

//   // If this stringify fails because of a circular structure, even the one in events.emit would.
//   // So it does not make sense to try/catch this.
//   if (data) this.set('progress_data', JSON.stringify(data));

//   this.set('updated_at', Date.now());
//   this.refreshTtl();
//   events.emit(this.id, 'progress', n, data);
//   return this;
// };

// /**
//  * Set the job delay in `ms`.
//  *
//  * @param {Number|Date} delay in ms or execution date
//  * @return {Job|Number}
//  * @api public
//  */

// Job.prototype.delay = function (ms) {
//   if (0 == arguments.length) return this._delay;
//   if (_.isDate(ms)) {
//     ms = parseInt(ms.getTime() - Date.now())
//   }
//   if (ms > 0) {
//     this._delay = ms;
//   }
//   return this;
// };


// Job.prototype.remove = function (fn) {
//   var client = this.client;
//   client.multi()
//     .zrem(client.getKey('jobs:' + this.state()), this.zid)
//     .zrem(client.getKey('jobs:' + this.type + ':' + this.state()), this.zid)
//     .zrem(client.getKey('jobs'), this.zid)
//     .del(client.getKey('job:' + this.id + ':log'))
//     .del(client.getKey('job:' + this.id))
//     .exec(function (err) {
//       //            events.remove(this);
//       events.emit(this.id, 'remove', this.type);
//       if (!exports.disableSearch) {
//         getSearch().remove(this.id, fn);
//       } else {
//         fn && fn(err);
//       }
//     }.bind(this));
//   return this;
// };

// /**
//  * Set state to `state`.
//  *
//  * @param {String} state
//  * @param fn
//  * @return {Job} for chaining
//  * @api public
//  */
// Job.prototype.state = function (state, fn) {
//   if (0 == arguments.length) return this._state;
//   var client = this.client
//     , fn = fn || noop;
//   var oldState = this._state;
//   var multi = client.multi();
//   if (oldState && oldState != '' && oldState != state) {
//     multi
//       .zrem(client.getKey('jobs:' + oldState), this.zid)
//       .zrem(client.getKey('jobs:' + this.type + ':' + oldState), this.zid);
//   }
//   multi
//     .hset(client.getKey('job:' + this.id), 'state', state)
//     .zadd(client.getKey('jobs:' + state), this._priority, this.zid)
//     .zadd(client.getKey('jobs:' + this.type + ':' + state), this._priority, this.zid);

//   // use promote_at as score when job moves to delayed
//   ('delayed' === state) ? multi.zadd(client.getKey('jobs:' + state), parseInt(this.promote_at), this.zid) : noop();
//   ('active' === state && this._ttl > 0) ? multi.zadd(client.getKey('jobs:' + state), Date.now() + parseInt(this._ttl), this.zid) : noop();
//   ('active' === state && !this._ttl) ? multi.zadd(client.getKey('jobs:' + state), this._priority < 0 ? this._priority : -this._priority, this.zid) : noop();
//   ('inactive' === state) ? multi.lpush(client.getKey(this.type + ':jobs'), 1) : noop();

//   this.set('updated_at', Date.now());
//   this._state = state;
//   multi.exec(function (err, replies) {
//     if (!err) {
//       (this._state === 'inactive') ? events.emit(this.id, 'enqueue', this.type) : noop();
//     }
//     return fn(err);
//   }.bind(this));
//   return this;
// };

// /**
//  * Set the job's failure `err`.
//  *
//  * @param {Error} err
//  * @return {Job} for chaining
//  * @api public
//  */

// Job.prototype.error = function (err) {
//   var str, summary;
//   if (0 == arguments.length) return this._error;

//   if ('string' == typeof err) {
//     str = err;
//     summary = '';
//   } else {
//     if (err.stack && 'string' === typeof err.stack) {
//       str = err.stack
//     } else { //TODO what happens to CallSite[] err.stack?
//       str = err.message
//     }
//     summary = ('string' === typeof str) ? str.split('\n')[0] : '';
//   }
//   this.set('error', str);
//   this.log('%s', summary);
//   events.emit(this.id, 'error', str);
//   return this;
// };

// /**
//  * Set state to "complete", and progress to 100%.
//  */

// Job.prototype.complete = function (clbk) {
//   return this.set('progress', 100).state('complete', clbk);
// };

// /**
//  * Set state to "failed".
//  */

// Job.prototype.failed = function (clbk) {
//   this.failed_at = Date.now();
//   return this.set('failed_at', this.failed_at).state('failed', clbk);
// };

// /**
//  * Set state to "inactive".
//  */

// Job.prototype.inactive = function (clbk) {
//   return this.state('inactive', clbk);
// };

// /**
//  * Set state to "active".
//  */

// Job.prototype.active = function (clbk) {
//   return this.state('active', clbk);
// };

// /**
//  * Set state to "delayed".
//  */

// Job.prototype.delayed = function (clbk) {
//   return this.state('delayed', clbk);
// };

// /**
//  * Subscribe this job for event mapping.
//  *
//  * @return {Job} for chaining
//  * @api public
//  */

// Job.prototype.subscribe = function (callback) {
//   if (this._jobEvents) {
//     events.add(this, callback);
//   } else {
//     callback && callback();
//   }
//   return this;
// };
