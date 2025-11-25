export default class Redis {
    constructor() { }
    on() { }
    get() { return Promise.resolve(null); }
    set() { return Promise.resolve('OK'); }
    del() { return Promise.resolve(1); }
    quit() { return Promise.resolve('OK'); }
}
