let _ = require('lodash');
let util = require('util');
let noop = function () { };
let crawlerModel = require('./models/crawlerModel');
/**
 * Expose `Crawler`.
 */

exports = module.exports = Crawler;

/**
 * Initialize a new `Job` with the given `type` and `data`.
 *
 * @param {String} type
 * @param {Object} data
 * @api public
 */

function Crawler(data) {
  // this.type = type;
  this.data = data || {};
  // this._max_attempts = 1;
  // this._jobEvents = exports.jobEvents;
  // //  this.client = redis.client();
  // this.client = Job.client/* || (Job.client = redis.client())*/;
  // this.priority('normal');
  // this.on('error', function (err) {
  // });// prevent uncaught exceptions on failed job errors
}

/**
 * Get job with `id` and callback `fn(err, job)`.
 *
 * @param {Number} id
 * @param {String} jobType is optional
 * @param {Function} fn
 * @api public
 */

// exports.get
Crawler.prototype.get = function (id, user, fn) {
  if (typeof user === 'function' && !fn) {
    fn = user;
    user = '';
  }
  let crawler = new Crawler;

  crawler.id = id;
  // TODO: include filter by user id
  crawlerModel.findById(crawler.id, function (err, hash) {
    if (err) return fn(err);
    if (!hash) {
      return fn(new Error('crawler "' + crawler.id + '" doesnt exist'));
    }
    fn(err, crawler);
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
//  * Save the job, optionally invoking the callback `fn(err)`.
//  *
//  * @param {Function} fn
//  * @return {Job} for chaining
//  * @api public
//  */

// Job.prototype.save = function (fn) {
//   var client = this.client
//     , fn = fn || noop
//     , max = this._max_attempts
//     , self = this;

//   // update
//   if (this.id) return this.update(fn);

//   // incr id
//   client.incr(client.getKey('ids'), function (err, id) {
//     if (err) return fn(err);
//     // add the job for event mapping
//     self.id = id;
//     self.zid = client.createFIFO(id);
//     self.subscribe(function () {
//       self._state = self._state || (this._delay ? 'delayed' : 'inactive');
//       if (max) { self.set('max_attempts', max); }
//       client.sadd(client.getKey('job:types'), self.type, noop);
//       self.set('type', self.type);
//       var now = Date.now();
//       self.created_at = now;
//       self.set('created_at', self.created_at);
//       self.promote_at = now + (self._delay || 0);
//       self.set('promote_at', self.promote_at);
//       self.update(fn);
//     }.bind(this));
//   }.bind(this));
//   return this;
// };

// /**
//  * Update the job and callback `fn(err)`.
//  *
//  * @param {Function} fn
//  * @api public
//  */

// Job.prototype.update = function (fn) {
//   var json;

//   // serialize json data
//   try {
//     json = JSON.stringify(this.data);
//   } catch (err) {
//     fn(err);
//     return this;
//   }

//   // delay
//   if (this._delay) {
//     this.set('delay', this._delay);
//     if (this.created_at) {
//       var timestamp = parseInt(this.failed_at || this.created_at, 10)
//         , delay = parseInt(this._delay);
//       this.promote_at = timestamp + delay;
//       this.set('promote_at', this.promote_at);
//     }
//   }
//   if (this._ttl) {
//     this.set('ttl', this._ttl);
//   }
//   if (this._removeOnComplete) this.set('removeOnComplete', this._removeOnComplete);
//   if (this._backoff) {
//     if (_.isPlainObject(this._backoff)) this.set('backoff', JSON.stringify(this._backoff));
//     else this.set('backoff', this._backoff.toString());
//   }

//   // updated timestamp
//   this.set('updated_at', Date.now());
//   this.refreshTtl();

//   // priority
//   this.set('priority', this._priority);

//   this.client.zadd(this.client.getKey('jobs'), this._priority, this.zid, noop);

//   // data
//   this.set('data', json, function () {
//     // state
//     this.state(this._state, fn);
//   }.bind(this));

//   if (!exports.disableSearch) {
//     if (this.searchKeys()) {
//       this.searchKeys().forEach(function (key) {
//         var value = _.get(this.data, key);
//         if (!_.isString(value)) {
//           value = JSON.stringify(value);
//         }
//         getSearch().index(value, this.id);
//       }.bind(this));
//     } else {
//       getSearch().index(json, this.id);
//     }
//   }
//   return this;
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
