import { jest } from '@jest/globals';
import axios from 'axios';

describe('Debug Mocks', () => {
    it('should have mocked axios', () => {
        console.log('Axios:', axios);
        expect(jest.isMockFunction(axios.get)).toBe(true);
    });
});
