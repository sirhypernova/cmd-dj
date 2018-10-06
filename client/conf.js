const pcol = require('p-col');
const pcolSQLite = require('pcol-sqlite');

class Conf extends pcol {
    constructor(db,conf = []) {
        if (conf != [] && conf.constructor.name != 'Array') {
            var newconf = [];
            for (var key in conf) {
                newconf.push([key,conf[key]]);
            }
            conf = newconf;
        }
        
        if (typeof db == 'string') {
            var dbname = db;
            db = new pcolSQLite(dbname);
        }
        
        super(db,conf);
    }
}

module.exports = Conf;