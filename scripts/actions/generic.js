/**
 * @class
 * @abstract
 * @property {string} type
 * @property {object} data
 */
export class Action {
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
     * Validate the action data, throwing an error for any invalid data.
     * @abstract
     * @param {object} data
     */
    static validateData() {
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
        if (Comparison.operations[operation](attributeValue, value)) resolveHandler(document, passAction);
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
     * TODO this also isn't right, data isn't an array, updates is.
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

export const actions = {
    comparison: {
        create: (data) => new Comparison(data),
        resolve: Comparison.resolve,
        options: { operations: Object.keys(Comparison.operations) },
    },
    updateDoc: {
        create: (data) => new UpdateDoc(data),
        resolve: UpdateDoc.resolve,
        options: { operations: Object.keys(UpdateDoc.operations) },
    },
};
