import { AppHook, AppOption, start } from './registerApp';
import { SyncHook, SyncBailHook } from 'tapable';
import toArray from './util/toArray';

enum ApplicationStatus {
    NOT_LOAD = 'NOT_LOAD',
    LOADED = 'LOADED',
    UNLOADED = 'UNLOADED',
    ERROR = 'ERROR',
}

function normalHook(option: AppOption & AppHook) {
    return {
        unmount: toArray(option.unmount),
        bootstrap: toArray(option.bootstrap),
        mount: toArray(option.mount),
        active: toArray(option.active),
    };
}

export class Application {
    hook: {
        bootstrap: SyncHook<[]>;
        mount: SyncHook<[]>;
        unmount: SyncHook<[]>;
        active: SyncBailHook<[], true | void>;
        entry?: () => Promise<Partial<AppHook>>;
    } = {
        bootstrap: new SyncHook(),
        mount: new SyncHook(),
        unmount: new SyncHook(),
        active: new SyncBailHook(),
    };

    status: ApplicationStatus = ApplicationStatus.NOT_LOAD;
    running = false;

    constructor(public name: string, option: AppOption) {
        this.processHook(option as any);
        // @ts-ignore
        this.hook.entry = option.entry;
    }

    private processHook(hooks: Partial<AppHook>) {
        const normal = normalHook(hooks as any);
        this.hook.bootstrap.taps.push(...normal.bootstrap.map(fn => ({ type: 'sync', name: 'bootstrap', fn: fn } as const)));
        this.hook.mount.taps.push(...normal.mount.map(fn => ({ type: 'sync', name: 'mount', fn: fn } as const)));
        this.hook.unmount.taps.push(...normal.unmount.map(fn => ({ type: 'sync', name: 'unmount', fn: fn } as const)));
        this.hook.active.taps.push(...normal.active.map(fn => ({ type: 'sync', name: 'active', fn: fn } as const)));
    }

    async entry() {
        if (this.status === ApplicationStatus.NOT_LOAD) {
            const hooks = await this.hook.entry?.();
            if (hooks) {
                this.processHook(hooks);
            }
            this.bootstrap();
        }
    }

    async mount() {
        this.running = true;
        this.hook.mount.call();
    }

    unmount() {
        this.running = false;
        this.hook.unmount.call();
    }
    active() {
        return this.hook.active.call();
    }
    bootstrap() {
        if (this.status === ApplicationStatus.NOT_LOAD) this.hook.bootstrap.call();
    }
}
