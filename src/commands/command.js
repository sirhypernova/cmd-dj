const { Client, CommandContext, Module, Check } = require("..");

module.exports = class Command {
  /**
   * Command base class
   * @param {Client} client
   */
  constructor(client) {
    this.client = client;
    /** @type {Check[]} */
    this.checks = [];
    this.name = "";
    this.aliases = [];
    this.help = "";
    this.args = "";
    this.groups = ["default"];
    this.displayGroup = "Default";
    this.cachedUsage = false;
    this.fileLocation = null;
    /** @type {Module} */
    this.module = null;
  }

  /**
   * Get command usage
   * @param {CommandContext} ctx
   */
  usage(ctx) {
    if (this.cachedUsage) return ctx.prefix + this.cachedUsage;
    let usage = this.name;
    if (this.name in this.client.arguments.commandArguments) {
      usage +=
        " " +
        this.client.arguments.commandArguments[this.name]
          .map(
            (arg) =>
              `${arg.optional ? "[" : "<"}${
                arg.options ? arg.options.join("|") : arg.name
              }${arg.optional ? "]" : ">"}`
          )
          .join(" ")
          .trim();
      this.cachedUsage = usage;
    }
    return ctx.prefix + usage;
  }

  /**
   * Execute command
   * @param {CommandContext} ctx
   */
  async execute(ctx) {}

  /**
   * Executed when invalid arguments are input
   * @param {CommandContext} ctx
   * @param {Object} error
   */
  badArgs(ctx, error) {
    return this.usageMessage(ctx);
  }

  /**
   * Executed when a check fails
   * @param {CommandContext} ctx
   * @param {String} checkName
   */
  failedCheck(ctx, checkName) {}

  /**
   * Send the default usage message
   * @param {CommandContext} ctx
   */
  usageMessage(ctx) {
    return ctx.msg.channel.send(`Usage: \`${this.usage(ctx)}\``);
  }
};
