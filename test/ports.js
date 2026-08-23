// Asserts how constants.js resolves ports, across NODE_ENV and the override variables.
//
// This exists because port resolution in this file changed twice in two days (#6 added validation,
// #8 removed a shared PORT and moved the reads out of the `production` block), and neither change had
// anything guarding it. The specific gap it would have caught: the override variables used to be read
// inside the `production` block, so `APOLLO_PORT=9500 npm run dev:server` silently started on 9090.
// Worse, `APOLLO_PORT=abc` threw while `APOLLO_PORT=9500` was ignored, so the variable could fail your
// startup without ever being able to change it.
//
// A child process per case, because constants.js reads the environment once at require time and node
// caches the module.
//
// No dependencies: assert and child_process are both standard library.
const assert = require('assert');
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// DELETE the keys rather than setting them to ''. Setting a variable to an empty string is not the
// same as leaving it unset, and constants.js rejects set-but-empty deliberately: something put the
// variable there and produced nothing. A harness that conflates the two cannot test either case, and
// the first version of this file did exactly that and failed on its own opening assertion.
const run = (env, script) => {
  const clean = { ...process.env };
  for (const key of ['NODE_ENV', 'APOLLO_PORT', 'HTTP_PORT', 'PORT']) delete clean[key];
  return execFileSync(process.execPath, ['-e', script],
    { cwd: ROOT, env: { ...clean, ...env }, encoding: 'utf8', stdio: 'pipe' });
};

const resolve = (env) => {
  const out = run(env, 'const c = require("./constants").current; console.log(c.apollo.port + " " + c.http.port)');
  const [apollo, http] = out.trim().split(' ').map(Number);
  return { apollo, http };
};

const rejects = (env) => {
  try {
    run(env, 'require("./constants")');
    return null;
  } catch (error) {
    return String(error.stderr);
  }
};

let checks = 0;
const check = (label, fn) => { fn(); checks++; process.stdout.write(`  ok  ${label}\n`); };

check('defaults are 9090 and 9091 when nothing is set', () => {
  assert.deepStrictEqual(resolve({}), { apollo: 9090, http: 9091 });
});

// The case that was broken: the override must apply in EVERY environment, not only production.
for (const NODE_ENV of [null, 'dev', 'production']) {
  check(`APOLLO_PORT and HTTP_PORT apply with NODE_ENV=${NODE_ENV || '(unset)'}`, () => {
    const env = { APOLLO_PORT: '9500', HTTP_PORT: '9600' };
    if (NODE_ENV !== null) env.NODE_ENV = NODE_ENV;
    assert.deepStrictEqual(resolve(env), { apollo: 9500, http: 9600 });
  });
}

// And the distinction the harness above depends on, asserted rather than assumed.
check('set-but-empty is rejected, while unset falls back', () => {
  assert.deepStrictEqual(resolve({}), { apollo: 9090, http: 9091 });
  const stderr = rejects({ APOLLO_PORT: '' });
  assert.ok(stderr && stderr.includes('APOLLO_PORT'), 'an empty APOLLO_PORT should be rejected');
});

// The collision this change exists to prevent: one variable must not drive both processes.
check('PORT is ignored entirely, so it cannot point both processes at one port', () => {
  assert.deepStrictEqual(resolve({ PORT: '8080' }), { apollo: 9090, http: 9091 });
});

check('the two ports are independent', () => {
  assert.deepStrictEqual(resolve({ APOLLO_PORT: '9500' }), { apollo: 9500, http: 9091 });
  assert.deepStrictEqual(resolve({ HTTP_PORT: '9600' }), { apollo: 9090, http: 9600 });
});

// Validation still reaches both variables, and the message names the one at fault.
for (const [variable, value] of [['APOLLO_PORT', 'abc'], ['APOLLO_PORT', '-1'], ['APOLLO_PORT', '99999'],
                                 ['APOLLO_PORT', '0'], ['APOLLO_PORT', '9090.5'],
                                 ['HTTP_PORT', 'abc'], ['HTTP_PORT', '65536']]) {
  check(`${variable}=${value} is rejected, naming ${variable}`, () => {
    const stderr = rejects({ [variable]: value });
    assert.ok(stderr, `${variable}=${value} should have been rejected`);
    assert.ok(stderr.includes(variable), `the error should name ${variable}, got: ${stderr.split('\n')[0]}`);
    assert.ok(/must be an integer between 1 and 65535/.test(stderr), 'expected the range message');
  });
}

check('a boundary just inside each end is accepted', () => {
  assert.strictEqual(resolve({ APOLLO_PORT: '1' }).apollo, 1);
  assert.strictEqual(resolve({ APOLLO_PORT: '65535' }).apollo, 65535);
});

process.stdout.write(`\nports: ${checks} checks passed\n`);
