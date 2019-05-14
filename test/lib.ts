import {exampleFunc} from "../src/lib";

describe('one', () => {
    it('one() to be "Hello World"', () => {
        expect(exampleFunc()).toBe("Hello World")
    });

    it('one() to be 2', () => {
        expect(exampleFunc()).toBe("Hello Hello")
    });
});
