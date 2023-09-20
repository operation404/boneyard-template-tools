# Boneyard Collection

- [Boneyard Drawing Tools](https://github.com/operation404/boneyard-drawing-tools)
- [Boneyard Template Tools](https://github.com/operation404/boneyard-template-tools)
- [Boneyard Turn Timer](https://github.com/operation404/boneyard-turn-timer)
- [Boneyard Socketlib Companion](https://github.com/operation404/boneyard-socketlib-companion)

# Boneyard Template Tools

The Boneyard Template Tools module extends the `TokenDocument` and `MeasuredTemplateDocument` classes to add new functionality for detecting collisions between tokens and templates.

- [Token-Template Collision Detection](#token-template-collision-detection)
  - [Targeting Modes](#targeting-modes)
  - [Token Region Targeting Edge Case](#token-region-targeting-edge-case)
- [TODO](#todo)

## Token-Template Collision Detection

The default Foundry `TokenDocument` and `MeasuredTemplateDocument` classes are respectively extended as `ByTokenDocument` and `ByMeasuredTemplateDocument`. Each of the new subclasses provides two new instance methods that can be used to test for collision with either a specific document of the opposite type or to find all of said documents that it collides with. These methods are accessible directly from instances of the document classes.

`ByTokenDocument` provides the `collidesTemplate` and `getTemplates` methods, and `ByMeasuredTemplateDocument` provides the `collidesToken` and `getTokens` methods.

```js
const tokenDoc = canvas.scene.tokens.get(tokenDocId);
const templateDoc = canvas.scene.templates.get(templateDocId);

// test if the token collides with the passed template
const templateCollides = tokenDoc.collidesTemplate(templateDoc);

// get all templates that collide with this token
const templatesArray = tokenDoc.getTemplates();

// test if the template collides with the passed token
const tokenCollides = templateDoc.collidesToken(tokenDoc);

// get all tokens that collide with this template
const tokensArray = templateDoc.getTokens();
```

## Collision Methods

`collidesToken` is the method which implements all collision detection logic, and is ultimately called by all other collision methods provided by this module. All of the options fields are optional and will use the default values in the module settings if no explicit value is passed.
```js
    /**
     * Check if a token is contained by this template.
     * This method can either return a boolean if only a simple binary collision result is required,
     * or it can return the ratio of the area of the collision intersection and either the token or template's area.
     * @param {ByTokenDocument} tokenDoc                    The token being tested.
     * @param {object} [options]                            Options to configure how collision is calculated.
     * @param {number} [options.tolerance]                  Percentage of overlap needed to be considered inside the template.
     * @param {string} [options.collisionMethod]            Type of collision detection method to use.
     * @param {boolean} [options.percentateOutput]          Whether to return a boolean representing the collision result or ratio of
     *                                                      the collision intersection area.
     * @param {boolean} [options.considerTemplateRatio]     Whether to account for the ratio of the intersection and template areas.
     * @param {string} [options.tokenCollisionShape]        What shape type to use for the token's collision area.
     * @returns {boolean|number}                            Whether the token is inside the template or the ratio of the collision
     *                                                      intersection area.
     */
    collidesToken(tokenDoc, options)
```

```js
    /**
     * Check if a template contains this token.
     * This method can either return a boolean if only a simple binary collision result is required,
     * or it can return the ratio of the area of the collision intersection and either the token or template's area.
     * @param {ByMeasuredTemplateDocument} measuredTemplateDoc  The template being tested.
     * @param {object} [options]                                Options to configure how collision is calculated.
     * @param {number} [options.tolerance]                      Percentage of overlap needed to be considered inside the template.
     * @param {string} [options.targetingMode]                  Type of collision detection method to use.
     * @param {boolean} [options.percentateOutput]              Whether to return a boolean representing the collision result or ratio of
     *                                                          the collision intersection area.
     * @param {boolean} [options.considerTemplateRatio]         Whether to account for the ratio of the intersection and template areas.
     * @param {string} [options.tokenCollisionShape]            What shape type to use for the token's collision area.
     * @returns {boolean|number}                                Whether the token is inside the template or the ratio of the collision
     *                                                          intersection area.
     */
    collidesTemplate(measuredTemplateDoc, options)

    /**
     * Find all templates that this token is contained within.
     * @param {object} [options]                            Options to configure how collision is calculated.
     * @param {number} [options.tolerance]                  Percentage of overlap needed to be considered inside the template.
     * @param {string} [options.targetingMode]              Type of collision detection method to use.
     * @param {boolean} [options.considerTemplateRatio]     Whether to account for the ratio of the intersection and template areas.
     * @param {string} [options.tokenCollisionShape]        What shape type to use for the token's collision area.
     * @returns {ByMeasuredTemplateDocument[]}              Array of all templates that contain the token.
     */
    getTemplates(options)

    

    /**
     * Find all tokens that are contained within this template.
     * @param {object} [options]                            Options to configure how collision is calculated.
     * @param {number} [options.tolerance]                  Percentage of overlap needed to be considered inside the template.
     * @param {string} [options.targetingMode]              Type of collision detection method to use.
     * @param {boolean} [options.considerTemplateRatio]     Whether to account for the ratio of the intersection and template areas.
     * @param {string} [options.tokenCollisionShape]        What shape type to use for the token's collision area.
     * @returns {ByTokenDocument[]}                         Array of all tokens contained within the template.
     */
    getTokens(options)
```

### Targeting Modes

Boneyard Template Tools supports three targeting modes currently, all of which generate and test points to see if they are within the measured template. The amount and location of points generated is determined by the targeting mode. The list of targeting modes can be accessed through `TARGETING_MODES`.

```js
Boneyard.Template_Tools.TARGETING_MODES = {
    CENTER: 'token center',
    REGION: 'token region',
    SPACE: 'any token space',
};
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
