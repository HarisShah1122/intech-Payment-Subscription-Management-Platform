'use client';

import React from 'react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to Fintech Payment Platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Overview</h2>
            <p className="text-gray-600">Your account overview and statistics</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Subscriptions</h2>
            <p className="text-gray-600">Manage your active subscriptions</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Payments</h2>
            <p className="text-gray-600">View payment history and methods</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile</h2>
            <p className="text-gray-600">Update your account information</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Settings</h2>
            <p className="text-gray-600">Configure your preferences</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Support</h2>
            <p className="text-gray-600">Get help and contact support</p>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">🚀 Platform Status</h3>
          <p className="text-blue-700">
            Frontend: Running on <span className="font-mono bg-blue-100 px-2 py-1 rounded">http://localhost:3000</span><br/>
            Backend API: <span className="font-mono bg-blue-100 px-2 py-1 rounded">http://localhost:5000</span><br/>
            Status: <span className="text-green-600 font-semibold">✅ Ready for Development</span>
          </p>
        </div>
      </div>
    </div>
  );
}
