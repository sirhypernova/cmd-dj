const { CommandContext } = require("..");

/**
 * @typedef {Object} argResult
 * @property {boolean} valid
 * @property {any} value
 */

/**
 *
 * @callback parserFunction
 * @param {CommandContext} ctx
 * @param {Number} position
 * @param {Object|boolean} options
 * @returns {argResult}
 */

module.exports = {
  /** @type {parserFunction} */
  string(ctx, pos, options) {
    if (!ctx.rawArgs[pos]) return { valid: false, value: true };
    let value = ctx.rawArgs[pos];
    if (options) {
      if (!options.includes(value))
        return { valid: false, value: "BAD_ARGUMENT" };
    }
    return { valid: true, value: value };
  },
  /** @type {parserFunction} */
  long(ctx, pos) {
    if (!ctx.rawArgs[pos]) return { valid: false, value: true };
    return { valid: true, value: ctx.rawArgs.slice(pos).join(" ") };
  },
  /** @type {parserFunction} */
  async member(ctx, pos) {
    if (!ctx.rawArgs[pos]) return { valid: false, value: true };
    if (ctx.rawArgs[pos] == "me") return { valid: true, value: ctx.msg.member };
    const matches = ctx.rawArgs[pos].match(/^<@!?(\d+)>$/);
    if (matches == null || !matches.length) {
      const idmatches = ctx.rawArgs[pos].match(/^(\d{16,20})$/);
      if (idmatches != null && idmatches.length) {
        const idmatch = idmatches[1];
        const memberMatch = await ctx.msg.guild.members.fetch(idmatch);
        if (!memberMatch) return { valid: false, value: "NOT_IN_GUILD" };
        return { valid: true, value: memberMatch };
      }
      return { valid: false, value: "BAD_ARGUMENT" };
    }
    const id = matches[1];
    const member = await ctx.msg.guild.members.fetch(id);
    if (!member) return { valid: false, value: "NOT_IN_GUILD" };
    return { valid: true, value: member };
  },
  integer(ctx, pos) {
    if (!ctx.rawArgs[pos]) return { valid: false, value: true };
    if (!/^-?[0-9]+$/.test(ctx.rawArgs[pos]))
      return { valid: false, value: "BAD_ARGUMENT" };
    return { valid: true, value: parseInt(ctx.rawArgs[pos]) };
  },
};
