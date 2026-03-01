import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import { Loader2 } from "lucide-react";
import api from "../../../../utils/api";

const emptyGuarantor = {
  guarantorId: "",
  firstName: "",
  lastName: "",
  contact: "",
  cnic: "",
  city: "",
  address: "",
};

const INITIAL_ID = "G-001";

const capitalizeText = (text) =>
  text
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .trim();

export default function AddGuarantor({ onSave }) {
  const [guarantor, setGuarantor] = useState(emptyGuarantor);
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingId, setFetchingId] = useState(true);

  useEffect(() => {
    fetchNextGuarantorId();
  }, []);

  const fetchNextGuarantorId = async () => {
    setFetchingId(true);
    try {
      const res = await api.get("/guarantors");
      const guarantors = res.data;

      if (!guarantors || guarantors.length === 0) {
        setGuarantor((prev) => ({ ...prev, guarantorId: INITIAL_ID }));
      } else {
        const lastId = guarantors.reduce((max, g) => {
          const num = parseInt(g.guarantorId?.replace("G-", "") || "0", 10);
          return !isNaN(num) && num > max ? num : max;
        }, 0);
        const nextId = `G-${String(lastId + 1).padStart(3, "0")}`;
        setGuarantor((prev) => ({ ...prev, guarantorId: nextId }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Guarantor ID", { theme: "dark" });
    } finally {
      setFetchingId(false);
    }
  };

  useEffect(() => {
    const requiredFields = [
      guarantor.firstName,
      guarantor.lastName,
      guarantor.contact,
      guarantor.cnic,
      guarantor.city,
      guarantor.address,
    ];
    setIsFormValid(requiredFields.every((f) => f && f.trim() !== ""));
  }, [guarantor]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "contact") {
      setGuarantor((prev) => ({
        ...prev,
        contact: value.replace(/\D/g, "").slice(0, 15),
      }));
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
      setGuarantor((prev) => ({ ...prev, cnic: formatted }));
      return;
    }

    setGuarantor((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    const toastOpts = { position: "top-right", theme: "dark", autoClose: 2000 };

    const capGuarantor = {
      ...guarantor,
      firstName: capitalizeText(guarantor.firstName),
      lastName: capitalizeText(guarantor.lastName),
      city: capitalizeText(guarantor.city),
      address: capitalizeText(guarantor.address),
    };

    if (!/^G-\d+$/.test(capGuarantor.guarantorId)) {
      setLoading(false);
      return toast.error("Invalid Guarantor ID", toastOpts);
    }

    const fullContact = "+" + capGuarantor.contact;
    if (!/^\+\d{7,15}$/.test(fullContact)) {
      setLoading(false);
      return toast.error("Contact must be + followed by 7-15 digits", toastOpts);
    }

    if (!/^\d{5}-\d{7}-\d{1}$/.test(capGuarantor.cnic)) {
      setLoading(false);
      return toast.error("CNIC format invalid", toastOpts);
    }

    try {
      const res = await api.post("/guarantors", {
        ...capGuarantor,
        contact: fullContact,
        dateAdded: new Date().toISOString(),
      });
      if (onSave) onSave(res.data);
      toast.success("Guarantor added successfully!", toastOpts);

      setGuarantor(emptyGuarantor);
      fetchNextGuarantorId();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to add guarantor", toastOpts);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setGuarantor((prev) => ({ ...emptyGuarantor, guarantorId: prev.guarantorId }));
    toast.info("Form cleared", { position: "top-right", theme: "dark", autoClose: 1000 });
  };

  return (
    <div className="px-4 py-2 min-h-screen">
      <ToastContainer />
      <div className="max-w-8xl mx-auto space-y-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Add Guarantor</h1>
          <p className="text-white/70">Fill in the guarantor details below and save.</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 shadow-lg mt-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Guarantor ID */}
            <div>
              <label className="block mb-1 font-bold text-white">Guarantor ID</label>
              <input
                type="text"
                value={guarantor.guarantorId}
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
                value={guarantor.firstName}
                onChange={handleChange}
                className="p-3 rounded-md bg-black/30 border border-white/20"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={guarantor.lastName}
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
                value={guarantor.contact}
                onChange={handleChange}
                className="p-3 rounded-md bg-black/30 border border-white/20"
              />
              <input
                type="text"
                name="cnic"
                placeholder="12345-1234567-1"
                value={guarantor.cnic}
                onChange={handleChange}
                className="p-3 rounded-md bg-black/30 border border-white/20"
              />
            </div>

            {/* City */}
            <input
              type="text"
              name="city"
              placeholder="City"
              value={guarantor.city}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-black/30 border border-white/20"
            />

            {/* Address */}
            <textarea
              name="address"
              placeholder="Address"
              rows="3"
              value={guarantor.address}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-black/30 border border-white/20"
            />

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!isFormValid || loading || fetchingId}
                className="flex-1 py-3 bg-cyan-800 hover:bg-cyan-900 rounded-md font-semibold flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <PersonAddIcon />}
                Save
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 py-3 bg-red-700 hover:bg-red-800 rounded-md font-semibold flex justify-center items-center gap-2"
              >
                <CleaningServicesIcon />
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
