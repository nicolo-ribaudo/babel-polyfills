## Migration from `preset-env` and `plugin-transform-runtime`

All the existig capabilities of `@babel/preset-env` and `@babel/plugin-transform-runtime` related to `core-js` are supported by the polyfill providers implemented in this repository.

### `core-js@3`

<!-- prettier-ignore-start -->
<table>
<thead><tr>
<th align="center">Old configuration</th>
<th align="center">New configuration</th>
</tr></thead>
<tr>
<td>

```json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": { "firefox": 42 },
      "useBuiltIns": "usage",
      "corejs": 3
    }]
  ]
}
```

</td>
<td>

```json
{
  "targets": { "firefox": 42 },
  "presets": ["@babel/preset-env"],
  "plugins": [
    ["polyfill-corejs3", {
      "method": "usage-global"
    }]
  ]
}
```

</td>
</tr>
</table>
<!-- prettier-ignore-end -->


<!-- prettier-ignore-start -->
<table>
<thead><tr>
<th align="center">Old configuration</th>
<th align="center">New configuration</th>
</tr></thead>
<tr>
<td>

```json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": { "firefox": 42 },
      "useBuiltIns": "entry",
      "corejs": 3
    }]
  ]
}
```

</td>
<td>

```json
{
  "targets": { "firefox": 42 },
  "presets": ["@babel/preset-env"],
  "plugins": [
    ["polyfill-corejs3", {
      "method": "entry-global"
    }]
  ]
}
```

</td>
</tr>
</table>
<!-- prettier-ignore-end -->


<!-- prettier-ignore-start -->
<table>
<thead><tr>
<th align="center">Old configuration</th>
<th align="center">New configuration</th>
</tr></thead>
<tr>
<td>

```json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": { "firefox": 42 }
    }]
  ],
  "plugins": [
    ["@babel/transform-runtime", {
      "corejs": 3
    }]
  ]
}
```

</td>
<td>

```json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": { "firefox": 42 }
    }]
  ],
  "plugins": [
    "@babel/transform-runtime",
    ["polyfill-corejs3", {
      "method": "usage-pure"
    }]
  ]
}
```

**NOTE**: The "Old" config doesn't support targets for polyfills, but you'll likely want to enable them by moving the `targets` option to the top-level.

</td>
</tr>
</table>
<!-- prettier-ignore-end -->

### `es-shims`

<!-- prettier-ignore-start -->
<table>
<thead><tr>
<th align="center">Old configuration (with <code>core-js</code>)</th>
<th align="center">New configuration</th>
</tr></thead>
<tr>
<td>

```json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": { "firefox": 42 },
      "useBuiltIns": "usage",
      "corejs": 3
    }]
  ]
}
```

</td>
<td>

```json
{
  "targets": { "firefox": 42 },
  "presets": ["@babel/preset-env"],
  "plugins": [
    ["polyfill-es-shims", {
      "method": "usage-global"
    }]
  ]
}
```

</td>
</tr>
</table>
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
<table>
<thead><tr>
<th align="center">Old configuration (with <code>core-js</code>)</th>
<th align="center">New configuration</th>
</tr></thead>
<tr>
<td>

```json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": { "firefox": 42 }
    }]
  ],
  "plugins": [
    ["@babel/transform-runtime", {
      "corejs": 3
    }]
  ]
}
```

</td>
<td>

```json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": { "firefox": 42 }
    }]
  ],
  "plugins": [
    "@babel/transform-runtime",
    ["polyfill-es-shims", {
      "method": "usage-pure",
    }]
  ]
}
```

**NOTE**: The "Old" config doesn't support targets for polyfills, but you'll likely want to enable them by moving the `targets` option to the top-level.

</td>
</tr>
</table>
<!-- prettier-ignore-end -->
