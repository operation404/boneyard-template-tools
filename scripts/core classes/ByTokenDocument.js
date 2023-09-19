import { ByMeasuredTemplateDocument } from './ByMeasuredTemplateDocument.js';
import * as CONST from '../constants.js';

/** @inheritdoc */
export class ByTokenDocument extends CONFIG.Token.documentClass {
    // -------------------- Private Class Fields --------------------

    /**
     * Attach init hooks to set class fields and override the core class.
     */
    static _init() {
        ByTokenDocument._overrideSimpleTokenDocument();
        ByTokenDocument._defaultTokenCollisionShape = game.settings.get(
            CONST.MODULE,
            CONST.SETTINGS.TOKEN_COLLISION_SHAPE
        );
    }

    /**
     * Override the core SimpleTokenDocument class.
     */
    static _overrideSimpleTokenDocument() {
        CONFIG.Token.documentClass = ByTokenDocument;
        console.log(`====== Boneyard ======\n - ByTokenDocument override complete`);
    }

    static _defaultTokenCollisionShape;

    // -------------------- Private Instance Fields --------------------

    _getBounds() {
        return this.object.bounds;
    }

    /**
     * Get the point at the center of token.
     * @returns {Point[]}
     */
    _centerPoint() {
        const { size } = this.parent.dimensions;
        // width/height are in grid units, not px
        const { x, y, width, height } = this;
        return [
            {
                x: x + (width * size) / 2,
                y: y + (height * size) / 2,
            },
        ];
    }

    /**
     * Get the point at the center of each space the token occupies.
     * @returns {Point[]}
     */
    _spacesPoints() {
        const { size } = this.parent.dimensions;
        const { x, y } = this;
        // width/height are in grid units, not px
        // ceil so tokens partially occupying a space include that entire space
        const width = Math.ceil(this.width);
        const height = Math.ceil(this.height);

        const points = [];
        for (let h = 0.5; h < height; h++) {
            for (let w = 0.5; w < width; w++) {
                points.push({
                    x: x + w * size, // x + hortizontal offset for the space
                    y: y + h * size, // y + vertical offset for the space
                });
            }
        }
        return points;
    }

    /**
     * Get the point at the center of each space the token occupies.
     * @returns {Point[]}
     */
    _gridSpacesCenterPoints({ tokenCollisionShape = ByTokenDocument._defaultTokenCollisionShape }) {
        // Check for invalid input errors
        {
            if (this.object === null || this.parent !== canvas.scene) {
                const msg = `Token not on current active scene.`;
                return console.error(msg, this);
            }
            if (CONST.TOKEN_COLLISION_SHAPE[tokenCollisionShape] === undefined) {
                const msg = `Invalid token collision shape: ${tokenCollisionShape}`;
                return console.error(msg, tokenCollisionShape);
            }
        }
        if (canvas.grid.type === window.CONST.GRID_TYPES.GRIDLESS) return [];

        let collisionShape;
        switch (tokenCollisionShape) {
            case CONST.TOKEN_COLLISION_SHAPE.CIRCLE:
                collisionShape = this._circle(options);
                break;
            case CONST.TOKEN_COLLISION_SHAPE.RECTANGLE:
                collisionShape = this._rectangle(options);
                break;
        }

        const d = canvas.dimensions;
        const grid = canvas.grid.grid;
        let { x, y, width, height } = this; // width/height are in grid units, not px
        x += (width * size) / 2;
        y += (height * size) / 2;
        const distance = (Math.sqrt(width * width + height * height) / 2) * d.distance;

        // ---------- modified from foundry MeasuredTemplate._getGridHighlightPositions ----------

        // Get number of rows and columns
        const [maxRow, maxCol] = grid.getGridPositionFromPixels(d.width, d.height);
        let nRows = Math.ceil((distance * 1.5) / d.distance / (d.size / grid.h));
        let nCols = Math.ceil((distance * 1.5) / d.distance / (d.size / grid.w));
        [nRows, nCols] = [Math.min(nRows, maxRow), Math.min(nCols, maxCol)];

        // Get the offset of the template origin relative to the top-left grid space
        const [tx, ty] = grid.getTopLeft(x, y);
        const [row0, col0] = grid.getGridPositionFromPixels(tx, ty);
        const [hx, hy] = [Math.ceil(grid.w / 2), Math.ceil(grid.h / 2)];
        const isCenter = x - tx === hx && y - ty === hy;

        // Identify grid coordinates covered by the template Graphics
        const positions = [];
        for (let r = -nRows; r < nRows; r++) {
            for (let c = -nCols; c < nCols; c++) {
                const [gx, gy] = grid.getPixelsFromGridPosition(row0 + r, col0 + c);
                const [testX, testY] = [gx + hx - x, gy + hy - y];
                const contains = (r === 0 && c === 0 && isCenter) || grid._testShape(testX, testY, collisionShape);
                if (!contains) continue;
                positions.push({ x: gx, y: gy });
            }
        }
        return positions;
    }

    /*
    	This function is written in such a way that it assumes the token's width
    	and height are whole numbers. If this assumption isn't true, this function
    	may behave unexpectedly.
    	
    	If the token is aligned to the grid, it calculates the vertices, edge mid-points,
    	and centers of all grid squares the token occupies and returns them. It functions 
    	the same way if not aligned to the grid, but the points returned won't match to 
    	exact grid vertices, edge mid-points, or centers.			
    	
    	Because this is really just generating multiple points and hoping that they'll
    	be inside the template, it's not the most efficient.
    	
    	This should suffice for 99% of situations, but I know that it is not
    	true shape collision detection, so there will be edge case failures. If true
    	shape collision is ever implemented, using 'points_any_token_space' will
    	be unnecessary.
    	
    	TODO: implement a more robust solution
    	
    	If a token is adjacent to a template edge, that token would normally be
    	considered inside the template, as a point that is on the edge of the token's
    	occupied region would be on the edge of the template, and being on the edge
    	is still considered being inside the template.
    	
    	As a simple workaround, all of the points along the outermost edge of the token's
    	occupied region are shifted inwards 1 pixel. This means that rather than just
    	sharing an edge, the token must truly overlap with the template to be considered
    	inside of it.
    */
    /**
     * Get the points that approximately form the spacial region the token occupies.
     * @returns {Point[]}
     */
    _regionPoints() {
        const { size } = this.parent.dimensions;
        const { x, y } = this;
        // width/height are in grid units, not px
        // ceil so tokens partially occupying a space include that entire space
        const width = Math.ceil(this.width);
        const height = Math.ceil(this.height);

        /*
        	Top points:
        	(a) Start with top left point, moved x&y inwards by 1px.
        	(b) Do all of the points along the top edge until the top right point,
        		move all of the y down 1px.
        	(c) Top right point, move y down 1px and x back 1px.
        	
        	Middle Points:
        	(d) Leftmost point of the row, move x 1px right.
        	(e) Do all inner points normally.
        	(f) Rightmost point of the row, move x 1px left.
        	
        	Bottom points:
        	(g) Bottom left point, move x 1px right, y 1px up.
        	(h) Bottom edge points, move y 1px up for each.
        	(i) Bottom right point, move x 1px left, y 1px up.
        	
        	_________      a_b_b_b_c 
        	|   |   |      |   |   |
        	|   |   |      d e e e f
        	|   |   |      |   |   |
        	---------  ->  d-e-e-e-f  
        	|   |   |      |   |   |
        	|   |   |      d e e e f
        	|   |   |      |   |   |
        	---------      g-h-h-h-i 
        */
        const points = [];
        let w = 0,
            h = 0;
        top_row: {
            // a - top left point
            points.push({
                x: x + 1,
                y: y + 1,
            });

            // b - top middle points
            for (w = 0.5; w < width; w += 0.5) {
                points.push({
                    x: x + w * size,
                    y: y + 1,
                });
            }

            // c - top right point
            points.push({
                x: x + w * size - 1,
                y: y + 1,
            });
        }

        w = 0;
        body: {
            for (h = 0.5; h < height; h += 0.5) {
                // d - left edge points
                points.push({
                    x: x + w * size + 1,
                    y: y + h * size,
                });

                // e - all inner points
                for (w = 0.5; w < width; w += 0.5) {
                    points.push({
                        x: x + w * size,
                        y: y + h * size,
                    });
                }

                // f - right edge points
                points.push({
                    x: x + w * size - 1,
                    y: y + h * size,
                });
            }
        }

        w = 0;
        bottom_row: {
            // g - bottom left point
            points.push({
                x: x + 1,
                y: y + h * size - 1,
            });

            // h - bottom middle points
            for (w = 0.5; w < width; w += 0.5) {
                points.push({
                    x: x + w * size,
                    y: y + h * size - 1,
                });
            }

            // i - bottom right point
            points.push({
                x: x + w * size - 1,
                y: y + h * size - 1,
            });
        }

        return points;
    }

    /**
     * Create a circle approximation representing the occupied area of the token.
     * If the token's width and height are not equal, the larger of the two is used as
     * the radius of the circle. The circle's center point is still the true center of the
     * token.
     * @returns {PIXI.Polygon} The polygon approximation of the token's occupied area as a circle
     */
    _circle() {
        const { size } = this.parent.dimensions;
        const { x, y, width, height } = this; // width/height are in grid units, not px
        const widthRadius = (width * size) / 2;
        const heightRadius = (height * size) / 2;
        return new PIXI.Circle(x + widthRadius, y + heightRadius, Math.max(widthRadius, heightRadius));
    }

    /**
     * Create a rectangular approximation representing the occupied area of the token.
     * @returns {PIXI.Polygon} The polygon approximation of the token's occupied area as a rectangle
     */
    _rectangle() {
        const { size } = this.parent.dimensions;
        const { x, y, width, height } = this; // width/height are in grid units, not px
        return new PIXI.Rectangle(x, y, width * size, height * size);
    }

    // -------------------- Instance Fields --------------------

    /**
     *
     * @param {MeasuredTemplateDocument} measuredTemplateDoc
     * @param {object} options
     * @returns
     */
    inTemplate(measuredTemplateDoc, options) {
        if (measuredTemplateDoc instanceof ByMeasuredTemplateDocument) {
            return measuredTemplateDoc.containsToken(this, options);
        } else {
            const msg = `Argument measuredTemplateDoc not instance of ByMeasuredTemplateDocument.`;
            return console.error(msg, measuredTemplateDoc);
        }
    }

    /**
     *
     * @param {object} options
     * @returns
     */
    getTemplates(options) {
        return this.parent.templates.filter((template) => this.inTemplate(template, options));
    }
}

/*
TODO

Rerwite the points methods to better generate for oddly sized and non-aligned stuff

need to have ways to handle cases where things are and are not grid aligned.

i also probably don't need the points region option anymore, that can be deleted. 
the point center and spaces are still useful tho

*/
