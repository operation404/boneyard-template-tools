import * as CONST from '../constants.js';
import { ByMeasuredTemplateDocument } from './ByMeasuredTemplateDocument';

/*

TODO

Also, for the template itself, the shape is a simple pixi graphics object.
If I make a pixi container and put multiple shapes in it, I should be able
to make custom composite templates. The container seems to test all children for stuff like
a point being inside of it - even if it doesn't, I could easily override the method
and make it do that.
So like 3 overlapping circles all as one template. 

*/

export class CompositeMeasuredTemplate extends ByMeasuredTemplateDocument {}
