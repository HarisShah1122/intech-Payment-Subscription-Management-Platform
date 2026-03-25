'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export default function Support() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tickets');
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'general'
  });

  const [tickets] = useState([
    {
      id: '1',
      subject: 'Login Issue',
      message: 'Unable to access account',
      category: 'technical',
      status: 'resolved',
      createdAt: '2026-03-24',
      updatedAt: '2026-03-25'
    },
    {
      id: '2',
      subject: 'Billing Question',
      message: 'Charge on credit card',
      category: 'billing',
      status: 'open',
      createdAt: '2026-03-25',
      updatedAt: '2026-03-25'
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle ticket submission
    console.log('New support ticket:', formData);
    // Reset form
    setFormData({ subject: '', message: '', category: 'general' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                Support Center
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {user?.firstName}!
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['tickets', 'faq', 'contact'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {activeTab === 'tickets' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* New Ticket Form */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Ticket</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="general">General</option>
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                      <option value="feature">Feature Request</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Submit Ticket
                  </button>
                </form>
              </div>
            </div>

            {/* Existing Tickets */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Tickets</h3>
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{ticket.subject}</h4>
                          <p className="text-sm text-gray-600 mt-1">{ticket.message}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ticket.status === 'resolved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Category: {ticket.category}</span>
                        <span>Created: {ticket.createdAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
        )}

        {activeTab === 'faq' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-6">
                <div className="border-l-4 border-gray-200 pl-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">How do I reset my password?</h4>
                  <p className="text-sm text-gray-600">Click on the "Forgot Password" link on the login page and follow the instructions sent to your email.</p>
                </div>
                <div className="border-l-4 border-gray-200 pl-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">How do I update my payment method?</h4>
                  <p className="text-sm text-gray-600">Go to the Payments section in your dashboard and click "Add Payment Method" to add a new card or bank account.</p>
                </div>
                <div className="border-l-4 border-gray-200 pl-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">How do I cancel my subscription?</h4>
                  <p className="text-sm text-gray-600">Navigate to Subscriptions and click "Cancel" next to any active subscription you wish to terminate.</p>
                </div>
                <div className="border-l-4 border-gray-200 pl-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Is my data secure?</h4>
                  <p className="text-sm text-gray-600">Yes, we use industry-standard encryption and security measures to protect your personal and financial information.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Get Help</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 5a2 2 0 11-2 2v12a2 2 0 002 2h8a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-900">Email Support</p>
                        <p className="text-sm text-gray-600">support@fintechplatform.com</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 5a2 2 0 11-2 2v12a2 2 0 002 2h8a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-900">Live Chat</p>
                        <p className="text-sm text-gray-600">Available 24/7 for premium users</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-purple-500 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 5a2 2 0 11-2 2v12a2 2 0 002 2h8a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-900">Phone Support</p>
                        <p className="text-sm text-gray-600">1-800-FINTECH</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Business Hours</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                    <p>Saturday - Sunday: 10:00 AM - 4:00 PM EST</p>
                    <p>Holiday support available for enterprise customers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
