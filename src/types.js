const
  { Maybe }                = require('ramda-fantasy'),
  { Additive, GroupBy, First,
    Last, Max, Mean, Min } = require('./monoids');


const Observation = (timestamp, location, temperature, observatory) => ({
  timestamp,
  location,
  temperature,
  observatory,
  unapply: f => f(timestamp, location, temperature, observatory)
});

class Summary {
  constructor({ distance, firstLocation, lastLocation, minTemp, maxTemp, meanTemp, observatoryCount }) {
    this.distance         = distance;
    this.firstLocation    = firstLocation;
    this.lastLocation     = lastLocation;
    this.minTemp          = minTemp;
    this.maxTemp          = maxTemp;
    this.meanTemp         = meanTemp;
    this.observatoryCount = observatoryCount;
  }

  concat(other) {
    return new Summary({
      distance:         calculateDistance(this, other),
      firstLocation:    this.firstLocation.concat(other.firstLocation),
      lastLocation:     this.lastLocation.concat(other.lastLocation),
      minTemp:          this.minTemp.concat(other.minTemp),
      maxTemp:          this.maxTemp.concat(other.maxTemp),
      meanTemp:         this.meanTemp.concat(other.meanTemp),
      observatoryCount: this.observatoryCount.concat(other.observatoryCount)
    });
  }

  static empty() {
    return new Summary({
      distance:         Additive.empty(),
      firstLocation:    First.empty(),
      lastLocation:     Last.empty(),
      minTemp:          Min.empty(),
      maxTemp:          Max.empty(),
      meanTemp:         Mean.empty(),
      observatoryCount: GroupBy.empty()
    });
  }

  equals(other) {
    return (this.distance.equals(other.distance) || console.log('>> distance'))
      && (this.firstLocation.equals(other.firstLocation) || console.log('>> first loc'))
      && (this.lastLocation.equals(other.lastLocation) || console.log('>> last loc'))
      && (this.minTemp.equals(other.minTemp) || console.log('>> min temp'))
      && (this.maxTemp.equals(other.maxTemp) || console.log('>> max temp'))
      && (this.meanTemp.equals(other.meanTemp) || console.log('>> mean temp'))
      && (this.observatoryCount.equals(other.observatoryCount) || console.log('>> obs count'));
  }

  toJSON() {
    return {
      distance:         this.distance.get(),
      minTemp:          this.minTemp.get(),
      maxTemp:          this.maxTemp.get(),
      meanTemp:         this.meanTemp.get().getOrElse(null),
      observatoryCount: this.observatoryCount.get(),
      firstLocation:    this.firstLocation.get().getOrElse(null),
      lastLocation:     this.lastLocation.get().getOrElse(null)
    };
  }
}

Summary.fromObs = ({ location, temperature, observatory }) => new Summary({
  distance:         Additive.empty(),
  firstLocation:    new First(Maybe.Just(location)),
  lastLocation:     new Last(Maybe.Just(location)),
  minTemp:          new Min(temperature),
  maxTemp:          new Max(temperature),
  meanTemp:         new Mean(temperature, 1),
  observatoryCount: new GroupBy({[observatory]: 1})
});

// Calculate the total distance between two observations
// This will combine the existing distance of both, along with the
// distance between the ob1's last location and ob2's first location
const calculateDistance = (ob1, ob2) => Maybe.maybe(
  ob2.distance,
  ({x: x1, y: y1}) => Maybe.maybe(
    ob1.distance,
    ({x: x2, y: y2}) =>
      new Additive(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))).concat(ob1.distance).concat(ob2.distance),
    ob2.firstLocation.get()
  ),
  ob1.lastLocation.get()
);

module.exports = {
  Observation,
  Summary
};
