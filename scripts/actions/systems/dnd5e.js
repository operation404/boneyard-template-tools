import { Action } from '../generic.js';
import { _resolveParse } from '../handler.js';

export const systemId = 'dnd5e';

class Damage extends Action {
    /**
     * @param {object} data
     * @param {string} data.damageType
     * @param {number} data.value
     * @param {boolean} [data.print]
     */
    constructor(data) {
        if (!data.hasOwnProperty('print')) data.print = false;
        super(data);
    }

    /**
     * @param {object} data
     * @param {string} data.damageType
     * @param {number} data.value
     * @param {boolean} data.print
     * @throws 'damageType' invalid.
     * @throws 'value' must be integer.
     * @throws 'print' must be boolean.
     */
    static validateData({ damageType, value, print }) {
        if (!CONFIG.DND5E.damageTypes.hasOwnProperty(damageType)) throw `'damageType' invalid.`;
        if (!Number.isInteger(value)) throw `'value' must be integer.`;
        if (typeof print !== 'boolean') throw `'print' must be boolean.`;
    }

    /**
     * Determine the damage type's multiplier for the actor.
     * @param {ActorDocument} actor
     * @param {string} damageType
     */
    static _getMultiplier(actor, damageType) {
        const { di: damageImmunities, dr: damageResistances, dv: damageVulnerabilities } = actor.system.traits;
        if (damageResistances.value.has(damageType)) {
            return 0.5;
        } else if (damageImmunities.value.has(damageType)) {
            return 0;
        } else if (damageVulnerabilities.value.has(damageType)) {
            return 2;
        }
        return 1;
    }

    /**
     * @param {ActorDocument} actor
     * @param {number} value
     * @param {string} damageType
     */
    static _print(actor, value, damageType) {
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<span>${actor.name} takes ${value} ${CONFIG.DND5E.damageTypes[damageType]} damage.</span><br>`,
        });
    }

    /**
     * Apply damage or healing to the actor, accounting for immunities, resistances,
     * and vulnerabilities.
     * @param {ActorDocument} actor
     * @param {object} data
     * @param {string} data.damageType
     * @param {number} data.value
     * @param {boolean} data.print
     */
    static resolve(actor, { damageType, value, print }) {
        const multiplier = this._getMultiplier(actor, damageType);
        actor.applyDamage(value, multiplier);
        if (print) this._print(actor, value, damageType);
    }
}

class Healing extends Damage {
    /**
     * @param {object} data
     * @param {number} data.value
     * @param {boolean} [data.print]
     */
    constructor(data) {
        super(data);
    }

    /**
     * @param {object} data
     * @param {number} data.value
     * @param {boolean} data.print
     * @throws 'value' must be integer.
     * @throws 'print' must be boolean.
     */
    static validateData({ value }) {
        if (!Number.isInteger(value)) throw `'value' must be integer.`;
        if (typeof print !== 'boolean') throw `'print' must be boolean.`;
    }

    /**
     * @param {ActorDocument} actor
     * @param {number} value
     */
    static _print(actor, value) {
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<span>${actor.name} heals ${value} hp.</span><br>`,
        });
    }

    /** @override */
    static _getMultiplier() {
        return -1;
    }
}

class SavingThrow extends Action {
    /**
     * @param {object} data
     * @param {string} data.save
     * @param {number} [data.bonus]
     * @param {number} data.dc
     * @param {Action|Action[]} data.passActions
     * @param {Action|Action[]} [data.failActions]
     * @param {boolean} [data.print]
     */
    constructor(data) {
        data.passActions = Array.isArray(data.passActions) ? data.passActions : [data.passActions];
        if (!data.hasOwnProperty('bonus')) data.bonus = 0;
        if (!data.hasOwnProperty('failActions')) data.failActions = [];
        data.failActions = Array.isArray(data.failActions) ? data.failActions : [data.failActions];
        if (!data.hasOwnProperty('print')) data.print = false;
        super(data);
    }

    /**
     * @param {object} data
     * @param {string} data.save
     * @param {number} data.bonus
     * @param {number} data.dc
     * @param {Action[]} data.passActions
     * @param {Action[]} data.failActions
     * @param {boolean} data.print
     * @throws 'save' invalid.
     * @throws 'bonus' must be integer.
     * @throws 'dc' must be integer.
     * @throws 'passActions' must be instance(s) of Action.
     * @throws 'failActions' must be instance(s) of Action.
     * @throws 'print' must be boolean.
     */
    static validateData({ save, bonus, dc, passActions, failActions }) {
        if (!CONFIG.DND5E.abilities.hasOwnProperty(save)) throw `'save' invalid.`;
        if (!Number.isInteger(bonus)) throw `'bonus' must be integer.`;
        if (!Number.isInteger(dc)) throw `'dc' must be integer.`;
        passActions.forEach((a) => {
            if (!(a instanceof Action)) throw `'passActions' must be instances of Action.`;
        });
        failActions.forEach((a) => {
            if (!(a instanceof Action)) throw `'failActions' must be instances of Action.`;
        });
        if (typeof print !== 'boolean') throw `'print' must be boolean.`;
    }

    // https://github.com/foundryvtt/dnd5e/blob/master/module/dice/dice.mjs

    /**
     * @param {ActorDocument} actor
     * @param {string} save
     * @param {number} bonus
     * @param {number} dc
     * @param {boolean} print
     * @returns {boolean}               Whether the save passed or failed.
     */
    static async _makeSave(actor, save, bonus, dc, print) {
        const saveRoll = await actor.rollAbilitySave(save, {
            fastForward: true,
            targetValue: dc,
            parts: ['@bonus'],
            data: { bonus },
            critical: null,
            fumble: null,
            chatMessage: print,
            messageData: {
                speaker: ChatMessage.getSpeaker({ actor }),
            },
        });
        return saveRoll.total >= dc;
    }

    /**
     * Make a saving throw for the actor and resolve actions based on whether
     * the save passed or failed.
     * @param {ActorDocument} actor
     * @param {object} data
     * @param {string} data.save
     * @param {number} data.bonus
     * @param {number} data.dc
     * @param {Action[]} data.passActions
     * @param {Action[]} data.failActions
     * @param {boolean} data.print
     */
    static async resolve(actor, { save, bonus, dc, passActions, failActions, print }) {
        if (await this._makeSave(actor, save, bonus, dc, print)) _resolveParse(actor, passActions);
        else _resolveParse(actor, failActions);
    }
}

class AbilityCheck extends Action {}

class CreatureType extends Action {}

export const actions = [Damage, Healing];
