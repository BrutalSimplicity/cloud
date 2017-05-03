import { GCloud } from '../';

export = PubSub;

declare class PubSub {
    constructor(options: GCloud.Configuration);
    topic(name: string): PubSub.Topic;
    subscription(name: string, options?: PubSub.SubscriptionOptions): PubSub.Subscription;
    createTopic(name: string): Promise<[PubSub.Topic, any]>;
    getSubscriptions(options?: PubSub.SubscriptionPagingOptions): Promise<[PubSub.Subscription[], any]>;
    getTopics(options?: PubSub.PagingOptions): Promise<[PubSub.Topic[], any]>;
}

declare namespace PubSub {
    export class Subscription extends NodeJS.EventEmitter {
        ack(ackIds: string|string[], options: { timeout }): Promise<void>;
        create(): Promise<[Subscription, any]>;
        delete(): Promise<any>;
        exists(): Promise<[boolean, any]>;
        getMetadata(): Promise<any>;
        pull<T>(options?: { maxResults: number, returnImmediately: boolean }): Promise<[T[], any]>;
        setAckDeadline(options: { ackIds: string|string[], seconds: number}): Promise<any>;
    }

    export class Topic {
        create(): Promise<[Topic, any]>;
        get(options?: { autoCreate: boolean }): Promise<[Topic, any]>;
        delete(): Promise<any>;
        exists(): Promise<[boolean, any]>;
        getMetadata(): Promise<any>;
        publish<T>(message: T|T[], options?: { raw: boolean, timeout: number }): Promise<any>;
        publish(message: any, options?: { raw: boolean, timeout: number }): Promise<any>;
        subscribe(name: string, options?: SubscriptionCreationOptions): Promise<[Subscription, any]>;
        subscription(name: string, options?: { autoAck: boolean, interval: number }): Subscription;
        getSubscriptions(options?: PagingOptions): Promise<[Subscription[], any]>;
    }

    export interface PagingOptions {
        autoPaginate: boolean;
        maxApiCalls: number;
        maxResults: number;
        pageSize: number;
        pageToken: string;
    }

    export interface SubscriptionPagingOptions extends PagingOptions {
        topic: string;
    }

    export interface SubscriptionOptions {
        autoAck: boolean;
        encoding: string;
        interval: number;
        maxInProgress: number;
        timeout: number;
    }

    export interface Message {
        ackId: string;
        id: string;
        data: any;
        attributes: any;
        ack(): Promise<void>;
        skip(): void;
    }

    export interface SubscriptionCreationOptions {
        ackDeadlineSeconds?: number;
        autoAck?: boolean;
        encoding?: string;
        interval?: number;
        maxInProgress?: number;
        pushEndpoint?: string;
        timeout?: number;
    }
}

