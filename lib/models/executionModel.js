const Schema = require('mongoose').Schema;

const subSchemaParser = new Schema(
  {
    path: String,
    name: String,
    sku: String,
    productId: String,
    groupId: String,
    price: String,
    currency: String,
    image: String,
    description: String
  }, { _id: false });

const subSchemaStartingLinks = new Schema({
  url: String, // required
  match: String,
  waitForSelector: String,
  parser: [subSchemaParser]
}, { _id: false });

const subSchemaCrawlMatches = new Schema({
  match: String,
  urlRegEx: String,  // required
  waitForSelector: String,
  parser: [subSchemaParser]
}, { _id: false });

const executionSchema = new Schema({
  crawlerCustomId: String,
  tags: [String],
  startedAt: { type: Date },
  updatedAt: { type: Date },
  finishedAt: { type: Date },
  status: String, // RUNNING SUCCEEDED STOPPED TIMEOUT FAILED
  queuedURLs: [String],
  finishedURLs: [String],
  startingLinks: [subSchemaStartingLinks],
  crawlMatches: [subSchemaCrawlMatches],
  // pageParserExtract: [
  //   {
  //     match: String,
  //     url: String,
  //     path: { selector: String, value: String },
  //     name: { selector: String, value: String },
  //     code: { selector: String, value: String },
  //     price: { selector: String, value: String },
  //     images: { selector: String, value: [String] },
  //     description: { selector: String, value: String }
  //   }
  // ],
  urlIncludeFragment: { type: Boolean, default: true },
  loadImages: { type: Boolean, default: true },
  loadCss: { type: Boolean, default: true },
  maxCrawledPages: { type: Number, default: 50 },
  maxCrawlDepth: { type: Number, default: 10 },
  crawlSpread: String,
  maxInfiniteScrollHeight: { type: Number, default: 2000 },
  maxParallelRequests: { type: Number, default: 3 },
  finishWebhookUrl: String
});

/* global db */
module.exports = db.model('executions', executionSchema);
