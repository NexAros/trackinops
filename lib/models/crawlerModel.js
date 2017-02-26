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

const subSchemaStartingLinks = new Schema({
  url: String, // required
  pageType: String,
  waitForSelector: String,
  parser: subSchemaParser
}, { _id: false });

const subSchemaCrawlMatches = new Schema({
  pageType: String,
  urlRegEx: String,  // required
  waitForSelector: String,
  parser: subSchemaParser
}, { _id: false });

const crawlerSchema = new Schema({
  crawlerCustomId: String, // TODO: place unique = true
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: { type: Date },
  tags: { type: [String], index: true },
  startingLinks: [subSchemaStartingLinks],
  crawlMatches: [subSchemaCrawlMatches],
  urlIncludeFragment: { type: Boolean, default: true },
  loadImages: { type: Boolean, default: true },
  loadCss: { type: Boolean, default: true },
  maxCrawledPages: { type: Number, default: 50 },
  maxCrawlDepth: { type: Number, default: 3 },
  crawlSpread: {
    type: String,
    enum: ['singleDomain', 'multiDomain']
  },
  maxInfiniteScrollHeight: { type: Number, default: 2000 },
  maxParallelRequests: { type: Number, default: 3 },
  finishWebhookUrl: String
});

/* global db */
module.exports = db.model('crawlers', crawlerSchema);
