const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowercase = uppercase.toLowerCase();

export const generateInput = (length: number) => {
    let input = "";
    for (let i = 0; i < length; i++) {
        const n = Math.random();
        if (n < 0.33) {
            input += uppercase[Math.floor(Math.random() * uppercase.length)];
        } else if (n < 0.66) {
            input += lowercase[Math.floor(Math.random() * uppercase.length)];
        } else {
            input += `${Math.floor(Math.random() * 10)}`;
        }
    }
    return input;
};

export type Rule = {
    description: string;
    rule: (input: string) => string;
};

export const rules: Rule[] = [
    {
        description:
            "If it is a letter, and has an odd position in the password, change the case. (i.e. A -> a a -> A)",
        rule: (input) =>
            input
                .split("")
                .map((c, i) =>
                    (i + 1) % 2 === 1
                        ? c === c.toLowerCase()
                            ? c.toUpperCase()
                            : c.toLowerCase()
                        : c
                )
                .join(""),
    },
    {
        description: "Add 3 to all numbers below 7",
        rule: (input) =>
            input
                .split("")
                .map((c) => {
                    const n = parseInt(c, 10);
                    if (!isNaN(n) && n < 7) return n + 3;

                    return c;
                })
                .join(""),
    },
    {
        description: "Shift all characters 2 positions to the right and wrap.",
        rule: (input) =>
            input
                .split("")
                .map((c) => {
                    if (!isNaN(parseInt(c))) return c;
                    if (c.toLowerCase() === c) {
                        let pos = lowercase.indexOf(c);
                        pos += 2;
                        if (pos >= lowercase.length) {
                            pos -= lowercase.length;
                        }
                        return lowercase[pos];
                    }
                    if (c.toUpperCase() === c) {
                        let pos = uppercase.indexOf(c);
                        pos += 2;
                        if (pos >= uppercase.length) {
                            pos -= uppercase.length;
                        }
                        return uppercase[pos];
                    }
                    return c;
                })
                .join(""),
    },
];

export const generateOutput = (input: string): string =>
    rules.reduce((acc, { rule }) => rule(acc), input);
