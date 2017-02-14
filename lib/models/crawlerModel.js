const Schema = require('mongoose').Schema;
const crawlerSchema = new Schema({
  crawlerCustomId: String, // TODO: place unique = true
  createdAd: { type: Date },
  updatedAt: { type: Date },
  tags: { type: [String], index: true },
  startingLinks: [
    {
      url: String, // required
      match: String,
      waitForSelector: String,
      parser: [
        {
          path: String,
          name: String,
          code: String,
          productId: String,
          groupId: String,
          price: String,
          image: String,
          description: String
        }
      ]
    }
  ],
  crawlMatches: [
    {
      match: String,
      urlRegEx: String,  // required
      waitForSelector: String,
      parser: [
        {
          path: String,
          name: String,
          code: String,
          productId: String,
          groupId: String,
          price: String,
          image: String,
          description: String
        }
      ]
    }
  ],
  // pageParserExtract: [
  //   {
  //     match: String,
  //     url: String,
  //     parser: [
  //       {
  //         path: { selector: String, value: String },
  //         name: { selector: String, value: String },
  //         code: { selector: String, value: String },
  //         price: { selector: String, value: String },
  //         images: { selector: String, value: [String] },
  //         description: { selector: String, value: String }
  //       }
  //     ]
  //   }
  // ],
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
