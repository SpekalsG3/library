export function runChecks (checks: [boolean, string][]) {
    const error = checks.find(el => !el[0]);
    if (error) {
        throw new Error(error[1]);
    }
}
