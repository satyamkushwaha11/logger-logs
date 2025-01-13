# logger-logs 📜

**logger-logs** is a lightweight and flexible utility for logging messages with detailed context. It outputs the **file path**, **line number**, and **formatted messages** to help you trace and debug issues effortlessly.

---

## Features 🚀

- **File Path & Line Number**: Automatically logs the file path and the line number where the logger is called.
- **Supports Multiple Data Types**: Logs strings, objects, arrays, and more in a readable format.
- **Error Handling**: Prevents logging errors from disrupting your application.
- **Lightweight & Easy to Use**: Minimal configuration required.

---

## Installation 🛠️

Install the package via npm:

```bash
npm install logger-logs 
```
Or add it directly to your package.json:
```bash
"dependencies": {
  "logger-logs": "^1.0.0"
}
```

-----------------------------

Import the Logger
```bash
import { logger } from "logger-logs";
```
Basic Usage
```bash
logger("This is a simple log message.");
```
Output:
```bash
Path::/path/to/your/file.js,  Line::5,   Message::This is a simple log message
```
Logging Objects
```bash
logger({ key: "value", status: "success" });
```
Output:
```bash
Path::/path/to/your/file.js,  Line::6,   Message::{
  "key": "value",
  "status": "success"
}
```
Logging Multiple Arguments
```bash
logger("User data:", { name: "John Doe", age: 30 });
```
Output:
```bash
Path::/path/to/your/file.js,  Line::7,   Message::User data: {
  "name": "John Doe",
  "age": 30
}
```