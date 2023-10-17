/*

Actions can be either

Effect 

Condition

condition {
    option 1: effect
    option 2: condition {
        option 1: effect
        option 2: effect
    }
}

*/

/**
 * @class
 * @property {string} action
 * @property {string} type
 * @property {object} data
 */
class Action {
    /**
     * @param {string} action
     * @param {string} type
     * @param {object} data
     * @returns {Action}
     */
    static create(action, type, data) {
        switch (action) {
            case 'effect':
                return Effect.create(type, data);
            case 'condition':
                return Condition.create(type, data);
            default:
                throw `Invalid Action type.`;
        }
    }

    constructor(action, type, data) {
        this.action = action;
        this.type = type;
        this.data = data;
    }
}

class Condition extends Action {
    static options = {
        savingThrow: ['physical', 'evasion', 'mental'],
    };

    static create(type, data) {
        switch (type) {
            case 'savingThrow':
                return new Condition(type, Condition.#savingThrow(data));
            case 'skillCheck':
                return new Condition(type, Condition.#skillCheck(data));
            case 'comparison':
                return new Condition(type, Condition.#comparison(data));
            default:
                throw `Invalid Effect Type.`;
        }
    }

    /**
     * @param {object} data
     * @param {string} data.type
     * @param {number} [data.modifier]
     * @param {Action|Action[]} [data.pass]
     * @param {Action|Action[]} [data.fail]
     * @returns {Action}
     */
    static #savingThrow({ type, modifier, pass, fail }) {
        if (!Condition.options.savingThrow.includes(type)) throw `Invalid save type.`;
        if (!pass && !fail) return;
        return new Condition('save', {
            type: type,
            modifier: modifier,
            pass: pass,
            fail: fail,
        });
    }

    /**
     * @param {object} data
     * @param {string} data.type
     * @param {number} difficulty
     * @param {number} [data.modifier]
     * @param {Action|Action[]} [data.pass]
     * @param {Action|Action[]} [data.fail]
     * @returns {Action}
     */
    static #skillCheck() {}

    static #comparison() {}

    constructor(type, data) {
        this.action = 'condition';
        this.type = type;
        this.data = data;
    }
}

class Effect extends Action {
    static options = {
        status: ['create', 'delete'],
    };

    /**
     * @param {string} type
     * @param {object} data
     * @returns {Effect}
     */
    static create(type, data) {
        switch (type) {
            case 'damage':
                return new Effect(type, Effect.#damage(data));
            case 'status':
                return new Effect(type, Effect.#status(data));
            default:
                throw `Invalid effect type.`;
        }
    }

    /**
     * TODO update this to take roll strings.
     * @param {object} data
     * @param {number} data.value   The damage to apply.
     * @returns {{value:number}}
     */
    static #damage({ value }) {
        if (!Number.isInteger(value)) throw `Value must be integer.`;
        return { value };
    }

    /**
     * @param {object} data
     * @param {string} data.action  'create' or 'delete'
     * @param {string} data.id      Id of the status.
     * @returns {{type:string, id:string}}}
     */
    static #status({ action, id }) {
        if (!Effect.options.status.includes(action)) throw `Invalid status action.`;
        if (!CONFIG.statusEffects.find((s) => s.id === id)) throw `Invalid status id.`;
        return { action, id };
    }

    /**
     * @param {string} type
     * @param {object} data
     */
    constructor(type, data) {
        this.action = 'effect';
        this.type = type;
        this.data = data;
    }
}
