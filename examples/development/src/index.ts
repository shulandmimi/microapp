import { registerApp, registerApps, start, render } from '@micro/core';

let count = 0;
registerApps([
    {
        name: 'test-container',
        entry() {
            return Promise.resolve({
                bootstrap() {
                    console.log('bootstrap 2');
                },
            });
        },
        active: [
            () => {
                console.log(count);
                if (count === 0) {
                    return true;
                }
            },
        ],
        bootstrap() {
            console.log('bootstrap 1');
        },

        mount() {
            console.log('node mount');
        },

        unmount() {
            console.log('node unmount');
        },
    },
    {
        name: 'test-unmount',
        active() {
            if (count !== 0) {
                return true;
            }
            count++;
        },

        mount() {
            console.log('mount test-mount');
        },
    },
]);

start();

setTimeout(() => {
    render();
}, 1000);
