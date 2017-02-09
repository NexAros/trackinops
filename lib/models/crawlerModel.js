const Schema = require('mongoose').Schema;
const crawlerSchema = new Schema({
  crawlerCustomId: String,
  createdAd: { type: Date },
  updatedAt: { type: Date },
  tags: { type: [String], index: true },
  startingLinks: [
    {
      key: String,
      value: String
    }
  ],
  crawlMatches: [
    {
      match: String,
      urlRegEx: String,
      selector: String
    }
  ],
  pageParserExtract: [
    {
      match: String,
      url: String,
      path: { selector: String, value: String },
      name: { selector: String, value: String },
      code: { selector: String, value: String },
      price: { selector: String, value: String },
      images: { selector: String, value: [String] },
      description: { selector: String, value: String }
    }
  ],
  urlIncludeFragment: { type: Boolean, default: true },
  loadImages: { type: Boolean, default: true },
  loadCss: { type: Boolean, default: true },
  maxCrawledPages: { type: Number, default: 50 },
  maxCrawlDepth: { type: Number, default: 3 },
  crawlSpread: String,
  maxInfiniteScrollHeight: { type: Number, default: 2000 },
  maxParallelRequests: { type: Number, default: 3 },
  finishWebhookUrl: String
});

/* global db */
module.exports = db.model('crawlers', crawlerSchema);
