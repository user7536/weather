const
  { Either, Maybe, Tuple }           = require('ramda-fantasy'),
  { Iso, Prism }                     = require('flunc-optics'),
  { adapt, bind, both, choose,
    digit, integer, literal,
    parse, print, replicate,
    satisfy, seqL, seqR, stringLit } = require('flunc-grammar'),
  { charListToStr, intToString }     = require('flunc-grammar/isos'),
  { compose }                        = require('flunc-grammar/util'),
  { Observation }                    = require('./types'),
  id = x => x;

// iso between a string of digits and the representing integer
const charListToInt = compose(charListToStr, intToString);

// prism matching a number between the inclusive lower and upper bounds
const bounded = (lower, upper) => Prism.prism_(
  n => n,
  n => n >= lower && n <= upper ? Maybe.Just(n) : Maybe.Nothing()
);

// pads single digits to double digits - a.k.a leftpad ;)
const padTwoDigits = Iso.iso(x => x, x => x.length === 1 ? ['0', x[0]] : x);

// matches two digits within the inclusive lower and upper bounds
const boundedTwoDigits = (lower, upper) =>
  adapt(compose(padTwoDigits, compose(charListToInt, bounded(lower, upper))),
        replicate(2, digit));

// a -> Iso b (a, b)
const pairWith = a => Iso.iso(b => Tuple(a, b), Tuple.snd);

// pairs bounded day with the given month
const daysG = (m, n) => adapt(pairWith(m), boundedTwoDigits(1, n));

// produce a 'day' grammar for the given month
const daysFromMonthG = m => {
  switch(m) {
    case  1:
    case  3:
    case  5:
    case  7:
    case  8:
    case 10:
    case 12: return daysG(m, 31);
    case  2: return daysG(m, 28);
    default: return daysG(m, 30);
  }
};

// matches 'yyyy-mm-dd'
const dateG = both(adapt(charListToInt, replicate(4, digit)),
                   /* determine which 'day' grammar to use from the matching month */
                   seqR(literal('-'), bind(seqL(boundedTwoDigits(1, 12), literal('-')), daysFromMonthG, Tuple.snd)));

// matches 'hh:dd'
const timeG = both(boundedTwoDigits(0, 23), seqR(literal(':'), boundedTwoDigits(0, 59)));

// Iso ((Integer, (Integer, Integer)), (Integer, Integer)) Date
const dateTimeIso = Iso.iso(
  t => {
    const
      date  = Tuple.fst(t),
      year  = Tuple.fst(date),
      month = Tuple.fst(Tuple.snd(date)),
      day   = Tuple.snd(Tuple.snd(date)),
      time  = Tuple.snd(t),
      hour  = Tuple.fst(time),
      mins  = Tuple.snd(time);
    return new Date(Date.UTC(year, month - 1, day, hour, mins));
  },
  d => Tuple(
    Tuple(d.getUTCFullYear(), Tuple(d.getUTCMonth() + 1, d.getUTCDate())),
    Tuple(d.getUTCHours(), d.getUTCMinutes())
  )
);

// matches 'yyyy-mm-ddThh:mm'
const dateTimeG = adapt(dateTimeIso, both(dateG, seqR(literal('T'), timeG)));

// various unit conversion isos
const celciusToKelvinIso    = Iso.iso(c => c + 273.15, k => k - 273.15);
const farenheitToKelvinIso  = Iso.iso(f => (f - 32) / 1.8 + 273.15, k => (k - 273.15) * 1.8 + 32);
const milesToKilometresIso  = Iso.iso(mi => mi / 0.62137, km => km * 0.62137);
const metresToKilometresIso = Iso.iso(m => m / 1000, km => km * 1000);

// Point = { x: Integer, y: Integer }
// Iso (Integer, Integer) Point
const tupleXYIso = Iso.iso(
  t => ({ x: Tuple.fst(t), y: Tuple.snd(t) }),
  ({x, y}) => Tuple(x, y)
);

// matches '<x coord>,<y coord>'
const coordsG = convert => {
  const convertedInt = adapt(convert, integer);
  return adapt(tupleXYIso, both(convertedInt, seqR(literal(','), convertedInt)));
};

// matches 'AA'-'ZZ'
const countryCodeG = adapt(
  charListToStr,
  replicate(2, satisfy(c => /[A-Z]/.test(c)))
);

// Iso ((a, b), c) [a, b, c]
const nestedTupleLToList = Iso.iso(
  t => [Tuple.fst(Tuple.fst(t)), Tuple.snd(Tuple.fst(t)), Tuple.snd(t)],
  ([x, y, z]) => Tuple(Tuple(x, y), z)
);

// matches '<coords>|<distance>' with conversion to kilometers and kelvin from the given isos
const measurementsG = (toKmIso, toKelvinIso) =>
  both(coordsG(toKmIso), seqR(literal('|'), adapt(toKelvinIso, integer)));

// matches an '<coords>|<distance>|<observatory code>'
const countryObsG = (toKmIso, toKelvinIso, obsG) =>
  adapt(nestedTupleLToList, both(
    measurementsG(toKmIso, toKelvinIso),
    seqR(literal('|'), obsG)
  ));

// specific grammars for the various conversions per observatory
const auObservationG    = countryObsG(id, celciusToKelvinIso, stringLit('AU'));
const frObservationG    = countryObsG(metresToKilometresIso, id, stringLit('FR'));
const usObservationG    = countryObsG(milesToKilometresIso, farenheitToKelvinIso, stringLit('US'));
const otherObservationG = countryObsG(id, id, countryCodeG);

// Converts between the nested eithers returned by `choose` and the various observatories
const allObsIso = Iso.iso(
  Either.either(id, Either.either(id, Either.either(id, id))),
  lto => {
    const [,,obs] = lto;
    switch (obs) {
      case 'AU': return Either.Left(lto);
      case 'US': return Either.Right(Either.Left(lto));
      case 'FR': return Either.Right(Either.Right(Either.Left(lto)));
      default:   return Either.Right(Either.Right(Either.Right(lto)));
    }
  }
);

// Matches any of the observatories
const allObsG = adapt(allObsIso,
  choose(auObservationG, choose(usObservationG, choose(frObservationG, otherObservationG))));

// Iso (Date, [Point, Temperature, CountryCode]) Observation
const obsWithTsIso = Iso.iso(
  t => {
    const ts = Tuple.fst(t);
    const [loc, temp, obs] = Tuple.snd(t);
    return Observation(ts, loc, temp, obs);
  },
  o => o.unapply((ts, loc, temp, obs) => Tuple(ts, [loc, temp, obs])));

// Matches a full observation line
const toObservationG = obsG => adapt(obsWithTsIso, both(dateTimeG, seqR(literal('|'), obsG)));

const allObservationsG = toObservationG(allObsG);

// Generated parsers and printers for a full observation line
const parser  = parse(allObservationsG);
const printer = print(allObservationsG);

module.exports = {
  parser,
  printer,
  countryCodeG,
  countryObsG,
  toObservationG,
  celciusToKelvinIso,
  farenheitToKelvinIso,
  metresToKilometresIso,
  milesToKilometresIso
};
