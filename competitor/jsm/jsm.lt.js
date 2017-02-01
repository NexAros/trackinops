var winston = require('winston');
var path = require('path');

var Nightmare = require('nightmare');
var vo = require('vo');
var cheerio = require('cheerio');
var moment = require('moment');
var nightmare = Nightmare({
    show: false, // true/false - showing a loading browser
    ignoreSslErrors: true,
    webSecurity: false
});
var saveToDB = require('../../saveToDB');
var WHICH = ' jsm.lt, ';



module.exports = function() {
    var homepageUrl = 'http://www.jsm.lt/';
    var kon_id = 14470;
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
                filename: path.join(__dirname, '../../logs/jsm_parse.log'),
                json: false,
                formatter: formatter,
                prettyPrint: true
            })
        ]
    });

    // parsing Homepage
    var getHome = function*(url) {
        var tree = {};
        yield nightmare.goto(url, 'https://www.google.lt/').then(function(rez) {
            if (rez.code == 200) {
                console.log('Homepage Ok =' + rez.code + ' on url= ' + rez.url);
            } // console.log(rez.referer);        // console.dir(rez.headers);
        });

        tree.url = yield nightmare.url();
        tree.date = moment().format("YYYY-M-D HH:mm:ss");
        var title = yield nightmare.title();
        if (title) {
            tree.name = title;
        } else {
            tree.name = tree.url;
        }
        tree.id = 0;

        tree.children = yield nightmare.evaluate(function() {
            return Array.prototype.map.call(document.querySelectorAll('div.dropdown-menu ul h4 a'), function(e) {
                return {
                    'name': e.title,
                    'url': e.href,
                    'id': parseInt(e.href.split('/prekiu-kategorija/')[1].split('-')[0])
                };
            });
        });
        totalGroupCount += tree.children.length;
        console.log('totalGroupCount = ' + totalGroupCount);
        console.log('');

        logger.info('Homepage, ', JSON.stringify(tree));
        // console.log(tree);
        return tree;
    };

    // parsing groups from categories
    var getGroups = function*(tree) {
        // tree = { name:'',url:'',id='',children:[{},{},{}] }
        for (var ind = 0; ind < tree.children.length; ind++) {
            // for (var ind = 0; ind < 1; ind++) {
            //console.log("tree.children[" + ind + "] = " + tree.children[ind].url);
            yield nightmare.goto(tree.children[ind].url).then(function(rez) {
                if (rez.code == 200) {
                    console.log('Ok = ' + rez.code + ' on url= ' + rez.url)
                }
            });
            console.log('tree.children[' + ind + '] = ' + tree.children[ind].name);
            yield nightmare.wait('ul.category-filter > li > a');
            tree.children[ind].date = moment().format("YYYY-M-D HH:mm:ss");
            // eshop_category_id is used for paginating with ajax xhtml requests
            // tree.children[ind].eshop_category_id = yield nightmare.evaluate(function() {
            //     return parseInt(document.querySelector('div.body > div.container > div.row').getElementsByTagName("script")[0].innerHTML.match("getNextPage.+items_list_170\',([0-9]+),function")[1])
            // });
            tree.children[ind].path = yield nightmare.evaluate(function() {
                return Array.prototype.map.call(document.querySelectorAll('div.breadcrumbs > ul > li > a'), function(e) {
                    return e.getAttribute('title');
                    // }).join(' > ');
                }).join('/');
            });
            tree.children[ind].path = (tree.children[ind].path + '/').replace('Pradžia/', '');
            var childNodes = yield nightmare.evaluate(function() {
                return Array.prototype.map.call(document.querySelectorAll('ul.category-filter > li > a'), function(e) {
                    var h = 'http://www.jsm.lt'
                    return {
                        'name': e.text,
                        'url': h + e.getAttribute("onclick").split("\'")[1],
                        'id': parseInt(e.getAttribute("onclick").split("\'")[1].split('/prekiu-kategorija/')[1].split('-')[0])
                    };
                });
            });
            if (childNodes[0].name === 'Į aukštesnę kategoriją' && childNodes.length > 0) {
                // remove first child if it's not a lower group
                childNodes.splice(0, 1);
            }
            if (childNodes.length > 0) {
                // add children array to the group in the tree
                tree.children[ind].children = childNodes;
                tree.children[ind].groupCount = childNodes.length;
                // parse the group with added children to look for more children

                console.log('tree.children[' + ind + '].groupCount = ' + tree.children[ind].groupCount);

                totalGroupCount += tree.children[ind].groupCount;
                console.log('totalGroupCount = ' + totalGroupCount);
                console.log('');
                logger.info('Product group, ', JSON.stringify(tree.children[ind]));
                yield getGroups(tree.children[ind]);
            } else {
                // tree.children[ind].products = yield getProducts();
                // tree.children[ind].prodCount = tree.children[ind].products.length;

                // // saveToDB.saveGroup(tree.children[ind], kon_id);
                // // saveToDB.saveProductList(tree.children[ind], kon_id);

                // // console.dir(tree.children[ind].products);
                // // console.log(typeof(tree.children[ind].products)); object of []
                // // console.dir(tree.children[ind].products);
                // // console.dir(tree.children[ind].products.length);

                // console.log('tree.children[' + ind + '].prodCount = ' + tree.children[ind].prodCount);
                // totalProductCount += tree.children[ind].prodCount;
                // console.log('totalProductCount = ' + totalProductCount);
                // console.log(tree.children[ind]);
                // console.log('');
                // logger.info('Product group zema, ', JSON.stringify(tree.children[ind]));


                saveToDB.saveGroup(tree.children[ind], kon_id, WHICH);
            }
        }
        return tree;
    };

    // and return lowest group array deepestGroups to parse products
    var saveGroups = function*(children) {
        // forEach element e loop
        for (var i = 0; i < children.length; i++) {
            var e = children[i];
            // save all groups



            if (e.children) { // if has children -> go deeper
                yield saveGroups(e.children);
            } else { // if no children ->
                // get products from the lowest group and add to element
                e.products = yield getProducts(e);
                //add to parse array
                deepestGroups.push(e);
            }
        }
    }

    // parse and get products from the group
    var getProducts = function*() {

        var products = [];
        var empty = yield nightmare.evaluate(function() {
            return document.querySelector('div#items_list_170 > div.empty');
        });
        // console.log(empty);
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
            $('div.item div.holder').each(function(i, elem) {
                //products[i].name = $(this).text();
                var h = 'http://www.jsm.lt';

                products[i] = {};
                products[i].name = $(elem).find('h3 a').first().text();
                products[i].url = h + $(elem).find('h3 a').first().attr('href');
                products[i].id = parseInt(products[i].url.split('/preke/')[1].split('-')[0]);
                products[i].img = h + $(elem).find('div.image > a > img').first().attr('src');

                products[i].pCode = parseInt($(elem).find('div.description > ul > li > strong').first().text().replace('Prekės kodas: ', ''));

                products[i].qnt = $(elem).find('div.prices div.price span.qnt').first().text();
                $(elem).find('div.prices div.price sub').first().remove();
                $(elem).find('div.prices div.price span.qnt').first().remove();
                var sup = $(elem).find('div.prices div.price sup').first();
                $(elem).find('div.prices div.price sup').first().remove();
                products[i].price = parseFloat(parseInt($(elem).find('div.prices div.price').first().text()) + '.' + sup.text()); //.toFixed(2);
                products[i].date = moment().format("YYYY-M-D HH:mm:ss");
            });

        }
        // else {
        //     return products.length == 0 ? 'null' : products;
        // }
        // console.dir(products);
        return products; // return products array
    }

    //
    var saveTree = function*(tree) {
        // var deepestGroups = [];

        yield saveGroups(tree.children);

        // console.log('deepestGroups.length');
        // console.dir(deepestGroups.length);

        // var consoleLogTreeArray = function(array) {
        //     return (Array.isArray(array) ? array : [array]).map(function(a) {
        //         var r = a.name;
        //         if ('children' in a) {
        //             r += consoleLogTreeArray(a.children);
        //         }
        //         return '<li>' + r + '</li>';
        //     }).join('')
        // }
        return deepestGroups;
    }

    var allProducts = function*() {

    }

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
        var allProductTree = vo(getHome(homepageUrl), getGroups /*, saveTree*/ ) // creating product tree Pipeline
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
    }

    vo(run)(function(err, result) {
        if (err) throw err;
    });

    process.on('uncaughtException', function(e) {
        console.log(new Date().toString(), e.stack || e);
        process.exit(1);
    });
}