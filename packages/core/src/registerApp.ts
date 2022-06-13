import { Application } from './Application';

export interface App {
    name: string;
    active: OneOrArray<() => true | void>;
}

type OneOrArray<T> = T | T[];

export interface AppHook {
    bootstrap: OneOrArray<() => void>;
    mount: OneOrArray<() => void>;
    unmount: OneOrArray<() => void>;
}

export interface AppImport {
    entry: () => Promise<Partial<AppHook>>;
}

export type AppOption = (App & Partial<AppHook>) | (App & AppImport);

const apps: Map<string, Application> = new Map();
const activeApps: Set<Application> = new Set();

let running = false;

export function registerApp(app: AppOption) {
    if (apps.has(app.name)) {
        console.error(`app "${app.name}" aready exits`);
    }

    const application = new Application(app.name, app);

    apps.set(application.name, application);
    if (running) render();
}

export function registerApps(apps: AppOption[]) {
    apps.forEach(app => registerApp(app));
}

export function start() {
    running = true;
    render();
}

export async function render() {
    const appList = [...apps.values()];
    let unmounts = [];

    const unmountCall = (apps: Application[]) => apps.map(app => app.unmount());
    const mountCall = (apps: Application[]) => apps.map(app => app.mount());

    // 之前加载的 app 需要全部卸载
    if (activeApps.size) {
        unmounts.push(...activeApps);
        activeApps.clear();
    }

    const activeAppList = appList.filter(app => app.active());
    // 如果卸载列表
    unmountCall(unmounts.filter(app => activeAppList.every(activeApp => app.name !== activeApp.name)));

    activeAppList.forEach(app => activeApps.add(app));
    // 以 app 为单位加阻塞器
    await Promise.all(activeAppList.map(app => app.entry()));

    await Promise.all(mountCall(activeAppList));
}
