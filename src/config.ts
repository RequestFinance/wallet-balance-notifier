import dotenv from "dotenv-flow";
import envVar from "env-var";

dotenv.config({
  silent: true,
  default_node_env: "development",
});

const { get } = envVar;
const getRequired = (env: string) => get(env).required();

export const config = {
  get port() {
    return getRequired("PORT").asPortNumber();
  },
  get etherscanApiKey() {
    return getRequired("ETHERSCAN_API_KEY").asString();
  },
  get healthcheckUrl() {
    return get("HEALTHCHECK_URL").asString();
  },
};
