var fs = require('fs');
var scrape = require('website-scraper');
var exports = module.exports = {};
const remote = require('electron').remote;
const app = remote.app;
const appPath = app.getAppPath();
const appDataPath = app.getPath('documents');

exports.parseJson = function(path) {
  var data = fs.readFileSync(`${appDataPath}/oden/${path}`, 'utf-8');
  return JSON.parse(data);
};

exports.parseJsonAsync = function(path, callback) {
  fs.readFile(`${appDataPath}/oden/${path}`, 'utf-8', (err, data) => {
    if (err) throw err;
    callback(JSON.parse(data));
  });
};

exports.parseJsonPromise = function(path) {
  return new Promise(function(resolve, reject) {
    fs.readFile(`${appDataPath}/oden/${path}`, 'utf-8', (err, data) => {
      if (err) return reject(err);
      resolve(JSON.parse(data));
    });
  });
};

exports.writeJson = function(path, input) {
  console.log(`${appDataPath}/oden/${path}`);
  fs.writeFileSync(`${appDataPath}/oden/${path}`, input);
};

exports.categorizeArticles = function(queueArray, scrapeLog) {
  console.log(queueArray);

  let jsonPromises = [];
  jsonPromises.push(fileHandler.parseJsonPromise('json/directory.json'));
  jsonPromises.push(fileHandler.parseJsonPromise('json/category.json'));

  Promise.all(jsonPromises).then(returnValues => {
    scrapeLog('config files successfully loaded');
    //scope.scrapeInfo += 'config files successfully loaded';
    saveLoop(returnValues[0], returnValues[1]);
  }).catch(error => {
    console.log(error);
  });

  function saveLoop(directory, categoryObj) {
    savePromiseArray = [];
    for (q = 1; q < queueArray.length; q++) {
      let itemObj = queueArray[q];
      let link = itemObj.link;
      let title = itemObj.title;
      title = title.replace(/<!\[CDATA\[/g, "");
      title = title.replace(/\]\]>/g, "");
      title = title.replace(/\'/g, "");
      title = title.replace(/&#039;/g, "");
      title = title.replace(/;/g, "");
      let saveName = title + itemObj.pubDate;
      saveName = saveName.replace(/\ /g, "_");
      saveName = saveName.replace(/,/g, "_");
      saveName = saveName.replace(/:/g, "_");
      saveName = saveName.replace(/\./g, "_");
      let fileAlreadyExists = false;
      console.log("saving " + link);
      //scope.scrapeInfo += "\nsaving " + link;
      scrapeLog(`saving ${link}`);

      console.log(saveName);
      if (itemObj.categoriesToSave.length == itemObj.subcategoriesToSave.length) {
        for (let i = 0; i < directory.articles.length; i++) {
          if (directory.articles[i].path == saveName && directory.articles[i].pubDate == itemObj.pubDate) {
            fileAlreadyExists = true;
            console.log("article already saved! skipping to next one");
          }
        }

        if (!fileAlreadyExists) {
          //saveArticle(link, saveName);
          savePromiseArray.push(saveArticlePromiseGenerator(link, saveName));
          let directoryItemObj = new directoryItemObjectGenerator(title, itemObj.pubDate, link, saveName);
          directory.articles.push(directoryItemObj);
        }

        for (let i = 0; i < directory.articles.length; i++) {
          if (directory.articles[i].path == saveName && directory.articles[i].pubDate == itemObj.pubDate) {
            let categoryExists = false;
            for (let c = 0; c < itemObj.categoriesToSave.length; c++) {
              for (let e = 0; e < directory.articles[i].cats.length; e++) {
                if (directory.articles[i].cats[e].name == itemObj.categoriesToSave[c]) {
                  let subcategoryExists = false;
                  for (let s = 0; s < directory.articles[i].cats[e].subs.length; s++) {
                    if (directory.articles[i].cats[e].subs[s] == itemObj.subcategoriesToSave[c]) {
                      subcategoryExists = true;
                    }
                  }

                  if (!subcategoryExists) {
                    directory.articles[i].cats[e].subs.push(itemObj.subcategoriesToSave[c]);
                  }
                  categoryExists = true;
                }
              }
              if (!categoryExists) {
                let catObjToSave = new catObjGenerator(itemObj.categoriesToSave[c], itemObj.subcategoriesToSave[c]);
                directory.articles[i].cats.push(catObjToSave);
              }
            }
          }
        }

        for (let a = 0; a < itemObj.categoriesToSave.length; a++) {
          let categoryExists = false;
          for (let b = 0; b < categoryObj.categories.length; b++) {
            if (categoryObj.categories[b].name == itemObj.categoriesToSave[a]) {
              categoryExists = true
              let subcategoryExists = false;
              for (let c = 0; c < categoryObj.categories[b].subs.length; c++) {
                if (categoryObj.categories[b].subs[c].name == itemObj.subcategoriesToSave[a]) {
                  subcategoryExists = true;
                  categoryObj.categories[b].subs[c].articles.push(new categoryItemObjectGenerator(title, itemObj.pubDate, saveName));
                }
              }
            }
          }
          if (!categoryExists) {
            console.log("category not found, cannot save");
            //scope.scrapeInfo += "category not found, cannot save";
            scrapeLog("category not found, cannot save");
          }
        }
      } else {
        console.log("category array didn't match subcategory array, skipping");
        //scope.scrapeInfo += "category array didn't match subcategory array, skipping";
        scrapeLog("category array didn't match subcategory array, skipping");
      }
    }
    fs.writeFileSync(`${appDataPath}/oden/json/directory.json`, JSON.stringify(directory));
    fs.writeFileSync(`${appDataPath}/oden/json/category.json`, JSON.stringify(categoryObj));
    Promise.all(savePromiseArray).then(() => {
      console.log('Done!');
      //scope.scrapeInfo += '\nDone!';
      scrapeLog('done!');
    }).catch(err => {
      console.log(err);
    });
  }

  function categoryItemObjectGenerator(name, pubDate, path) {
    this.name = name;
    this.pubDate = pubDate;
    this.path = path;
  }

  function directoryItemObjectGenerator(name, pubDate, urlLink, path) {
    this.name = name;
    this.pubDate = pubDate;
    this.link = urlLink;
    this.path = path;
    this.cats = [];
  }

  function catObjGenerator(catName, subcatName) {
    this.name = catName;
    this.subs = [subcatName];
  }

  function saveArticlePromiseGenerator(link, saveName) {
    var options = {
      urls: [link],
      directory: `${appDataPath}/oden/articles/${saveName}/`,
    };

    return scrape(options).then(result => {
      console.log(`successfully saved ${saveName}`);
    });
  }
  // async function saveArticle(link, saveName) {
  //   var options = {
  //     urls: [link],
  //     directory: `${appDataPath}/oden/articles/${saveName}/`,
  //   };
  //
  //   scrape(options).then(result => {
  //     console.log(`successfully saved ${saveName}`);
  //   }).catch(err => {
  //     console.log(err);
  //   });
  // }
};
