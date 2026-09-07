import { GoogleSheet } from "gsheet-object";
import { config } from "~/config.ts";

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

const fromWei = (wei: string): number => Number(BigInt(wei)) / 1e18;

const sendAlert = async (
  text: string,
  { name, address, balance, network, slackHook }: IWalletAlertConfig,
  chains: IChainMap,
) => {
  const baseUrl = chains[network.toLowerCase()].explorerUrl;
  const currency = chains[network.toLowerCase()].currency;

  await fetch(slackHook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
    }),
  });
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
  const url = new URL(config.etherscanApiUrl);
  url.searchParams.set("chainId", String(chains[network].chainId));
  url.searchParams.set("module", "account");
  url.searchParams.set("action", "balance");
  url.searchParams.set("address", address);
  url.searchParams.set("apikey", config.etherscanApiKey);

  let data;
  try {
    const response = await fetch(url.toString());
    data = await response.json();
  } catch (e) {
    console.error(
      `Error fetching wallet ${name} (${address}) on ${network}:`,
      e,
    );
    throw e;
  }

  if (data.status === "0") {
    if (/rate limit/i.test(data.result)) {
      console.warn(
        `Etherscan rate limit hit for wallet ${name} (${address}) on ${network}, skipping:`,
        data.result,
      );
      return null;
    }
    throw new Error(data.result);
  }

  if (typeof data.result !== "string") {
    throw new Error(
      `Unexpected Etherscan response for wallet ${name} (${address}) on ${network}: ${JSON.stringify(data)}`,
    );
  }

  const newBalance = fromWei(data.result);
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
      `low balance on wallet ${name} (${address}) on ${network}: ${result.balance}. Skipping alert and balance update.`,
    );
    return null;
  }
  if (alertLevel === "error") {
    console.warn(
      `low balance on wallet ${name} (${address}) on ${network}: ${result.balance}.`,
    );
    sendAlert(`:alert: Low balance on wallet ${name}`, result, chains);
  } else {
    console.log(
      `balance on wallet ${name} (${address}) on ${network}: ${newBalance}`,
    );
  }
  return result;
};

export const run = async () => {
  const sheet = await GoogleSheet.load<IWalletAlertConfig>("WalletAlerts");
  const wallets = await sheet.getData();
  const chainsSheet = await GoogleSheet.load<IChainConfig>("Chains");
  const chainData = await chainsSheet.getData();
  const chains = chainData.reduce(
    (acc, curr) => ({ ...acc, [curr.name]: curr }),
    {} as IChainMap,
  );

  let balanceUpdated = false;
  for (const wallet of wallets) {
    const result = await processWallet(wallet, chains);
    if (result) {
      console.log(
        `updating wallet balance for ${result.name} (${result.address}) on ${result.network} to ${result.balance}`,
      );
      await sheet.update(wallet._row, "balance", result.balance);
      balanceUpdated = true;
    }
  }

  const healthcheckUrl = config.healthcheckUrl;
  if (healthcheckUrl && balanceUpdated) {
    await fetch(healthcheckUrl, { method: "POST" });
  }
};
