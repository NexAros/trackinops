const Schema = require('mongoose').Schema;

const lastUpdatedExecution = new Schema(
  {
    _id: Schema.Types.ObjectId,
    crawlerCustomId: String,
    startedAt: { type: Date },
    finishedAt: { type: Date },
    status: String
  });

const categorySchema = new Schema({
  name: String,
  parent: String,
  category: String,
  categoryId: String,
  createdAt: { type: Date },
  updatedAt: { type: Date },
  lastUpdatedExecution: { lastUpdatedExecution }
});

/* global db */
module.exports = db.model('categories', categorySchema);
