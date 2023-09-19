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
        const { x, y, width, height } = this; // width/height are in grid units, not px
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
    _gridSpacesPoints(options) {
        if (this.object === null || this.parent !== canvas.scene) {
            const msg = `Token not on current active scene.`;
            return console.error(msg, this);
        }
        if (canvas.grid.type === window.CONST.GRID_TYPES.GRIDLESS) return [];

        const collisionShape = this._shape(options);
        const d = canvas.dimensions;
        const grid = canvas.grid.grid;
        let { x, y, width, height } = this; // width/height are in grid units, not px
        [x, y] = [x + (width * size) / 2, y + (height * size) / 2]; // set x,y to token center
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

    _shape({ tokenCollisionShape = ByTokenDocument._defaultTokenCollisionShape }) {
        switch (tokenCollisionShape) {
            case CONST.TOKEN_COLLISION_SHAPE.CIRCLE:
                return this._circle(options);
            case CONST.TOKEN_COLLISION_SHAPE.RECTANGLE:
                return this._rectangle(options);
            default:
                const msg = `Invalid token collision shape: ${tokenCollisionShape}`;
                return console.error(msg, tokenCollisionShape);
        }
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
