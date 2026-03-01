import { useCallback } from "react";

/**
 * Custom hook for printing content using iframe approach
 * This is production-ready and works reliably across browsers
 */
const usePrint = () => {
  const print = useCallback((htmlContent) => {
    // Create hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    // Get iframe document
    const iframeDoc = iframe.contentWindow.document;

    // Write content to iframe
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Print Invoice</title>
          <style>
            @page {
              margin: 0.5cm;
              size: auto;
            }
            body {
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for content to load, then print
    iframe.contentWindow.focus();
    
    setTimeout(() => {
      try {
        iframe.contentWindow.print();
      } catch (error) {
        console.error("Print failed:", error);
      }
      
      // Clean up after print
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  }, []);

  return { print };
};

export default usePrint;
