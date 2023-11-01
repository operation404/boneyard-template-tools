import { _resolveParse } from './handler.js';

/**
 * @class
 * @abstract
 * @property {string} type
 * @property {object} data
 */
export class Action {
    static options = {};
    type;
    data;

    /**
     * @abstract
     * @param {object} data
     */
    constructor(data) {
        if (this.constructor.name === 'Action') throw `Cannot instantiate abstract class.`;
        this.constructor.validateData(data);
        this.type = this.constructor.name;
        this.data = data;
    }

    /**
     * Validate the action data, throwing an error for any invalid data.
     * @abstract
     * @param {object} data
     */
    static validateData(data) {
        throw `Cannot call abstract method.`;
    }

    /**
     * Execute a single action with the provided data.
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
 *                  value, resolving additional actions based on the result.
 */
class Comparison extends Action {
    static options = {
        operations: {
            '=': (a, b) => a === b,
            '!=': (a, b) => a !== b,
            '>': (a, b) => a > b,
            '<': (a, b) => a < b,
            '>=': (a, b) => a >= b,
            '<=': (a, b) => a <= b,
        },
    };

    /**
     * @param {object} data
     * @param {string} data.operation
     * @param {string} data.attributePath
     * @param {!*} data.value
     * @param {Action|Action[]} data.trueActions
     * @param {Action|Action[]} [data.falseActions]
     */
    constructor(data) {
        data.trueActions = Array.isArray(data.trueActions) ? data.trueActions : [data.trueActions];
        if (!data.hasOwnProperty('falseActions')) data.falseActions = [];
        data.falseActions = Array.isArray(data.falseActions) ? data.falseActions : [data.falseActions];
        super(data);
    }

    /**
     * @param {object} data
     * @param {string} data.operation
     * @param {string} data.attributePath
     * @param {!*} data.value
     * @param {Action[]} data.trueActions
     * @param {Action[]} data.falseActions
     * @throws 'operation' invalid.
     * @throws 'attributePath' must be string.
     * @throws 'value' must be non-null
     * @throws 'trueActions' must be instance(s) of Action.
     * @throws 'falseActions' must be instance(s) of Action.
     */
    static validateData({ operation, attributePath, value, trueActions, falseActions }) {
        if (!Object.keys(this.options.operations).includes(operation)) throw `'operation' invalid.`;
        if (typeof attributePath !== 'string') throw `'attributePath' must be string.`;
        if (value === undefined || value === null) throw `'value' must be non-null`;
        trueActions.forEach((a) => {
            if (!(a instanceof Action)) throw `'trueActions' must be instances of Action.`;
        });
        falseActions.forEach((a) => {
            if (!(a instanceof Action)) throw `'falseActions' must be instances of Action.`;
        });
    }

    /**
     * @param {Document} document
     * @param {object} data
     * @param {string} data.operation
     * @param {string} data.attributePath
     * @param {!*} data.value
     * @param {Action[]} data.trueActions
     * @param {Action[]} data.falseActions
     * @throws 'attributePath' does not exist or its value is undefined.
     * @throws Attribute value and 'value' parameter not same type.
     */
    static resolve(document, { operation, attributePath, value, trueActions, falseActions }) {
        let attributeValue = document;
        attributePath.split('.').forEach((pathToken) => (attributeValue = attributeValue?.[pathToken]));
        if (attributeValue === undefined) throw `'attributePath' does not exist or its value is undefined.`;
        if (typeof attributeValue !== typeof value) throw `Attribute value and 'value' parameter not same type.`;
        if (this.options.operations[operation](attributeValue, value)) _resolveParse(document, trueActions);
        else _resolveParse(document, falseActions);
    }
}

/**
 * @class
 * @extends Action
 * @classdesc       Action that updates a document with the provided values.
 */
class UpdateDoc extends Action {
    static options = {
        operations: {
            replace: (orig, val) => val,
            add: (orig, val) => orig + val,
        },
    };

    /**
     * @param {object} data
     * @param {object|object[]} data.updates
     */
    constructor(data) {
        data.updates = Array.isArray(data.updates) ? data.updates : [data.updates];
        super(data);
    }

    /**
     * @param {object} data
     * @param {object[]} data.updates
     * @param {string} data.updates[].attributePath
     * @param {string} data.updates[].method
     * @param {!*} data.updates[].value
     * @throws 'attributePath' must be string.
     * @throws 'method' invalid.
     * @throws 'value' must be non-null.
     */
    static validateData({ updates }) {
        updates.forEach(({ attributePath, method, value }) => {
            if (typeof attributePath !== 'string') throw `'attributePath' must be string.`;
            if (!Object.keys(this.options.operations).includes(method)) throw `'method' invalid.`;
            if (value === undefined || value === null) throw `'value' must be non-null.`;
        });
    }

    /**
     * @param {Document} document
     * @param {object} data
     * @param {object[]} data.updates
     * @param {string} data.updates[].attributePath
     * @param {string} data.updates[].method
     * @param {!*} data.updates[].value
     * @throws 'attributePath' does not exist or its value is undefined.
     * @throws Attribute value and 'value' parameter not same type.
     */
    static resolve(document, { updates }) {
        const updateEntries = updates.map(({ attributePath, method, value }) => {
            let attributeValue = document;
            attributePath.split('.').forEach((pathToken) => (attributeValue = attributeValue?.[pathToken]));
            if (attributeValue === undefined) throw `'attributePath' does not exist or its value is undefined.`;
            if (typeof attributeValue !== typeof value) throw `Attribute value and 'value' parameter not same type.`;
            return [attributePath, this.options.operations[method](attributeValue, value)];
        });
        document.update(Object.fromEntries(updateEntries));
    }
}

export const actions = [Comparison, UpdateDoc];
