let express = require('express');
let router = express.Router();
let crawlerModel = require('../lib/models/crawlerModel');

/* GET home page. */
router.get('/', function (req, res, next) {
  crawlerModel.find(function (err, docs) {
    if (err) return next(err);
    res.render('index', { title: docs });
  });
});

router.use('/crawlers/', require('./crawlers'));

module.exports = router;
