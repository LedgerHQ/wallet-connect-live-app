import { describe, expect, it } from "vitest";
import { sessionRequestReporters } from ".";
import { signRequestReporter } from "./signRequestReporter";

describe("sessionRequestReporters", () => {
  it("registers the sign request reporter", () => {
    expect(sessionRequestReporters).toEqual([signRequestReporter]);
  });
});
