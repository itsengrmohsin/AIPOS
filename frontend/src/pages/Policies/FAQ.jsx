import React from "react";
import BackButton from "../../components/Button/BackButton";
const FAQ = () => {
  const faqs = [
    {
      q: "What payment options do you offer?",
      a: "We offer both full cash payment and flexible instalment plans ranging from 1 to 12 months.",
    },
    {
      q: "How does the instalment plan work?",
      a: "You can select your desired instalment term (1–12 months) at checkout. A fixed commission (30%–45%) is applied depending on the product and selected duration. Your monthly instalments will be calculated and displayed before you confirm the purchase.",
    },
    {
      q: "Is the commission the same for all plans?",
      a: "No. The commission varies between 30% (minimum) and 45% (maximum) depending on the product and the instalment term you choose.",
    },
    {
      q: "Can I pay off my instalment early?",
      a: "Yes, early settlement is possible. Please contact our customer service team to get details on your outstanding balance.",
    },
    {
      q: "What happens if I miss a payment?",
      a: "Late or missed payments does not have any penalties but could affect your eligibility for future instalment plans. Please ensure payments are made on time.",
    },
    {
      q: "Are there any hidden fees?",
      a: "No, all fees and commissions are clearly stated at checkout. We believe in full transparency with no hidden charges.",
    },
    {
      q: "Can I return a product purchased on instalments?",
      a: "Yes, you can return a product purchased on instalments if it is unused and returned within 24 hours. Once the product is returned and approved, your paid instalments will be refunded (excluding any applicable commissions already charged).",
    },
    {
      q: "How can I track my instalments?",
      a: "You can log into your account dashboard to view your payment schedule, remaining balance, and due dates.",
    },
    {
      q: "Do I need approval for instalments?",
      a: "Some plans may require basic verification or credit approval. Our team will notify you if any additional information is needed.",
    },
    {
      q: "How do I contact customer support?",
      a: `You can reach us via:
      • Email: info.zubielectronics@gmail.com
      • Phone: +92 332 9094396 & +92 3189239614
      • Live Chat: WhatsApp CTA on our website`,
    },
  ];

  return (
    <>
      {/* <Helmet>
        <title>FAQ's - Zubi Electronics</title>
        <meta
          name="description"
          content="This is the faq's page of zubi electronics."
        />
      </Helmet> */}
      <div className=" min-h-screen w-full flex items-center justify-center p-6">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-xl max-w-4xl w-full p-8">
          <div className="hidden sm:block">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold text-white/90 mb-8 text-center">
            Frequently Asked Questions (FAQ)
          </h1>
          <div className="space-y-6">
            {faqs.map((item, index) => (
              <div key={index}>
                <h2 className="text-xl font-semibold text-white/90 mb-2">
                  {index + 1}. {item.q}
                </h2>
                <p className="text-white/80 leading-relaxed whitespace-pre-line">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQ;
