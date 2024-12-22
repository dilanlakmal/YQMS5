import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FACTORIES, STYLE_CODES, getCustomerByStyleCode } from '../constants/data';

function Details({ onDetailsSubmit }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: new Date(),
    factory: '',
    lineNo: '',
    styleCode: '',
    styleDigit: '',
    customer: '',
    moNo: ''
  });

  const validateStyleDigit = (value) => {
    // Remove spaces and invalid symbols
    const cleanValue = value.replace(/[^0-9a-zA-Z-]/g, '');
    
    // Check if the value contains only numbers
    const isOnlyNumbers = /^\d+$/.test(cleanValue);
    
    if (isOnlyNumbers) {
      // For numbers only, enforce length limits
      if (cleanValue.length > 5) return cleanValue.slice(0, 5);
      if (cleanValue.length < 3) return cleanValue;
      return cleanValue;
    }
    
    // For alphanumeric values, just return the cleaned value
    return cleanValue;
  };

  const handleStyleCodeChange = (code) => {
    const customer = getCustomerByStyleCode(code);
    setFormData(prev => ({
      ...prev,
      styleCode: code,
      customer,
      moNo: `${code}${prev.styleDigit}`
    }));
  };

  const handleStyleDigitChange = (value) => {
    const validatedValue = validateStyleDigit(value);
    setFormData(prev => ({
      ...prev,
      styleDigit: validatedValue,
      moNo: `${prev.styleCode}${validatedValue}`
    }));
  };

  const handleLineNoChange = (value) => {
    const cleanValue = value.toUpperCase().replace(/\s+/g, '');
    setFormData(prev => ({
      ...prev,
      lineNo: cleanValue
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate style digit if it contains only numbers
    const isOnlyNumbers = /^\d+$/.test(formData.styleDigit);
    if (isOnlyNumbers && formData.styleDigit.length < 3) {
      alert('Style digit must be at least 3 digits when using numbers only');
      return;
    }

    if (!formData.factory || !formData.lineNo || !formData.styleCode || !formData.styleDigit) {
      alert('Please fill in all required fields');
      return;
    }

    onDetailsSubmit(formData);
    navigate('/inspection');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quality Inspection Details</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <DatePicker
              selected={formData.date}
              onChange={(date) => setFormData(prev => ({ ...prev, date }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              dateFormat="yyyy-MM-dd"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Factory</label>
            <select
              value={formData.factory}
              onChange={(e) => setFormData(prev => ({ ...prev, factory: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select Factory</option>
              {FACTORIES.map(factory => (
                <option key={factory} value={factory}>{factory}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Line No</label>
            <input
              type="text"
              value={formData.lineNo}
              onChange={(e) => handleLineNoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Style Code</label>
            <select
              value={formData.styleCode}
              onChange={(e) => handleStyleCodeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select Style Code</option>
              {STYLE_CODES.map(({ code }) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Style Digit</label>
            <input
              type="text"
              value={formData.styleDigit}
              onChange={(e) => handleStyleDigitChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <input
              type="text"
              value={formData.customer}
              readOnly
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">MO No</label>
            <input
              type="text"
              value={formData.moNo}
              readOnly
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Continue to Inspection
          </button>
        </form>
      </div>
    </div>
  );
}

export default Details;
