# Boneyard Collection

- [Boneyard Drawing Tools](https://github.com/operation404/boneyard-drawing-tools)
- [Boneyard Template Tools](https://github.com/operation404/boneyard-template-tools)
- [Boneyard Turn Timer](https://github.com/operation404/boneyard-turn-timer)
- [Boneyard Socketlib Companion](https://github.com/operation404/boneyard-socketlib-companion)

# Boneyard Template Tools

Boneyard Template Tools extends the `TokenDocument` and `MeasuredTemplateDocument` classes to add new functionality for detecting collisions between tokens and templates.

- [Token-Template Collision Detection](#token-template-collision-detection)
   - [Document Instance Methods](#document-instance-methods)
   - [Collision Methods](#collision-methods)
   - [Token Collision Shapes](#token-collision-shapes)

- [Settings](#settings)
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

### Document Instance Methods

`collidesToken` is the method which implements all collision detection logic, and is ultimately called by all other collision methods provided by this module. All of the options fields are optional and will use the default values as defined in the module settings if no explicit values are passed. This method can be configured to return either a boolean representing a collision based on a certain tolerance or a ratio of the intersection's area to the token's or template's area. The boolean result is useful for simplifying collision results to a binary option, but the ratio can be used if one wishes to have different outcomes based on how much overlap there is with the token and template.

```js
    /**
     * Check if a token is contained by this template.
     * This method can either return a boolean if only a simple binary collision result is required,
     * or it can return the ratio of the area of the collision intersection and either the token or template's area.
     * @param {ByTokenDocument} tokenDoc                    The token being tested.
     * @param {object} [options]                            Options to configure how collision is calculated.
     * @param {number} [options.tolerance]                  Percentage of overlap needed to be considered inside the template.
     * @param {string} [options.collisionMethod]            Type of collision detection method to use.
     * @param {boolean} [options.percentageOutput]          Whether to return a boolean representing the collision result or ratio of
     *                                                      the collision intersection area.
     * @param {boolean} [options.considerTemplateRatio]     Whether to account for the ratio of the intersection and template areas.
     * @param {string} [options.tokenCollisionShape]        What shape type to use for the token's collision area.
     * @returns {boolean|number}                            Whether the token is inside the template or the ratio of the collision
     *                                                      intersection area.
     */
    collidesToken(tokenDoc, options)

```

`getTokens` tests all tokens in the current scene and returns an array of documents of all the tokens that are considered to collide with the template. The array will be empty if no tokens collide with the template. As this requires a definitive answer for whether or not a token collides with the template, the `options.percentageOutput` field is always set to false regardless of whether or not it is declared in the options argument.

```js
    /**
     * Find all tokens that are contained within this template.
     * As a definitive answer is needed for whether a token collides with a template in order to populate the array,
     * the options.percentageOutput field is always set to false regardless of any default or explicitly declared value.
     * @param {object} [options]                            Options to configure how collision is calculated.
     * @param {number} [options.tolerance]                  Percentage of overlap needed to be considered inside the template.
     * @param {string} [options.collisionMethod]            Type of collision detection method to use.
     * @param {boolean} [options.considerTemplateRatio]     Whether to account for the ratio of the intersection and template areas.
     * @param {string} [options.tokenCollisionShape]        What shape type to use for the token's collision area.
     * @returns {ByTokenDocument[]}                         Array of all tokens contained within the template.
     */
    getTokens(options)

```

`collidesTemplates` is a convenience method provided by the token document class. It is identical to calling the argument template's `collidesToken` method and passing the token as an argument.

```js
    /**
     * Check if a template contains this token.
     * @see {@link ByMeasuredTemplateDocument#collidesToken}
     * @returns {boolean|number}        Whether the token is inside the template or the ratio of the collision
     *                                  intersection area.
     */
    collidesTemplate(measuredTemplateDoc, options)

```

`getTemplates` is the token document's version of the template document's `getTokens` method. It behaves in the same manner but returns an array of documents of all the templates in the scene that collide with the token.

```js
    /**
     * Find all templates that this token is contained within.
     * @see {@link ByMeasuredTemplateDocument#getTokens}
     * @returns {ByTokenDocument[]}     Array of all templates that contain the token.
     */
    getTemplates(options)

```

### Collision Methods

There are 3 provided styles of token collision detection: center point, occupied grid spaces, and area intersection. The first two options generate a set of points and tests whether any of them are contained within a template. The last option generates a polygon representation of the token's area on the grid and then performs an intersection with the template. The list of collision styles can be accessed through `Boneyard.Template_Tools.COLLISION_METHOD`.

```js
Boneyard.Template_Tools.TARGETING_MODES = {
    POINTS_CENTER: 'POINTS_CENTER',
    GRID_SPACES_POINTS: 'GRID_SPACES_POINTS',
    AREA_INTERSECTION: 'AREA_INTERSECTION'
};

```

`POINTS_CENTER` will generate a single point at the center of the token and test if that point is within the template. This point may not be grid aligned if the token itself is either not aligned to the grid or if the token's dimensions are not cleanly divisible by the grid size.

`GRID_SPACES_POINTS` will generate a point at the center of each grid space the token is considered to occupy. This collision style uses a modified version of the code that Foundry core uses to highlight grid spaces contained within a template. While the points generated by in this style of collision will always be at the center of grid spaces, the token doesn't need to be grid aligned. A space is determined to be occupied by the token if the center point of that space is contained within the polygon representation of the token's area on the grid. If the scene has no grid, the array of points will always be empty and therefore will never result in a collision.

`AREA_INTERSECTION` will create a PIXI Polygon representing the area the token occupies on the grid. This polygon is then intersected with the template. If the two shapes overlap at all, the resulting intersection will have a non-zero area. The ratio of intersection area to the token polygon's area (or the template's, depending on configuration) is used to determine collision.

<img src="https://github.com/operation404/boneyard-template-tools/blob/master/images/collision_styles_example.png?raw=true" width=60%>

This example shows the collision styles using some example tokens of a lionfolk warrior, a worg, and an angel and assuming the smallest possible tolerance value. The point at the center of the lionfolk's token is inside the template, so it would result in a collision when using the `POINTS_CENTER` collision method. The worg's center point isn't inside of the template, but the center of some of the grid spaces that the token occupies are, so it would result in a collision when using the `GRID_SPACES_POINTS` collision method. Neither the center point of the angel or any of the grid spaces the angel occupies are inside of the template. However, the collision box of the angel overlaps with the template, resulting in an intersection with a non-zero area and therefore a collision when using the `AREA_INTERSECTION` collision method.

### Token Collision Shapes

There are 2 provided ways of representing token area on the grid: rectangles and circles. When using a rectangular representation, a rectangle is generated with the same width and height of the token on the grid. When using a circle representation, the center point of the circle is set to the token's center and the radius is half of either the token width or height, whichever is larger. The circle representation uses a polygon approximation for actual collision detection. This should have no tangible effect on collision accuracy in actual play, but is mentioned for clarity. The chosen representation can impact the results of token collision when using the `GRID_SPACES_POINTS` and `AREA_INTERSECTION` collision methods.

<img src="https://github.com/operation404/boneyard-template-tools/blob/master/images/token_shape_area_intersection_example.png?raw=true" width=40%>

In this example, the token's grid area representation as a rectangle is shown in cyan and the representation as a circle is shown in purple. When using the `AREA_INTERSECTION` collision style the rectangle representation would result in a collision but the circle representation would not.

<img src="https://github.com/operation404/boneyard-template-tools/blob/master/images/token_shape_grid_spaces_example.png?raw=true" width=40%>

This example shows how the different representations of a token affects which grid spaces a token occupies with the `AREA_INTERSECTION` collision style. When representing the token's grid area as a rectangle, all of the points displayed would be contained within that rectangle and so the grid spaces they belong to are considered to be occupied by the token. When using the circle representation, the center points of the grid spaces at the corners of the token aren't contained by the circle representing the token's area on the grid. These points are marked in orange and their respective grid spaces are not considered occupied by the token, whereas the spaces represented by the cyan points would be.

## Settings

All modules settings are global and define the default behavior of collision detection.

**Collision Detection Method** sets the default collision style to use for collision detection.

**Token Collision Shape** sets the default representation for the token grid area.

**Collision Ratio Tolerance** sets the default tolerance to use for collision detection when returning a boolean. If the collision ratio is equal to or above this tolerance, the token is considered contained by the template and true is returned, otherwise false. The tolerance must be a number greater than zero, and is the smallest possible number JS can represent by default. For this value, any non-zero overlap is considered a collision.

**Return Collision Ratio** sets whether collision methods should return the collision ratio instead of a boolean. This ratio can be useful when one would want to do different things depending on how much the token overlaps with the template.

__Consider Intersection and Template Ratio__ sets whether the `AREA_INTERSECTION` collision method should also account for both the ratio of the intersection and token areas and the intersection and template areas. This may be desired for cases where the area of the token is close to or greater than the area of the template. In such cases, the ratio of the intersection and token areas might be very small despite most of the template overlapping with the token. This option requests the collision methods to also calculate the ratio of the intersection and template areas, and return that if it would be greater than the intersection and token area ratio. This can be useful for where one would want a token to be considered to collide with a smaller template that mostly or completely overlaps with it.

## TODO

- [x] ~~Add proper module settings to set the default targeting mode.~~
- [x] ~~Either add new targeting modes or update the existing modes to handle targeting more accurately to the targeting mode descriptions. Any token space should actually calculate center points of grid spaces even if the token isn't properly aligned to them. Token region should actually check if the regions overlap rather than the simpler workaround of generating a dense field of points.~~
- [ ] Provide more token collision shape options. Ellipse seems like a given, potentially more irregular shapes. Also worth investigating a way to set a token to have a specific collision shape instead of using one shape representation for all collisions.
- [ ] Create a new template subclass that represents a set operation on two or more templates.
- [ ] Add functionality to live preview placing a template on the grid.
- [ ] Expand collision methods to allow for template-template collision and token-token collision.
- [ ] Add methods to give a template a function to run on all tokens that the template contains. Worth investigating if there are other useful automation tools I can provide for templates.
