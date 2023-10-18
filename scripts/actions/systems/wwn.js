import { Action } from '../generic.js';

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
     * @param {string} data.value
     */
    constructor(data) {}

    static validateData() {}

    static resolve() {}
}
