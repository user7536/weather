const
  jsv                      = require('jsverify'),
  { Maybe }                = require('ramda-fantasy'),
  { Observation, Summary } = require('./types'),
  { Additive, GroupBy, First,
    Last, Max, Mean, Min } = require('./monoids');

const JustArb  = arb => arb.smap(Maybe.Just, m => m.value);
const MaybeArb = arb => jsv.oneof(jsv.constant(Maybe.Nothing()), JustArb(arb));

const PointArb = jsv.record({ x: jsv.nat, y: jsv.nat });

const AdditiveArb = jsv.nat.smap(n => new Additive(n), x => x.get());
const GroupByArb  = jsv.dict(jsv.nat).smap(ns => new GroupBy(ns), x => x.get());
const FirstArb    = arb => MaybeArb(arb).smap(m => new First(m), x => x.get());
const LastArb     = arb => MaybeArb(arb).smap(m => new Last(m), x => x.get());
const MaxArb      = jsv.number.smap(n => new Max(n), x => x.get());
const MinArb      = jsv.number.smap(n => new Min(n), x => x.get());
const MeanArb     = jsv.pair(jsv.number, jsv.nat).smap(([x, n]) => new Mean(x, n), ({ total, count }) => [total, count]);

// Generates a triple of a first location, last location and the distance between the two.
const LocationDistanceArb = jsv.oneof(
  jsv.constant([Additive.empty(), First.empty(), Last.empty()]),
  jsv.pair(PointArb, PointArb).smap(
    ([p1, p2]) => {
      const {x: x1, y: y1} = p1,
            {x: x2, y: y2} = p2,
            distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      return [new Additive(distance), new First(Maybe.Just(p1)), new Last(Maybe.Just(p2))]
    },
    ([distance, first, last]) => [first.get(), last.get()]
  )
);

const SummaryArb = jsv.tuple([LocationDistanceArb, MinArb, MaxArb, MeanArb, GroupByArb]).smap(
  ([[distance, firstLocation, lastLocation], minTemp, maxTemp, meanTemp, observatoryCount]) => {
    return new Summary({ distance, firstLocation, lastLocation, minTemp, maxTemp, meanTemp, observatoryCount })
  },
  ({ distance, firstLocation, lastLocation, minTemp, maxTemp, meanTemp, observatoryCount }) => {
    console.log('!', firstLocation);
    return [ distance, firstLocation, lastLocation, minTemp, maxTemp, meanTemp, observatoryCount ];
  }
);

const CountryCodeArb = jsv.pair(jsv.integer(65, 90), jsv.integer(65, 90)).smap(
  ([a, b]) => String.fromCharCode(a, b),
  (str) => [str.charCodeAt(0), str.charCodeAt(1)]
);

const ObservationArb = jsv.record({
  timestamp:   jsv.datetime,
  location:    PointArb,
  temperature: jsv.integer(250, 300),
  observatory: jsv.oneof(CountryCodeArb, jsv.elements(['AU', 'FR', 'US']))
}).smap(
  ({ timestamp, location, temperature, observatory }) => Observation(timestamp, location, temperature, observatory),
  o => o.unapply((timestamp, location, temperature, observatory) => ({ timestamp, location, temperature, observatory }))
);

module.exports = {
  ObservationArb,
  SummaryArb,
  AdditiveArb,
  GroupByArb,
  FirstArb,
  LastArb,
  MaxArb,
  MinArb,
  MeanArb
};
