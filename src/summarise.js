const
  flyd                          = require('flyd'),
  { spawn }                     = require('child_process'),
  { observationStream, stream } = require('./stream'),
  { Summary }                   = require('./types');

// Creates a sorted stream from STDIN.
const sortedStream = () => {
  // gnu `sort` is used here for its ability to handle files larger than available memory via external merge
  const sortProc = spawn('sort');
  process.stdin.pipe(sortProc.stdin);
  return stream(sortProc.stdout);
};

// Parses STDIN for rows of `Observation` text, producing a JSON-encoded summary of
// the total distance, min/max/mean temp, observation count and first/last recorded location.
const main = () => {
  // Note the stream must be sorted to correctly observe the total distance between points.
  const obsStream = observationStream(sortedStream());
  const summarise = flyd.scan((a, b) => a.concat(Summary.fromObs(b)), Summary.empty());
  const resultStream = summarise(obsStream);
  flyd.on(() => {
    process.stdout.write(JSON.stringify(resultStream()) + '\n');
  }, resultStream.end);
};

module.exports = {
  main
};
