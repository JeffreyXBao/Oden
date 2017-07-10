var app = angular.module('oden-app', ['ngRoute']);
var fileHandler = require('./src/fileHandler.js');

app.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'html/home.html'
    })

    .when('/categoryConfig', {
      templateUrl: 'html/categoryConfig.html'
    })

    .when('/rssConfig', {
      templateUrl: 'html/rssConfig.html'
    })

    .when('/scrape', {
      templateUrl: 'html/scrape.html'
    })

    .when('/settings', {
      templateUrl: 'html/settings.html'
    })
});

app.controller('homeCtrl', function($scope) {
  $scope.categories = fileHandler.parseJson('./json/category.json').categories;
});

app.controller('rssConfigCtrl', function($scope) {
  $scope.vmRss = null;

  $scope.response = fileHandler.parseJson('./json/rss.json');
  $scope.isResponseEmpty = true;

  $scope.checkResponse = function() {
    if ($scope.response === undefined || $scope.response.length == 0) {
      $scope.isResponseEmpty = true;
    } else {
      $scope.isResponseEmpty = false;
    }
    return $scope.isResponseEmpty;
  };

  $scope.handleAddDivClick = function() {
    console.log('handleAddDivClick called');
    var input = $scope.vmRss;
    if (input != "") {

      let rssArray = fileHandler.parseJson('./json/rss.json');
      let parsedInput = input.split(",");
      let concatArray = rssArray.concat(parsedInput);
      let stringedArray = JSON.stringify(concatArray);

      fileHandler.writeJson('./json/rss.json', stringedArray);

      $scope.response = fileHandler.parseJson('./json/rss.json');
      $scope.checkResponse();
    } else {
      alert("You didn't type a link.");
    }
  };

  $scope.delete = function(index) {
    let rssArray = fileHandler.parseJson('./json/rss.json');
    rssArray.splice(index, 1);
    let stringedArray = JSON.stringify(rssArray);

    fileHandler.writeJson('./json/rss.json', stringedArray);

    $scope.response = fileHandler.parseJson('./json/rss.json');
    $scope.checkResponse();
  };
});

app.controller('navBarCtrl', function($scope, $location) {
  $scope.isActive = function(viewLocation) {
    return viewLocation === $location.path();
  };
});

app.controller('settingsCtrl', function($scope) {
  $scope.handleMemeClick = function() {
    document.getElementById("pagestyle").setAttribute("href", "css/meme.css");
  };
  $scope.handleSuperMemeClick = function() {
    document.getElementById("pagestyle").setAttribute("href", "css/superMeme.css");
  };
  $scope.handleSuperDankMemeClick = function() {
    document.getElementById("pagestyle").setAttribute("href", "css/superDankMeme.css");
  };
  $scope.handleNormalClick = function() {
    document.getElementById("pagestyle").setAttribute("href", "css/index.css");
  };
});

app.controller('scrapeCtrl', function($scope, $http) {
  $scope.handleScrapeClick = function() {
    console.log("Scrape initialized");
    $scope.scrapeInfo = "Scrape initialized";

    var xmlParser = new DOMParser();
    let jsonPromises = [];
    let savePromises = [];
    jsonPromises.push(fileHandler.parseJsonPromise('./json/rss.json'));
    jsonPromises.push(fileHandler.parseJsonPromise('./json/category.json'));

    // let httpRequestRss = new XMLHttpRequest();
    // httpRequestRss.open('GET', objRss[r], false);
    // httpRequestRss.send(null);
    // if (httpRequestRss.status === 200) {
    //   let rssPage = xmlParser.parseFromString(httpRequestArticle.responseText, "application/xml");
    //   console.log(rssPage);
    //   let items = rssPage.getElementsByTagName('item');
    // } else {
    //
    // }

    Promise.all(jsonPromises).then(returnValues => {
      let rssArray = returnValues[0];
      let categoryObj = returnValues[1];
      initScrape(rssArray, categoryObj);
    }).catch(error => {
      console.log(error);
    });

    async function initScrape(rssArray, categoryObj) {
      let scrapePromises = [];
      let articleReturnArray = [];

      for (let r = 0; r < rssArray.length; r++) {
        scrapePromises.push(httpPromiseConstructor(rssArray[r]));
      }

      Promise.all(scrapePromises).then(function(returnData) {
        let scrapeItemArray = [];
        for (r = 0; r < returnData.length; r++) {
          let rssPage = $.parseXML(returnData[r].data);
          console.log(rssPage);
          let items = rssPage.getElementsByTagName('item');

          for (let i = 0; i < items.length; i++) {
            scrapeItemArray.push(items[i]);
          }
        }
        console.log(scrapeItemArray);
        scrapeItems(scrapeItemArray)
      }).catch(error => {
        console.log(error);
      });

      function scrapeItems(inputArray) {
        let itemPromises = [];

        for (let i = 0; i < inputArray.length; i++) {
          itemPromises.push(itemPromiseConstructor(inputArray[i]));
        }

        Promise.all(itemPromises).then(returnArrayArray => {
          let superArray = [];

          for (let a = 0; a < returnArrayArray.length; a++) {
            if (returnArrayArray[a].length > 0) {
              for (let r = 0; r < returnArrayArray[a].length; r++)
                superArray.push(returnArrayArray[a][r]);
            }
          }

          fileHandler.categorizeArticles(superArray);
        }).catch(error => {
          console.log(error);
        });
      }

      function httpPromiseConstructor(path) {
        return $http({
          method: 'GET',
          url: path
        })
      }

      function itemPromiseConstructor(item) {
        return new Promise(function(resolve, reject) {
          let itemPromiseArray = [];
          $http({
            method: 'GET',
            url: item.getElementsByTagName('link')[0].innerHTML
          }).then(function successCallback(response) {
            let parsedHtml = xmlParser.parseFromString(response.data, "text/html");
            let textToCheck = parsedHtml.getElementsByTagName('p');

            let catArray = [];
            let subcatArray = [];

            for (let c = 0; c < categoryObj.categories.length; c++) {
              for (let s = 0; s < categoryObj.categories[c].subs.length; s++) {
                let keyWordCount = 0;
                for (let k = 0; k < categoryObj.categories[c].subs[s].keywords.length; k++) {
                  let keyword = new RegExp(categoryObj.categories[c].subs[s].keywords[k], 'gi');
                  for (let t = 0; t < textToCheck.length; t++) {
                    let matches = textToCheck[t].innerHTML.match(keyword);
                    if (matches !== null && matches !== undefined && matches !== []) {
                      keyWordCount += matches.length;
                    }
                  }
                }
                if (keyWordCount > 5) {
                  console.log(item.getElementsByTagName('title')[0].innerHTML);
                  catArray.push(categoryObj.categories[c].name);
                  subcatArray.push(categoryObj.categories[c].subs[s].name);
                }
              }
            }
            if (catArray.length > 0 && subcatArray.length > 0) {
              let date = "";
              if (item.getElementsByTagName('pubDate')[0] != undefined) {
                date = item.getElementsByTagName('pubDate')[0].innerHTML;
              }
              itemPromiseArray.push({
                title: item.getElementsByTagName('title')[0].innerHTML,
                pubDate: date,
                link: item.getElementsByTagName('link')[0].innerHTML,
                categoriesToSave: catArray,
                subcategoriesToSave: subcatArray
              });
            }
            resolve(itemPromiseArray);
          });
        });
      }

      // Promise.all(scrapePromises).then(() => {
      //   console.log("all done analyzing articles!");
      //   fileHandler.categorizeArticles(articleReturnArray);
      // }).catch(error => {
      //   console.log(error);
      // });
      //
      // function scrapePromiseConstructor(path) {
      //   return $http({
      //     method: 'GET',
      //     url: path
      //   }).then(function(returnData) {
      //     // console.log(returnData.data);
      //     let rssString = returnData.data;
      //     let rssPage = $.parseXML(returnData.data);
      //     console.log(rssPage);
      //     let items = rssPage.getElementsByTagName('item');
      //
      //     for (let i = 0; i < items.length; i++) {
      //       scrapeItem(items[i]);
      //     }
      //
      //   });
      // }

      // function scrapeItem(item) {
      //   $http({
      //     method: 'GET',
      //     url: item.getElementsByTagName('link')[0].innerHTML
      //   }).then(function successCallback(response) {
      //     let parsedHtml = xmlParser.parseFromString(response.data, "text/html");
      //     let textToCheck = parsedHtml.getElementsByTagName('p');
      //
      //     let catArray = [];
      //     let subcatArray = [];
      //
      //     for (c = 0; c < categoryObj.categories.length; c++) {
      //       for (s = 0; s < categoryObj.categories[c].subs.length; s++) {
      //         let keyWordCount = 0;
      //         for (k = 0; k < categoryObj.categories[c].subs[s].keywords.length; k++) {
      //           let keyword = new RegExp(categoryObj.categories[c].subs[s].keywords[k], 'gi');
      //           for (let t = 0; t < textToCheck.length; t++) {
      //             let matches = textToCheck[t].innerHTML.match(keyword);
      //             if (matches !== null && matches !== undefined && matches !== []) {
      //               keyWordCount += matches.length;
      //             }
      //           }
      //         }
      //         if (keyWordCount > 5) {
      //           console.log(item.getElementsByTagName('title')[0].innerHTML);
      //           catArray.push(categoryObj.categories[c]);
      //           subcatArray.push(categoryObj.categories[c].subs[s]);
      //         }
      //       }
      //     }
      //     //articleReturnArray.push(new Array(item.getElementsByTagName('title')[0].innerHTML, item.getElementsByTagName('pubDate')[0].innerHTML, item.getElementsByTagName('link')[0].innerHTML, catArray, subcatArray));
      //     if (catArray.length > 0 && subcatArray.length > 0) {
      //       articleReturnArray.push({
      //         title: item.getElementsByTagName('title')[0].innerHTML,
      //         pubDate: item.getElementsByTagName('pubDate')[0].innerHTML,
      //         link: item.getElementsByTagName('link')[0].innerHTML,
      //         categoriesToSave: catArray,
      //         subcategoriesToSave: subcatArray
      //       });
      //     }
      //   });
      // }
    }
  };
});
