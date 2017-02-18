const Schema = require('mongoose').Schema;

const subSchemaParser = new Schema(
  {
    path: String,
    name: String,
    sku: String,
    productId: String,
    categoryId: String,
    price: String,
    currency: String,
    image: String,
    description: String
  }, { _id: false });


const requestSchema = new Schema({
  executionId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  url: String,
  loadedUrl: String,
  requestedAt: Date,
  loadingStartedAt: Date,
  loadingFinishedAt: Date,
  responseStatus: Number,
  responseHeaders: Object, // TODO: can't be Object

  parserStartedAt: Date,
  parserFinishedAt: Date,
  parserResult: subSchemaParser,

  // TODO: do later like this:
  // An arbitrary string that uniquely identifies the web page in the crawling queue.
  // It is used by the crawler to determine whether a page has already been visited.
  // If two or more pages have the same uniqueKey, then the crawler only visits the first one.
  //
  // By default, uniqueKey is generated from the 'url' property as follows:
  //  * hostname and protocol is converted to lower-case
  //  * trailing slash is removed
  //  * common tracking parameters starting with 'utm_' are removed
  //  * query parameters are sorted alphabetically
  //  * whitespaces around all components of the URL are trimmed
  //  * if the 'considerUrlFragment' setting is disabled, the URL fragment is removed completely
  //
  // If you prefer different generation of uniqueKey, you can override it in the 'interceptRequest'
  // or 'context.enqueuePage' functions.
  uniqueUrl: {
    type: String,
    unique: true
  },

  contentType: String,
  method: String,
  referrer: String,
  downloadedBytes: Number,

  depth: Number,

  errorInfo: String
});

/* global db */
module.exports = db.model('requests', requestSchema);
