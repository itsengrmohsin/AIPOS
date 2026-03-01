import React from "react";
import BackButton from "../../components/Button/BackButton";
const Privacy = () => {
  const policy = [
    {
      title: "Privacy Policy",
      content:
        "Your privacy is important to us. At ZUBI ELECTRONICS, we are committed to protecting your personal information.",
    },
    {
      title: "Information We Collect",
      content: `• Personal details such as name, email, phone number, and address.
• Payment information for processing purchases (credit/debit cards, bank details, etc.).
• Usage data such as browsing patterns, product interests, and interactions with our website.`,
    },
    {
      title: "How We Use Your Information",
      content: `• To process orders and deliver products.
• To provide customer support and respond to inquiries.
• To send promotional offers and updates (with your consent).
• To improve our services and website experience.`,
    },
    {
      title: "Data Security",
      content:
        "We use industry-standard measures to safeguard your information against unauthorized access, loss, or misuse.",
    },
    {
      title: "Sharing Your Information",
      content:
        "We do not sell your personal information. We may share your data only with trusted partners for order fulfillment, payment processing, and legal compliance.",
    },
    {
      title: "Your Rights",
      content:
        "You can access, update, or delete your personal information by contacting us at [Your Email/Support Link].",
    },
    {
      title: "Changes to This Policy",
      content:
        "We may update this policy periodically. We encourage you to review it regularly.",
    },
  ];

  return (
    <>
      {/* <Helmet>
        <title>Privacy Policy - Zubi Electronics</title>
        <meta
          name="description"
          content="This is the privacy policy page of zubi electronics."
        />
      </Helmet> */}
      <div className=" min-h-screen w-full flex items-center justify-center p-6">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-xl max-w-4xl w-full p-8">
        <div className="hidden sm:block">
                  <BackButton />
                </div>
          <h1 className="text-3xl font-bold text-white/90 mb-8 text-center">
            Privacy Policy
          </h1>
          <div className="space-y-6">
            {policy.map((section, index) => (
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

export default Privacy;
