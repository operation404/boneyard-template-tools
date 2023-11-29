# Changelog

## 3.0.0

Templates:

- Added method `targetTokens` - targets all colliding tokens.
- Added method `forEachToken` - runs passed function on all colliding tokens.
- Bugfix for incorrect bounding box collision calculation resulting in failed collisions.

Template Previews:

- Template Previews added.
  - Pass initial data and create the template with live previewing enabled, allowing adjustments to be made before placing the template.
  - Restrictions can be added, limiting the ability to move the template, change its size, or rotate it.

Current roadmap is to work on a way to make compositions of basic shapes for t emplating as well as using shapes to further restrict the placement of template previews.

## 2.0.0

Complete rewrite of the original module.

- Module collision detection functionality significantly improved and expanded.
  - Foundry core TokenDocument and MeasuredTemplateDocument classes are extended.
  - Collision detection functions are now implemented as instance methods of the new document subclasses.
  - Center point collision mostly unchanged.
  - Grid spaces collision now correctly generates points representing the center of grid spaces even if the token isn't aligned to the grid, and works on non-square grids.
  - Area intersection collision implemented. A rectangle or circle polygon approximation of the token's area on the grid is generated and intersected with the polygon representation of the template's shape, with the area of the resulting intersection being used to determine whether the token and template collide.
  - Before any collision detection is performed, methods first check if document bounding boxes overlap.
