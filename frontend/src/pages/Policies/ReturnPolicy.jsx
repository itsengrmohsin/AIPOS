import React from "react";
import BackButton from "../../components/Button/BackButton";
const ReturnPolicy = () => {
  const returnSections = [
    {
      title: "Return & Refund Policy",
      content:
        "Easy Returns\nWe want you to be completely satisfied with your purchase. If you’re not happy with your product, you may return it (within 24 hours) of purchase.",
    },
    {
      title: "Eligibility",
      content: `• The product must be unused, in original packaging, and include all accessories.
• Some items (like consumables or clearance products) may not be eligible for return.`,
    },
    {
      title: "Exchange",
      content: `• If you prefer, you can exchange the product for another model or variant.
• Exchanges are subject to stock availability.
• The price of the new product will be applied to the exchange.`,
    },
    {
      title: "Return Shipping",
      content:
        "Customers may be responsible for return shipping costs unless the item was defective or wrongfully shipped.",
    },
  ];

  return (
    <>
      {/* <Helmet>
        <title>Return Policy - Zubi Electronics</title>
        <meta
          name="description"
          content="This is the return policy page of zubi electronics."
        />
      </Helmet> */}
      <div className=" min-h-screen w-full flex items-center justify-center p-6">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-xl max-w-4xl w-full p-8">
          <div className="hidden sm:block">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold text-white/90 mb-8 text-center">
            Return Policy
          </h1>
          <div className="space-y-6">
            {returnSections.map((section, index) => (
              <div key={index}>
                <h2 className="text-xl font-semibold text-white/90 mb-2">
                  {section.title}
                </h2>
                <p className="text-white/80 leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReturnPolicy;
