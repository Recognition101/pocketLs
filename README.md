# Pocket Ls

This is a small CLI utility that will print any URL that is currently unread (non-archived) in your [pocket](https://getpocket.com) account.

## Setup

First, `cd` to the pocketLs directory, and install node and all dependencies:

```
brew install node
npm install
```

Then, run the setup process in order to authenticate (follow all instructions it gives you, which include opening a browser and registering/authenticating a pocket app):

```
node setupPocketLs.js
```

## Usage

```
Usage: pocketLs [options]

Options:

  -h, --help                output usage information
  -V, --version             output the version number
  -x, --exclude [filename]  An optional JSON file that maintains a list of URLs that have been printed already, and will not be printed again in successive runs.
```

For example:

```
node pocketLs.js
```

Might output:

```
http://example1.com http://example2.com
```

The `--once` option can be used to specify a JSON file that will be used to store which URLs have been printed already, and not allow them to be printed again. This is useful if you run this script periodically and never want a URL to be shown twice. For instance, if we run this command once:

```
node pocketLs.js -o ~/.pocketLsLog.json
```

Then it will output each URL and store each URL in the file `~/.pocketLsLog.json`. If we were to run that command again, it would not output anything, since every URL was already encountered once according to `~/.pocketLsLog.json`.
