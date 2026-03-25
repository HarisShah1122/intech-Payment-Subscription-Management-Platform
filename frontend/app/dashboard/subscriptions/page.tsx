'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export default function Subscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([
    {
      id: '1',
      name: 'Premium Plan',
      status: 'active',
      price: '$29.99/month',
      nextBilling: '2026-04-25',
      features: ['Unlimited transactions', 'Priority support', 'Advanced analytics']
    },
    {
      id: '2', 
      name: 'Basic Plan',
      status: 'active',
      price: '$9.99/month',
      nextBilling: '2026-04-25',
      features: ['Basic transactions', 'Email support', 'Standard analytics']
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                My Subscriptions
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Active Subscriptions</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Add New Subscription
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subscriptions.map((subscription) => (
            <div key={subscription.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{subscription.name}</h3>
                    <p className="text-sm text-gray-500">{subscription.price}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    subscription.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {subscription.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Next Billing:</span>
                    <span className="font-medium text-gray-900">{subscription.nextBilling}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
                  <ul className="space-y-2">
                    {subscription.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2l2-2-4" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex space-x-3">
                  <button className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm">
                    Edit
                  </button>
                  <button className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
