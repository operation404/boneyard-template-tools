import { ByMeasuredTemplateDocument } from './ByMeasuredTemplateDocument.js';
import * as CONST from '../constants.js';

/** @inheritdoc */
export class ByTokenDocument extends CONFIG.Token.documentClass {
    // -------------------- Private Class Fields --------------------

    /**
     * Initialize class fields and override the core class.
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

    /**
     * What shape to use for collision when no explicit shape is given.
     */
    static _defaultTokenCollisionShape;

    // -------------------- Private Instance Fields --------------------

    /**
     * Get the bounding box containing this document's token object.
     * @returns {PIXI.Rectangle}    Bounding box of this document's token object.
     */
    _getBounds() {
        return this.object.bounds;
    }

    /**
     * Get the point at the center of token.
     * @returns {Point}       A point at the center of the token.
     */
    _centerPoint() {
        const { size } = this.parent.dimensions;
        const { x, y, width, height } = this; // width/height are in grid units, not px
        return {
            x: x + (width * size) / 2,
            y: y + (height * size) / 2,
        };
    }

    /**
     * Get the point at the center of each grid space the token occupies.
     * If the canvas is in gridless mode, returns an empty array.
     * @param {boolean} [options.tokenCollisionShape]       What shape to use when determining if a token occupies a grid space.
     * @returns {Point[]}                                   Array of points at the center of spaces on the grid that the token occupies.
     */
    _gridSpacesPoints(options = {}) {
        if (this.object === null || this.parent !== canvas.scene) {
            const msg = `Token not on current active scene.`;
            return console.error(msg, this);
        }
        if (canvas.grid.type === window.CONST.GRID_TYPES.GRIDLESS) return [];

        const collisionShape = this._shape(options);
        const d = canvas.dimensions;
        const grid = canvas.grid.grid;
        let { x, y, width, height } = this; // width/height are in grid units, not px
        [x, y] = [x + (width * d.size) / 2, y + (height * d.size) / 2]; // set x,y to token center
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
                // const [testX, testY] = [gx + hx - x, gy + hy - y];
                // original shifts test points by shape's x,y as template shapes are defined at a 0,0 origin, but the shapes
                // ByTokens generate for collision are not relative to a 0,0 origin and instead the token's actual x,y
                // position on the grid, shifting the test points isn't required
                const [testX, testY] = [gx + hx, gy + hy];
                const contains = (r === 0 && c === 0 && isCenter) || grid._testShape(testX, testY, collisionShape);
                if (!contains) continue;
                // original saves top-left of grid space, save center of space instead
                positions.push({ x: testX, y: testY });
            }
        }
        return positions;
    }

    /**
     * Create a circle approximation representing the occupied area of the token.
     * If the token's width and height are not equal, the larger of the two is used as
     * the radius of the circle. The circle's center point is still the true center of the
     * token.
     * @returns {PIXI.Polygon}  A circle polygon approximation of the token's occupied area.
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
     * @returns {PIXI.Polygon}  A rectangle polygon approximation of the token's occupied area.
     */
    _rectangle() {
        const { size } = this.parent.dimensions;
        const { x, y, width, height } = this; // width/height are in grid units, not px
        return new PIXI.Rectangle(x, y, width * size, height * size);
    }

    /**
     * Get a PIXI shape representing the area the token occupies to use for collision detection.
     * @param {string} [options.tokenCollisionShape]    What shape type to use for the token's collision area.
     * @returns {PIXI.Circle|PIXI.Rectangle}            The shape representing the token's collision area.
     */
    _shape({ tokenCollisionShape = ByTokenDocument._defaultTokenCollisionShape }) {
        switch (tokenCollisionShape) {
            case CONST.TOKEN_COLLISION_SHAPE.CIRCLE:
                return this._circle();
            case CONST.TOKEN_COLLISION_SHAPE.RECTANGLE:
                return this._rectangle();
            default:
                const msg = `Invalid token collision shape: ${tokenCollisionShape}`;
                return console.error(msg, tokenCollisionShape);
        }
    }

    // -------------------- Instance Fields --------------------

    /**
     * Check if a template contains this token.
     * @see {@link ByMeasuredTemplateDocument#collidesToken}
     */
    collidesTemplate(measuredTemplateDoc, options) {
        if (measuredTemplateDoc instanceof ByMeasuredTemplateDocument) {
            return measuredTemplateDoc.collidesToken(this, options);
        } else {
            const msg = `Argument measuredTemplateDoc not instance of ByMeasuredTemplateDocument.`;
            return console.error(msg, measuredTemplateDoc);
        }
    }

    /**
     * Find all templates that this token is contained within.
     * @see {@link ByMeasuredTemplateDocument#getTokens}
     */
    getTemplates(options) {
        options.percentateOutput = false;
        return this.parent.templates.filter((template) => this.collidesTemplate(template, options));
    }
}
