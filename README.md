# Boneyard Collection
- [Boneyard Drawing Tools](https://github.com/operation404/boneyard-drawing-tools)
- [Boneyard Template Tools](https://github.com/operation404/boneyard-template-tools)
- [Boneyard Socketlib Companion](https://github.com/operation404/boneyard-socketlib-companion)

# Boneyard Template Tools
The Boneyard Template Tools module currently contains one new feature for extending Measured Template functionality:
- [Template/Token Targeting Functions](#templatetoken-targeting-functions)

## Template/Token Targeting Functions
Three API functions are added for determining whether or not a token is inside of a template, finding all tokens inside of a template, and finding all templates that a token is inside of. These can be used in macros or other modules for automating the process of targeting and applying the effects of abilities that affect an area of the grid. 

These functions can be accessed with the `Boneyard.Template_Tools' namespace. The `target_style` parameter is optional and if not present, the functions will use whatever targeting style is currently set as the module's default.

```js
// in the Template_Tools class
static token_in_template(token_doc, template_doc, target_style)
static template_get_tokens(template_doc, target_style)
static token_get_templates(token_doc, target_style)

// example call
Boneyard.Template_Tools.template_get_tokens(templateDocument, "token region");
```

### Targeting Modes

Boneyard Template Tools supports three targeting modes currently, all of which generate and test points to see if they are within the measured template. The amount and location of points generated is determined by the targeting mode.
- `"token center"` generates a single point at the center of the token.
- `"any token space"` generates a point at the center of each grid square the token occupies.
- `"token region"` generates points at the corners, center, and middle of the edges of each grid square the token occupies.

![Examples of the points the different targeting modes generate.](https://github.com/operation404/boneyard-template-tools/blob/master/images/example_targeting_points.jpg?raw=true)

This example shows whether or not a token is determined to be inside of a template based on the targeting mode.

![Examples of what the targeting modes look like on the grid.](https://github.com/operation404/boneyard-template-tools/blob/master/images/example_templates.jpg?raw=true)

### Token Region Targeting Edge Case
TODO 
add description and example, then clean up code 

