import type {
    ClientEvents,
    ButtonInteraction,
    AnySelectMenuInteraction,
    ModalSubmitInteraction,
} from 'discord.js';

export interface Command {
    data: any;
    execute: (interaction: any) => Promise<void>;
    devOnly?: boolean;
}

export interface ClientEvent<Key extends keyof ClientEvents> {
    name: Key;
    once?: boolean;
    execute: (...args: ClientEvents[Key]) => Promise<void> | void;
}

export interface ComponentHandler<T extends ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction> {
    id: string;
    execute: (interaction: T) => Promise<void>;
}
