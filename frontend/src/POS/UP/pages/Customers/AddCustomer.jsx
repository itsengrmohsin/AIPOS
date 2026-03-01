import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useNavigate } from "react-router-dom"; // ✅ Added
import api from "../../../../utils/api";

const emptyCustomer = {
  customerId: "",
  firstName: "",
  lastName: "",
  contact: "",
  cnic: "",
  city: "",
  status: "Active",
  address: "",
  email: "",
  password: "",
};

const fetchNextCustomerId = async () => {
  try {
    const res = await api.get("/customers/next-id");
    if (res?.data?.nextCustomerId) return res.data.nextCustomerId;
  } catch (err) {
    console.warn("Could not fetch next customerId, using fallback", err);
  }
  return `C-${String(Date.now() % 1000).padStart(3, "0")}`;
};

const capitalizeText = (text) =>
  text
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export default function AddCustomer({ onSave }) {
  const navigate = useNavigate(); // ✅ Navigation Hook
  const [customer, setCustomer] = useState(emptyCustomer);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    if (!customer.customerId) {
      (async () => {
        const newId = await fetchNextCustomerId();
        setCustomer((prev) => ({ ...prev, customerId: newId }));
      })();
    }
  }, []);

  useEffect(() => {
    const required = [
      customer.firstName,
      customer.lastName,
      customer.contact,
      customer.cnic,
      customer.email,
      customer.city,
      customer.address,
      customer.password,
    ];
    setIsFormValid(required.every((f) => f.trim() !== ""));
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "contact") {
      setCustomer((prev) => ({ ...prev, contact: value.replace(/\D/g, "") }));
      return;
    }

    if (name === "cnic") {
      let digits = value.replace(/\D/g, "").slice(0, 13);
      let formatted =
        digits.length <= 5
          ? digits
          : digits.length <= 12
          ? `${digits.slice(0, 5)}-${digits.slice(5)}`
          : `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
      setCustomer((prev) => ({ ...prev, cnic: formatted }));
      return;
    }

    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const capCustomer = {
      ...customer,
      firstName: capitalizeText(customer.firstName),
      lastName: capitalizeText(customer.lastName),
      city: capitalizeText(customer.city),
      address: capitalizeText(customer.address),
    };

    if (!/^C-\d+$/.test(capCustomer.customerId))
      return toast.error("Invalid Customer ID format", { theme: "dark" });

    const fullContact = "+" + capCustomer.contact;
    if (!/^\+\d{7,15}$/.test(fullContact))
      return toast.error(
        "Contact must start with '+' followed by 7–15 digits",
        { theme: "dark" }
      );

    if (!/^\d{5}-\d{7}-\d{1}$/.test(capCustomer.cnic))
      return toast.error("CNIC must be in format 12345-1234567-1", {
        theme: "dark",
      });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(capCustomer.email))
      return toast.error("Please enter a valid email", { theme: "dark" });

    api
      .post("/customers", { ...capCustomer, contact: fullContact })
      .then((res) => {
        if (onSave) onSave(res.data);

        toast.success(
          `Customer added! Temporary password: ${res.data.temporaryPassword}`,
          { theme: "dark", autoClose: 2000 }
        );

        // ✅ Navigate after success
        setTimeout(() => {
          navigate("/up/dashboard"); // 
        }, 3000);
      })
      .catch((err) =>
        toast.error(err.response?.data?.error || "Failed to add customer", {
          theme: "dark",
        })
      );
  };

  const handleClear = () => {
    const currentId = customer.customerId;
    setCustomer({ ...emptyCustomer, customerId: currentId });
    toast.info("Form cleared!", { theme: "dark" });
  };

  return (
    <div className="px-4 py-2 min-h-[100%]">
      <ToastContainer position="top-right" autoClose={2000} theme="dark" />
      <div className="mx-auto space-y-3 max-w-8xl">
        <div>
          <h1 className="text-3xl font-bold text-white">Add Customer</h1>
          <p className="text-white">
            Fill in the customer details below and save.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 text-white shadow-lg mt-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Customer ID */}
            <div>
              <label className="block mb-1 font-bold">Customer ID</label>
              <input
                type="text"
                value={customer.customerId}
                readOnly
                className="w-full p-3 rounded-md bg-black/40 border border-white/30 cursor-not-allowed"
              />
            </div>

            {/* First & Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={customer.firstName}
                onChange={handleChange}
                className="p-3 rounded-md bg-black/30 border border-white/20"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={customer.lastName}
                onChange={handleChange}
                className="p-3 rounded-md bg-black/30 border border-white/20"
              />
            </div>

            {/* Contact & CNIC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="contact"
                placeholder="Contact (without +)"
                value={customer.contact}
                onChange={handleChange}
                className="p-3 rounded-md bg-black/30 border border-white/20"
              />
              <input
                type="text"
                name="cnic"
                placeholder="CNIC"
                value={customer.cnic}
                onChange={handleChange}
                className="p-3 rounded-md bg-black/30 border border-white/20"
              />
            </div>

            {/* Email & Password */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={customer.email}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-black/30 border border-white/20"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={customer.password}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-black/30 border border-white/20"
            />

            {/* City & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={customer.city}
                onChange={handleChange}
                className="p-3 rounded-md bg-black/30 border border-white/20"
              />
              <select
                name="status"
                value={customer.status}
                onChange={handleChange}
                className="p-3 rounded-md bg-black/30 border border-white/20"
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Suspended</option>
              </select>
            </div>

            {/* Address */}
            <textarea
              name="address"
              placeholder="Permanent Address"
              value={customer.address}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 rounded-md bg-black/30 border border-white/20"
            />

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!isFormValid}
                className="flex-1 py-3 bg-cyan-800 hover:bg-cyan-900 rounded-md font-semibold flex justify-center items-center gap-2"
              >
                <PersonAddIcon />
                Save
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="flex-1 py-3 bg-red-700 hover:bg-red-800 rounded-md font-semibold"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}