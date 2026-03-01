import React from "react";
import BackButton from "../../components/Button/BackButton";
const InstalmentPlans = () => {
  const instalmentSections = [
    {
      title: "Flexible Instalment Plans",
      content:
        "We offer convenient instalment options to make your purchases easier.",
    },
    {
      title: "How It Works",
      content: `• Choose your product and select “Pay in Instalments” at checkout.
• Pick a plan from [X months/terms].
• Pay the instalments automatically through your preferred payment method.`,
    },
    {
      title: "Benefits",
      content: `• Spread the cost of your purchase over time.
• Enjoy interest-free options for selected plans.
• No hidden fees—what you see is what you pay.`,
    },
    {
      title: "Eligibility & Terms",
      content: `• Instalment plans may require credit approval.
• Late or missed payments have not any additional charges but affect eligibility for future instalments.
• Full terms and conditions are available at checkout.`,
    },
  ];

  return (
    <>
      {/* <Helmet>
        <title>Installment Plans - Zubi Electronics</title>
        <meta
          name="description"
          content="This is the installment plans page of zubi electronics."
        />
      </Helmet> */}
      <div className=" min-h-screen w-full flex items-center justify-center p-6">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-xl max-w-4xl w-full p-8">
        <div className="hidden sm:block">
          <BackButton />
        </div>
          <h1 className="text-3xl font-bold text-white/90 mb-8 text-center">
            Instalment Plans
          </h1>
          <div className="space-y-6">
            {instalmentSections.map((section, index) => (
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

export default InstalmentPlans;
