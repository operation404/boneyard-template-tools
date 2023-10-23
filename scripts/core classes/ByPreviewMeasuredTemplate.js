/*  
Specific thanks to trioderegion (github.com/trioderegion)

Their warpgate module served as a frequent reference for how to
alter the behavior of MeasuredTemplates for the purpose of
creating a simple preview. Their module's Crosshair functionality
provides much of the functionality this module's previewer does,
but does considerably more as well.

There is also code from the core packages as well as the D&D5E
system that is used and modified here.
*/

/*
 _id: DocumentIdField
user: ForeignDocumentField
t: StringField
x: NumberField
y: NumberField
distance: NumberField
direction: AngleField
angle: AngleField
width: NumberField
borderColor: ColorField
fillColor: ColorField
texture: FilePathField
hidden: BooleanField
flags: ObjectField
 */

async function previewTemplatePlacement(config, callbacks) {
    mergeObject(config, PreviewTemplate.defaults, { overwrite: false });

    // Remember controlled tokens to restore control after preview.
    let controlled = [];
    if (config.rememberControlled) {
        controlled = canvas.tokens.controlled;
    }

    // If initial location not given, use mouse position.
    if (!config.hasOwnProperty('x') && !config.hasOwnProperty('y')) {
        // v This is identical to 'canvas.mousePosition'
        // canvas.app.renderer.events.pointer.getLocalPosition(canvas.app.stage)
        let mouseLoc = canvas.mousePosition;
        mouseLoc = PreviewTemplate.getSnappedPosition(mouseLoc, config.interval);
        config.x = mouseLoc.x;
        config.y = mouseLoc.y;
    }

    const template = new PreviewTemplate(config, callbacks);
    await template.drawPreview();

    for (const token of controlled) {
        token.control({ releaseOthers: false });
    }

    return template;
    //return template.toObject();
}

class PreviewTemplateOld extends MeasuredTemplate {
    static defaults = {
        size: 1,
        tag: 'crosshairs',
        interval: 2,
        fillAlpha: 0,
        lockSize: true,
        lockPosition: false,
        rememberControlled: false,

        //Measured template defaults
        texture: null,
        //x: 0,
        //y: 0,
        direction: 0,
        fillColor: '#ffffff',
    };

    constructor(config, callbacks = {}) {
        const templateData = {
            t: config.t,
            user: game.user.id,
            distance: config.size,
            x: config.x,
            y: config.y,
            fillColor: config.fillColor,
            width: 1,
            texture: config.texture,
            direction: config.direction,
        };

        const template = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene });
        super(template);

        this.fillAlpha = config.fillAlpha;
        this.tag = config.tag;
        this.lockSize = config.lockSize;
        this.lockPos = config.lockPos;
        this.lockRot = config.lockRot;
        this.posInterval = config.posInterval;
        this.callbacks = callbacks;
        this.inFlight = false;
        this.cancelled = true;
        this.rightX = 0;
        this.rightY = 0;
        this.radius = (this.document.distance * this.scene.grid.size) / 2;
    }

    toObject() {
        const data = mergeObject(this.document.toObject(), {
            cancelled: this.cancelled,
            scene: this.scene,
            radius: this.radius,
            size: this.document.distance,
        });
        delete data.width;
        return data;
    }

    static getTag(key) {
        return canvas.templates.preview.children.find((child) => child.tag === key);
    }

    static getSnappedPosition({ x, y }, interval) {
        const offset = interval < 0 ? canvas.grid.size / 2 : 0;
        const snapped = canvas.grid.getSnappedPosition(x - offset, y - offset, interval);
        return { x: snapped.x + offset, y: snapped.y + offset };
    }

    async draw() {
        super._draw();
        this.controlIcon.destroy();
        this.refresh();
        if (this.id) this.activateListeners();
    }

    async draw22() {
        this.clear();

        // Load the texture
        const texture = this.document.texture;
        if (texture) {
            this._texture = await loadTexture(texture, { fallback: 'icons/svg/hazard.svg' });
        } else {
            this._texture = null;
        }

        // Template shape
        this.template = this.addChild(new PIXI.Graphics());

        // Draw the ruler measurement
        this.ruler = this.addChild(this._drawRulerText());

        // Update the shape and highlight grid squares
        this.refresh();
        //BEGIN WARPGATE
        //this.highlightGrid();
        //END WARPGATE

        // Enable interactivity, only if the Tile has a true ID
        if (this.id) this.activateListeners();
        return this;
    }

    /**
     * Draw the Text label used for the MeasuredTemplate
     * @return {PreciseText}
     * @protected
     */
    _drawRulerText() {
        const style = CONFIG.canvasTextStyle.clone();
        style.fontSize = Math.max(Math.round(canvas.dimensions.size * 0.36 * 12) / 12, 36);
        const text = new PreciseText(null, style);
        //BEGIN WARPGATE
        //text.anchor.set(0.5, 0);
        text.anchor.set(0, 0);
        //END WARPGATE
        return text;
    }

    refresh() {
        this.renderFlags.set({
            refresh: true,
        });
        return this;
    }

    /** @override */
    refresh22() {
        if (!this.template) return;
        let d = canvas.dimensions;
        const document = this.document;
        this.position.set(document.x, document.y);

        // Extract and prepare data
        let { direction, distance } = document;
        distance *= d.size / 2;
        //BEGIN WARPGATE
        //width *= (d.size / d.distance);
        //END WARPGATE
        direction = Math.toRadians(direction);

        // Create ray and bounding rectangle
        this.ray = Ray.fromAngle(document.x, document.y, direction, distance);

        // Get the Template shape
        this.shape = this._computeShape();

        // Draw the Template outline
        this.template.clear().lineStyle(this._borderThickness, this.borderColor, 0.75);

        // Fill Color or Texture

        if (this._texture) {
            /* assume 0,0 is top left of texture
             * and scale/offset this texture (due to origin
             * at center of template). tileTexture indicates
             * that this texture is tilable and does not
             * need to be scaled/offset */
            const scale = (distance * 2) / this._texture.width;
            const offset = distance;
            this.template.beginTextureFill({
                texture: this._texture,
                matrix: new PIXI.Matrix().scale(scale, scale).translate(-offset, -offset),
            });
        } else {
            this.template.beginFill(this.fillColor, this.fillAlpha);
        }

        // Draw the shape
        this.template.drawShape(this.shape);

        this.template
            .lineStyle(this._borderThickness, 0x000000, this.drawOutline ? 0.75 : 0)
            .beginFill(0x000000, 0.5)
            .drawCircle(0, 0, 6)
            .drawCircle(this.ray.dx, this.ray.dy, 6);

        return this;
    }

    async drawPreview() {
        // Draw the template and switch to the template layer
        this.initialLayer = canvas.activeLayer;
        this.layer.activate();
        await this.draw();
        this.layer.preview.addChild(this);
        this.layer.interactiveChildren = false;

        // Hide the sheet that originated the preview
        //BEGIN WARPGATE
        this.inFlight = true;

        // Activate interactivity
        this.activatePreviewListeners();

        // Callbacks
        this.callbacks?.show?.(this);

        // await (async () => {
        while (this.inFlight) await new Promise((resolve) => setTimeout(resolve, 100));
        // })();

        if (this.activeHandlers) {
            this.clearHandlers();
        }

        window.a = this;

        //END WARPGATE
        return this;
    }

    _mouseMoveHandler(event) {
        event.stopPropagation();

        /* if our position is locked, do not update it */
        if (this.lockPosition) return;

        // Apply a 20ms throttle
        let now = Date.now();
        if (now - this.moveTime <= 20) return;

        const center = event.data.getLocalPosition(this.layer);
        const { x, y } = PreviewTemplate.getSnappedPosition(center, this.interval);
        this.document.updateSource({ x, y });
        this.refresh();
        this.moveTime = now;

        if (now - this.initTime > 1000) {
            canvas._onDragCanvasPan(event.data.originalEvent);
        }
    }

    _leftClickHandler(event) {
        const document = this.document;
        const thisSceneSize = this.scene.grid.size;

        const destination = PreviewTemplate.getSnappedPosition(this.document, this.interval);
        this.radius = (document.distance * thisSceneSize) / 2;
        this.cancelled = false;

        this.document.updateSource({ ...destination });

        this.clearHandlers(event);
    }

    _mouseWheelHandler(event) {
        if (event.ctrlKey) event.preventDefault(); // Avoid zooming the browser window
        if (!event.altKey) event.stopPropagation();

        const delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
        const snap = event.ctrlKey ? delta : 5;
        //BEGIN WARPGATE
        const document = this.document;
        const thisSceneSize = this.scene.grid.size;
        if (event.shiftKey && !this.lockSize) {
            let distance = document.distance + 0.25 * Math.sign(event.deltaY);
            distance = Math.max(distance, 0.25);
            this.document.updateSource({ distance });
            this.radius = (document.distance * thisSceneSize) / 2;
        } else if (!event.altKey) {
            const direction = document.direction + snap * Math.sign(event.deltaY);
            this.document.updateSource({ direction });
        }
        //END WARPGATE
        this.refresh();
    }

    _rightDownHandler(event) {
        if (event.button !== 2) return;

        this.rightX = event.screenX;
        this.rightY = event.screenY;
    }

    _rightUpHandler(event) {
        if (event.button !== 2) return;

        const isWithinThreshold = (current, previous) => Math.abs(current - previous) < 10;
        if (isWithinThreshold(this.rightX, event.screenX) && isWithinThreshold(this.rightY, event.screenY)) {
            this.cancelled = true;
            this.clearHandlers(event);
        }
    }

    _clearHandlers(event) {
        //WARPGATE BEGIN
        /* destroy ourselves */
        this.document.object.destroy();
        this.template.destroy();
        this.layer.preview.removeChild(this);
        this._destroyed = true;

        canvas.stage.off('mousemove', this.activeMoveHandler);
        canvas.stage.off('mousedown', this.activeLeftClickHandler);
        canvas.app.view.onmousedown = null;
        canvas.app.view.onmouseup = null;
        canvas.app.view.onwheel = null;

        // Show the sheet that originated the preview
        if (this.actorSheet) this.actorSheet.maximize();
        this.activeHandlers = false;
        this.inFlight = false;
        //WARPGATE END

        /* re-enable interactivity on this layer */
        this.layer.interactiveChildren = true;

        /* moving off this layer also deletes ALL active previews?
         * unexpected, but manageable
         */
        if (this.layer.preview.children.length == 0) {
            this.initialLayer.activate();
        }
    }

    /**
     * Activate listeners for the template preview
     */
    activatePreviewListeners() {
        this.moveTime = 0;
        this.initTime = Date.now();
        //BEGIN WARPGATE
        this.activeHandlers = true;

        /* Activate listeners */
        this.activeMoveHandler = this._mouseMoveHandler.bind(this);
        this.activeLeftClickHandler = this._leftClickHandler.bind(this);
        this.rightDownHandler = this._rightDownHandler.bind(this);
        this.rightUpHandler = this._rightUpHandler.bind(this);
        this.activeWheelHandler = this._mouseWheelHandler.bind(this);

        this.clearHandlers = this._clearHandlers.bind(this);

        // Update placement (mouse-move)
        canvas.stage.on('mousemove', this.activeMoveHandler);

        // Confirm the workflow (left-click)
        canvas.stage.on('mousedown', this.activeLeftClickHandler);

        // Mouse Wheel rotate
        canvas.app.view.onwheel = this.activeWheelHandler;

        // Right click cancel
        canvas.app.view.onmousedown = this.rightDownHandler;
        canvas.app.view.onmouseup = this.rightUpHandler;

        // END WARPGATE
    }
}

/**
 * A helper class for building MeasuredTemplates for 5e spells and abilities
 */
export class PreviewTemplate extends MeasuredTemplate {
    /**
     * Track the timestamp when the last mouse move event was captured.
     * @type {number}
     */
    #moveTime = 0;

    /**
     * The initially active CanvasLayer to re-activate after the workflow is complete.
     * @type {CanvasLayer}
     */
    #initialLayer;

    /**
     * Track the bound event handlers so they can be properly canceled later.
     * @type {object}
     */
    #events;

    static #getDefaults() {
        return {
            // Preview specific defaults
            tag: 'previewTemplate',
            interval: 2,
            lockPosition: false,
            lockSize: true,
            lockRotation: false,
            rememberControlled: false,

            // Measured template document defaults
            direction: 0,
            distance: canvas.dimensions.distance,
            width: canvas.dimensions.distance,
            user: game.user.id,
            fillColor: game.user.color,
            angle: CONFIG.MeasuredTemplate.defaults.angle,
        };
    }

    /**
     *
     * @param {Object} templateData
     * @param {Object} callbacks
     * @returns {PreviewTemplate|null}
     */
    static async createPreview(templateData, callbacks) {
        if (!templateData.hasOwnProperty('t')) return null;
        mergeObject(templateData, PreviewTemplate.#getDefaults(), { overwrite: false });

        if (!templateData.hasOwnProperty('x') || !templateData.hasOwnProperty('y')) {
            // canvas.app.renderer.events.pointer.getLocalPosition(canvas.app.stage)
            // Above is identical to 'canvas.mousePosition'
            const mouseLoc = PreviewTemplate.getSnappedPosition(canvas.mousePosition, templateData.interval);
            templateData.x = mouseLoc.x;
            templateData.y = mouseLoc.y;
        }

        // Remember controlled tokens to restore control after preview.
        const controlled = templateData.rememberControlled ? canvas.tokens.controlled : [];

        const cls = CONFIG.MeasuredTemplate.documentClass;
        const templateDoc = new cls(templateData, { parent: canvas.scene });
        const templateObj = new PreviewTemplate(templateDoc);

        await templateObj.drawPreview();

        controlled.forEach((token) => token.control({ releaseOthers: false }));

        return templateObj;
    }

    /**
     * Creates a preview of the spell template.
     * @returns {Promise}  A promise that resolves with the final measured template if created.
     */
    drawPreview() {
        this.#initialLayer = canvas.activeLayer;

        // Draw the template and switch to the template layer
        this.draw();
        this.layer.activate();
        this.layer.preview.addChild(this);

        // Activate interactivity
        return this.activatePreviewListeners();
    }

    /* -------------------------------------------- */

    /**
     * Activate listeners for the template preview
     * @returns {Promise}                 A promise that resolves with the final measured template if created.
     */
    activatePreviewListeners() {
        return new Promise((resolve, reject) => {
            this.#events = {
                cancel: this._onCancelPlacement.bind(this),
                confirm: this._onConfirmPlacement.bind(this),
                move: this._onMovePlacement.bind(this),
                resolve,
                reject,
                rotate: this._onRotatePlacement.bind(this),
            };

            // Activate listeners
            canvas.stage.on('mousemove', this.#events.move);
            canvas.stage.on('mousedown', this.#events.confirm);
            canvas.app.view.oncontextmenu = this.#events.cancel;
            canvas.app.view.onwheel = this.#events.rotate;
        });
    }

    /* -------------------------------------------- */

    /**
     * Shared code for when template placement ends by being confirmed or canceled.
     * @param {Event} event  Triggering event that ended the placement.
     */
    async _finishPlacement(event) {
        this.layer._onDragLeftCancel(event);
        canvas.stage.off('mousemove', this.#events.move);
        canvas.stage.off('mousedown', this.#events.confirm);
        canvas.app.view.oncontextmenu = null;
        canvas.app.view.onwheel = null;
        this.#initialLayer.activate();
        await this.actorSheet?.maximize();
    }

    /* -------------------------------------------- */

    /**
     * Move the template preview when the mouse moves.
     * @param {Event} event  Triggering mouse event.
     */
    _onMovePlacement(event) {
        event.stopPropagation();

        if (this.lockPosition) return;

        const now = Date.now(); // Apply a 20ms throttle
        if (now - this.#moveTime <= 20) return;

        const center = event.data.getLocalPosition(this.layer);
        const interval = canvas.grid.type === CONST.GRID_TYPES.GRIDLESS ? 0 : 2;
        const snapped = canvas.grid.getSnappedPosition(center.x, center.y, interval);

        this.document.updateSource({ x: snapped.x, y: snapped.y });
        this.refresh();
        this.#moveTime = now;
    }

    /* -------------------------------------------- */

    /**
     * Rotate the template preview by 3˚ increments when the mouse wheel is rotated.
     * @param {Event} event  Triggering mouse event.
     */
    _onRotatePlacement(event) {
        if (event.ctrlKey) event.preventDefault(); // Avoid zooming the browser window
        event.stopPropagation();
        const delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
        const snap = event.shiftKey ? delta : 5;
        const update = { direction: this.document.direction + snap * Math.sign(event.deltaY) };
        this.document.updateSource(update);
        this.refresh();
    }

    /* -------------------------------------------- */

    /**
     * Confirm placement when the left mouse button is clicked.
     * @param {Event} event  Triggering mouse event.
     */
    async _onConfirmPlacement(event) {
        await this._finishPlacement(event);
        const interval = canvas.grid.type === CONST.GRID_TYPES.GRIDLESS ? 0 : 2;
        const destination = canvas.grid.getSnappedPosition(this.document.x, this.document.y, interval);
        this.document.updateSource(destination);
        this.#events.resolve(canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [this.document.toObject()]));
    }

    /* -------------------------------------------- */

    /**
     * Cancel placement when the right mouse button is clicked.
     * @param {Event} event  Triggering mouse event.
     */
    async _onCancelPlacement(event) {
        await this._finishPlacement(event);
        this.#events.reject();
    }
}
