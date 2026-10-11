import { useState } from "react";
import api from "../api";

const buttons = [
  { label: "AC", type: "utility" },
  { label: "(", type: "utility" },
  { label: ")", type: "utility" },
  { label: "÷", value: "/", type: "operator" },

  { label: "7" },
  { label: "8" },
  { label: "9" },
  { label: "×", value: "*", type: "operator" },

  { label: "4" },
  { label: "5" },
  { label: "6" },
  { label: "−", value: "-", type: "operator" },

  { label: "1" },
  { label: "2" },
  { label: "3" },
  { label: "+", type: "operator" },

  { label: "%" },
  { label: "0" },
  { label: "." },
  { label: "=", type: "equals" },
];

// Safe expression parser.
// Does not use eval() or the Function constructor.
function evaluateExpression(input) {
  const expression = input.replace(/\s+/g, "");

  if (!expression || expression.length > 200) {
    throw new Error("Enter a valid expression");
  }

  let position = 0;

  function peek() {
    return expression[position];
  }

  function consume(char) {
    if (peek() === char) {
      position++;
      return true;
    }

    return false;
  }

  function parseNumber() {
    const start = position;
    let digits = 0;

    while (/[0-9]/.test(peek() || "")) {
      position++;
      digits++;
    }

    if (consume(".")) {
      while (/[0-9]/.test(peek() || "")) {
        position++;
        digits++;
      }
    }

    if (digits === 0) {
      throw new Error("Invalid number");
    }

    const value = Number(expression.slice(start, position));

    if (!Number.isFinite(value)) {
      throw new Error("Invalid number");
    }

    return value;
  }

  function parsePrimary() {
    if (consume("(")) {
      const value = parseAddSub();

      if (!consume(")")) {
        throw new Error("Missing closing bracket");
      }

      return value;
    }

    return parseNumber();
  }

  function parseUnary() {
    if (consume("+")) {
      return parseUnary();
    }

    if (consume("-")) {
      return -parseUnary();
    }

    return parsePrimary();
  }

  function parsePostfix() {
    let value = parseUnary();

    while (consume("%")) {
      value /= 100;
    }

    return value;
  }

  function parseMultiplyDivide() {
    let value = parsePostfix();

    while (peek() === "*" || peek() === "/") {
      const operator = expression[position++];

      const right = parsePostfix();

      if (operator === "/" && right === 0) {
        throw new Error("Cannot divide by zero");
      }

      value =
        operator === "*"
          ? value * right
          : value / right;
    }

    return value;
  }

  function parseAddSub() {
    let value = parseMultiplyDivide();

    while (peek() === "+" || peek() === "-") {
      const operator = expression[position++];

      const right = parseMultiplyDivide();

      value =
        operator === "+"
          ? value + right
          : value - right;
    }

    return value;
  }

  const result = parseAddSub();

  if (position !== expression.length) {
    throw new Error("Invalid expression");
  }

  if (!Number.isFinite(result)) {
    throw new Error("Result is too large");
  }

  return result;
}

function formatResult(value) {
  return Number(value.toPrecision(12)).toString();
}

function Calculator({ onSaved }) {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function appendValue(value) {
    setExpression((previous) => previous + value);
    setError("");
  }

  function clear() {
    setExpression("");
    setResult("");
    setError("");
  }

  function backspace() {
    setExpression((previous) => previous.slice(0, -1));
    setError("");
  }

  async function calculate() {
    if (!expression.trim() || saving) {
      return;
    }

    let numericResult;

    try {
      numericResult = evaluateExpression(expression);

      const formattedResult = formatResult(numericResult);

      setResult(formattedResult);
      setError("");
      setSaving(true);

      // Save to MongoDB through the backend.
      const response = await api.post("/calculations", {
        expression,
        result: numericResult,
      });

      // Update the history panel.
      onSaved(response.data);
    } catch (err) {
      if (err.response) {
        setError(
          err.response.data?.message ||
            "Could not save calculation"
        );
      } else if (
        err.message === "Network Error" ||
        err.code === "ECONNABORTED"
      ) {
        setError("Cannot connect to the server");
      } else {
        setError(err.message || "Invalid expression");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleButton(button) {
    if (button.label === "AC") {
      clear();
      return;
    }

    if (button.label === "=") {
      calculate();
      return;
    }

    appendValue(button.value ?? button.label);
  }

  return (
    <section className="calculator-card">
      <div className="calculator-heading">
        <div>
          <p className="eyebrow">STANDARD CALCULATOR</p>
          <h2>Calculate anything.</h2>
        </div>

        <div className="calculator-symbol">⌗</div>
      </div>

      <div className="display">
        <div className="display-label">EXPRESSION</div>

        <div className="expression">
          {expression || "0"}
        </div>

        <div className="result-label">RESULT</div>

        <div className="result">
          {result !== "" ? result : "—"}
        </div>
      </div>

      <div className="utility-row">
        <button
          className="utility-button"
          onClick={backspace}
          aria-label="Delete last character"
        >
          ⌫ Backspace
        </button>

        <span className="keyboard-hint">
          Use your keyboard
        </span>
      </div>

      <div className="keypad">
        {buttons.map((button) => (
          <button
            key={button.label}
            className={[
              "key",
              button.type ? `key-${button.type}` : "",
            ].join(" ")}
            onClick={() => handleButton(button)}
            disabled={saving}
          >
            {button.label}
          </button>
        ))}
      </div>

      {saving && (
        <p className="message">Saving calculation...</p>
      )}

      {error && (
        <p className="message error-message">{error}</p>
      )}

      <p className="calculator-footer">
        Your calculations are saved to cloud history.
      </p>
    </section>
  );
}

export default Calculator;