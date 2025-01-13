// Exporting the logger function as a named export
export const logger = (...args) => {
    try {
        // Create a new Error object to capture the current stack trace
        const err = new Error();

        // Get the stack trace from the error object, or default to an empty string
        const stack = err.stack || "";

        // Split the stack trace into individual lines
        const stackLines = stack.split("\n");

        // Extract the stack line where the logger was called (3rd line in most environments)
        const callerStackLine = stackLines[2] || "";

        // Use a regular expression to extract the file name and line number from the stack trace
        const match = callerStackLine.match(/at\s+(.*):(\d+):(\d+)/);

        // Extract the file name and line number from the regex match
        const fileName = match?.[1] || "unknown file"; // Fallback to "unknown file" if not found
        const lineNo = match?.[2] || "unknown line";   // Fallback to "unknown line" if not found

        // Format the arguments into a single message string
        const formattedMessage = args
            .map(arg => 
                // Convert objects to JSON strings for better readability
                (typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg)
            )
            .join(" "); // Join all arguments with a space separator

        // Log the message with the file name and line number for context
        console.log(`Path::${fileName},  Line::${lineNo},   Message::${formattedMessage}`);
    } catch (error) {
        // If an error occurs during logging, output a generic error message
        console.error("Logger Error:", error.message);

        // Fallback to logging the original arguments without additional context
        console.log(...args);
    }
};
