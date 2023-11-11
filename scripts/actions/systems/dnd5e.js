import { Action, Validate, Roll } from '../generic.js';
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
     */
    static validateData({ damageType, value, print }) {
        Validate.isObjField({ damageType }, CONFIG.DND5E.damageTypes);
        Validate.isInteger({ value });
        Validate.isBoolean({ print });
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
    static async _print(actor, value, damageType) {
        await ChatMessage.create({
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
    static async resolve(actor, { damageType, value, print }) {
        const multiplier = this._getMultiplier(actor, damageType);
        actor.applyDamage(value, multiplier);
        if (print) await this._print(actor, value, damageType);
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
    static validateData({ value, print }) {
        Validate.isInteger({ value });
        Validate.isBoolean({ print });
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
        else data.failActions = Array.isArray(data.failActions) ? data.failActions : [data.failActions];
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
     */
    static validateData({ save, bonus, dc, passActions, failActions, print }) {
        Validate.isObjField({ save }, CONFIG.DND5E.abilities);
        Validate.isInteger({ bonus, dc });
        Validate.isClass({ passActions, failActions }, Action);
        Validate.isBoolean({ print });
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
        if (await this._makeSave(actor, save, bonus, dc, print)) await _resolveParse(actor, passActions);
        else await _resolveParse(actor, failActions);
    }
}

class AbilityCheck extends Roll {
    static options = {};

    /**
     * @param {object} data
     * @param {string} data.check
     * @param {number} [data.bonus]
     * @param {number} data.dc
     * @param {Action|Action[]} data.trueActions
     * @param {Action|Action[]} [data.falseActions]
     * @param {boolean} [data.print]
     */
    constructor(data) {
        if (!data.hasOwnProperty('bonus')) data.bonus = 0;
        super(data);
    }

    /**
     * @param {object} data
     * @param {string} data.check
     * @param {number} data.bonus
     * @param {number} data.dc
     * @param {Action[]} data.trueActions
     * @param {Action[]} data.falseActions
     * @param {boolean} data.print
     */
    static validateData({ check, bonus, dc, trueActions, falseActions, print }) {
        Validate.isObjField({ check }, CONFIG.DND5E.abilities);
        Validate.isInteger({ bonus, dc });
        Validate.isClass({ trueActions, falseActions }, Action);
        Validate.isBoolean({ print });
    }

    static async evaluateRoll(actor, { check, bonus, dc, print }) {
        const abilityRoll = await actor.rollAbilityTest(check, {
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
        return abilityRoll.total >= dc;
    }
}

class CreatureType extends Action {}

export const actions = [Damage, Healing, SavingThrow, AbilityCheck];
