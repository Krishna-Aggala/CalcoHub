import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/calculations";

const OPERATORS = ["+", "-", "*", "/"];

const BUTTONS = [
  { label: "AC", value: "AC", type: "clear" },
  { label: "(", value: "(", type: "function" },
  { label: ")", value: ")", type: "function" },
  { label: "÷", value: "/", type: "operator" },

  { label: "7", value: "7", type: "number" },
  { label: "8", value: "8", type: "number" },
  { label: "9", value: "9", type: "number" },
  { label: "×", value: "*", type: "operator" },

  { label: "4", value: "4", type: "number" },
  { label: "5", value: "5", type: "number" },
  { label: "6", value: "6", type: "number" },
  { label: "−", value: "-", type: "operator" },

  { label: "1", value: "1", type: "number" },
  { label: "2", value: "2", type: "number" },
  { label: "3", value: "3", type: "number" },
  { label: "+", value: "+", type: "operator" },

  { label: "%", value: "%", type: "percent" },
  { label: "0", value: "0", type: "number" },
  { label: ".", value: ".", type: "number" },
  { label: "=", value: "=", type: "equals" },
];

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

function formatResult(value) {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  if (Object.is(value, -0)) {
    return "0";
  }

  return Number(value.toPrecision(12)).toString();
}

function formatExpression(expression) {
  return expression
    .replace(/\*/g, " × ")
    .replace(/\//g, " ÷ ")
    .replace(/\+/g, " + ")
    .replace(/-/g, " − ")
    .replace(/\s+/g, " ")
    .trim();
}

function isOperator(value) {
  return OPERATORS.includes(value);
}

function isUnaryMinus(expression, index) {
  if (expression[index] !== "-") {
    return false;
  }

  let previousIndex = index - 1;

  while (
    previousIndex >= 0 &&
    /\s/.test(expression[previousIndex])
  ) {
    previousIndex--;
  }

  if (previousIndex < 0) {
    return true;
  }

  const previous = expression[previousIndex];

  return isOperator(previous) || previous === "(";
}

// --------------------------------------------------
// SAFE MATHEMATICAL EXPRESSION PARSER
// Supports +, -, *, /, parentheses, and negative numbers.
// Does not use eval().
// --------------------------------------------------

function evaluateExpression(expression) {
  const input = expression.replace(/\s+/g, "");

  if (!input) {
    throw new Error("Please enter a calculation.");
  }

  if (input.length > 200) {
    throw new Error("The calculation is too long.");
  }

  let position = 0;

  function parseNumber() {
    const start = position;
    let decimalCount = 0;

    while (position < input.length) {
      const character = input[position];

      if (character === ".") {
        decimalCount++;

        if (decimalCount > 1) {
          throw new Error("Invalid decimal number.");
        }

        position++;
      } else if (/[0-9]/.test(character)) {
        position++;
      } else {
        break;
      }
    }

    const numberText = input.slice(start, position);

    if (!numberText || numberText === ".") {
      throw new Error("Invalid number.");
    }

    const number = Number(numberText);

    if (!Number.isFinite(number)) {
      throw new Error("Invalid number.");
    }

    return number;
  }

  function parseFactor() {
    if (input[position] === "+") {
      position++;
      return parseFactor();
    }

    if (input[position] === "-") {
      position++;
      return -parseFactor();
    }

    if (input[position] === "(") {
      position++;

      const value = parseAddSubtract();

      if (input[position] !== ")") {
        throw new Error("Missing closing parenthesis.");
      }

      position++;

      return value;
    }

    return parseNumber();
  }

  function parseMultiplyDivide() {
    let value = parseFactor();

    while (
      input[position] === "*" ||
      input[position] === "/"
    ) {
      const operator = input[position];

      position++;

      const right = parseFactor();

      if (operator === "*") {
        value *= right;
      } else {
        if (right === 0) {
          throw new Error("Cannot divide by zero.");
        }

        value /= right;
      }

      if (!Number.isFinite(value)) {
        throw new Error("Result is outside the supported range.");
      }
    }

    return value;
  }

  function parseAddSubtract() {
    let value = parseMultiplyDivide();

    while (
      input[position] === "+" ||
      input[position] === "-"
    ) {
      const operator = input[position];

      position++;

      const right = parseMultiplyDivide();

      if (operator === "+") {
        value += right;
      } else {
        value -= right;
      }

      if (!Number.isFinite(value)) {
        throw new Error("Result is outside the supported range.");
      }
    }

    return value;
  }

  const result = parseAddSubtract();

  if (position !== input.length) {
    throw new Error("Invalid mathematical expression.");
  }

  return result;
}

// --------------------------------------------------
// MAIN REACT COMPONENT
// --------------------------------------------------

function App() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState(null);

  const [history, setHistory] = useState([]);

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [justCalculated, setJustCalculated] = useState(false);

  // ------------------------------------------------
  // LOAD HISTORY FROM MONGODB
  // ------------------------------------------------

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load calculation history.");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid history response.");
      }

      setHistory(data);
    } catch (err) {
      console.error("History loading error:", err);

      setMessage(
        "Cannot connect to the backend. Check your server."
      );
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ------------------------------------------------
  // INPUT HANDLING
  // ------------------------------------------------

  const appendValue = useCallback(
    (value) => {
      setError("");
      setMessage("");

      // Start a new expression after a completed calculation.
      if (justCalculated) {
        if (/^[0-9.]$/.test(value) || value === "(") {
          setExpression(value === "." ? "0." : value);
          setResult(null);
          setJustCalculated(false);
          return;
        }

        if (isOperator(value)) {
          setExpression((result === null ? "" : String(result)) + value);
          setResult(null);
          setJustCalculated(false);
          return;
        }
      }

      setExpression((previous) => {
        // First number or initial decimal point.
        if (/^[0-9]$/.test(value)) {
          return previous + value;
        }

        // Handle decimal points.
        if (value === ".") {
          const currentNumber = previous.split(/[+\-*/()]/).pop();

          if (currentNumber.includes(".")) {
            return previous;
          }

          if (
            previous === "" ||
            /[+\-*/(]$/.test(previous)
          ) {
            return previous + "0.";
          }

          return previous + ".";
        }

        // Handle parentheses.
        if (value === "(") {
          if (previous && /[0-9.)]$/.test(previous)) {
            return previous + "*(";
          }

          return previous + "(";
        }

        if (value === ")") {
          const openCount = (previous.match(/\(/g) || []).length;
          const closeCount = (previous.match(/\)/g) || []).length;

          if (
            openCount <= closeCount ||
            /[+\-*/.(]$/.test(previous)
          ) {
            return previous;
          }

          return previous + ")";
        }

        // Handle arithmetic operators.
        if (isOperator(value)) {
          if (!previous) {
            return value === "-" ? "-" : "";
          }

          const lastIndex = previous.length - 1;
          const lastCharacter = previous[lastIndex];

          // Do not insert a binary operator after an opening parenthesis.
          if (lastCharacter === "(") {
            return value === "-" ? previous + "-" : previous;
          }

          // Replace a previously entered binary operator.
          if (isOperator(lastCharacter)) {
            // A minus can represent a negative number.
            if (value === "-") {
              if (lastCharacter === "-") {
                return previous;
              }

              return previous + "-";
            }

            // If the last minus is unary, replace its preceding
            // binary operator instead of creating an invalid expression.
            if (
              lastCharacter === "-" &&
              isUnaryMinus(previous, lastIndex)
            ) {
              const beforeMinus = previous.slice(0, lastIndex);

              if (!beforeMinus) {
                return "";
              }

              const precedingIndex = beforeMinus.length - 1;

              if (isOperator(beforeMinus[precedingIndex])) {
                return (
                  beforeMinus.slice(0, precedingIndex) + value
                );
              }

              return previous;
            }

            return previous.slice(0, -1) + value;
          }

          return previous + value;
        }

        return previous;
      });

      setResult(null);
      setJustCalculated(false);
    },
    [justCalculated, result]
  );

  // ------------------------------------------------
  // CLEAR CALCULATOR
  // ------------------------------------------------

  const clearCalculator = useCallback(() => {
    setExpression("");
    setResult(null);
    setError("");
    setMessage("");
    setJustCalculated(false);
  }, []);

  // ------------------------------------------------
  // DELETE LAST CHARACTER
  // ------------------------------------------------

  const backspace = useCallback(() => {
    setExpression((previous) => previous.slice(0, -1));
    setResult(null);
    setError("");
    setMessage("");
    setJustCalculated(false);
  }, []);

  // ------------------------------------------------
  // PERCENTAGE
  // Example: 50 % = 0.5
  // ------------------------------------------------

  const applyPercentage = useCallback(() => {
    if (!expression) {
      setError("Please enter a number first.");
      return;
    }

    try {
      const value = evaluateExpression(expression);

      setExpression(String(value / 100));
      setResult(null);
      setError("");
      setMessage("");
      setJustCalculated(false);
    } catch (err) {
      setError(err.message);
    }
  }, [expression]);

  // ------------------------------------------------
  // CALCULATE AND SAVE TO MONGODB
  // ------------------------------------------------

  const calculate = useCallback(async () => {
    if (!expression.trim()) {
      setError("Please enter a calculation.");
      return;
    }

    setError("");
    setMessage("");

    let calculatedResult;

    try {
      calculatedResult = evaluateExpression(expression);
    } catch (err) {
      setError(err.message);
      return;
    }

    // Show the result immediately.
    setResult(calculatedResult);
    setJustCalculated(true);

    // Save calculation history in MongoDB.
    setSaving(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expression,
          result: calculatedResult,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save calculation.");
      }

      const savedCalculation = await response.json();

      setHistory((previous) => [
        savedCalculation,
        ...previous.filter(
          (item) => item._id !== savedCalculation._id
        ),
      ].slice(0, 100));

      setMessage("Calculation saved successfully.");
    } catch (err) {
      console.error("Saving error:", err);

      setMessage(
        "Result calculated, but saving failed. Check MongoDB and the backend."
      );
    } finally {
      setSaving(false);
    }
  }, [expression]);

  // ------------------------------------------------
  // DELETE ONE HISTORY ITEM
  // ------------------------------------------------

  const deleteHistoryItem = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete calculation.");
      }

      setHistory((previous) =>
        previous.filter((item) => item._id !== id)
      );

      setMessage("Calculation deleted.");
      setError("");
    } catch (err) {
      console.error("Delete error:", err);
      setMessage("Unable to delete this calculation.");
    }
  }, []);

  // ------------------------------------------------
  // CLEAR ALL HISTORY
  // ------------------------------------------------

  const clearHistory = useCallback(async () => {
    if (history.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete all calculation history?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to clear history.");
      }

      setHistory([]);
      setMessage("Calculation history cleared.");
      setError("");
    } catch (err) {
      console.error("History clearing error:", err);
      setMessage("Unable to clear calculation history.");
    }
  }, [history.length]);

  // ------------------------------------------------
  // REUSE A HISTORY ITEM
  // ------------------------------------------------

  const reuseHistoryItem = useCallback((item) => {
    setExpression(String(item.expression));
    setResult(item.result);
    setError("");
    setMessage("");
    setJustCalculated(true);
  }, []);

  // ------------------------------------------------
  // KEYBOARD SUPPORT
  // ------------------------------------------------

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (
          target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
        )
      ) {
        return;
      }

      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        appendValue(event.key);
        return;
      }

      if (["+", "-", "*", "/"].includes(event.key)) {
        event.preventDefault();
        appendValue(event.key);
        return;
      }

      if (event.key === ".") {
        event.preventDefault();
        appendValue(".");
        return;
      }

      if (event.key === "(" || event.key === ")") {
        event.preventDefault();
        appendValue(event.key);
        return;
      }

      if (event.key === "%") {
        event.preventDefault();
        applyPercentage();
        return;
      }

      if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        calculate();
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        backspace();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clearCalculator();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    appendValue,
    applyPercentage,
    calculate,
    backspace,
    clearCalculator,
  ]);

  // ------------------------------------------------
  // BUTTON CLICK HANDLER
  // ------------------------------------------------

  function handleButtonClick(button) {
    switch (button.type) {
      case "clear":
        clearCalculator();
        break;

      case "equals":
        calculate();
        break;

      case "percent":
        applyPercentage();
        break;

      default:
        appendValue(button.value);
        break;
    }
  }

  // ------------------------------------------------
  // USER INTERFACE
  // ------------------------------------------------

  return (
    <div className="app-shell">
      {/* HEADER */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">CH</div>

          <div className="brand-copy">
            <div className="brand-name">
              Calco<span>Hub</span>
            </div>

            <div className="brand-subtitle">
              Simple calculations. Clear results.
            </div>
          </div>
        </div>

        <div className="connection-status">
          <span className="status-dot"></span>
          <span>MongoDB</span>
        </div>
      </header>

      {/* MAIN CONTENT */}

      <main className="main-layout">
        {/* CALCULATOR */}

        <section className="calculator-column">
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>

              <h1>
                Calculate <span>with clarity.</span>
              </h1>

             {/* <p className="heading-description">
                Perform calculations and keep your results organized
                in one place.
              </p>*/}
            </div>
          </div>

          <section className="calculator-card">
            <div className="card-topline">
              <span className="section-label">
                STANDARD CALCULATOR
              </span>

              <span className="keyboard-hint">
                Keyboard enabled
              </span>
            </div>

            {/* DISPLAY */}

            <div className="display-panel">
              <div className="display-label-row">
                <span>EXPRESSION</span>
                <span>RESULT</span>
              </div>

              <div className="expression-display">
                <span className="expression-value">
                  {expression
                    ? formatExpression(expression)
                    : "0"}
                </span>

                {expression && (
                  <button
                    type="button"
                    className="backspace-button"
                    onClick={backspace}
                    aria-label="Delete last character"
                  >
                    ⌫
                  </button>
                )}
              </div>

              <div className="result-display">
                <span className="result-prefix">=</span>

                <span className="result-value">
                  {result !== null
                    ? formatResult(result)
                    : "—"}
                </span>
              </div>
            </div>

            {/* STATUS MESSAGES */}

            {error && (
              <div className="message message-error" role="alert">
                {error}
              </div>
            )}

            {message && (
              <div className="message message-info" role="status">
                {message}
              </div>
            )}

            {/* KEYPAD */}

            <div className="keypad-heading">
              <span>KEYPAD</span>

              <button
                type="button"
                className="text-button"
                onClick={clearCalculator}
              >
                Reset calculator
              </button>
            </div>

            <div className="keypad">
              {BUTTONS.map((button) => (
                <button
                  key={button.label}
                  type="button"
                  className={`calc-button button-${button.type}`}
                  onClick={() => handleButtonClick(button)}
                  aria-label={
                    button.label === "AC"
                      ? "Clear calculator"
                      : button.label
                  }
                >
                  {button.label}
                </button>
              ))}
            </div>

            <div className="calculator-footer">
              <span className="footer-icon">✓</span>

              <span>
                {saving
                  ? "Saving calculation..."
                  : "Your calculations are stored in your database."}
              </span>
            </div>
          </section>

          {/* KEYBOARD HELP */}

          <section className="info-strip">
            <div className="info-icon">⌨</div>

            <div>
              <h3>Keyboard shortcuts</h3>

              <p>
                Enter to calculate, Backspace to delete, and Escape
                to clear. You can also type numbers and operators.
              </p>
            </div>
          </section>
        </section>

        {/* HISTORY PANEL */}

        <aside className="history-card">
          <div className="history-header">
            <div>
              {/*<p className="eyebrow">YOUR SAVED RESULTS</p>*/}

              <h2>Calculation history</h2>

              <p className="history-subtitle">
                Review and reuse your previous calculations.
              </p>
            </div>

            <div className="history-count">
              {history.length}
            </div>
          </div>

          <div className="history-toolbar">
            <span>Recent activity</span>

            <button
              type="button"
              className="clear-history-button"
              onClick={clearHistory}
              disabled={history.length === 0}
            >
              Clear all
            </button>
          </div>

          {/* HISTORY LIST */}

          <div className="history-list">
            {loadingHistory ? (
              <div className="history-state">
                <p>Loading calculation history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="history-state">
                <div className="empty-history-icon">∑</div>

                <h3>No calculations yet</h3>

                <p>
                  Your saved calculations will appear here.
                </p>
              </div>
            ) : (
              history.map((item) => (
                <article
                  key={item._id}
                  className="history-item"
                >
                  <button
                    type="button"
                    className="history-content"
                    onClick={() => reuseHistoryItem(item)}
                    title="Reuse this calculation"
                  >
                    <span className="history-expression">
                      {formatExpression(item.expression)}
                    </span>

                    <span className="history-date">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "Saved calculation"}
                    </span>
                  </button>

                  <div className="history-result">
                    <span className="history-equals">=</span>

                    <span>{formatResult(item.result)}</span>
                  </div>

                  <button
                    type="button"
                    className="delete-history-button"
                    onClick={() => deleteHistoryItem(item._id)}
                    aria-label="Delete this calculation"
                  >
                    ×
                  </button>
                </article>
              ))
            )}
          </div>

          {/* DATABASE FOOTER */}

          <div className="history-footer">
            <span className="database-icon">▤</span>

            <div>
              <strong>MongoDB Atlas</strong>

              <span>History stored in your database</span>
            </div>
          </div>
        </aside>
      </main>

      {/* FOOTER */}

      <footer className="app-footer">
        <span>CalcoHub</span>
        <span className="footer-divider">•</span>
        <span>Built with the MERN stack</span>
        <span className="footer-divider">•</span>
        {/*<span>Calculate smarter.</span>*/}
        <span>©2026  Krishna Aggala</span>
      </footer>
    </div>
  );
}

export default App;