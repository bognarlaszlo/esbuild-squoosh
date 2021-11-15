# esbuild-squoosh

An [esbuild](https://esbuild.github.io/) plugin for compressing resolved images using [libSquoosh](https://github.com/GoogleChromeLabs/squoosh/tree/dev/libsquoosh)

## Install
`npm i -D esbuild-squoosh`

## Usage
```js
import esbuild from 'esbuild'
import squoosh from 'esbuild-squoosh'

import squooshConfig from './config/squoosh.config.js'

esbuild.build({
    plugins: [
        squoosh(squooshConfig)
    ]
})
```

If this PostCSS plugin helped you in any way please consider buying me a book @ my buymeacoffee.com page

[!["Buy Me A Coffee"][bmc-badge]][bmc-page]

### TODO:
- Include tests

[bmc-page]: https://www.buymeacoffee.com/bognarlaszlo
[bmc-badge]: https://www.buymeacoffee.com/assets/img/guidelines/download-assets-sm-1.svg
