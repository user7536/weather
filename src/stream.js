const
  flyd       = require('flyd'),
  fs         = require('fs'),
  { parser } = require('./grammar'),
  { Maybe }  = require('ramda-fantasy');

const Unit = Object.create(null);

// Convert a readable Node stream into a Flyd stream.
const stream = readable => {
  const stream = flyd.stream();
  readable.on('data', data => {
    // apply some back-pressure
    readable.pause();
    stream(data);
    readable.resume();
  });
  readable.on('end', () => stream.end(true));
  return stream;
};

// Creates a new stream that will output values of the given stream demarcated by new lines.
const splitStream = s => {
  const splitS = flyd.stream();
  let buf = '';
  flyd.on(a => {
    let parts = (buf + a).split(/\r?\n/);
    buf = parts.pop();
    parts.filter(x => x.length > 0).forEach(x => splitS(x));
  }, s);
  flyd.endsOn(s.end, splitS);
  return splitS;
};

// Takes a stream of lines and attempts to parse them, producing a stream of `Maybe Observation`.
const parsedStream = s =>
  flyd.map(x => parser(x), s);

// Takes a stream of `Maybe a` and produces a stream containing only `Just a` values.
const catMaybeStream = s => {
  const justS = flyd.stream();
  flyd.on(Maybe.maybe(Unit, justS), s);
  flyd.endsOn(s.end, justS);
  return justS;
};

// Takes a stream of text and produces a stream of `Observation`.
const observationStream = inputStream =>
  catMaybeStream(parsedStream(splitStream(inputStream)));

module.exports = {
  observationStream,
  stream,
};
