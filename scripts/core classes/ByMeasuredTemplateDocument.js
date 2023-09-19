import * as CONST from '../constants.js';
import { ByTokenDocument } from './ByTokenDocument.js';

/** @inheritdoc */
export class ByMeasuredTemplateDocument extends CONFIG.MeasuredTemplate.documentClass {
    // -------------------- Private Class Fields --------------------

    /**
     * Initialize class fields and override the core class.
     */
    static _init() {
        ByMeasuredTemplateDocument._overrideMeasuredTemplateDocument();
        ByMeasuredTemplateDocument._defaultTargetingMode = game.settings.get(
            CONST.MODULE,
            CONST.SETTINGS.TARGETING_MODE
        );
        ByMeasuredTemplateDocument._defaultTolerance = game.settings.get(CONST.MODULE, CONST.SETTINGS.TOLERANCE);
        ByMeasuredTemplateDocument._defaultPercentageOutput = game.settings.get(
            CONST.MODULE,
            CONST.SETTINGS.PERCENTAGE_OUTPUT
        );
    }

    /**
     * Override the core MeasuredTemplateDocument class.
     */
    static _overrideMeasuredTemplateDocument() {
        CONFIG.MeasuredTemplate.documentClass = ByMeasuredTemplateDocument;
        console.log(`====== Boneyard ======\n - ByMeasuredTemplateDocument override complete`);
    }

    /**
     * The targeting mode to use when no explicit mode is given.
     */
    static _defaultTargetingMode;

    /**
     * The tolerance to use when no explicit tolerance is given.
     */
    static _defaultTolerance;

    /**
     * Whether to output a percentage or boolean if not explicity requested.
     */
    static _defaultPercentageOutput;

    // -------------------- Private Instance Fields --------------------

    /**
     * Find the percentage of how many points from a set are contained inside of a template.
     * @param {Point[]} points      The points to test for being contained in the template.
     * @returns {Number}            The percentage of points from the array that the template contained.
     */
    _containedPoints(points) {
        const { x, y } = this;
        const containedCount = points.reduce(
            (counter, p) => (counter += this.object.shape.contains(p.x - x, p.y - y) ? 1 : 0),
            0
        );
        return containedCount / points.length;
    }

    /**
     * Get the bounding box containing this document's template object.
     * @returns {PIXI.Rectangle}    Bounding box of this document's template object.
     */
    _getBounds() {
        return this.object.bounds;
    }

    /**
     * Check if the bounding box of the given document overlaps with the bounding box of this document.
     * @param {ByTokenDocument|ByMeasuredTemplateDocument} doc      Document to test for bounding box collision.
     * @returns {boolean}                                           Whether the bounding box of the given document overlaps
     *                                                              with this document's bounding box.
     */
    _boundsOverlap(doc) {
        if (!(doc instanceof ByTokenDocument || doc instanceof ByMeasuredTemplateDocument)) {
            const msg = `Argument doc not instance of BySimpleTokenDocument or ByMeasuredTemplateDocument.`;
            console.error(msg, doc);
            return false;
        }
        const b1 = this._getBounds();
        const b2 = doc._getBounds();
        const l1 = { x: b1.x, y: b1.y },
            r1 = { x: b1.x + b1.width, y: b1.y + b1.height },
            l2 = { x: b2.x, y: b2.y },
            r2 = { x: b2.x + b2.width, y: b2.y + b2.height };

        // if rectangles have no area, no overlap
        if (l1.x === r1.x || l1.y === l2.y || l2.x === r2.x || l2.y === r2.y) return false;

        // if one rectangle is to the left of the other
        if (l1.x > r2.x || l2.x > r1.x) return false;

        // if one rectangle is above the other
        if (r1.y < l2.y || r2.y < l1.y) return false;

        return true;
    }

    /**
     * Create a PIXI polygon from the template's shape and translate it to the template's grid location.
     * This method should only be called if the shape associated with this template is a rectangle or circle.
     * @returns {PIXI.Polygon}  The translated polygon form of the shape.
     */
    _2dShape() {
        const shapeCopy = this.object.shape.clone();
        shapeCopy.x += this.x;
        shapeCopy.y += this.y;
        return shapeCopy.toPolygon();
    }

    /**
     * Create a copy of this template's PIXI polygon shape and translate it to the template's grid location.
     * This method should only be called if the shape associated with this template is a polygon.
     * @param {number} [options.scalingFactor]  The scalar to use for preserving floating point precision
     *                                          when converting to integers.
     * @returns {PIXI.Polygon}                  The copied and translated polygon.
     */
    _polygon(options = { scalingFactor: 100 }) {
        let { x, y } = this;
        x *= options.scalingFactor;
        y *= options.scalingFactor;
        const clipperPolygon = this.object.shape.toClipperPoints(options);
        clipperPolygon.forEach((p) => {
            p.X += x;
            p.Y += y;
        });
        return PIXI.Polygon.fromClipperPoints(clipperPolygon, options);
    }

    /**
     * Create a new PIXI polygon representation of the template's shape at the template's grid location.
     * @returns {PIXI.Polygon}  The polygon representing this template.
     */
    _polyForm() {
        switch (this.object.shape.type) {
            case 0: // generic poly
                return this._polygon();
            case 1: // rect
            case 2: // circle
                return this._2dShape();
            default:
                const msg = `Unkown PIXI object type: ${this.object.shape.type}`;
                return console.error(msg, this.object.shape.type);
        }
    }

    /**
     * Find the percentage of overlap between the argument polygon and a polygon representing this template's shape.
     * If the two polygons don't overlap, the return value is 0. If the argument polygon is 100% contained within
     * the template, the return value is 1. Otherwise, returns the area of the intersection divided by the area of
     * the argument polygon.
     * If considerTemplateRatio is true, the ratio of the intersection's area and the template's area is also evaluated,
     * and the larger of the two ratios is returned. This may be desired in cases where the template may be smaller than the
     * polygon it is intersecting, in which case it can never return a value of 1 even if the template is completely contained
     * within the argument polygon.
     * @param {PIXI.Polygon} testPoly                       The polygon tested for intersection.
     * @param {boolean} [options.considerTemplateRatio]     Whether to account for the ratio of the intersection and template areas.
     * @returns {number}                                    The ratio of the intersection and argument polygon areas, or if considerTemplateRatio is true,
     *                                                      the ratio of the intersection and template areas if it results in a larger value.
     */
    _polyIntersection(testPoly, { considerTemplateRatio = false }) {
        const templatePoly = this._polyForm();
        const intersectionArea = templatePoly.intersectPolygon(testPoly).signedArea();
        return (
            intersectionArea /
            (considerTemplateRatio ? Math.min(templatePoly.signedArea(), testPoly.signedArea()) : testPoly.signedArea())
        );
    }

    // -------------------- Instance Fields --------------------

    /**
     * Check if a token is contained by this template.
     * This method can either return a boolean if only a simple binary collision result is required,
     * or it can return the ratio of the area of the collision intersection and either the token or template's area.
     * @param {ByTokenDocument} tokenDoc                    The token being tested.
     * @param {object} [options]                            Options to configure how collision is calculated.
     * @param {number} [options.tolerance]                  Percentage of overlap needed to be considered inside the template.
     * @param {string} [options.targetingMode]              Type of collision detection method to use.
     * @param {boolean} [options.percentateOutput]          Whether to return a boolean representing the collision result or ratio of
     *                                                      the collision intersection area.
     * @param {boolean} [options.considerTemplateRatio]     Whether to account for the ratio of the intersection and template areas.
     * @param {string} [options.tokenCollisionShape]        What shape type to use for the token's collision area.
     * @returns {boolean|number}                            Whether the token is inside the template or the ratio of the collision
     *                                                      intersection area.
     */
    containsToken(tokenDoc, options = {}) {
        const {
            tolerance = ByMeasuredTemplateDocument._defaultTolerance,
            targetingMode = ByMeasuredTemplateDocument._defaultTargetingMode,
            percentateOutput = ByMeasuredTemplateDocument._defaultPercentageOutput,
        } = options;

        // Check for invalid input errors
        {
            if (!(tokenDoc instanceof ByTokenDocument)) {
                const msg = `Argument tokenDoc not instance of BySimpleTokenDocument.`;
                return console.error(msg, tokenDoc);
            }
            if (tolerance <= 0) {
                const msg = `Argument tolerance must be greater than or equal to 0: ${tolerance}`;
                return console.error(msg, tolerance);
            }
            if (CONST.TARGETING_MODE[targetingMode] === undefined) {
                const msg = `Invalid targeting mode: ${targetingMode}`;
                return console.error(msg, targetingMode);
            }
            if (this.parent !== tokenDoc.parent) {
                const msg = `Argument tokenDoc not on same scene as measured template.`;
                return console.error(msg, tokenDoc);
            }
        }

        // Test for token-template collision
        let collisionRatio = 0;
        if (this._boundsOverlap(tokenDoc)) {
            switch (targetingMode) {
                case CONST.TARGETING_MODE.POINTS_CENTER:
                    collisionRatio = this._containedPoints([tokenDoc._centerPoint()], options);
                    break;
                case CONST.TARGETING_MODE.GRID_SPACES_POINTS:
                    collisionRatio = this._containedPoints(tokenDoc._gridSpacesPoints(options), options);
                    break;
                case CONST.TARGETING_MODE.AREA_INTERSECTION:
                    collisionRatio = this._polyIntersection(tokenDoc._shape(options).toPolygon(), options);
                    break;
            }
        }

        return percentateOutput ? collisionRatio : collisionRatio >= tolerance;
    }

    /**
     * Find all tokens that are considered to be contained within this template.
     * @param {object} [options]                            Options to configure how collision is calculated.
     * @param {number} [options.tolerance]                  Percentage of overlap needed to be considered inside the template.
     * @param {string} [options.targetingMode]              Type of collision detection method to use.
     * @param {boolean} [options.considerTemplateRatio]     Whether to account for the ratio of the intersection and template areas.
     * @param {string} [options.tokenCollisionShape]        What shape type to use for the token's collision area.
     * @returns {ByTokenDocument[]}                         Array of all tokens contained within the template.
     */
    getTokens(options = {}) {
        options.percentateOutput = false;
        return this.parent.tokens.filter((token) => this.containsToken(token, options));
    }
}
