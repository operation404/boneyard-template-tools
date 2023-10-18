import * as CONST from '../const.js';

// Socket methods

/**
 * Perform updates on one or more documents.
 * @param {UpdatePackage} updatePackage     What documents to update and how.
 */
export function performPackagedUpdates({ documentName, parentUuid, updates }) {
    getDocumentClass(documentName).updateDocuments(updates, parentUuid ? { parent: fromUuid(parentUuid) } : undefined);
}

// Helper methods for making effects and such

/**
 * Contains all of the data needed to update documents.
 * @typedef {Object} UpdatePackage
 * @property {string} documentName          Type of the documents to update.
 * @property {string|undefined} parentUuid  Uuid of the parent containing the documents if they are embedded.
 * @property {Object[]} updates             Array of differential data objects, each used to update a single document.
 */

/**
 * A tuple containing a Document and a map of the values to update it with.
 * @typedef {Object} UpdateTuple
 * @property {Document} document
 * @property {Object} updates
 */

/**
 * Update one or more documents with the corresponding new values.
 * @param {UpdateTuple|UpdateTuple[]} updateTuples
 * @throws Documents must all be the same type.
 * @throws Documents must all have either the same parent or no parent.
 * @throws Owner Required setting is enabled and user lacks permission to update a document.
 * @throws A GM is required to update a document but none are online.
 */
export function updateDocuments(updateTuples) {
    const requiresOwnership = game.settings.get(CONST.MODULE, CONST.SETTINGS.UPDATE_REQUIRES_OWNERSHIP);
    updateTuples = Array.isArray(updateTuples) ? updateTuples : [updateTuples];
    const updatePackage = {
        documentName: updateTuples[0].document.documentName,
        parentUuid: updateTuples[0].document.parent?.uuid,
    };

    let executeAsGM = false;
    updatePackage.updates = updateTuples.map(({ document, updates }) => {
        if (updatePackage.documentName !== document.documentName) throw new Error(`Document types must all match.`);
        if (updatePackage.parentUuid !== document.parent?.uuid) throw new Error(`Document parents must all match.`);
        if (document.permission !== CONST.DOCUMENT_PERMISSION_LEVELS.OWNER) {
            if (requiresOwnership) throw new Error(`Document ownership required to update.`);
            else if (!executeAsGM) executeAsGM = true;
        }
        return { _id: document.id, ...updates };
    });

    if (executeAsGM) {
        // TODO implement socket handler, or just use socketlib...
        game.socket.emit(CONST.SOCKET, {
            sender: game.user.id,
            mode: 'asGM',
            action: 'performPackagedUpdates',
            updatePackage: updatePackage,
        });
    } else performPackagedUpdates(updatePackage);
}

// --------------------------------------------------------------

function parseAndResolveAction(document, action) {}

export const actions = {
    comparison: {
        create: (data) => new Comparison(data),
        resolve: Comparison.resolve,
        operations: Object.keys(Comparison.operations),
    },
    updateDoc: {
        create: (data) => new UpdateDoc(data),
        resolve: UpdateDoc.resolve,
        operations: Object.keys(UpdateDoc.operations),
    },
};

/**
 * @class
 * @abstract
 * @property {string} type
 * @property {object} data
 */
class Action {
    type;
    data;

    /**
     * @abstract
     * @param {object} data
     */
    constructor(data) {
        throw `Cannot instantiate abstract class.`;
    }

    /**
     * @abstract
     * @param {object} data
     */
    static validateData() {
        throw `Cannot call abstract method.`;
    }

    /**
     * @abstract
     * @param {Document} document
     * @param {object} data
     */
    static resolve(document, data) {
        throw `Cannot call abstract method.`;
    }
}

/**
 * @class
 * @extends Action
 * @classdesc       Action that compares an attribute of a document to a provided
 *                  value, resolving additional actions if the comparison is true.
 */
class Comparison extends Action {
    static operations = {
        '=': (a, b) => a === b,
        '!=': (a, b) => a !== b,
        '>': (a, b) => a > b,
        '<': (a, b) => a < b,
        '>=': (a, b) => a >= b,
        '<=': (a, b) => a <= b,
    };

    /**
     * @param {object} data
     * @param {string} data.operation
     * @param {string} data.attributePath
     * @param {!*} data.value
     * @param {Action|Action[]} data.passAction
     */
    constructor(data) {
        data.passAction = Array.isArray(data.passAction) ? data.passAction : [data.passAction];
        Comparison.validateData(data);
        this.type = 'Comparison';
        this.data = data;
    }

    /**
     * @param {object} data
     * @param {string} data.operation
     * @param {string} data.attributePath
     * @param {!*} data.value
     * @param {Action[]} data.passAction
     * @throws 'operation' invalid.
     * @throws 'attributePath' must be string.
     * @throws 'value' must be non-null
     * @throws 'passAction' must be instance(s) of Action.
     */
    static validateData({ operation, attributePath, value, passAction }) {
        if (!Object.keys(Comparison.operations).includes(operation)) throw `'operation' invalid.`;
        if (!Comparison.options.operations.includes(operation)) throw `'operation' invalid type.`;
        if (typeof attributePath !== 'string') throw `'attributePath' must be string.`;
        if (value === undefined || value === null) throw `'value' must be non-null`;
        passAction.forEach((a) => {
            if (!(a instanceof Action)) throw `'passAction' must be instance(s) of Action.`;
        });
    }

    /**
     * @param {Document} document
     * @param {object} data
     * @param {string} data.operation
     * @param {string} data.attributePath
     * @param {!*} data.value
     * @param {Action[]} data.passAction
     */
    static resolve(document, { operation, attributePath, value, passAction }) {
        let attributeValue = document;
        attributePath.split('.').forEach((pathToken) => {
            attributeValue = attributeValue?.[pathToken];
        });
        if (attributeValue === undefined) throw `'attributePath' does not exist or its value is undefined.`;
        if (typeof attributeValue !== typeof value) throw `Attribute value and 'value' parameter not same type.`;
        if (Comparison.operations[operation](attributeValue, value)) parseAndResolveAction(document, passAction);
    }
}

/**
 * @class
 * @extends Action
 * @classdesc       Action that updates a document with the provided values.
 */
class UpdateDoc extends Action {
    static operations = {
        replace: (orig, val) => val,
        add: (orig, val) => orig + val,
    };

    /**
     * @param {object} data
     * @param {object|object[]} data.updates
     */
    constructor(data) {
        data.updates = Array.isArray(data.updates) ? data.updates : [data.updates];
        UpdateDoc.validateData(data);
        this.type = 'UpdateDoc';
        this.data = data;
    }

    /**
     * TODO not sure if value should be required to be an integer.
     * @param {object[]} data
     * @param {string} data[].attributePath
     * @param {string} data[].method
     * @param {number} data[].value
     */
    static validateData(data) {
        data.forEach(({ attributePath, method, value }) => {
            if (typeof attributePath !== 'string') throw `'attributePath' must be string.`;
            if (!Object.keys(UpdateDoc.operations).includes(method)) throw `'method' invalid.`;
            if (Number.isNaN(value)) throw `'value' must be number.`;
        });
    }

    /**
     * @param {Document} document
     * @param {object[]} data
     * @param {string} data[].attributePath
     * @param {string} data[].method
     * @param {number} data[].value
     */
    static resolve(document, data) {
        const updateEntries = data.map(({ attributePath, method, value }) => {
            let attributeValue = document;
            attributePath.split('.').forEach((pathToken) => {
                attributeValue = attributeValue?.[pathToken];
            });
            if (attributeValue === undefined) throw `'attributePath' does not exist or its value is undefined.`;
            if (typeof attributeValue !== typeof value) throw `Attribute value and 'value' parameter not same type.`;
            return [attributePath, UpdateDoc.operations[method](attributeValue, value)];
        });
        document.update(Object.fromEntries(updateEntries));
    }
}
