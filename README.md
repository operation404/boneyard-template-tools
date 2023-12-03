# Boneyard Collection

- [Boneyard Drawing Tools](https://github.com/operation404/boneyard-drawing-tools)
- [Boneyard Template Tools](https://github.com/operation404/boneyard-template-tools)
- [Boneyard Turn Timer](https://github.com/operation404/boneyard-turn-timer)
- [Boneyard Action Prefabs](https://github.com/operation404/boneyard-action-prefabs)
- [Boneyard Socketlib Companion](https://github.com/operation404/boneyard-socketlib-companion)

# Boneyard Template Tools

Boneyard Template Tools extends the `MeasuredTemplateDocument` and `TokenDocument` classes to add new functionality for detecting collisions between tokens and templates, as well as adding utilities for live previewing of template placement.

Documentation on how to use template collision and template previews has been moved to the repository [wiki](https://github.com/operation404/boneyard-template-tools/wiki).

## TODO
- [ ] Create a new template subclass that represents a set operation on two or more templates.
- [ ] Provide more token collision shape options. Ellipse seems like a given, potentially more irregular shapes. Also worth investigating a way to set a token to have a specific collision shape instead of using one shape representation for all collisions.
- [ ] Expand collision methods to allow for template-template collision and token-token collision.
- [x] ~~Add proper module settings to set the default targeting mode.~~
- [x] ~~Either add new targeting modes or update the existing modes to handle targeting more accurately to the targeting mode descriptions. Any token space should actually calculate center points of grid spaces even if the token isn't properly aligned to them. Token region should actually check if the regions overlap rather than the simpler workaround of generating a dense field of points.~~
- [x] ~~Add functionality to live preview placing a template on the grid.~~
- [x] ~~Add methods to give a template a function to run on all tokens that the template contains. Worth investigating if there are other useful automation tools I can provide for templates.~~ Turning this idea into a new module.
