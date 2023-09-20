## 2.0.0

Complete rewrite of the original module.

- Module collision detection functionality significantly improved and expanded.
  - Foundry core TokenDocument and MeasuredTemplateDocument classes are extended.
  - Collision detection functions are now implemented as instance methods of the new document subclasses.
  - Center point collision mostly unchanged.
  - Grid spaces collision now correctly generates points representing the center of grid spaces even if the token isn't aligned to the grid, and works on non-square grids.
  - Area intersection collision implemented. A rectangle or circle polygon approximation of the token's area on the grid is generated and intersected with the polygon representation of the template's shape, with the area of the resulting intersection being used to determine whether the token and template collide.
  - Before any collision detection is performed, methods first check if document bounding boxes overlap.
