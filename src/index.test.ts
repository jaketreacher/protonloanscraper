import { apy_string_to_number } from "./index";

describe("apy_string_to_number", () => {
  test("Finds match in good earn string", () => {
    const test_string = "Earn: 10.95% APY";

    const result = apy_string_to_number(test_string);

    expect(result).toBe(10.95);
  });

  test("Finds match in good pay string", () => {
    const test_string = "Pay: 10.95% APY";

    const result = apy_string_to_number(test_string);

    expect(result).toBe(-10.95);
  });
});
