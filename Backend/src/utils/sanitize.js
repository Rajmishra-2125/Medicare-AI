/**
 * Sanitizes input strings by escaping dangerous HTML characters.
 * Prevents HTML injection (XSS) in dynamic templates such as emails.
 *
 * @param {string} str - The raw string to escape.
 * @returns {string} The HTML-safe escaped string.
 */
export const escapeHTML = (str) => {
  if (typeof str !== "string") return str;
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[tag] || tag
  );
};
