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
   var saveToDB = require('../../saveToDB');
   var WHICH = ' jsm.lt, ';
   var Promise = require('q').Promise;
   module.exports = function() {
       var current_url;
       var homepageUrl = 'http://www.jsm.lt';
       var tiek_id = 14470;
       var deepestGroups = [];
       var totalGroupCount = 0;
       var totalProductCount = 0;
       var WHICH = ' jsm.lt, ';

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
           var urllink = 'http://127.0.0.1:3001/db/preke/?tiek_id=' + tiek_id; //del_date=null&
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

           //    console.log('groupe, ', group);
           for (var i = 0; i < group.length; i++) {
               if ((group[i].link != null) && (group[i].del_date == null)) {
                   //    console.log('group[i].link', group[i].link);
                   yield nightmare.goto(group[i].link).wait(900).then(function(rez) {
                       //    if (rez.code == 200) {
                       //        console.log('Ok = ' + rez.code + ' on url= ' + rez.url);
                       //    }
                   });
                   var prid = group[i].prid;
                   current_url = group[i].link;
                   group[i].product = yield getProducts();
                    console.log('group[i].product', group[i].product);
                   if (group[i].product != {}) {

                       group[i].product.prid = group[i].prid;
                       //    console.log('group[i].product', group[i].product.brand);
                       console.log('group[i].product', group[i].link);
                       console.log('group[i].product', group[i].product);
                          saveToDB.saveProduct(group[i].product, tiek_id, WHICH);

                   }
               }
           }
           return tree;
       };




       // parse and get products from the group nuo cia
       var getProducts = function*() {
           var group = this.arr;
           var product = {};

           // console.log(empty);

           yield nightmare.evaluate(function() {
               return document.documentElement.innerHTML;
           }).then((html) => {
               $ = cheerio.load(html);
               var empty;
               var empty2;
               if ($('div#items_list_170 > div.empty').length) {
                   empty = true;
               }
               if ($('div.emsg').length) {
                   empty2 = true;
               }

               if (!empty /*&& !empty2*/) {
                   //bar-kodas
                   if ($('li.spec strong').length) {
                       $('li.spec strong').each(function(i, elem) {
                           product.ean = $(elem).text();
                       });
                   }
                   product.images = [];
                   //paveiksliukai
                   if ($('div.holder>a img').length) {
                       $('div.holder>a img').each(function(i, elem) {
                           var h = 'http://www.jsm.lt';
                           product.images[i] = h + $(elem).attr("onclick").split("changeImage('")[1].split('\'')[0];
                       });
                   } else {
                       $('a.watermarked').each(function(i, elem) {
                           var h = 'http://www.jsm.lt/';
                           product.images[i] = h + $(elem).attr("href");
                       });
                   }
                   //charakteristika
                   product.char_name = []; //pavadinimas
                   product.char_value = []; //reiksme
                   if ($('div#specification div.full-specs ul li').length) {
                       $('div#specification div.full-specs ul li').each(function(i, elem) {
                           console.log('atejo ir cia: ');
                           product.char_name[i] = ($(elem).find('span.name').text()).trim().replace(':', '');
                           product.char_value[i] = ($(elem).find('span.value').text()).trim();
                       });
                   }
                   var ki = product.char_name.length;
                   if ($('li.spec').length) {
                       console.log('ki: ', ki);
                       $('li.spec').next().each(function(i, elem) {
                           product.char_name[ki + i] = ($(elem).find('span.name').text()).trim().replace(':', '');
                           product.char_value[ki + i] = ($(elem).find('span.value').text()).trim();
                       });
                   }

                   //gamintojas
                   if ($('li.spec').length) {
                       $('li.spec').each(function(i, elem) {
                           //gamintojas
                           if ($(elem).find('span.name').first().text() == 'Prekinis ženklas:') {
                               product.brand = $(elem).find('span.value').first().text();
                               return false;
                           }
                           //    //description
                           //    if ($(elem).find('span.name').first().text() == 'Pagrindinės charakteristikos:') {
                           //        product.description = $(elem).find('span.value').first().text();
                           //        //    return false;
                           //    }
                       });
                   }
                   //description
                   if ($('div#description div.entry').length) { //other details
                       $('div#description div.entry').each(function(i, elem) {
                           product.description = $(elem).text();
                       });
                   }
               }
           });

           return product; // return product array
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