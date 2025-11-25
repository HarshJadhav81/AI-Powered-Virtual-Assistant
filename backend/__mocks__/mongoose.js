import { jest } from '@jest/globals';

const mongoose = {
    connect: jest.fn(() => Promise.resolve({ connection: { host: 'localhost' } })),
    connection: {
        host: 'localhost',
        on: jest.fn(),
        once: jest.fn()
    },
    Schema: class { },
    model: jest.fn(() => ({
        find: jest.fn(() => ({ sort: jest.fn(() => Promise.resolve([])) })),
        findOne: jest.fn(() => Promise.resolve(null)),
        findById: jest.fn(() => Promise.resolve(null)),
        create: jest.fn(() => Promise.resolve({})),
        findByIdAndUpdate: jest.fn(() => Promise.resolve({})),
        deleteOne: jest.fn(() => Promise.resolve({})),
        save: jest.fn(() => Promise.resolve({}))
    })),
    Types: {
        ObjectId: jest.fn(() => 'mock-object-id')
    }
};

export default mongoose;
