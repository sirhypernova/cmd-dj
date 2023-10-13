import { CommandContext } from "../index.js";
const defaultParsers = { ...(await import("./defaultParsers.js")) };

export default class Arguments {
  constructor() {
    /** @type {Object.<String,Array>} */
    this.commandArguments = {};
    /** @type {Object.<String,parserFunction>} */
    this.parsers = defaultParsers;

    this.validRegex =
      /^(<(?:[A-Za-z0-9]+\??)(?:(?: |\|)[A-Za-z0-9]+)*> ?)+(?<! )$/;
    this.parseRegex = /<([A-Za-z0-9]+\??)((?:(?: |\|)[A-Za-z0-9]+)*)>/g;
  }

  validate(args) {
    return this.validRegex.test(args);
  }

  /**
   *
   * @param {String} command
   * @param {String} args
   */
  addArgs(command, args) {
    if (!this.validate(args)) throw new Error("Invalid Arguments String");
    let arg;
    let types = [];
    while ((arg = this.parseRegex.exec(args)) != null) {
      arg.shift();
      let type = arg.shift();
      let otherData = arg.shift().trim();
      let name = type;
      let argOptions;
      let optional = false;

      if (otherData.length) {
        let data = otherData.split("|");
        if (data.length >= 1) {
          if (data[0] == "") throw new Error("OR must have a name");
          if (data.length == 1) {
            name = data[0];
          } else {
            type = "string";
            argOptions = data;
          }
        }
      }
      if (type.endsWith("?")) {
        optional = true;
        type = type.replace("?", "");
      }
      if (name.endsWith("?")) {
        optional = true;
        name = name.replace("?", "");
      }
      types.push({ name, type, options: argOptions || false, optional });
    }
    types.forEach((type, position) => {
      if (type.type == "long" && position != types.length - 1)
        throw new Error("Argument type long must be the last argument.");
    });
    this.commandArguments[command] = types;
  }

  /**
   * @typedef {Object} argResult
   * @property {boolean} valid
   * @property {any} value
   */

  /**
   *
   * @param {CommandContext} ctx
   */
  async getArgs(ctx) {
    const args =
      this.commandArguments[
        ctx.command in ctx.client.commands.aliases
          ? ctx.client.commands.aliases[ctx.command]
          : ctx.command
      ];
    const finishedArgs = {};
    let error = false;
    let finished = 0;
    for (let arg of args) {
      if (!(arg.type in this.parsers))
        throw new Error(`Parser type "${arg.type}" does not exist.`);
      let result = this.parsers[arg.type](ctx, finished, arg.options);
      if (result instanceof Promise) result = await result;
      if (!result.valid && !arg.optional) {
        error = { name: arg.name, error: result.value || true };
        break;
      }
      finishedArgs[arg.name] =
        !result.valid && arg.optional ? null : result.value;
      finished++;
    }
    if (finished !== args.length) return { valid: false, error };
    return { valid: true, args: finishedArgs };
  }

  /**
   *
   * @callback parserFunction
   * @param {CommandContext} ctx
   * @param {Number} position
   * @param {Object|boolean} options
   * @returns {argResult}
   */

  /**
   * Add an argument parser
   * @param {String} name
   * @param {parserFunction} func
   */
  addParser(name, func) {
    this.parsers[name] = func;
  }
}
