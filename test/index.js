const jsv = require('jsverify');
const { Additive, GroupBy, First, Last, Max, Mean, Min } = require('../src/monoids');
const { Summary } = require('../src/types');
const { SummaryArb, AdditiveArb, GroupByArb, FirstArb, LastArb, MaxArb, MinArb, MeanArb } = require('../src/arbitrary');

////

const monoidCheck = (empty, monoidArb) => {
  // associativity
  jsv.assertForall(monoidArb, monoidArb, monoidArb,
    (a, b, c) => a.concat(b).concat(c).equals(a.concat(b.concat(c))));

  // left identity
  jsv.assertForall(monoidArb, a => empty.concat(a).equals(a));

  // right identity
  jsv.assertForall(monoidArb, a => a.concat(empty).equals(a));
};

////

monoidCheck(Summary.empty(), SummaryArb);
monoidCheck(Additive.empty(), AdditiveArb);
monoidCheck(GroupBy.empty(), GroupByArb);
monoidCheck(First.empty(), FirstArb(jsv.number));
monoidCheck(Last.empty(), LastArb(jsv.number));
monoidCheck(Max.empty(), MaxArb);
monoidCheck(Mean.empty(), MeanArb);
monoidCheck(Min.empty(), MinArb);

////

console.log('TESTS PASSED');
