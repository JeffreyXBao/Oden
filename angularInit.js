var app = angular.module('oden-app', ['ngRoute']);
var fileHandler = require(`./src/fileHandler.js`);
const remote = require('electron').remote;
var main = remote.require('./main.js');

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
  $scope.categories = fileHandler.parseJson('json/category.json').categories;
  $scope.openPage = function(path) {
    main.openWindow(path);
  };
});


app.controller('catConfigCtrl', function($scope) {
  $scope.categoryJson = fileHandler.parseJson('json/category.json');

  $scope.checkExists = function() {
    if ($scope.categoryJson === undefined || $scope.categoryJson.categories.length == 0) {
      return true;
    } else {
      return false;
    }
  };
  $scope.addcat = function() {
    console.log('handleAddDivClick called');
    var input = $scope.newCatName;
    if (input != "") {
      let catObj = fileHandler.parseJson('json/category.json');
      catObj.push(new catObjGenerator(input));
      let stringedObj = JSON.stringify(catObj);

      fileHandler.writeJson('json/category.json', stringedObj);

      $scope.categoryJson = fileHandler.parseJson('json/category.json');

      function catObjGenerator(catName) {
        this.name = catName;
        this.subs = [];
      }
    } else {
      alert("You didn't type a name.");
    }
  };

  $scope.delete = function(index) {
    let rssArray = fileHandler.parseJson('json/rss.json');
    rssArray.splice(index, 1);
    let stringedArray = JSON.stringify(rssArray);

    fileHandler.writeJson('json/rss.json', stringedArray);

    $scope.response = fileHandler.parseJson('json/rss.json');
    $scope.checkResponse();
  };
});

app.controller('rssConfigCtrl', function($scope) {
  $scope.vmRss = null;

  $scope.response = fileHandler.parseJson('json/rss.json');

  $scope.checkResponse = function() {
    if ($scope.response === undefined || $scope.response.length == 0) {
      return true;
    } else {
      return false;
    }
    return $scope.isResponseEmpty;
  };

  $scope.handleAddDivClick = function() {
    console.log('handleAddDivClick called');
    var input = $scope.vmRss;
    if (input != "") {

      let rssArray = fileHandler.parseJson('json/rss.json');
      let parsedInput = input.split(",");
      let concatArray = rssArray.concat(parsedInput);
      let stringedArray = JSON.stringify(concatArray);

      fileHandler.writeJson('json/rss.json', stringedArray);

      $scope.response = fileHandler.parseJson('json/rss.json');
      $scope.checkResponse();
    } else {
      alert("You didn't type a link.");
    }
  };

  $scope.delete = function(index) {
    let rssArray = fileHandler.parseJson('json/rss.json');
    rssArray.splice(index, 1);
    let stringedArray = JSON.stringify(rssArray);

    fileHandler.writeJson('json/rss.json', stringedArray);

    $scope.response = fileHandler.parseJson('json/rss.json');
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
  $scope.scrapeInfo = null;
  $scope.handleTimeTravelClick = function(inputDays) {
    if (!main.existingScrape) {
      main.existingScrape = true;
      const firstDate = new Date(2010, 0, 31);
      let days = inputDays;
      const todayms = new Date();
      let currentDay = new Date(Math.trunc((todayms) / (1000 * 60 * 60 * 24)) * (1000 * 60 * 60 * 24));
      let maxDate;
      if (inputDays == -1) {
        days = Math.trunc((currentDay - firstDate) / (1000 * 60 * 60 * 24));
        maxDate = firstDate;
      } else {
        maxDate = new Date(todayms - (1000 * 60 * 60 * 24 * days));
      }

      let maxDateInt = (maxDate.getFullYear() * 10000000000) + ((maxDate.getMonth() + 1) * 100000000) + (maxDate.getDate() * 1000000) + (maxDate.getHours() * 10000) + (maxDate.getMinutes() * 100) + maxDate.getSeconds();

      console.log(`Time Travel initialized, going back ${days} days`);
      $scope.scrapeInfo = `Time Travel initialized, going back ${days} days`;
      $scope.scrapeInfo += (`\nEarliest day is ${maxDateInt}`);

      let httpPromiseArray = [];

      httpPromiseArray.push(httpPromiseConstructor('https://web.archive.org/web/timemap/link/http://news.google.com/news?cf=all&hl=en&pz=1&ned=us&output=rss'));
      httpPromiseArray.push(httpPromiseConstructor('https://web.archive.org/web/timemap/link/http://news.google.com/news/rss/?ned=us&hl=en'));

      Promise.all(httpPromiseArray).then(returnXml => {
        let oldArray = returnXml[0].data.split('\n');
        let newArray = returnXml[1].data.split('\n');
        console.log(oldArray);
        console.log(newArray);

        let mergedArray = oldArray.concat(newArray);
        console.log(mergedArray);

        for (let i = 0; i < mergedArray.length; i++) {
          if (mergedArray[i].includes('rel="first memento"') || mergedArray[i].includes('rel="memento"')) {
            let link = mergedArray[i].substring(mergedArray[i].lastIndexOf('<') + 1, mergedArray[i].lastIndexOf('>'));
            let dateInt = link.substring(link.lastIndexOf('web/') + 4, link.lastIndexOf('/http'));
            if (dateInt >= maxDateInt) {
              console.log(link);
              console.log(dateInt);
            }
          }
        }
      }).catch(err => {
        console.log(err);
        $scope.scrapeInfo += `\n${err}`;
      });

      function convertToTwoDigit(input) {
        if (input < 10) {
          input = `0${input}`;
        }
        return input;
      }

      // for (let i = 0; i <= days; i++) {
      //   let tempDay = currentDay - (1000 * 60 * 60 * 24 * i);
      //   tempDay = new Date(tempDay);
      //   let changeDay = new Date(2017, 05, 28);
      //   let dateString = `${tempDay.getFullYear()}${convertToTwoDigit(tempDay.getMonth() +1)}${convertToTwoDigit(tempDay.getDate())}`;
      // }
    } else {
      $scope.scrapeInfo += '\nA scrape is already in progress!';
      console.log('\nA scrape is already in progress!');
    }

  };

  $scope.handlePartyClick = function() {
    if (!main.existingScrape) {
      main.existingScrape = true;
      fileHandler.parseJsonAsync('json/category.json', categoryJson => {
        console.log(categoryJson);
        $scope.scrapeInfo = 'Party initialized';
        let arrayFiesta = [];
        for (let i = 0; i < categoryJson.categories.length; i++) {
          arrayFiesta.push(rssGenerator(categoryJson.categories[i].name));
          for (let j = 0; j < categoryJson.categories[i].subs.length; j++) {
            arrayFiesta.push(rssGenerator(categoryJson.categories[i].subs[j].name));
          }
        }

        console.log(arrayFiesta);
        initScrape(arrayFiesta, categoryJson);

        function rssGenerator(name) {
          let temp = name.replace(/\ /g, "%20");
          return `https://news.google.com/news/rss/search/section/q/${temp}/${temp}?hl=en&ned=us`;
        }
      });
    } else {
      $scope.scrapeInfo += '\nA scrape is already in progress!';
      console.log('\nA scrape is already in progress!');
    }
  };

  $scope.handleScrapeClick = function() {
    if (!main.existingScrape) {
      main.existingScrape = true;
      console.log("Scrape initialized");
      //scrapeLog('Scrape initialized');
      $scope.scrapeInfo = 'Scrape initialized';

      let jsonPromises = [];
      let savePromises = [];
      jsonPromises.push(fileHandler.parseJsonPromise('json/rss.json'));
      jsonPromises.push(fileHandler.parseJsonPromise('json/category.json'));

      Promise.all(jsonPromises).then(returnValues => {
        let rssArray = returnValues[0];
        let categoryObj = returnValues[1];
        initScrape(rssArray, categoryObj);
      }).catch(error => {
        console.log(error);
        scrapeLog(error);
      });
    } else {
      $scope.scrapeInfo += '\nA scrape is already in progress!';
      console.log('\nA scrape is already in progress!');
    }
  };

  async function initScrape(rssArray, categoryObj) {
    let scrapePromises = [];
    let articleReturnArray = [];
    var xmlParser = new DOMParser();

    for (let r = 0; r < rssArray.length; r++) {
      scrapePromises.push(httpPromiseConstructor(rssArray[r]));
    }

    Promise.all(scrapePromises.map(reflect)).then(function(returnData) {
      let success = returnData.filter(x => x.status === "resolved");

      let newReturnData = [];

      for (let q = 0; q < success.length; q++) {
        newReturnData.push(success[q].v);
      }

      let scrapeItemArray = [];
      for (let r = 0; r < newReturnData.length; r++) {
        let rssPage = $.parseXML(newReturnData[r].data);
        console.log(rssPage);
        let items = rssPage.getElementsByTagName('item');

        for (let i = 0; i < items.length; i++) {
          scrapeItemArray.push(items[i]);
        }
      }
      scrapeItems(scrapeItemArray);
    }).catch(error => {
      console.log(error);
      scrapeLog(error);
    });

    function scrapeItems(inputArray) {
      let itemPromises = [];

      for (let i = 0; i < inputArray.length; i++) {
        itemPromises.push(itemPromiseConstructor(inputArray[i]));
      }

      Promise.all(itemPromises.map(reflect)).then(returnArrayArray => {
        let successReturnArrayArray = returnArrayArray.filter(x => x.status === "resolved");
        let newReturnArrayArray = [];

        for (let h = 0; h < successReturnArrayArray.length; h++) {
          newReturnArrayArray.push(successReturnArrayArray[h].v)
        }

        let superArray = [];

        for (let a = 0; a < newReturnArrayArray.length; a++) {
          if (newReturnArrayArray[a].length > 0) {
            for (let r = 0; r < newReturnArrayArray[a].length; r++)
              superArray.push(newReturnArrayArray[a][r]);
          }
        }

        fileHandler.categorizeArticles(superArray, scrapeLog);
      }).catch(error => {
        console.log(error);
        scrapeLog(error);
      });
    }

    function itemPromiseConstructor(item) {
      return new Promise(function(resolve, reject) {
        let itemPromiseArray = [];
        $http({
          method: 'GET',
          url: item.getElementsByTagName('link')[0].innerHTML
        }).then(function(response) {
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
  }

  function httpPromiseConstructor(path) {
    return $http({
      method: 'GET',
      url: path
    });
  }

  function reflect(promise) {
    return promise.then(function(v) {
      return {
        v: v,
        status: "resolved"
      }
    }, function(e) {
      return {
        e: e,
        status: "rejected"
      }
    });
  }

  function scrapeLog(msg) {
    $scope.$apply(function() {
      $scope.scrapeInfo += `\n${msg}`;
    });
  }
});
