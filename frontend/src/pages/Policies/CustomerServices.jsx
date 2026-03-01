import React from "react";
import BackButton from "../../components/Button/BackButton";

const CustomerServices = () => {
  const supportSections = [
    {
      title: "Customer Support",
      content:
        "We are here to help! Our dedicated customer service team is available to answer your questions and resolve any issues.",
    },
    {
      title: "Contact Us",
      content: `• info.zubielectronics@gmail.com
• Phone: +92 332 9094396 & +92 3189239614
• Live Chat: Available on our website from 09:00 AM to 09:00 PM.`,
    },
    {
      title: "Support Services",
      content: `• Assistance with Best Brands and Quality.
• Guidance on instalment plans and payment options.
• Product information and troubleshooting.`,
    },
    {
      title: "Response Time",
      content: "We aim to respond to all inquiries within 24 hours.",
    },
  ];

  return (
    <>
      {/* <Helmet>
        <title>Customer Services - Zubi Electronics</title>
        <meta
          name="description"
          content="This is the customer services page of zubi electronics."
        />
      </Helmet> */}

      <div className=" min-h-screen w-full flex items-center justify-center p-6">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-xl max-w-4xl w-full p-8">
          <div className="hidden sm:block">
            <BackButton />
          </div>{" "}
          <h1 className="text-3xl font-bold text-white/90 mb-8 text-center">
            Customer Service
          </h1>
          <div className="space-y-6">
            {supportSections.map((section, index) => (
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

export default CustomerServices;
