# Ethereum Wallet Balance notifier

Small utility to receive slack alerts when a given Ethereum wallet balance is low (under given threshold)

![image](https://user-images.githubusercontent.com/14175665/62474023-4911d080-b7a2-11e9-9ea2-f5d51014e1f8.png)

## How to use

1. Create a google [spreadsheet](https://sheets.new)
2. Create the following columns

| Column    | Description                                                                            |
| --------- | -------------------------------------------------------------------------------------- |
| Name      | A friendly name for your wallet, to display in alerts                                  |
| Address   | The ethereum address you want to monitor                                               |
| Threshold | The threshold, in ETH, under which the alert will be sent                              |
| Network   | Mainnet or Rinkeby                                                                     |
| SlackHook | A valid [slack hook](https://api.slack.com/incoming-webhooks) URL to send the alert to |

3. Fill some data
4. Get the spreadsheet ID (available in url after https://docs.google.com/spreadsheets/)
5. Run the code

```bash
SPREADSHEET_ID=[your spreadhsheet id] node index.js
```

## Usage at Request

- Configuration Spreadsheet is available [here](https://docs.google.com/spreadsheets/d/1JfS4McLLMrfHhIWZl3_caZCN_06WjhNjXticmvHaKE8/edit)
- The function is deployed under [Google Cloud Functions](https://console.cloud.google.com/functions/list), and scheduled hourly using [Google Cloud Scheduler](https://console.cloud.google.com/cloudscheduler)

### Push new version

Any commit to master will be automatically deployed.
