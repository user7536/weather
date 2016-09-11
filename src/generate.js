const
  jsv                = require('jsverify'),
  flyd               = require('flyd'),
  { printer }        = require('./grammar'),
  { ObservationArb } = require('./arbitrary');

const genObservation = jsv.sampler(ObservationArb);
const genJunk        = jsv.sampler(jsv.asciistring);

const loop = (n, junkFactor) => {
  if (n > 0) {
    Math.random() < junkFactor
      ? process.stdout.write(`${genJunk()}\n`)
      : process.stdout.write(`${printer(genObservation())}\n`);
    setImmediate(loop, n - 1, junkFactor);
  }
};

// Generate `n` random, unordered observations
// `junkFactor` will determine the frequency of invalid data to be produced
const main = (n, junkFactor) => loop(n, junkFactor);

module.exports = {
  main
};
