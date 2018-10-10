const { Collection } = require('discord.js');

class Conf extends Collection {
    constructor(conf = []) {
        if (conf != [] && conf.constructor.name != 'Array') {
            var newconf = [];
            for (var key in conf) {
                newconf.push([key,conf[key]]);
            }
            conf = newconf;
        }
        
        super(conf);
    }
}

module.exports = Conf;