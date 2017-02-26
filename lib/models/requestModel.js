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
  pageType: String,
  responseStatus: Number,
  responseHeaders: Object, // TODO: can't be Object

  parserStartedAt: Date,
  parserFinishedAt: Date,
  parserResult: subSchemaParser,

  // TODO: insert uniqueUrl generation and check for duplicate jobs on the uniqueUrl
  // String that uniquely identifies the web page in the crawling queue.
  // uniqueUrl should be generated from the 'url' property as follows:
  //  1 hostname and protocol is converted to lower-case
  //  2 trailing slash is removed
  //  3 common tracking parameters starting with 'utm_' are removed
  //  4 query parameters are sorted alphabetically
  //  5 whitespaces around all components of the URL are trimmed
  //  6 if the 'urlIncludeFragment' setting is disabled, the URL fragment is removed completely
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
