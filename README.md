## spritore

### What's this?
This is a library that allows you to create sprites for Vector Tile maps with fewer settings than spritezero or spritesmith.
Even svg files and other image files that cannot be converted properly by spritezero can be converted to Sprite (with some force).

### Usage
```js
const { generate } = require("@kartore/spritore")
const path = require("path")

generate({
  inputPath: path.join(__dirname, "input"),
  outputPath: path.join(__dirname, "output"),
  outputFileName: "sprite"
  
})
```

### Installation

Requires [nodejs](http://nodejs.org/) v14.0.0 or greater.

```bash
$ npm install @kartore/spritore
```
