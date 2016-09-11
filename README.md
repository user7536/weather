# Weather Observations

![Homer, stop that!](https://media.giphy.com/media/xT5LMIp6EnVSEwLUYg/giphy.gif)

This project contains some example utilities for parsing, summarising and converting weather observation logs.

A log consists of a new-line separated stream of text, such as:
```
2014-12-31T13:44|10,5|243|AU
```
Which can consists of the following data:
```
<timestamp>|<location>|<temperature>|<observatory>
```

There are no guarantees that the log files are sorted chronologically and may contain unwanted characters interspersed between entries.

## Getting started

From within the project directory:
```
npm install && npm test
```

### `bin/summarise`

This script will parse STDIN for a series of weather observation log entries and print a JSON-encoded summary of the following on STDOUT:

* The min/max/mean temperature (kelvin)
* The number of observations recorded at each observatory
* The total distance travelled (kilometres)
* The first and last recorded locations

### `bin/generate <n> <junk>`

This script can be used to generate a series of new-line separated observations printed to STDOUT.

The script expects an integer argument `<n>` to determine how many lines should be produced.

Optionally, a decimal value between `0` and `1` can be provided as `<junk>` to determine the likelihood of invalid data to be produced in the stream to assist with testing.

n.b. The generated stream of data is not sorted in any way.

### `bin/convert <distance-unit> <temperature-unit>`

This script can be used to convert a stream of observations on STDIN, printing the converted `<location>|<temperature>` on STDOUT.

The script expects a `<distance-unit>` of `km`, `mi`, or `m` and a `<temperature-unit>` of `k`, `f`, or `c`.

## Notes

This project makes use of [Flunc Grammar] and [Flunc Optics] to produce pairs of printers and parsers for consuming and producing the formatted lines of observation data. Both of these projects are relatively new with no attention to performance having been made yet, meaning this project is likely to be quite sluggish by extension and should be considered as more of an experiment of curiosity at this stage.

Further improvements could be made to the summarisation script by processing the data in parallel. While currently this is restricted due to processing the single stream received on STDIN, it would be fairly trivial to instead process chunks of a file in parallel running over multiple processors. The only constraint is to ensure the chunks are combined in chronological order to ensure the total distance value is calculated correctly.

[Flunc Grammar]: http://www.github.com/flunc/grammar
[Flunc Optics]: http://www.github.com/flunc/optics
