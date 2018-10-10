const path = require('path');
const fs = require('fs');
const { Collection } = require('discord.js');

class ChecksHandler {
    constructor(dj) {
        this.dj = dj;
        this._checks = {};
        
        this.scan(path.resolve(__dirname,'default'),'dj');
    }
    
    add(checkconf) {
        var { name } = checkconf;
        var check = checkconf.check || function () {};
        var error = checkconf.error || 'None';
        
        if (!this.exists(name)) return this._checks[name] = {check: check, error: error};
    }
    
    scan(directory,base) {
        return new Promise((resolve,reject) => {
            var dir = path.resolve(directory);
            fs.stat(dir, (err) => {
              if (err) return reject('Invalid Path');
              fs.readdir(dir, (err,files) => {
                  if (err) return reject(err);
                  files.forEach(file => {
                      if (!file.endsWith('.js')) return;
                      var name = file.slice(0,-3);
                      var check = require(path.resolve(dir,name));
                      check.name = (base ? base : path.basename(directory)) + '.' + name;
                      this.add(check);
                  });
                  resolve();
              });
            });
        });
    }
    
    get(check) {
        return this._checks[check];
    }
    
    get collection() {
        var array = [];
        for (var key in this._checks) {
            array.push([key,this._checks[key]]);
        }
        return new Collection(array);
    }
    
    exists(check) {
        return this._checks.hasOwnProperty(check);
    }
}

module.exports = ChecksHandler;