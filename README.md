# Proton Loan Scraper

NodeJS project that can be configured to periodically scrape the [Proton Loan Website](https://protonloan.com/markets) and store data in InfluxDB.

## Motivation

USDC and USDT are both stablecoins that have high yields (30%+). However, this is not consistent – sometimes the yield dips into single-digits.

Additionally, the stablecoins do not vary proportionally so it is not clear which is the better investment option over a longer period.

This tool aims to periodically collect data to determine an average APY for each stablecoin and provide more insight into the better investment option.

Intended to be run on an hourly cron job.

## Docker

`INFLUX_HOST` will be read from the environment. It will default to `localhost`.

```
docker run -e INFLUX_HOST="localhost" --rm jaketreacher/protonloanscraper
```
