import { expect, test } from "vitest";
import { hello } from "./hello";

test("hello test", () => {
  expect(hello()).toEqual("hello");
});
