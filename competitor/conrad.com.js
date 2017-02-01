var winston = require('winston');
var path = require('path');

var Nightmare = require('nightmare');
var vo = require('vo');
var cheerio = require('cheerio');
var moment = require('moment');
var nightmare = Nightmare({
    show: true, // true/false - showing a loading browser
    ignoreSslErrors: true,
    webSecurity: false
});
var saveToDB = require('../saveToDB');
var saveToDBproduct = require('../saveToDBproduct');
var WHICH = ' conrad.com, '; //i saveToDB logams
module.exports = function() {
    var current_url;
    var homepageUrl = 'http://www.conrad.com'; //'http://www.conrad.com/ce/en/overview/2409004/3D-Printer-Accessories-Spares?perPage=36';
    var kon_id = 42651;
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
        // var logMessage = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds + ' conrad.com, ' + args.message;
        var logMessage = moment().format("YYYY-M-D HH:mm:ss") + ' conrad.com, ' + args.message;

        // moment().format("YYYY-M-D HH:mm:ss")
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
    const yieldCallback = require('yield-callback');
    // parsing Homepage
    var getHome = function*(url) {
        var tree = {};
        // event to show console logs from evaluate
        yield nightmare.on('console', function(log, message) {
            // console.dir(message);
        });
        yield nightmare.goto(url, 'https://www.google.lt/').then(function(rez) {
            // if (rez.code == 200) {
            //     console.log('Homepage Ok =' + rez.code + ' on url= ' + rez.url);
            // } // console.log(rez.referer);        // console.dir(rez.headers);
        });

        tree.url = yield nightmare.url();
        tree.date = moment().format("YYYY-M-D HH:mm:ss");
        var title;
        title = yield nightmare.title();
        if (title) {
            tree.name = title;
        } else {
            tree.name = tree.url;
        }
        tree.id = 0;
        // console.log('bandau pries f-ja = ');

        yield nightmare.evaluate(function() {
            return document.documentElement.innerHTML;
        }).then((html) => {
            $ = cheerio.load(html);
            tree.children = [];
            $('#nav td.level1.ces ul.level2 > li > a').each(function(i, elem) {
                tree.children[i] = {};
                tree.children[i].name = $(elem).text();
                tree.children[i].url = $(elem).attr('href');
                tree.children[i].id = parseInt($(elem).attr('href').split('/SHOP_AREA_')[1].split('-')[0]);
            });

        }).catch(function(error) {
            console.error('Search failed:', error);
        });
        //  console.log('bandauuu = ');
        // console.log(tree.children);
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
            current_url = tree.children[ind].url;
            yield nightmare.goto(tree.children[ind].url).then(function(rez) {
                // if (rez.code == 200) {
                //     console.log('Ok = ' + rez.code + ' on url= ' + rez.url)
                // }
            });
            // console.log('tree.children[' + ind + '] = ' + tree.children[ind].name);
            // yield nightmare.wait('ul.category-filter > li > a');
            // yield nightmare.wait('div.submenulist > div.category > a');
            tree.children[ind].date = moment().format("YYYY-M-D HH:mm:ss");
            // eshop_category_id is used for paginating with ajax xhtml requests
            // tree.children[ind].eshop_category_id = yield nightmare.evaluate(function() {
            //     return parseInt(document.querySelector('div.body > div.container > div.row').getElementsByTagName("script")[0].innerHTML.match("getNextPage.+items_list_170\',([0-9]+),function")[1])
            // });

            yield nightmare.evaluate(function() {
                return document.documentElement.innerHTML;
            }).then((html) => {
                $ = cheerio.load(html);
                tree.children[ind].path = [];
                if ($('div#ariadne > a').length) {
                    $('div#ariadne > a').each(function(i, elem) {
                        tree.children[ind].path = tree.children[ind].path + $(elem).text() + ' > ';
                    });
                    $('div#ariadne > h1').each(function(i, elem) {
                        tree.children[ind].path = tree.children[ind].path + $(elem).text();
                    });
                } else if ($('div#breadcrumb > a').length) {
                    $('div#breadcrumb > a').each(function(i, elem) {
                        tree.children[ind].path = tree.children[ind].path + $(elem).text() + ' > ';
                    });
                    $('div#breadcrumb > h1').each(function(i, elem) {
                        tree.children[ind].path = tree.children[ind].path + $(elem).text();
                    });
                }

            });
            //+console.log('tree.children[ind].path', tree.children[ind].path);

            var childNodes = [];
            // console.log('childNodes.length', childNodes.length);
            yield nightmare.evaluate(function() {
                return document.documentElement.innerHTML;
            }).then((html) => {
                $ = cheerio.load(html);
                //tree.children = [];
                // childNodes = [];
                if ($('.submenulist').length) {
                    //find(selector).length > 0
                    $('div.submenulist div.category>a').each(function(i, elem) {
                        childNodes[i] = {};
                        //  childNodes[i].name = $(elem).text().split('(')[0];
                        childNodes[i].url = $(elem).attr('href');
                        childNodes[i].id = $(elem).attr('id');
                    });
                    $('div.submenulist div.category>a span.headline').each(function(i, elem) {
                        //  childNodes[i] = {};
                        childNodes[i].name = $(elem).text();
                    });
                }

            });

            // for (var bla = 0; bla < childNodes.length; bla++) {
            //     console.log('childNodes[bla].name', childNodes[bla].name);
            //     // console.log('childNodes[bla].url', childNodes[bla].url);
            //     // console.log('childNodes[bla].id', childNodes[bla].id);
            // }
            // console.log('childNodes.length', childNodes.length);
            tree.children[ind].children = childNodes;
            tree.children[ind].groupCount = childNodes.length;
            // parse the group with added children to look for more children

            if (childNodes.length > 0) {
                // add children array to the group in the tree
                tree.children[ind].children = childNodes;
                tree.children[ind].groupCount = childNodes.length;
                // parse the group with added children to look for more children

                console.log('tree.children[' + ind + '].groupCount = ' + tree.children[ind].groupCount);

                totalGroupCount += tree.children[ind].groupCount;
                console.log('totalGroupCount = ' + totalGroupCount);
                console.log('');
                // logger.info('Product group, ', JSON.stringify(tree.children[ind]));
                yield getGroups(tree.children[ind]);
            } else {
                //  console.log('Prie prekiu:');
                // tree.children[ind].products = yield getProducts();
                // tree.children[ind].prodCount = tree.children[ind].products.length;
                //savetodb(tree.children[ind]);
                // var grupe = new saveToDB(tree.children[ind].url, tree.children[ind].id, tree.children[ind].name, tree.children[ind].date, tree.children[ind].path);

                saveToDB.saveGroup(tree.children[ind], kon_id, WHICH);
                deepestGroups.push(tree.children[ind]);
                // saveToDB.saveProductList(tree.children[ind], kon_id);

                // console.dir(tree.children[ind].products);
                // console.log(typeof(tree.children[ind].products)); object of []
                // console.dir(tree.children[ind].products);
                // console.dir(tree.children[ind].products.length);


                // console.log('tree.children[' + ind + '].prodCount = ' + tree.children[ind].prodCount);
                // totalProductCount += tree.children[ind].prodCount;
                // console.log('totalProductCount = ' + totalProductCount);
                // console.log(tree.children[ind]);
                // console.log('');
            }
        }

        return deepestGroups;
        // return tree;
    };

    // var savetodb = function*(children) {
    //     console.log('atejo ;s');
    //     var gr_id = saveToDB.groupIsInDB(children, kon_id);
    //     console.log('gr_id ;s', gr_id);
    //     var valid = saveToDB.validateGroup(children, kon_id);
    //     if (valid == true) {
    //         if (gr_id != 0) {
    //             console.log('if (gr_id) true');
    //             saveToDB.updateGroup(children, kon_id, gr_id);
    //             // logger.info('Group already exists - UPDATE, ', JSON.stringify(group));

    //         } else {
    //             console.log('if (gr_id) false');
    //             saveToDB.createGroup(children, kon_id);
    //             // logger.info('Group does not exist - CREATE, ', JSON.stringify(group));

    //         }
    //     }
    //     // saveToDB.saveProductList(tree.children[ind], kon_id);
    // };
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
    };

    // parse and get products from the group nuo cia
    var getProducts = function*() {

        var products = [];
        // var empty = yield nightmare.evaluate(function() {
        //     return document.querySelector('div#items_list_170 > div.empty'); //????????????????????
        // });
        // console.log(empty);

        // nightmare.wait(30000);
        var nav = [];
        var nav_last_nr;
        yield nightmare.evaluate(function() {
            return document.documentElement.innerHTML;
        }).then((html) => {
            $ = cheerio.load(html);
            //tree.children = [];
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

        //+   console.log('nav_last_nr', nav_last_nr);
        //+ for (var bla = 0; bla < nav.length; bla++) {
        //     console.log('nav[bla].name', nav[bla].name);
        //     console.log('nav[bla].url', nav[bla].url);
        // }


        var prod_qnt = 0;
        //var nav_last_nr = parseInt(nav[document.querySelectorAll('div.page-navigation a').length - 1].text()); //last page number in navigation
        // var nav_last_nr = parseInt(nav[nav.length - 1].text);
        // for (var b = 0; b < nav_last_nr - 1; b++) {
        // get all products html
        // console.log('Prie prekiu atejo');
        for (b = 0; b < nav_last_nr; b++) {
            var next;
            yield nightmare.evaluate(function() {
                return document.documentElement.innerHTML;
            }).then((html) => {
                $ = cheerio.load(html);
                //tree.children = [];
                $('div.page-navigation a').each(function(i, elem) {
                    next = $(elem).attr('href');
                });
            });
            var kiek = 0;
            yield nightmare.evaluate(function() {
                return document.documentElement.innerHTML;
            }).then((html) => {
                $ = cheerio.load(html);
                // tree.children = [];
                $('div.list-product-item').each(function(i, elem) {
                    var h = 'http://www.conrad.com';

                    products[prod_qnt + i] = {};
                    products[prod_qnt + i].name = $(elem).find('div.product-description span div.name span a').first().text();
                    products[prod_qnt + i].url = $(elem).find('div.product-description span div.name span a').first().attr('href');
                    products[prod_qnt + i].id = parseInt($(elem).find('div.product-description span div.name span a').first().attr('href').split('/product/')[1].split('/')[0]);
                    products[prod_qnt + i].img = $(elem).find('div.product-image > span > a > img').first().attr('src');

                    products[prod_qnt + i].pCode = $(elem).find('div.product-description span div.bestnr strong').first().text();

                    products[prod_qnt + i].qnt = $(elem).find('div.order-details span.product-amount').first().text();
                    products[prod_qnt + i].price = parseFloat($(elem).find('div.product-order-options span.current-price').first().text().replace(' € ', '').replace(',', '.')); //.toFixed(2);
                    // <span class="current-price"> € 180,00 </span>
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
                //tree.children = [];
                $('div.page-navigation span.current-page').each(function(i, elem) {
                    current_page = parseInt($(elem).text());

                });
            });
            // console.log('current_page', current_page);
            if (current_page != nav_last_nr) {
                //  console.log('current_url', current_url);
                var next_url = current_url + next;
                yield nightmare.goto(next_url).then(function(rez) {
                    // if (rez.code == 200) {
                    //     console.log('Ok = ' + rez.code + ' on url= ' + rez.url);
                    // }
                });
            }
        }

        return products; // return products array
    }


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
    var saveProducts = function*(deepestGroups) {
        for (var inde = 0; inde < deepestGroups.length; inde++) {
            saveToDB.saveProductList(deepestGroups[inde], kon_id);
        }
        for (var inde = 0; inde < deepestGroups.length; inde++) {
            for (var indeks = 0; indeks < deepestGroups.length; indeks++) {
                yield nightmare.goto(deepestGroups[inde].products[indeks].url).then(function(rez) {
                    // if (rez.code == 200) {
                    //     console.log('Ok = ' + rez.code + ' on url= ' + rez.url);
                    // }
                });


                yield nightmare.evaluate(function() {
                    return document.documentElement.innerHTML;
                }).then((html) => {
                    $ = cheerio.load(html);
                    //tree.children = [];
                    // childNodes = [];
                    if ($('span.swiper-slide>img').length) { //paveiksliukai
                        //find(selector).length > 0
                        $('span.swiper-slide>img').each(function(i, elem) {
                            //childNodes[i] = {};
                            //  childNodes[i].name = $(elem).text().split('(')[0];
                            deepestGroups[inde].products[indeks].images[i] = {};
                            $(elem).find('.swiper-pagination-video').first().remove();
                            deepestGroups[inde].products[indeks].images[i] = $(elem).first().attr('src');
                            // childNodes[i].url = $(elem).attr('href');
                            // childNodes[i].id = $(elem).attr('id');
                        });

                        // $('div.submenulist div.category>a span.headline').each(function(i, elem) {
                        //     //  childNodes[i] = {};
                        //     childNodes[i].name = $(elem).text();
                        // });
                    }
                    if ($('div#details [id*="beschreibung"] p:nth-child(2)').length) { //description
                        $('div#details [id*="beschreibung"] p:nth-child(2)').each(function(i, elem) {
                            deepestGroups[inde].products[indeks].description = $(elem).text();

                        });

                    } else {
                        if ($('div.inner div.produktbezeichnung h2').length) { //other details
                            deepestGroups[inde].products[indeks].description = $(elem).text();
                        }
                    }

                });


            }
        }
    }
    var run = function*() {
        //start parsing JSM product tree from homepage
        var allProductTree = vo(getHome(homepageUrl), getGroups /*, saveProducts*/ /*, saveTree*/ ) // creating product tree Pipeline
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