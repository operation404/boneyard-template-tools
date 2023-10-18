import { Action } from '../generic.js';

export const systemId = 'wwn';

// TODO
// Need to revisit this and properly implement for wwn version
// that is compatible with foundry v10+, my fork is v9 only

/**
 * @class
 * @extends Action
 * @classdesc       Modify an actor's HP via damage, healing, or replacement.
 */
class ChangeHP extends Action {
    static operations = {
        damage: (hp, val) => hp - val,
        heal: (hp, val) => hp + val,
        replace: (hp, val) => val,
    };

    /**
     * @param {object} data
     * @param {string} data.method
     * @param {number} data.value
     */
    constructor(data) {
        ChangeHP.validateData(data);
        this.type = 'ChangeHP';
        this.data = data;
    }

    /**
     * @param {object} data
     * @param {string} data.method
     * @param {number} data.value
     */
    static validateData({ method, value }) {
        if (!Object.keys(ChangeHP.operations).includes(method)) throw `'method' invalid.`;
        if (!Number.isInteger(value)) throw `'value' must be integer.`;
    }

    /**
     * @param {ActorDocument} actor
     * @param {object} data
     * @param {string} data.method
     * @param {number} data.value
     */
    static resolve(actor, data) {
        const hp = actor.attributes.hp.value;
    }
}

export const actions = {};
