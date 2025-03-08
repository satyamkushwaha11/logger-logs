
## 📜 logger-logs | Lightweight Logger for JavaScript & Node.js  

![NPM Version](https://img.shields.io/npm/v/logger-logs?color=blue&label=version)  
![Downloads](https://img.shields.io/npm/dt/logger-logs?color=green)  
![License](https://img.shields.io/npm/l/logger-logs)  
![GitHub Repo](https://img.shields.io/github/stars/satyamkushwaha11/logger-logs?style=social)  

🚀 **logger-logs** is a powerful yet lightweight **logging utility** for **JavaScript** and **Node.js**. It helps developers **debug applications efficiently** by logging messages with the **file path, line number, and formatted content**.  

🔹 **Perfect for debugging & error tracking**  
🔹 **Supports structured logging (JSON, objects, arrays, etc.)**  
🔹 **Zero configuration—just import and log**  

---

## 🚀 Features  

✅ **File Path & Line Number** – Find exactly where logs originate.  
✅ **Supports Objects & Arrays** – Structured, easy-to-read logs.  
✅ **Error-Safe** – Prevents logging issues from breaking your app.  
✅ **Minimal Overhead** – Keeps performance optimized.  
✅ **Simple API** – Just call `logger(...)`.  

---

## 📦 Installation  

Install via **npm**:  

```sh
npm install logger-logs
```

Or add it manually to your `package.json`:  

```json
"dependencies": {
  "logger-logs": "^1.0.1"
}
```

---

## ⚡ Usage  

### 🔹 **Basic Logging**  

```js
import { logger } from "logger-logs";

logger("Hello, world!");
```

📝 **Output:**  
```
Path:: /path/to/file.js, Line:: 5, Message:: Hello, world!
```

---

### 🔹 **Logging Objects & JSON**  

```js
logger({ user: "JohnDoe", role: "admin" });
```

📝 **Output:**  
```
Path:: /path/to/file.js, Line:: 6, Message:: {
  "user": "JohnDoe",
  "role": "admin"
}
```

---

### 🔹 **Logging Multiple Arguments**  

```js
logger("User details:", { id: 123, name: "Alice" });
```

📝 **Output:**  
```
Path:: /path/to/file.js, Line:: 7, Message:: User details: {
  "id": 123,
  "name": "Alice"
}
```

---

## 📖 Advanced Usage  

### 🔹 **Customizing Log Output**  
The logger automatically captures file path and line numbers, but you can extend its behavior using wrappers.

Example:  
```js
function debugLogger(message) {
  logger(`[DEBUG] ${message}`);
}

debugLogger("API response received");
```

---

## 🛠️ Why Choose `logger-logs`?  

✔️ **Beginner-Friendly** – No setup required.  
✔️ **Optimized for Debugging** – Track errors easily.  
✔️ **Minimal & Lightweight** – No unnecessary dependencies.  
✔️ **Works in JavaScript & TypeScript** – Node.js & Browser support.  

---

## 📖 Documentation  

For full documentation, visit:  
📌 **GitHub Repo** → [logger-logs](https://github.com/satyamkushwaha11/logger-logs)  

---

## 💡 Contributing  

Want to improve this package? Feel free to **fork the repo**, make your changes, and submit a **pull request**.  

---

## 📩 Support  

🔹 **Found a bug?** Report it here: [Issues](https://github.com/satyamkushwaha11/logger-logs/issues)  
🔹 **Need help?** Reach out via [Email](mailto:satyamkushwaha1101@gmail.com)  

---

## 📜 License  

This package is **open-source** under the **ISC License**.  

🚀 **Install `logger-logs` now and simplify debugging in your JavaScript & Node.js apps!** 🚀  

