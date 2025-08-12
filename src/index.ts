import { GoogleSheet } from "gsheet-object";
import axios from "axios";
import { fromWei } from "web3-utils";

type IWalletAlertConfig = {
  name: string;
  address: string;
  threshold: string;
  network: string;
  slackHook: string;
  balance: string;
  delta: string;
};

type IChainConfig = {
  name: string;
  explorerUrl: string;
  currency: string;
  chainId: number;
};

type IChainMap = Record<string, IChainConfig>;

const sendAlert = async (
  text: any,
  { name, address, balance, network, slackHook }: IWalletAlertConfig,
  chains: IChainMap,
) => {
  const baseUrl = chains[network.toLowerCase()].explorerUrl;
  const currency = chains[network.toLowerCase()].currency;

  await axios.post(slackHook, {
    attachments: [
      {
        text,
        fields: [
          {
            title: "Wallet",
            value: `<${baseUrl}/address/${address}|${name}>`,
            short: true,
          },
          {
            title: "Balance",
            value: `${balance} ${currency}`,
            short: true,
          },
          {
            title: "Network",
            value: network,
            short: true,
          },
        ],
        color: "danger",
      },
    ],
  });
};

const getClient = (baseURL: string, apiKey?: string) => {
  return axios.create({ baseURL, params: { apikey: apiKey } });
};

export const getAlertLevel = (
  balance: number,
  previousBalance: number | undefined,
  { threshold, delta }: { threshold: number; delta: number },
): "error" | "ok" | "skip" => {
  if (balance > threshold) {
    return "ok";
  }

  if (previousBalance) {
    let nextThreshold: number | undefined = 0;
    for (let x = threshold; x > 0; x -= delta) {
      if (x < previousBalance) {
        nextThreshold = x;
        break;
      }
    }
    if (!nextThreshold && previousBalance < delta) {
      return "skip";
    }
    if (nextThreshold && balance > nextThreshold) {
      return "skip";
    }
  }
  return "error";
};

const processWallet = async (wallet: IWalletAlertConfig, chains: IChainMap) => {
  const {
    name,
    address,
    threshold,
    network,
    balance: currentBalance,
    delta: deltaStr,
  } = wallet;
  if (!chains[network]) {
    console.warn("unknown network!", network);
    return;
  }
  const baseUrl = `https://api.etherscan.io/`;
  const api = getClient(baseUrl, process.env[`ETHERSCAN_API_KEY`]);
  let data;
  try {
    const response = await api.get(
      `/v2/api?chainId=${chains[network].chainId}`,
      {
        params: {
          module: "account",
          action: "balance",
          address,
          ...api.defaults.params,
        },
      },
    );
    data = response.data;
  } catch (e) {
    console.error(
      `Error fetching wallet ${wallet.name} (${address}) on ${network}:`,
      e,
    );
    throw e;
  }

  if (data.status === "0") {
    throw new Error(data.result);
  }

  const newBalance = Number(fromWei(data.result, "ether"));
  const result = {
    ...wallet,
    balance: newBalance.toFixed(3),
  };
  const alertLevel = getAlertLevel(newBalance, Number(currentBalance), {
    threshold: Number(threshold),
    delta: Number(deltaStr) || 1,
  });
  if (alertLevel === "skip") {
    console.warn(
      `low balance on wallet ${name} (${address}): ${result.balance}. Skipping alert and balance update.`,
    );
    return null;
  }
  if (alertLevel === "error") {
    console.warn(
      `low balance on wallet ${name} (${address}): ${result.balance}.`,
    );
    sendAlert(`:alert: Low balance on wallet ${name}`, result, chains);
  } else {
    console.log(`balance on wallet ${name} (${address}): ${newBalance}`);
  }
  return result;
};

export const main = async () => {
  const sheet = await GoogleSheet.load<IWalletAlertConfig>("WalletAlerts");
  const wallets = await sheet.getData();
  const chainsSheet = await GoogleSheet.load<IChainConfig>("Chains");
  const chainData = await chainsSheet.getData();
  const chains = chainData.reduce(
    (acc, curr) => ({ ...acc, [curr.name]: curr }),
    {} as IChainMap,
  );

  for (const wallet of wallets) {
    const result = await processWallet(wallet, chains);
    if (result) {
      console.log(`updating ${result.name} to ${result.balance}`);
      await sheet.update(wallet._row, "balance", result.balance);
    }
  }

  if (process.env.HEALTHCHECK_URL) {
    await axios.post(process.env.HEALTHCHECK_URL);
  }
};
