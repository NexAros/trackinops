   function Group(arr) {
       this.arr = arr;
   }
   var winston = require('winston');
   var path = require('path');
   var requestify = require('requestify');
   var Nightmare = require('nightmare');
   var vo = require('vo');
   var cheerio = require('cheerio');
   var moment = require('moment');
   var nightmare = Nightmare({
       show: true, // true/false - showing a loading browser
       ignoreSslErrors: true,
       webSecurity: false
   });
   var current_url;
   var saveToDB = require('../saveToDB.1.js');
   var saveToDBproduct = require('../saveToDBproduct');
   var WHICH = ' conrad.com, '; //i saveToDB logams
   var Promise = require('q').Promise;
   var async = require("async");
   module.exports = function() {
       var current_url;
       var homepageUrl = 'http://www.conrad.com';
       var tiek_id = 42651;
       var deepestGroups = [];
       var totalGroupCount = 0;
       var totalProductCount = 0;
       var now = new Date();

       function formatter(args) {
           var logMessage = moment().format("YYYY-M-D HH:mm:ss") + ' conrad.com, ' + args.message;
           return logMessage;
       }
       var logger = new(winston.Logger)({
           transports: [
               new(winston.transports.Console)(),
               new(winston.transports.File)({
                   filename: path.join(__dirname, '../logs/conrad.log'),
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
               console.dir(message);
           });
           yield nightmare.goto('https://www.google.lt/', 'https://www.google.lt/').then(function(rez) {
               //    if (rez.code == 200) {
               //        console.log('Homepage Ok =' + rez.code + ' on url= ' + rez.url);
               //    } // console.log(rez.referer);        // console.dir(rez.headers);
           });

           // console.log('group, ', this.arr);
           // console.log('groupe, ', group);
           console.log('is viso grupiu: ', group.length);
           var tikrinam = 0;
           // async.forEachLimit(group, 2, function(Grupe, callback) {
           //         var grupe = Grupe;
           //         var duomenys = {};
           //         tikrinam = 0;
           //         if ((grupe.link != null) && (grupe.del_date == null)) {
           //         async.series([
           //             function(callback) {
           //                      var Nightmare = require('nightmare');
           //                     var nightmare = Nightmare({
           //                         show: true, // true/false - showing a loading browser
           //                         ignoreSslErrors: true,
           //                         webSecurity: false
           //                     });
           //                     //  console.log(i, ' ', group.length);
           //                     //logger.info(i, ' ', group.length, group[i].link);
           //                       nightmare.on('console', function(log, message) {
           //                         console.dir(message);
           //                     });
           //                      nightmare.goto(grupe.link).wait(800).then(function(rez) {
           //                         //    if (rez.code == 200) {
           //                         //        console.log('Ok = ' + rez.code + ' on url= ' + rez.url);
           //                         //    }
           //                         callback();
           //                     });
           //                 },
           //                 function(callback) {
           //                     var gr_id = grupe.gr_id;
           //                     current_url = grupe.link;
           //                     //    console.log(' group[i].link', group[i].link);
           //                     grupe.products =  getProducts();
           //                     if (typeof grupe.products!=undefined)
           //                         callback();
           //                 },
           //                 function(callback) {
           //                     //    console.log(' group[i].link',group[i].link);
           //                     console.log('prekiu: ', grupe.products.length);

           //                     var ha;
           //                     ha = saveToDB.saveProductList(grupe, tiek_id, gr_id, WHICH);
           //                     tikrinam = ha;
           //                     while (tikrinam != 1) {
           //                         if (tikrinam == 1)
           //                             callback();
           //                     }
           //                 }

           //         ], callback);
           //         }
           //     },
           //     function(err) {
           //         // All tasks are done now
           //         console.log('baigesi');
           //         // return 1;
           //     });
           var tikrinam = 0;
           for (var i = 0; i < group.length; i++) {
               tikrinam = 0;
               if ((group[i].link != null) && (group[i].del_date == null)) {
                   console.log(i, ' ', group.length);
                   logger.info(i, ' ', group.length, group[i].link);
                   yield nightmare.goto(group[i].link).wait(800).then(function(rez) {
                       //    if (rez.code == 200) {
                       //        console.log('Ok = ' + rez.code + ' on url= ' + rez.url);
                       //    }
                   });
                   var gr_id = group[i].gr_id;
                   current_url = group[i].link;
                   //    console.log(' group[i].link', group[i].link);
                   group[i].products = yield getProducts();
                   //    console.log(' group[i].link',group[i].link);
                   console.log('prekiu: ', group[i].products.length);

                   var ha;
                   ha = yield saveToDB.saveProductList(group[i], tiek_id, gr_id, WHICH);
                   tikrinam = ha;
                   //    while (tikrinam!=1){

                   //    }
               }
           }
           return tree;
       };




       // parse and get products from the group nuo cia
       var getProducts = function*() {
           var group = this.arr;
           var products = [];
           var nav = [];
           var nav_last_nr;
           yield nightmare.evaluate(function() {
               return document.documentElement.innerHTML;
           }).then((html) => {
               $ = cheerio.load(html);
               if ($('div.page-navigation a').length) {
                   $('div.page-navigation a').each(function(i, elem) {
                       nav[i] = {};
                       nav[i].name = $(elem).text();
                       nav[i].url = $(elem).attr('href');
                       if (isNaN(parseInt(nav[i].name)) == false) {
                           nav_last_nr = parseInt(nav[i].name);
                       }
                   });
               } else {
                   nav_last_nr = 1;
               }
           });


           var prod_qnt = 0;
           // console.log('Prie prekiu atejo');
           for (b = 0; b < nav_last_nr; b++) {
               var next;
               yield nightmare.evaluate(function() {
                   return document.documentElement.innerHTML;
               }).then((html) => {
                   $ = cheerio.load(html);
                   $('div.page-navigation a').each(function(i, elem) {
                       next = $(elem).attr('href');
                   });
               });
               var kiek = 0;
               yield nightmare.evaluate(function() {
                   return document.documentElement.innerHTML;
               }).then((html) => {
                   $ = cheerio.load(html);
                   $('div.list-product-item').each(function(i, elem) {
                       var h = 'http://www.conrad.com';
                       products[prod_qnt + i] = {};
                       products[prod_qnt + i].name = $(elem).find('div.product-description span div.name span a').first().text();
                       products[prod_qnt + i].url = $(elem).find('div.product-description span div.name span a').first().attr('href');
                       products[prod_qnt + i].id = parseInt($(elem).find('div.product-description span div.name span a').first().attr('href').split('/product/')[1].split('/')[0]);
                       products[prod_qnt + i].img = $(elem).find('div.product-image > span > a > img').first().attr('src');
                       products[prod_qnt + i].pCode = $(elem).find('div.product-description span div.bestnr strong').first().text();
                       products[prod_qnt + i].qnt = $(elem).find('div.order-details span.product-amount').first().text();
                       products[prod_qnt + i].price = parseFloat($(elem).find('div.product-order-options span.current-price').first().text().replace(' € ', '').replace(',', '.')).toFixed(4);
                       products[prod_qnt + i].date = moment().format("YYYY-M-D HH:mm:ss");
                       // logger.info('Products[', i, '] = ', JSON.stringify(products[i]));
                       kiek++;
                   });
               });
               prod_qnt = prod_qnt + kiek;
               var current_page;
               yield nightmare.evaluate(function() {
                   return document.documentElement.innerHTML;
               }).then((html) => {
                   $ = cheerio.load(html);
                   $('div.page-navigation span.current-page').each(function(i, elem) {
                       current_page = parseInt($(elem).text());
                   });
               });
               // console.log('current_page', current_page);
               if (current_page != nav_last_nr) {
                   //  console.log('current_url', current_url);
                   var next_url = current_url + next;
                   yield nightmare.goto(next_url).then(function(rez) {
                       //    if (rez.code == 200) {
                       //        console.log('Ok = ' + rez.code + ' on url= ' + rez.url);
                       //    }
                   });
               }
           }
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