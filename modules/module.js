class Module extends require("events") {
  constructor(data) {
    super();
    this.dj = data.dj;
    this._name = data.name;
    this._events = data.events;
    this._loaded = true;
    this.firstLoad = true;
    this._modifier = data.modifier;
    this.data = {};
  }

  async disable() {
    if (!this._loaded) return;
    this.dj.commands.removeAllWhere(
      command => command.module._name == this._name
    );
    if ("disable" in this._events) {
      let res = this._events["disable"]();
      if (res instanceof Promise) await res;
    }
    this._eventsCache = this._events;
    this._events = {};
    this._loaded = false;
  }

  enable() {
    if (this._loaded) return;
    this._events = this._eventsCache;
    this._loaded = true;
    this.emit("ready");
  }

  addCommand(data) {
    data.module = this;
    return this.dj.commands.add(data);
  }

  scanCommands(directory) {
    return this.dj.commands.scan(directory, this);
  }

  scanChecks(directory) {
    return this.dj.checks.scan(directory, this._name);
  }
}

module.exports = Module;
