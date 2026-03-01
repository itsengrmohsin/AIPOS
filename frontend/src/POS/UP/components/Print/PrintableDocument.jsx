import React from "react";

/**
 * Generic Printable Document Component
 * Handles different document types: receipt, invoice, report, list
 */
const PrintableDocument = ({ type, data, title }) => {
  const styles = {
    container: {
      fontFamily: "sans-serif",
      padding: "20px",
      color: "#000",
    },
    header: {
      textAlign: "center",
      borderBottom: "2px solid #ccc",
      paddingBottom: "15px",
      marginBottom: "15px",
    },
    title: {
      margin: "0",
      fontSize: "24px",
      fontWeight: "bold",
    },
    subtitle: {
      margin: "5px 0",
      color: "#666",
    },
    section: {
      marginBottom: "15px",
    },
    sectionTitle: {
      fontSize: "14px",
      fontWeight: "600",
      marginBottom: "10px",
    },
    table: {
      width: "100%",
      fontSize: "13px",
      borderCollapse: "collapse",
    },
    tableRow: {
      borderBottom: "1px solid #eee",
    },
    tableCell: {
      padding: "8px 5px",
    },
    tableCellBold: {
      padding: "8px 5px",
      fontWeight: "500",
    },
    footer: {
      borderTop: "1px solid #ccc",
      paddingTop: "15px",
      textAlign: "center",
      fontSize: "12px",
      color: "#666",
      marginTop: "20px",
    },
  };

  // Receipt Layout (Cash/Installment)
  if (type === "receipt" || type === "invoice") {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>ZUBI ELECTRONICS</h1>
          <p style={styles.subtitle}>{title || "Sales Receipt"}</p>
          {data.invoiceId && (
            <p style={{ ...styles.subtitle, fontWeight: "600" }}>
              Invoice: {data.invoiceId}
            </p>
          )}
          {data.timestamp && (
            <p style={{ ...styles.subtitle, fontSize: "12px" }}>
              {new Date(data.timestamp).toLocaleString("en-PK")}
            </p>
          )}
        </div>

        {/* Product/Item Details */}
        {data.items && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Items</h3>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableRow}>
                  <th style={{ ...styles.tableCellBold, textAlign: "left" }}>Item</th>
                  <th style={{ ...styles.tableCellBold, textAlign: "right" }}>Qty</th>
                  <th style={{ ...styles.tableCellBold, textAlign: "right" }}>Price</th>
                  <th style={{ ...styles.tableCellBold, textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx} style={styles.tableRow}>
                    <td style={styles.tableCell}>{item.name}</td>
                    <td style={{ ...styles.tableCell, textAlign: "right" }}>{item.quantity}</td>
                    <td style={{ ...styles.tableCell, textAlign: "right" }}>
                      Rs. {item.price?.toLocaleString()}
                    </td>
                    <td style={{ ...styles.tableCell, textAlign: "right" }}>
                      Rs. {item.total?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        {data.total && (
          <div style={{ ...styles.section, borderTop: "1px solid #ccc", paddingTop: "10px" }}>
            <table style={styles.table}>
              <tbody>
                {data.subtotal && (
                  <tr>
                    <td style={styles.tableCellBold}>Subtotal:</td>
                    <td style={{ ...styles.tableCell, textAlign: "right" }}>
                      Rs. {data.subtotal.toLocaleString()}
                    </td>
                  </tr>
                )}
                {data.discount > 0 && (
                  <tr>
                    <td style={styles.tableCellBold}>Discount:</td>
                    <td style={{ ...styles.tableCell, textAlign: "right" }}>
                      Rs. {data.discount.toLocaleString()}
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ ...styles.tableCellBold, fontSize: "16px" }}>Total:</td>
                  <td style={{ ...styles.tableCell, textAlign: "right", fontSize: "16px", fontWeight: "bold" }}>
                    Rs. {data.total.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div style={styles.footer}>
          <p>Thank you for your business!</p>
          <p>This is a computer-generated document.</p>
        </div>
      </div>
    );
  }

  // Report Layout (Sales/Purchase/Inventory)
  if (type === "report") {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>ZUBI ELECTRONICS</h1>
          <p style={styles.subtitle}>{title || "Report"}</p>
          <p style={{ ...styles.subtitle, fontSize: "12px" }}>
            Generated: {new Date().toLocaleString("en-PK")}
          </p>
        </div>

        {data.summary && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Summary</h3>
            <table style={styles.table}>
              <tbody>
                {Object.entries(data.summary).map(([key, value]) => (
                  <tr key={key} style={styles.tableRow}>
                    <td style={styles.tableCellBold}>{key}:</td>
                    <td style={{ ...styles.tableCell, textAlign: "right" }}>
                      {typeof value === "number" ? value.toLocaleString() : value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.records && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Records</h3>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableRow}>
                  {data.columns?.map((col, idx) => (
                    <th key={idx} style={{ ...styles.tableCellBold, textAlign: "left" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.records.map((record, idx) => (
                  <tr key={idx} style={styles.tableRow}>
                    {Object.values(record).map((val, i) => (
                      <td key={i} style={styles.tableCell}>
                        {typeof val === "number" ? val.toLocaleString() : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={styles.footer}>
          <p>ZUBI ELECTRONICS - Management Report</p>
        </div>
      </div>
    );
  }

  // List Layout (Customers/Suppliers/Guarantors)
  if (type === "list") {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>ZUBI ELECTRONICS</h1>
          <p style={styles.subtitle}>{title || "List"}</p>
          <p style={{ ...styles.subtitle, fontSize: "12px" }}>
            Total Records: {data.items?.length || 0}
          </p>
        </div>

        {data.items && (
          <div style={styles.section}>
            <table style={styles.table}>
              <thead>
                <tr style={{ ...styles.tableRow, backgroundColor: "#f5f5f5" }}>
                  {data.columns?.map((col, idx) => (
                    <th key={idx} style={{ ...styles.tableCellBold, textAlign: "left" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx} style={styles.tableRow}>
                    {Object.values(item).map((val, i) => (
                      <td key={i} style={styles.tableCell}>
                        {typeof val === "number" ? val.toLocaleString() : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={styles.footer}>
          <p>ZUBI ELECTRONICS</p>
        </div>
      </div>
    );
  }

  return null;
};

export default PrintableDocument;
