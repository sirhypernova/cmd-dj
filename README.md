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
    roles: ['everyone'], // Allows everyone to use it
    help: 'Displays bot and api ping', // Help information - WIP,
    usage: '{prefix}ping', // Usage information - WIP
    // The handler gets run when a user runs a command, given they have proper permissions
    handler: async function (msg,args,dj) {
        var m = await msg.channel.send('Pong?');
        m.edit(`Pong! ${Math.floor(Date.now() -m.createdTimestamp)}ms (API: ${Math.floor(dj.ping)}ms)`);
    },
    onLoad: function (command) { // Command is the command object
        command.data.something = 'nice'; // Data can be used during multiple runs
    },
    falseHandler: function (msg,args,dj) {
        // This is ran when a user does not have the required roles to run the command
    }
})

dj.run().then(() => {
   console.log(`Logged in as ${dj.user.tag}!`);
})
.catch(e => {
   console.log(e);
});
```

## Documentation

### `dj.run()`
#### Start the bot
Returns a `Promise` that resolves when the bot is ready, or rejects if there is an error.

### `dj.commands.add(data)`
#### Add a new command
*Data Parameters*

***Required***

`name`: The name of the command, triggered on `prefix`+name

`handler`: The function that is run when the command is triggered, and valid roles exist. The function is run with 3 arguments: `message (Message)`,`arguments (array)`, and the client


`roles`: An array of required roles needed to run the command. Roles are **global**

`falseRun`: The function that is run when the command is triggered, but the user does not have the required roles. The function has the same arguments as handler.

`onLoad`: The function that is run when the command is loaded. The function has one argument: `command (Command)`

`usage`: The string that gives you the correct usage of the command. `{prefix}` will automatically be replaced with the proper prefix.

`help`: The string that tells a user what the command does

**Example:**
```js
dj.commands.add({
    name: 'ping',
    roles: ['everyone'],
    help: 'Displays bot and api ping',
    usage: '{prefix}ping',
    
    handler: async function (msg,args,dj) {
        var m = await msg.channel.send('Pong?');
        m.edit(`Pong! ${Math.floor(Date.now() -m.createdTimestamp)}ms (API: ${Math.floor(dj.ping)}ms)`);
    },
    onLoad: function (command) {
        command.data.something = 'nice';
    },
    falseHandler: function (msg,args,dj) {
        
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
// Remove all commands that everyone can use
dj.commnads.removeAllWhere((command, name) => {
   return command._roles.includes('everyone');
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