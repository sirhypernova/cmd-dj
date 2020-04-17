const { Client } = require("..");
const Module = require("./module");
const path = require("path");
const fs = require("fs");
const { Collection } = require("discord.js");

module.exports = class ModuleHandler {
  /**
   * Command handler
   * @param {Client} client
   */
  constructor(client) {
    this.client = client;
    this.modules = {};
    this._collection = null;
  }

  /**
   * Register a module
   * @param {Object} module
   * @param {{
   *  location?: String
   * }} options
   */
  async add(module, { location = false }) {
    if (this._collection !== null) this._collection = null;
    if (!(module.prototype instanceof Module))
      throw new Error("Module is not valid.");
    /** @type {Module} */
    const mod = new module(this.client);
    if (location) {
      mod.fileLocation = location;
    }
    this.modules[mod.name] = mod;
    if (["immediate", "before", "register"].includes(mod.loadPosition)) {
      let onLoad = mod._onLoad();
      if (onLoad instanceof Promise) await onLoad;
    } else if (
      mod.loadPosition == null ||
      ["ready", "after"].includes(mod.loadPosition)
    ) {
      if (this.client.ready) {
        let onLoad = mod._onLoad();
        if (onLoad instanceof Promise) await onLoad;
      }
    }
  }

  /**
   * Reload a module
   * @param {String} module
   */
  async reload(module) {
    if (!this.exists(module)) return false;
    if (this._collection !== null) this._collection = null;
    let mod = this.get(module);
    if (!mod.fileLocation) return false;
    if (!fs.existsSync(mod.fileLocation)) return false;
    /** @type {Module} */
    let newModule;
    try {
      delete require.cache[require.resolve(mod.fileLocation)];
      newModule = require(mod.fileLocation);
    } catch (e) {
      return e;
    }
    await mod._onUnload();
    delete this.modules[module];
    this.add(newModule, { location: mod.fileLocation });
    return true;
  }

  /**
   * Scan a directory to load modules from
   * @param {String} directory
   */
  scan(directory) {
    return new Promise((resolve, reject) => {
      var dir = path.resolve(directory);
      fs.stat(dir, (err) => {
        if (err) return reject("Invalid Path");
        fs.readdir(dir, (err, files) => {
          if (err) return reject(err);
          files.forEach((file) => {
            if (!file.endsWith(".js")) return;
            var mod = require(path.resolve(dir, file));
            this.add(mod, { location: path.resolve(dir, file) });
          });
          resolve();
        });
      });
    });
  }

  /**
   * Get a module
   * @param {String} module
   * @returns {Module}
   */
  get(module) {
    return this.modules[module];
  }

  /**
   * Checks if a module exists
   * @param {String} module
   */
  exists(module) {
    return this.modules.hasOwnProperty(module);
  }

  /**
   * Get a collection of modules
   * @returns {Collection<String,Module>}
   */
  get collection() {
    if (
      this._collection !== null &&
      Object.keys(this.modules).length == this._collection.size
    )
      return this._collection;
    var array = [];
    for (let key in this.modules) {
      array.push([key, this.modules[key]]);
    }
    return (this._collection = new Collection(array));
  }

  async loadModules() {
    let toLoad = this.collection
      .filter(
        (mod) =>
          !mod.loaded &&
          (mod.loadPosition == null ||
            ["ready", "after"].includes(mod.loadPosition))
      )
      .array();

    for (let mod of toLoad) {
      let onLoad = mod._onLoad();
      if (onLoad instanceof Promise) await onLoad;
    }
  }
};
