import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { getAlertLevel } from "../src/services/wallets.ts";

const config = {
  threshold: 20,
  delta: 5,
};

describe("getAlertLevel", () => {
  it("should not send alerts above threshold", () => {
    expect(getAlertLevel(30, undefined, config)).toBe("ok");
  });
  it("should send alerts under threshold with no current balance", () => {
    expect(getAlertLevel(18, undefined, config)).toBe("error");
  });
  it("should send alerts under threshold with current balance above threshold", () => {
    expect(getAlertLevel(18, 21, config)).toBe("error");
  });
  it("should not send alerts under threshold with current balance in current threshold", () => {
    expect(getAlertLevel(18, 19, config)).toBe("skip");
  });
  it("should re-send alerts under threshold with current balance under next threshold", () => {
    expect(getAlertLevel(15, 19, config)).toBe("error");
  });
  it("should send alerts once when last threshold is reached", () => {
    expect(getAlertLevel(4, 6, config)).toBe("error");
    expect(getAlertLevel(4, 4, config)).toBe("skip");
  });
});
