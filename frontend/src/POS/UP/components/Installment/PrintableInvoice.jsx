import React from "react";

const PrintableInvoice = ({ data }) => {
  if (!data) return null;

  const formatPKR = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodDisplay = (method) => {
    const methods = {
      cash: "Cash",
      bank_transfer: "Bank Transfer",
      cheque: "Cheque",
    };
    return methods[method] || method;
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px", color: "#000" }}>
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          borderBottom: "2px solid #ccc",
          paddingBottom: "15px",
          marginBottom: "15px",
        }}
      >
        <h1 style={{ margin: "0", fontSize: "24px", fontWeight: "bold" }}>
          ZUBI ELECTRONICS
        </h1>
        <p style={{ margin: "5px 0", color: "#666" }}>
          Installment Sale Receipt
        </p>
        <p style={{ margin: "5px 0", fontSize: "12px", fontWeight: "600" }}>
          Invoice: {data.invoiceId}
        </p>
        <p style={{ margin: "5px 0", fontSize: "12px", color: "#666" }}>
          {formatDateTime(data.timestamp)}
        </p>
      </div>

      {/* Product Details */}
      <div style={{ marginBottom: "15px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px" }}>
          Product Details
        </h3>
        <table style={{ width: "100%", fontSize: "13px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "5px 0", fontWeight: "500" }}>Product ID:</td>
              <td style={{ padding: "5px 0", textAlign: "right", fontFamily: "monospace" }}>
                {data.productId}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "5px 0", fontWeight: "500" }}>Name:</td>
              <td style={{ padding: "5px 0", textAlign: "right" }}>{data.productName}</td>
            </tr>
            <tr>
              <td style={{ padding: "5px 0", fontWeight: "500" }}>Model:</td>
              <td style={{ padding: "5px 0", textAlign: "right" }}>{data.productModel}</td>
            </tr>
            <tr>
              <td style={{ padding: "5px 0", fontWeight: "500" }}>Category:</td>
              <td style={{ padding: "5px 0", textAlign: "right" }}>{data.productCategory}</td>
            </tr>
            <tr>
              <td style={{ padding: "5px 0", fontWeight: "500" }}>Quantity:</td>
              <td style={{ padding: "5px 0", textAlign: "right" }}>{data.quantity} Piece(s)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Customer & Guarantor */}
      <div
        style={{
          marginBottom: "15px",
          borderTop: "1px solid #ccc",
          paddingTop: "15px",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px" }}>
          Customer Information
        </h3>
        <table style={{ width: "100%", fontSize: "13px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "5px 0", fontWeight: "500" }}>Customer:</td>
              <td style={{ padding: "5px 0", textAlign: "right" }}>
                {data.customerId} - {data.customer}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "5px 0", fontWeight: "500" }}>Guarantor:</td>
              <td style={{ padding: "5px 0", textAlign: "right" }}>
                {data.guarantorId} - {data.guarantor}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sale Details */}
      <div
        style={{
          marginBottom: "15px",
          borderTop: "1px solid #ccc",
          paddingTop: "15px",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px" }}>
          Sale Details
        </h3>
        <table style={{ width: "100%", fontSize: "13px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "5px 0", fontWeight: "500" }}>Selling Price:</td>
              <td style={{ padding: "5px 0", textAlign: "right" }}>
                {formatPKR(data.unitPrice)}
              </td>
            </tr>
            {data.discount > 0 && (
              <tr>
                <td style={{ padding: "5px 0", fontWeight: "500" }}>Discount:</td>
                <td style={{ padding: "5px 0", textAlign: "right" }}>
                  {data.discount}% ({formatPKR(data.discountAmount)})
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding: "5px 0", fontWeight: "500" }}>Subtotal:</td>
              <td style={{ padding: "5px 0", textAlign: "right" }}>
                {formatPKR(data.subtotal)}
              </td>
            </tr>
            {data.markupAmount > 0 && (
              <tr>
                <td style={{ padding: "5px 0", fontWeight: "500" }}>Markup:</td>
                <td style={{ padding: "5px 0", textAlign: "right" }}>
                  {data.markupRate} ({formatPKR(data.markupAmount)})
                </td>
              </tr>
            )}
            {data.downPaymentAmount > 0 && (
              <>
                <tr>
                  <td style={{ padding: "5px 0", fontWeight: "500" }}>Down Payment:</td>
                  <td style={{ padding: "5px 0", textAlign: "right" }}>
                    {formatPKR(data.downPaymentAmount)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "5px 0", fontWeight: "500" }}>Remaining Amount:</td>
                  <td style={{ padding: "5px 0", textAlign: "right", fontWeight: "600" }}>
                    {formatPKR(data.remainingAmount)}
                  </td>
                </tr>
              </>
            )}
            <tr>
              <td style={{ padding: "5px 0", fontWeight: "500" }}>Payment Method:</td>
              <td style={{ padding: "5px 0", textAlign: "right" }}>
                {getPaymentMethodDisplay(data.paymentMethod)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "5px 0", fontWeight: "500" }}>Payment Plan:</td>
              <td style={{ padding: "5px 0", textAlign: "right" }}>
                {data.planMonths} months
              </td>
            </tr>
            <tr>
              <td style={{ padding: "5px 0", fontWeight: "500" }}>Monthly Payment:</td>
              <td style={{ padding: "5px 0", textAlign: "right", fontWeight: "600" }}>
                {formatPKR(data.monthlyPayment)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div
        style={{
          backgroundColor: "#bbf7d0",
          border: "1px solid #14532d",
          borderRadius: "5px",
          padding: "10px",
          marginBottom: "15px",
        }}
      >
        <table style={{ width: "100%", fontSize: "14px" }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: "bold", color: "#14532d" }}>Total Amount:</td>
              <td style={{ fontWeight: "bold", color: "#14532d", textAlign: "right" }}>
                {formatPKR(data.finalTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Schedule */}
      {data.paymentTimeline && data.paymentTimeline.length > 0 && (
        <div
          style={{
            borderTop: "1px solid #ccc",
            paddingTop: "15px",
            marginBottom: "15px",
          }}
        >
          <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px" }}>
            Payment Schedule
          </h3>
          <div style={{ fontSize: "12px" }}>
            {data.paymentTimeline.slice(0, 3).map((payment, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "3px 0",
                }}
              >
                <span>Payment {payment.paymentNumber}:</span>
                <span>
                  {payment.dueDate} - {formatPKR(payment.paymentAmount)}
                </span>
              </div>
            ))}
            {data.paymentTimeline.length > 3 && (
              <div style={{ textAlign: "center", fontStyle: "italic", color: "#666" }}>
                ... and {data.paymentTimeline.length - 3} more payments
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #ccc",
          paddingTop: "15px",
          textAlign: "center",
          fontSize: "12px",
          color: "#666",
        }}
      >
        <p style={{ margin: "5px 0" }}>Thank you for your purchase!</p>
        <p style={{ margin: "5px 0" }}>This is a computer-generated installment receipt.</p>
      </div>
    </div>
  );
};

export default PrintableInvoice;
