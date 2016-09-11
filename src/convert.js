const
  flyd                          = require('flyd'),
  { print }                     = require('flunc-grammar'),
  { toObservationG, celciusToKelvinIso, countryObsG,
    countryCodeG, farenheitToKelvinIso, metresToKilometresIso,
    milesToKilometresIso }      = require('./grammar'),
  { stream, observationStream } = require('./stream');

const id = x => x;

// Determine which distance iso to use for the given argument
const readDistUnit = distUnit => {
  switch (distUnit.toLowerCase()) {
    case 'km': return id; // `Observation` distances are already normalised to kilometres
    case 'mi': return milesToKilometresIso;
    case 'm':  return metresToKilometresIso;
    default: throw 'Invalid distance unit: ' + distUnit;
  }
};

// Determine which temperature iso to use for the given argument
const readTempUnit = tempUnit => {
  switch (tempUnit.toLowerCase()) {
    case 'k': return id; // `Observation` temperatures are already normalised to kelvin
    case 'f': return farenheitToKelvinIso;
    case 'c': return celciusToKelvinIso;
    default: throw 'Invalid temperature unit: ' + tempUnit;
  }
};

// Converts the stream of observations received on STDIN to a pair of
// <x loc, y loc>|<temp> lines, converted to the given units.
// Supported distance units are:    km, mi, m
// Supported temperature units are: k, f, c
const main = (distUnit, tempUnit) => {
  const convertedG = toObservationG(countryObsG(readDistUnit(distUnit), readTempUnit(tempUnit), countryCodeG));
  const printer = print(convertedG);
  const obsStream = observationStream(stream(process.stdin));
  flyd.on(obs => console.log(printer(obs)), obsStream);
};

module.exports = {
  main
};
