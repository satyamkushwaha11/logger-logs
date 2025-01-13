// test/logger.test.js
import  {logger}  from '../src';

describe('Logger Function', () => {
    it('should log messages with file name and line number', () => {
        console.log = jest.fn();
        logger("Test log message");
        expect(console.log).toHaveBeenCalled();
    });
});

