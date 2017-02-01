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
   var saveToDB = require('../saveToDB');
   var saveToDBproduct = require('../saveToDBproduct');
   var WHICH = ' conrad.com, '; //i saveToDB logams
   var Promise = require('q').Promise;
   module.exports = function() {
       var current_url;
       var homepageUrl = 'http://www.conrad.com';
       var tiek_id = 42651;
       var deepestGroups = [];
       var totalGroupCount = 0;
       var totalProductCount = 0;
       var now = new Date();

       function formatter(args) {
           var year = now.getFullYear();
           var month = now.getMonth();
           var day = now.getDate();
           var hours = now.getHours();
           var minutes = now.getMinutes();
           var seconds = now.getSeconds();
           var logMessage = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds + ' conrad.com, ' + args.message;
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
               console.dir(message);
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
                   yield nightmare.goto(group[i].link).wait(800).then(function(rez) {
                       //    if (rez.code == 200) {
                       //        console.log('Ok = ' + rez.code + ' on url= ' + rez.url);
                       //    }
                   });
                   var prid = group[i].prid;
                   current_url = group[i].link;
                   group[i].product = yield getProducts();
                   group[i].product.prid = group[i].prid;
                   //    console.log('group[i].product', group[i].product.brand);
                   //    console.log('group[i].product', group[i].link);
                   saveToDB.saveProduct(group[i].product, tiek_id, WHICH);
               }
           }
           return tree;
       };




       // parse and get products from the group nuo cia
       var getProducts = function*() {
           var group = this.arr;
           var product = {};
           yield nightmare.evaluate(function() {
               return document.documentElement.innerHTML;
           }).then((html) => {
               $ = cheerio.load(html);
               //    product.price
               if ($('div.produktpreis span.price').length) {
                   $('div.produktpreis span.price').each(function(i, elem) {
                       product.price = parseFloat($(elem).text().replace(',', '.')).toFixed(4);
                   });
               }
               //ean
               if ($('span#mc_info_ean_code').length) {
                   //find(selector).length > 0
                   $('span#mc_info_ean_code').each(function(i, elem) {
                       product.ean = 'EAN:' + $(elem).text();
                   });
               }
               product.images = [];
               //paveiksliukai
               if ($('div.product-images-pager span:not(.swiper-pagination-video) img').length) {
                   //find(selector).length > 0
                   $('div.product-images-pager span:not(.swiper-pagination-video) img').each(function(i, elem) {
                       var h = 'http://www.conrad.com';
                       //childNodes[i] = {};
                       //    $(elem).find('span.swiper-pagination-video img').first().remove();
                       //  childNodes[i].name = $(elem).text().split('(')[0];
                       product.images[i] = {};
                       product.images[i] = h + $(elem).first().attr('src');
                       // childNodes[i].url = $(elem).attr('href');
                       // childNodes[i].id = $(elem).attr('id');
                   });

                   // $('div.submenulist div.category>a span.headline').each(function(i, elem) {
                   //     //  childNodes[i] = {};
                   //     childNodes[i].name = $(elem).text();
                   // });
               }
               //charakteristika
               product.char_name = []; //pavadinimas
               product.char_value = []; //reiksme
               if ($('div.technischedaten2 table tr').length) {
                   $('div.technischedaten2 table tr').each(function(i, elem) {
                       product.char_name[i] = ($(elem).find('th').text()).trim();
                       product.char_value[i] = ($(elem).find('td').text()).trim();
                   });
               }
               //gamintojas
               if ($('div.brand-logo a').length) {
                   $('div.brand-logo a').each(function(i, elem) {
                       product.brand = ($(elem).attr('href')).split('/brand/')[1];
                       return false;
                   });
               } else if ($('img#brand').length) {
                   $('img#brand').each(function(i, elem) {
                       product.brand = ($(elem).attr('title')).split(' of ')[1];
                       return false;
                   });
               }
               //description
               if ($('div#details [id*="beschreibung"] p:nth-child(2)').length) {
                   $('div#details [id*="beschreibung"] p:nth-child(2)').each(function(i, elem) {
                       product.description = $(elem).text();

                   });
               } else {
                   if ($('div.inner div.produktbezeichnung h2').length) { //other details
                       $('div.inner div.produktbezeichnung h2').each(function(i, elem) {
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