const { Client } = require("..");
const path = require("path");

module.exports = class Module extends require("events").EventEmitter {
  /**
   * Module base class
   * @param {Client} client
   */
  constructor(client) {
    super();
    this.client = client;
    this.loadPosition = null;
    this.name = "";
    this.enabled = true;
    this.fileLocation = null;
    this.loaded = false;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  onLoad() {}

  _onLoad() {
    if (this.loaded) return;
    this.loaded = true;
    this.onLoad();
  }

  async _onUnload() {
    this.client.commands.removeAllWhere(
      (cmd) => cmd.module && cmd.module.name == this.name
    );
    let unload = this.onUnload();
    if (unload instanceof Promise) await unload;
  }
  onUnload() {}

  /**
   * Scan a folder.
   * @param {String?} directory
   */
  scanCommands(directory = null) {
    this.client.commands.scan(directory, this);
  }
};
