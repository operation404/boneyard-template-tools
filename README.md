# Boneyard Collection
- [Boneyard Drawing Tools](https://github.com/operation404/boneyard-drawing-tools)
- [Boneyard Template Tools](https://github.com/operation404/boneyard-template-tools)
- [Boneyard Turn Timer](https://github.com/operation404/boneyard-turn-timer)
- [Boneyard Socketlib Companion](https://github.com/operation404/boneyard-socketlib-companion)

# Boneyard Template Tools
The Boneyard Template Tools module currently contains one new feature for extending Measured Template functionality:
- [Template/Token Targeting Functions](#templatetoken-targeting-functions)
  - [Targeting Modes](#targeting-modes)
  - [Token Region Targeting Edge Case](#token-region-targeting-edge-case)
- [TODO](#todo)

## Template/Token Targeting Functions
Three API functions are added for determining whether or not a token is inside of a template, finding all tokens inside of a template, and finding all templates that a token is inside of.

These functions can be accessed through the global `Boneyard.Template_Tools` namespace. The `targeting_mode` parameter is case sensitive and optional. If not present, the functions will use whatever targeting mode is currently set as the module's default. The default targeting mode is a configurable world setting.

```js
token_in_template(token_doc, template_doc, targeting_mode);
template_get_tokens(template_doc, targeting_mode);
token_get_templates(token_doc, targeting_mode);

// example call
Boneyard.Template_Tools.template_get_tokens(templateDocument, 'token region');
```

- `token_in_template()` returns a boolean representing whether or not a token is inside of the template.
- `template_get_tokens()` returns an array of token documents of all the tokens that are inside of the template.
- `token_get_templates()` returns an array of template documents of all the templates that a token is inside of.

### Targeting Modes

Boneyard Template Tools supports three targeting modes currently, all of which generate and test points to see if they are within the measured template. The amount and location of points generated is determined by the targeting mode. The list of targeting modes can be accessed through `TARGETING_MODES`.
```js
Boneyard.Template_Tools.TARGETING_MODES = {
  CENTER: 'token center',
  REGION: 'token region',
  SPACE: 'any token space'
}
```

- `'token center'` generates a single point at the center of the token.
- `'any token space'` generates a point at the center of each grid square the token occupies.
- `'token region'` generates points at the corners, center, and middle of the edges of each grid square the token occupies.

<img src="https://github.com/operation404/boneyard-template-tools/blob/master/images/example_targeting_points.jpg?raw=true" width=50%>

This example shows whether or not a token is determined to be inside of a template based on the targeting mode.

<img src="https://github.com/operation404/boneyard-template-tools/blob/master/images/example_templates.jpg?raw=true" width=50%>

These targeting modes assume that the token is both properly aligned to the grid as well as having integers for its height and width. If the token is not aligned to the grid, the points that are generated will not be properly aligned with the grid either. If the token has a height or width that isn't an integer, a ceiling operation is performed to make it an integer before points are generated. These are both limitations of the current implementation, and if the conditions are not met then the targeting methods may not perform as desired.

### Token Region Targeting Edge Case
In the case of the `'token region'` targeting mode, an edge case arises when a template and a token are adjacent to each other. When adjacent, there is at least one point on both the edge of the token's occupied region that is also on the edge of the template's contained region. Because the two regions share at least one point, the token is considered to be inside of the template, even if the regions they occupy do not actually overlap.

In this example the point that each token's occupied region shares with the edge of the template's contained region is marked. The intersection of the token and template's regions would have an area of 0, but they are still considered to be contained within each other.

<img src="https://github.com/operation404/boneyard-template-tools/blob/master/images/example_token_region_edge_case.jpg?raw=true" width=40%>

As a workaround for the `'token region'` targeting mode, the points generated on the border of a token's occupied region are all **shifted inwards by 1 pixel**. This prevents the token from being considered inside of an adjacent template that doesn't share any overlapping area with it.

## TODO
- [x] ~~Add proper module settings to set the default targeting mode.~~
- [ ] Either add new targeting modes or update the existing modes to handle targeting more accurately to the targeting mode descriptions. Any token space should actually calculate center points of grid spaces even if the token isn't properly aligned to them. Token region should actually check if the regions overlap rather than the simpler workaround of generating a dense field of points.
