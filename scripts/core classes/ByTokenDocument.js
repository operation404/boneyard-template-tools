import * as CONST from '../constants.js';

/** @inheritdoc */
export class BySimpleTokenDocument extends CONFIG.Token.documentClass {
    // -------------------- Private Class Methods --------------------

    /**
     * Attach init hooks to set class fields and override the core class.
     */
    static _init() {
        Hooks.once('init', _overrideSimpleTokenDocument._overrideSimpleTokenDocument);
    }

    /**
     * Override the core SimpleTokenDocument class.
     */
    static _overrideSimpleTokenDocument() {
        CONFIG.Token.documentClass = BySimpleTokenDocument;
        console.log(`====== Boneyard ======\n - BySimpleTokenDocument override complete`);
    }

    /**
     *  Get the point at the center of token.
     * @param {SimpleTokenDocument} tokenDoc
     * @returns {Point[]}
     */
    static _tokenCenterPoint(tokenDoc) {
        const { size } = tokenDoc.parent.dimensions;
        // width/height are in grid units, not px
        const { x, y, width, height } = tokenDoc;
        return [
            {
                x: x + (width * size) / 2,
                y: y + (height * size) / 2,
            },
        ];
    }

    /**
     * Get the point at the center of each space the token occupies.
     * @param {SimpleTokenDocument} tokenDoc
     * @returns {Point[]}
     */
    static _tokenSpacesPoints(tokenDoc) {
        const { size } = tokenDoc.parent.dimensions;
        const { x, y } = tokenDoc;
        // width/height are in grid units, not px
        // ceil so tokens partially occupying a space include that entire space
        const width = Math.ceil(tokenDoc.width);
        const height = Math.ceil(tokenDoc.height);

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
     * @param {SimpleTokenDocument} tokenDoc
     * @returns {Point[]}
     */
    static _tokenRegionPoints(tokenDoc) {
        const { size } = tokenDoc.parent.dimensions;
        const { x, y } = tokenDoc;
        // width/height are in grid units, not px
        // ceil so tokens partially occupying a space include that entire space
        const width = Math.ceil(tokenDoc.width);
        const height = Math.ceil(tokenDoc.height);

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

    // -------------------- Class Methods --------------------

    static tokenInTemplate(tokenDoc, measuredTemplateDoc, targetingMode) {
        return measuredTemplateDoc.containsToken(tokenDoc, targetingMode);
    }

    static tokenGetTemplates(tokenDoc, targetingMode) {
        return tokenDoc.parent.templates.filter((template) => template.containsToken(tokenDoc, targetingMode));
    }

    // -------------------- Private Instance Methods --------------------

    _centerPoint() {
        return BySimpleTokenDocument._tokenCenterPoint(this);
    }

    _spacesPoints() {
        return BySimpleTokenDocument._tokenSpacesPoints(this);
    }

    _regionPoints() {
        return BySimpleTokenDocument._tokenRegionPoints(this);
    }

    // -------------------- Instance Methods --------------------

    inTemplate(measuredTemplateDoc, targetingMode) {
        return BySimpleTokenDocument.tokenInTemplate(this, measuredTemplateDoc, targetingMode);
    }

    getTemplates(targetingMode) {
        return BySimpleTokenDocument.tokenGetTemplates(this, targetingMode);
    }
}
