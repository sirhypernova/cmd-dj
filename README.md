# CMD-DJ
Bot Framework for discord.js

***Documentation is a work-in-progress, and does not yet contain all features***

## Getting Started
*This package has only been tested in NodeJS v8*
```sh
npm install cmd-dj
```

## Example Bot
```js
// Main bot file
const { ClientCore } = require('cmd-dj');
const { Client } = ClientCore;

var dj = new Client({
    token: 'YOUR TOKEN',
    prefix: 'dj!',
    owners: [
        'YOUR DISCORD ID'
    ]
},
{
    disableEveryone: true
    // Any other discord client settings can be set here, see https://discord.js.org/#/docs/main/stable/typedef/ClientOptions for details
});

dj.commands.add({
    name: 'ping', // The name of the command, used in this example `dj!ping`
    help: 'Displays bot and api ping', // Help information - WIP,
    usage: '{prefix}ping', // Usage information - WIP
    // The handler gets run when a user runs a command, given they have proper permissions
    handler: async function (msg,args,dj) {
        var m = await msg.channel.send('Pong?');
        m.edit(`Pong! ${Math.floor(Date.now() -m.createdTimestamp)}ms (API: ${Math.floor(dj.ping)}ms)`);
    },
    onLoad: function (command) { // Command is the command object
        command.data.something = 'nice'; // Data can be used during multiple runs
    }
})

dj.run().then(() => {
   console.log(`Logged in as ${dj.user.tag}!`);
})
.catch(e => {
   console.log(e);
});
```

## Core Documentation

### `dj.run()`
#### Start the bot
Returns a `Promise` that resolves when the bot is ready, or rejects if there is an error.

## Modules Documentation
### _Coming soon_

## Commands Documentation

### `dj.commands.add(data)`
#### Add a new command
*Data Parameters*

***Required***

`name`: The name of the command, triggered on `prefix`+name (not required if using scan)

`handler`: The function that is run when the command is triggered, and valid roles exist. The function is run with 3 arguments: `message (Message)`,`arguments (array)`, and the client

***Optional***

`checks`: An array of checks needed to run the command.

`checkFail`: The function that is run when the command is triggered and one or more checks do not return true. The function has the same arguments as handler, in addition to `errors (object)`.

`onLoad`: The function that is run when the command is loaded. The function has one argument: `command (Command)`

`usage`: The string that gives you the correct usage of the command. `{prefix}` will automatically be replaced with the proper prefix.

`help`: The string that tells a user what the command does

**Example:**
```js
dj.commands.add({
    name: 'ping',
    checks: ['dj.owner'],
    help: 'Displays bot and api ping',
    usage: '{prefix}ping',
    
    handler: async function (msg,args,dj) {
        var m = await msg.channel.send('Pong?');
        m.edit(`Pong! ${Math.floor(Date.now() -m.createdTimestamp)}ms (API: ${Math.floor(dj.ping)}ms)`);
    },
    onLoad: function (command) {
        command.data.something = 'nice';
    },
    checkFail: function (msg,args,dj,errors) {
        console.log(errrors);
    }
})
```

### `dj.commands.scan(folder)`
#### Scans a folder and loads the commands
**Example:**
```js
dj.commands.scan('commands');
```

### `dj.commands.remove(command)`
#### Removes a command. Useful for disabling a command across all guilds
**Example:**
```js
dj.commands.remove('ping');
```

### `dj.commands.removeWhere(fn)`
#### Removes the first command where the function returns true.
**Function Arguments:**

`command`: The instance of the command

`name`: The name of the command

**Example:**
```js
// Remove the first command with no usage
dj.commnads.removeWhere((command, name) => {
   return command.usage == 'None Provided';
});
```

### `dj.commands.removeAllWhere(fn)`
#### Exactly like removeWhere, but removes all commands where the function returns true.
**Example:**
```js
// Remove all commands that owners can use
dj.commnads.removeAllWhere((command, name) => {
   return command._checks.includes('dj.owner');
});
```

### `dj.commands.reload(command)`
#### Reloads a command
**Example:**
```js
dj.commands.reload('help');
```

### `dj.commands.reloadDir(directory)`
#### Reloads all the commands loaded from the specified directory
**Example:**
```js
dj.commands.reloadDir('commands');
```

### `dj.commands.collection`
#### Returns a collection of all the commands

### `dj.commands.exists(command)`
#### Check if a command exists
**Example:**
```js
dj.commands.exists('ping');
// Returns true
```

## Checks Documentation
### `dj.checks.add(data)`

*Data Parameters*

***Required***

`name`: The name of the command, triggered on `prefix`+name (Not required if using scan)

`check`: The function that is run when the command is triggered, and valid roles exist. The function is run with 3 arguments: `message (Message)`,`arguments (array)`, and the client

***Optional***

`error`: The error message when the check does not evaluate to true

**Example:**
```js
{
    name: 'owner',
    error: 'Author is not an owner',
    check(msg,args,dj) {
        return dj.dj.get('owners').includes(msg.author.id);
    }
}
```

### `dj.checks.scan(folder,base)`
#### Scans a folder and loads the commands

*Parameters*

***Required***

`folder`: The folder to scan

***Optional***

`base`: The base of the check name. Default to folder + name

**Example:**
```js
dj.checks.scan('checks');
// Or
dj.checks.scan('checks','cool')
//
// Example, if a file is named 'test.js' in the folder 'checks'
// If there is no base specified, the check name would be 'checks.test'
// iF the base is 'cool', the check name would be 'cool.test'
```