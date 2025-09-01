const fs = require('fs');

// A mapping for digits greater than 9, useful for bases up to 36.
const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * Converts a string representation of a number from a given base to a BigInt (decimal).
 * @param {string} valueStr - The number as a string (e.g., "1a").
 * @param {number} base - The base of the number (e.g., 16).
 * @returns {BigInt} The decimal representation of the number as a BigInt.
 */
function toDecimal(valueStr, base) {
    const baseBigInt = BigInt(base);
    let result = 0n;
    
    // Process the string from left to right
    for (const char of valueStr.toLowerCase()) {
        const digit = DIGITS.indexOf(char);
        if (digit === -1 || digit >= base) {
            throw new Error(`Invalid digit '${char}' for base ${base}`);
        }
        result = result * baseBigInt + BigInt(digit);
    }
    return result;
}

/**
 * Converts a BigInt (decimal) to a string representation in a target base.
 * @param {BigInt} decimalValue - The decimal number to convert.
 * @param {number} base - The target base.
 * @returns {string} The string representation of the number in the target base.
 */
function fromDecimal(decimalValue, base) {
    if (decimalValue === 0n) {
        return '0';
    }
    // Handle the edge case of base 1
    if (base === 1) {
        return '1'.repeat(Number(decimalValue));
    }

    const baseBigInt = BigInt(base);
    let result = '';
    let num = decimalValue;

    while (num > 0n) {
        const remainder = num % baseBigInt;
        result = DIGITS[Number(remainder)] + result;
        num = num / baseBigInt;
    }

    return result;
}

/**
 * Evaluates a polynomial for a given x, using Horner's method for efficiency.
 * P(x) = a_n*x^n + ... + a_1*x + a_0
 * Horner's: ((...((a_n*x + a_{n-1})*x + a_{n-2})*x ...)*x + a_0)
 * @param {BigInt[]} coeffs - Array of coefficients (as BigInts), from a_0 to a_n.
 * @param {BigInt} x - The value to evaluate the polynomial at.
 * @returns {BigInt} The result of the evaluation.
 */
function evaluatePolynomial(coeffs, x) {
    // Start with the highest degree coefficient and work down.
    let result = 0n;
    for (let i = coeffs.length - 1; i >= 0; i--) {
        result = result * x + coeffs[i];
    }
    return result;
}


// --- Main Execution ---
function main() {
    try {
        // 1. Read and parse the input JSON file
        const rawData = fs.readFileSync('input.json');
        const input = JSON.parse(rawData);

        // 2. Extract roots and coefficients
        const rootsStr = input.keys.filter(key => !isNaN(parseInt(key, 10)));
        const numericKeys = Object.keys(input).filter(key => !isNaN(parseInt(key, 10))).sort((a, b) => a - b);
        
        const degree = numericKeys.length > 0 ? parseInt(numericKeys[numericKeys.length - 1], 10) : -1;
        if (degree === -1) {
            console.log('{}'); // No coefficients found, empty result
            return;
        }

        // 3. Convert all coefficients to decimal BigInts
        const coefficients = [];
        for (let i = 0; i <= degree; i++) {
            const key = i.toString();
            if (input[key]) {
                const base = parseInt(input[key].base, 10);
                const value = input[key].value;
                coefficients.push(toDecimal(value, base));
            } else {
                // If a coefficient for a power is missing, it's 0.
                coefficients.push(0n);
            }
        }
        
        // 4. Evaluate for each root and format the output
        const output = {};
        for (const rootStr of rootsStr) {
            const root = BigInt(rootStr);
            const base = Number(rootStr);

            // Evaluate the polynomial
            const resultDecimal = evaluatePolynomial(coefficients, root);

            // Convert the result to the required base
            const resultInBase = fromDecimal(resultDecimal, base);

            // Store in the output object
            output[rootStr] = {
                base: rootStr,
                value: resultInBase
            };
        }

        // 5. Print the final JSON output
        console.log(JSON.stringify(output, null, 2));

    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
