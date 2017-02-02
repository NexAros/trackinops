let express = require('express');
let router = express.Router();
let crawlersModel = require('../models/crawlers');

/* GET home page. */
router.get('/', function (req, res, next) {
  crawlersModel.find(function (err, docs) {
    if (err) return next(err);
    res.render('index', { title: docs });
  });
});

router.use('/crawlers/', require('./crawlers'));

module.exports = router;
