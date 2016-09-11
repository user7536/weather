const { Maybe } = require('ramda-fantasy');

const closeEnough = (v1, v2) =>
  Math.abs(v2 - v1) < 0.0000000000001;

class Additive {
  constructor(n) {
    this.n = n;
  }
  concat(other) {
    return new Additive(this.n + other.n);
  }
  get() {
    return this.n;
  }
  equals(other) {
    return other instanceof Additive && closeEnough(other.get(), this.n);
  }
  static empty() {
    return new Additive(0);
  }
}

class GroupBy {
  constructor(counts) {
    this.counts = counts;
  }
  concat(other) {
    let combined = Object.assign({}, this.counts);
    for (let k in other.counts) {
      if (k in combined) {
        combined[k] += other.counts[k];
      } else {
        combined[k] = other.counts[k];
      }
    }
    return new GroupBy(combined);
  }
  get() {
    return this.counts;
  }
  equals(other) {
    const otherCounts = other.get();
    return other instanceof GroupBy
      && Object.keys(this.counts).length === Object.keys(otherCounts).length
      && Object.keys(this.counts).reduce((acc, k) => acc && this.counts[k] === otherCounts[k], true);
  }
  static empty() {
    return new GroupBy({});
  }
}

class First {
  constructor(maybeX) {
    this.maybeX = maybeX;
  }
  concat(other) {
    return Maybe.maybe(other, () => this, this.maybeX);
  }
  get() {
    return this.maybeX;
  }
  equals(other) {
    return this.maybeX.equals(other.get());
  }
  static empty() {
    return new First(Maybe.Nothing());
  }
}

class Last {
  constructor(maybeX) {
    this.maybeX = maybeX;
  }
  concat(other) {
    return Maybe.maybe(this, () => other, other.maybeX);
  }
  get() {
    return this.maybeX;
  }
  equals(other) {
    return this.maybeX.equals(other.get());
  }
  static empty() {
    return new Last(Maybe.Nothing());
  }
}

class Max {
  constructor(n) {
    this.n = n;
  }
  concat(other) {
    return new Max(Math.max(this.n, other.n));
  }
  get() {
    return this.n;
  }
  equals(other) {
    return this.n === other.get();
  }
  static empty() {
    return new Max(-Infinity);
  }
}

class Mean {
  constructor(total, count) {
    this.total = total;
    this.count = count;
  }
  concat(other) {
    return new Mean(this.total + other.total, this.count + other.count);
  }
  get() {
    return this.count === 0 ? Maybe.Nothing() : Maybe.Just(this.total / this.count);
  }
  equals(other) {
    return this.total === other.total && this.count === other.count;
  }
  static empty() {
    return new Mean(0, 0);
  }
}

class Min {
  constructor(n) {
    this.n = n;
  }
  concat(other) {
    return new Min(Math.min(this.n, other.n));
  }
  get() {
    return this.n;
  }
  equals(other) {
    return this.n === other.get();
  }
  static empty() {
    return new Min(Infinity);
  }
}


module.exports = {
  Additive,
  GroupBy,
  First,
  Last,
  Max,
  Mean,
  Min
};
