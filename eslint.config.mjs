// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        rules: {
            // Enforces 4-space indentation. Sorry to say this, but if you like smaller indentation
            // sugggest you a psycological check.
            indent: ['error', 4], 

            // Enforces no more than one empty line between blocks of code.
            'no-multiple-empty-lines': [
                'error',
                {
                    max: 1
                },
            ], 

            // Prevent unnecessary spaces for better readability.
            'no-multi-spaces': [ 'error' ],
            // I just thik shorthand is not clear enough.
            'object-shorthand': [ 'error', 'never' ],
        },
    }
);