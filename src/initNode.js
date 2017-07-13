var fs = require('fs');
var exports = module.exports = {};

exports.checkFolderExists = async function(path, callbackFunction) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
  callbackFunction();
};

exports.checkFileExists = async function(file, template) {
  fs.access(file, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(template, (err, data) => {
          fs.writeFile(file, data, (err) => {
            if (err) {
              console.log(file);
              console.log(err);
            }else {
              console.log(`successfully wrote file for ${file}`);
            }
          });
        });
      } else {
        throw err;
      }
    }
  });
};
