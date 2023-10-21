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

export async function previewTemplatePlacement(config, callbacks) {
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

    return template.toObject();
}

class PreviewTemplate extends MeasuredTemplate {
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
        //this.refresh();
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
