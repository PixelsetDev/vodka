# Vodka
The backend server/API for Drinko!³ - the sequel to the much loved Drinko! game.

# Playing Drinko!³
To play Drinko!³ you can either download [Gin](https://github.com/pixelsetdev/gin) and Vodka and host them yourself or 
visit drinko.co.uk to play on our hosted instance. drinko.co.uk always has the most up-to-date version of the game 
automatically uploaded from our GitHub.

To play simply enter you and your friends names (2-20 players) and select one of the four games to play! There's 
Lightweight, Dirty, WTF, and Hardcore games you can play.

# Disclaimer
This game is dirty and contains adult themes, don't play it with your parents.

You must be 18+ to play.

This game will get you drunk. Always drink responsibly. When the fun stops, stop.

# Open Source
We <3 open source. The Drinko! software is and always will be available under the Apache-2.0 International license. You
are free to modify, share, and reproduce the software as long as you abide by the terms of the license.

## Building and Deploying
Drinko!³ composes of two parts - the client and server, which we call Gin and Vodka.
You'll need to download and build both of them to get started.
See the package.json file for build commands.

### Authentication
A LogTo instance is required for authentication. We may be able to provide access to our instance (Portal) if you need
it, if so please email portaldev@pixelset.dev for assistance.

Note: For LogTo to work correctly, you'll need to set TRUST_PROXY_HEADER to true in Node.JS

### TLS/SSL
By default, Vodka runs behind Caddy which provides TLS/SSL certificates.

### Content
Game-content is stored in a MYSQL Database. Our paid packs are not open-source, but our free ones are. Plus, you can add
your own! For help, please see [the database guide](DATABASE.md).

## Modifying Vodka
You can modify Vodka as long as you follow the terms of the Apache 2.0 license.

## Issues
Issues in this repository are for backend issues only. For frontend issues please open an issue at 
[Gin](https://github.com/pixelsetdev/gin)'s repository.