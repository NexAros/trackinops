   function Group(arr) {
       this.arr = arr;
   }
   var winston = require('winston');
   var path = require('path');
   var requestify = require('requestify');
   //    var request = require('request').forever();
   var Nightmare = require('nightmare');
   var vo = require('vo');
   var cheerio = require('cheerio');
   var moment = require('moment');
   var nightmare = Nightmare({
       show: true, // true/false - showing a loading browser
       ignoreSslErrors: true,
       webSecurity: false
           //    gotoTimeout: 999999999,
           //    loadTimeout: 999999999,
           //    executionTimeout: 999999999,
           //    waitTimeout: 999999999
   });
   var current_url;
   var saveToDB = require('../../saveToDB.1.js');
   var saveToDBproduct = require('../../saveToDBproduct');
   var WHICH = ' jsm.lt, ';
   var Promise = require('q').Promise;
   var WHICH = ' jsm.lt, ';
   module.exports = function() {
       var current_url;
       var homepageUrl = 'http://www.jsm.lt';
       var tiek_id = 14470;
       var deepestGroups = [];
       var totalGroupCount = 0;
       var totalProductCount = 0;

       function formatter(args) {
           var logMessage = moment().format("YYYY-M-D HH:mm:ss") + ' jsm.lt, ' + args.message;
           return logMessage;
       }
       var logger = new(winston.Logger)({
           transports: [
               new(winston.transports.Console)(),
               new(winston.transports.File)({
                   filename: path.join(__dirname, '../../logs/jsm.log'),
                   json: false,
                   formatter: formatter,
                   prettyPrint: true
               })
           ]
       });

       var getArray = function*() {
           var group;
           var urllink = 'http://127.0.0.1:3001/db/grupe/?tiek_id=' + tiek_id; //del_date=null&
           yield requestify.get(urllink).then(function(response) {
               //console.log(response.getBody());
               group = response.getBody();
               this.arr = group;
               // cb(group);
               return group;
           }).fail(function(res) {
               console.log(res);
               group = [];
               //  cb(group);
               return group;
           });
           return group;
       };

       // parsing Homepage
       var getHome = function*(group) {
           var tree = {};
           yield nightmare.on('console', function(log, message) {
               //    console.dir(message);
           });
           yield nightmare.goto('https://www.google.lt/', 'https://www.google.lt/').then(function(rez) {
               //    if (rez.code == 200) {
               //        console.log('Homepage Ok =' + rez.code + ' on url= ' + rez.url);
               //    } // console.log(rez.referer);        // console.dir(rez.headers);
           });
           // console.log('groupe, ', group);
           console.log('is viso grupiu: ', group.length);
           for (var i = 0; i < group.length; i++) {
            //   console.log(i, ' ', group.length);
            //   logger.info(i, ' ', group.length, group[i].link);
           if (group[i].del_date != null){
                console.log('bla: ', group[i].del_date);
             //  if ((group[i].link != null) && (group[i].del_date == null)) {
                   yield nightmare.goto(group[i].link).wait(800).then(function(rez) {
                       //    if (rez.code == 200) {
                       //        console.log('Ok = ' + rez.code + ' on url= ' + rez.url);
                       //    }
                   });
                   var gr_id = group[i].gr_id;
                   current_url = group[i].link;
                   group[i].products = yield getProducts();
                   //    console.log(group[i].products);

                   console.log('prekiu: ', group[i].products.length);
                   yield nightmare.wait(8000);

                   yield saveToDB.saveProductList(group[i], tiek_id, gr_id, WHICH);


               }
           }
           return tree;
       };

       // parse and get products from the group nuo cia
       var getProducts = function*() {
           var group = this.arr;
           var products = [];
           var empty = yield nightmare.evaluate(function() {
               return document.querySelector('div#items_list_170 > div.empty');
           });
           if (!empty) { // if not null
               var fullPage1 = yield nightmare.evaluate(function() {
                   return document.querySelectorAll('div#items_list_170 div.item div.holder').length;
               });
               if (fullPage1 == 30) { // fullPage contains 30 products
                   console.log('Full page 1 => Scroll to bottom ')
                       // scroll to bottom
                   var previousHeight, currentHeight = 0;
                   while (previousHeight !== currentHeight) {
                       previousHeight = currentHeight;
                       var currentHeight = yield nightmare.evaluate(function() {
                           return document.body.scrollHeight;
                       });

                       yield nightmare.scrollTo(currentHeight, 0)
                           .wait(1000);
                   }
               }
               // get all products html
               var prodContainer = yield nightmare.evaluate(function() {
                   return document.querySelector('div#items_list_170').innerHTML;
               });
               // console.dir(prodContainer);

               // cheerio get product data from html
               $ = cheerio.load(prodContainer);
               // console.log($('div.item div.holder'));
               if ($('div.item div.holder').length)
               var i=0;
               $('div.item div.holder').each(function(j, elem) {
                   //products[i].name = $(this).text();
                //   if (($(elem).find('h3 a').first().attr('href') )*='preke'){
                    
                 if (($(elem).find('h3 a').first().attr('href')) != '/cms/main/itempage'){
                   var h = 'http://www.jsm.lt';
                   products[i] = {};
               
                   products[i].name = $(elem).find('h3 a').first().text();
                   products[i].url = h + $(elem).find('h3 a').first().attr('href');
                //    if ($('h3 a').first().attr('href'))
                // console.log($(elem).find('h3 a').first().attr('href'));
                   products[i].id = parseInt((h + $(elem).find('h3 a').first().attr('href')).split('/preke/')[1].split('-')[0]);
                   
                   products[i].img = h + $(elem).find('div.image > a > img').first().attr('src');
                   products[i].pCode = parseInt($(elem).find('div.description > ul > li > strong').first().text().replace('Prekės kodas: ', ''));
                   products[i].qnt = $(elem).find('div.prices div.price span.qnt').first().text();
                   $(elem).find('div.prices div.price sub').first().remove();
                   $(elem).find('div.prices div.price span.qnt').first().remove();
                   var sup = $(elem).find('div.prices div.price sup').first();
                   $(elem).find('div.prices div.price sup').first().remove();
                   products[i].price = parseFloat(parseInt($(elem).find('div.prices div.price').first().text()) + '.' + sup.text()).toFixed(4); //.toFixed(2);
                   products[i].date = moment().format("YYYY-M-D HH:mm:ss");
                   i=i+1;
                   }
                   else{
                    console.log('skipinam');
                   }
               });

           }
           // else {
           //     return products.length == 0 ? 'null' : products;
           // }
           // console.dir(products);
           return products; // return products array
       };

       var convertLink = function(url) {
           url = url.replace("ą", "%c4%85").replace("č", "%c4%8d").replace("ę", "%c4%99").replace("ė", "%c4%97").replace("į", "%c4%af").replace("š", "%c5%a1").replace("ų", "%c5%b3").replace("ū", "%c5%ab").replace("ž", "%c5%be").replace("Ą", "%c4%84").replace("Č", "%c4%8c").replace("Ę", "%c4%98").replace("Ė", "%c4%96").replace("Į", "%c4%ae").replace("Š", "%c5%a0").replace("Ų", "%c5%b2").replace("Ū", "%c5%aa").replace("Ž", "%c5%bd").replace(" ", "%20");
           // int getIndex = url.indexOf("?force_sid");
           // if (getIndex > 0) {
           //     url = url.substring(0, getIndex);
           // }
           if (!url.contains(homepageUrl)) {
               url = homepageUrl + url;
           }
           return url;
       }

       var run = function*() {
           //start parsing JSM product tree from homepage
           var allProductTree = vo(getArray, getHome /*, getGroups*/ /*, saveProducts*/ /*, saveTree*/ ) // creating product tree Pipeline
               // yield vo([allProductTree /*, allProducts*/ ])
           yield vo(allProductTree /*, allProducts*/ )
               .then(function(rez) {
                   if (rez) {
                       console.dir(rez);
                   }
                   console.log('done');
                   logger.info('done');
               })
               .catch(function(e) {
                   console.error(e);
               });
           // yield nightmare.wait(5000);
           yield nightmare.end().catch(function(error) {
               console.error('Search failed:', error);
           });
       };

       vo(run)(function(err, result) {
           if (err) throw err;
       });

       process.on('uncaughtException', function(e) {
           console.log(new Date().toString(), e.stack || e);
           process.exit(1);
       });

   };