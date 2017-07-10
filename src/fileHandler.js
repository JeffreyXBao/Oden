var fs = require('fs');
var scrape = require('website-scraper');
var exports = module.exports = {};

exports.parseJson = function(path) {
  var data = fs.readFileSync(path, 'utf-8');
  return JSON.parse(data);
};

exports.parseJsonAsync = function(path, callback) {
  fs.readFile(path, 'utf-8', (err, data) => {
    if (err) throw err;
    callback(JSON.parse(data));
  });
};

exports.parseJsonPromise = function(path) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, 'utf-8', (err, data) => {
      if (err) return reject(err);
      resolve(JSON.parse(data));
    });
  });
};
// exports.getScrapingResources = function(callback) {
//   function readJson(path) {
//     var returnData = fs.readFile(path, 'utf-8', (err, data) => {
//       if (err) throw err;
//       return data;
//     });
//     return returnData;
//   }
//
//   let readPromise = new Promise((resolve, reject) => {
//     let rssString = readJson('./json/rss.json');
//     let categoryString = readJson('./json/category.json');
//
//     resolve(JSON.parse(rssString), JSON.parse(categoryString));
//   });
//
//   readPromise.then((returnedRss, returnedCategory) => {
//     callback(returnedRss, returnedCategory);
//   })
//   .catch((reason) => {
//     console.log(reason);
//   });
// }
exports.writeJson = function(path, input) {
  fs.writeFileSync(path, input);
};

exports.categorizeArticles = function(queueArray) {
  console.log(queueArray);
  fs.readFile('./json/directory.json', 'utf-8', (err, data) => {
    if (err) throw err;
    let directory = JSON.parse(data);

    for (q = 1; q < queueArray.length; q++) {
      let itemObj = queueArray[q];
      let link = itemObj.link;
      let saveName = itemObj.title + itemObj.pubDate;
      saveName = saveName.replace(/\ /g, "_");
      saveName = saveName.replace(/,/g, "_");
      saveName = saveName.replace(/:/g, "_");
      saveName = saveName.replace(/\./g, "_");
      let fileAlreadyExists = false;
      console.log("saving " + link);

      if (itemObj.categoriesToSave.length == itemObj.subcategoriesToSave.length) {
        for (let i = 0; i < directory.articles.length; i++) {
          if (directory.articles[i].path == saveName && directory.articles[i].pubDate == itemObj.pubDate) {
            fileAlreadyExists = true;
            console.log("article already saved! skipping to next one");
          }
        }

        if (!fileAlreadyExists) {
          saveArticle(link, saveName);

          let directoryItemObj = new directoryItemObjectGenerator(itemObj.title, itemObj.pubDate, link, saveName);
          directory.articles.push(directoryItemObj);

          function directoryItemObjectGenerator(name, pubDate, urlLink, path) {
            this.name = name;
            this.pubDate = pubDate;
            this.link = urlLink;
            this.path = path;
            this.cats = [];
          }
        }

        for (i = 0; i < directory.articles.length; i++) {
          console.log(directory);
          if (directory.articles[i].path == saveName && directory.articles[i].pubDate == itemObj.pubDate) {
            let categoryExists = false;
            for (c = 0; c < itemObj.categoriesToSave.length; c++) {
              for (e = 0; e < directory.articles[i].cats.length; e++) {
                if (directory.articles[i].cats[e].name == itemObj.categoriesToSave[c]) {
                  let subcategoryExists = false;
                  for (s = 0; s < directory.articles[i].cats[e].subs.length; s++) {
                    if (directory.articles[i].cats[e].subs[s] == itemObj.subcategoriesToSave[c]) {
                      subcategoryExists = true;
                    }
                  }

                  if (!subcategoryExists) {
                    directory.articles[i].cats[e].subs.push(itemObj.subcategoriesToSave[c]);
                    //break loop1;
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
      } else {
        console.log("category array didn't match subcategory array, skipping");
      }
    }
    fs.writeFileSync('./json/directory.json', JSON.stringify(directory));
  });

  function catObjGenerator(catName, subcatName) {
    this.name = catName;
    this.subs = [subcatName];
  }

  async function saveArticle(link, saveName) {
    var options = {
      urls: [link],
      directory: './articles/' + saveName + '/',
    };

    // scrape(options).then(result => {
    //   /* some code here */
    // }).catch(err => {
    //   console.log(err);
    // });
  }
};
