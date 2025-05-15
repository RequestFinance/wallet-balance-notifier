# Ethereum Wallet Balance notifier

Small utility to receive slack alerts when a given EVM wallet balance is low (under given threshold).

## How to use

1. Create a [Google Spreadsheet](https://sheets.new) with two sheets
   - the first one named `WalletAlerts`
   - the second one named `Chains`
2. In the `WalletAlerts` sheet, create the following columns

| Column      | Description                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `Name`      | A friendly name for your wallet, used in the Slack notification                                  |
| `Address`   | The EVM address you want to monitor                                                              |
| `Threshold` | The threshold, in ETH unit, under which the alert will be sent                                   |
| `Delta`     | How often to send an alert: a threshold of 20 and delta of 5 will send an alert at 20, 15, 10, 5 |
| `Network`   | The name of the chain, corresponding to its entry in the `Chains` sheet                          |
| `SlackHook` | A valid [Slack hook](https://api.slack.com/incoming-webhooks) URL to send the alert to           |

3. In the `Chains` sheet, create the following columns

| Column        | Description                                                                        |
| ------------- | ---------------------------------------------------------------------------------- |
| `name`        | The name of the chain                                                              |
| `explorerUrl` | The Etherscan root URL, like https://etherscan.io/, used in the Slack notification |
| `chainId`     | The chain identifier (e.g. 1 for mainnet / 137 for polygon)                        |
| `currency`    | The chain main currency, used in the Slack notification                            |

4. Fill some data
5. Get the spreadsheet ID (available in URL after https://docs.google.com/spreadsheets/d/)
6. Run the code

```sh
pnpm install
SPREADSHEET_ID=[your spreadhsheet id] ETHERSCAN_API_KEY_[NETWORK]=[your Etherscan API key] node index.js
```
