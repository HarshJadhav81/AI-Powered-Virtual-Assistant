import { jest } from '@jest/globals';

const cloudinary = {
    v2: {
        config: jest.fn(),
        uploader: {
            upload: jest.fn(() => Promise.resolve({ secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' })),
            destroy: jest.fn(() => Promise.resolve({ result: 'ok' }))
        }
    }
};

export default cloudinary;
